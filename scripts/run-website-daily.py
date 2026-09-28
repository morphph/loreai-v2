#!/usr/bin/env python3
"""Run fixed-release website jobs; never generate or send subscriber email."""
import argparse
import datetime as dt
import fcntl
import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request


def run(args, cwd, capture=False):
    return subprocess.run(args, cwd=cwd, check=True, text=True,
                          stdout=subprocess.PIPE if capture else None,
                          timeout=3600).stdout


def save(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def live_matches(base, date, expected):
    for lang, title in expected.items():
        prefix = '/zh' if lang == 'zh' else ''
        req = urllib.request.Request(f'{base}{prefix}/newsletter/{date}',
                                     headers={'User-Agent': 'LoreAI-Publish-Check/1.0'})
        with urllib.request.urlopen(req, timeout=25) as response:
            page = response.read().decode()
            headings = re.findall(r'<h1\b[^>]*>(.*?)</h1>', page, re.S)
            text = [html.unescape(re.sub(r'<[^>]+>', '', h)) for h in headings]
            if response.status != 200 or title not in text:
                return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('step', choices=['collect', 'newsletter'])
    parser.add_argument('--publisher', required=True)
    parser.add_argument('--state-dir', required=True)
    parser.add_argument('--expected-revision', required=True)
    parser.add_argument('--date', default=dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date().isoformat())
    parser.add_argument('--site', default='https://loreai.dev')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', args.date):
        raise ValueError('Invalid issue date')
    root = Path(__file__).resolve().parent.parent
    publisher = Path(args.publisher).resolve()
    state = Path(args.state_dir).resolve()
    state.mkdir(parents=True, exist_ok=True)
    status = state / f'{args.step}-{args.date}.json'
    with open('/tmp/loreai-pipeline.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        info = {'date': args.date, 'step': args.step, 'started_at': dt.datetime.now(dt.timezone.utc).isoformat(),
                'release': args.expected_revision, 'status': 'running', 'email_enabled': False}
        save(status, info)
        try:
            revision = run(['git', 'rev-parse', 'HEAD'], root, True).strip()
            if revision != args.expected_revision:
                raise RuntimeError('Release revision mismatch')
            dirty_code = run(['git', 'diff', 'HEAD', '--name-only', '--', 'scripts', 'skills', 'package.json', 'package-lock.json'], root, True).strip()
            if dirty_code:
                raise RuntimeError('Fixed release code has local changes')
            if args.step == 'collect':
                run(['node_modules/.bin/tsx', 'scripts/collect-news.ts'], root)
                run(['node_modules/.bin/tsx', 'scripts/validate-pipeline.ts', '--step=collect', f'--date={args.date}'], root)
            else:
                if os.environ.get('NEWSLETTER_AI_PROVIDER') != 'codex' or not os.environ.get('NEWSLETTER_CODEX_MODEL'):
                    raise RuntimeError('Explicit Codex runtime required')
                files = [f'content/newsletters/{lang}/{args.date}.md' for lang in ['en', 'zh']]
                generated = state / f'generated-{args.date}.json'
                if generated.exists():
                    receipt = json.loads(generated.read_text())
                    if receipt['release'] != revision or any(digest(root / f) != receipt['hashes'][f] for f in files):
                        raise RuntimeError('Generated content differs from recovery receipt; inspect before retrying')
                    print('Reusing validated generated issue; no model calls', flush=True)
                else:
                    # Never overwrite a partial run or silently reselect already-consumed news.
                    if any((root / f).exists() for f in files):
                        raise RuntimeError('Issue files exist without completion receipt; inspect partial run')
                    run(['node_modules/.bin/tsx', 'scripts/write-newsletter.ts', f'--date={args.date}', '--skip-seeds', '--website-only'], root)
                    run(['node_modules/.bin/tsx', 'scripts/validate-pipeline.ts', '--step=newsletter', f'--date={args.date}'], root)
                    save(generated, {'release': revision, 'hashes': {f: digest(root / f) for f in files}})
                run(['node_modules/.bin/tsx', 'scripts/validate-pipeline.ts', '--step=newsletter', f'--date={args.date}'], root)
                if run(['git', 'branch', '--show-current'], publisher, True).strip() != 'main':
                    raise RuntimeError('Publisher must be on main')
                changed = run(['git', 'status', '--porcelain', '--untracked-files=no'], publisher, True).splitlines()
                if any(line[3:] not in files for line in changed):
                    raise RuntimeError('Publisher has unrelated changes')
                run(['git', 'fetch', 'origin', 'main'], publisher)
                # A previous unpushed content commit is preserved. Divergence fails visibly.
                run(['git', 'merge', '--ff-only', 'origin/main'], publisher)
                for f in files:
                    target = publisher / f
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if target.exists() and target.read_bytes() != (root / f).read_bytes():
                        raise RuntimeError(f'Published issue conflict: {f}')
                    target.write_bytes((root / f).read_bytes())
                staged_before = run(['git', 'diff', '--cached', '--name-only'], publisher, True).splitlines()
                if any(f not in files for f in staged_before):
                    raise RuntimeError('Unrelated staged files in publisher')
                run(['git', 'add', '--', *files], publisher)
                if run(['git', 'diff', '--cached', '--name-only'], publisher, True).strip():
                    run(['git', 'commit', '-m', f'Publish bilingual website newsletter {args.date}'], publisher)
                run(['git', 'push', 'origin', 'HEAD:main'], publisher)
                info['uploaded_revision'] = run(['git', 'rev-parse', 'HEAD'], publisher, True).strip()
                info['status'] = 'uploaded_waiting_for_site'
                save(status, info)
                titles = {}
                for lang, f in zip(['en', 'zh'], files):
                    titles[lang] = re.search(r'^# (.+)$', (root / f).read_text(), re.M).group(1).strip()
                deadline = time.monotonic() + 1200
                while True:
                    try:
                        if live_matches(args.site, args.date, titles):
                            break
                    except (OSError, ValueError):
                        pass
                    if time.monotonic() >= deadline:
                        raise RuntimeError('Content uploaded but both website titles not verified within 20 minutes')
                    time.sleep(30)
                info['titles'] = titles
            info['status'] = 'verified'
            info['finished_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
            save(status, info)
            print(json.dumps(info, ensure_ascii=False), flush=True)
        except Exception as error:
            info['status'] = 'failed'
            info['error'] = str(error)
            info['finished_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
            save(status, info)
            raise


if __name__ == '__main__':
    main()
