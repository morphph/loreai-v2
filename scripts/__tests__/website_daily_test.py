import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import json

spec = importlib.util.spec_from_file_location('website_daily', Path(__file__).parents[1] / 'run-website-daily.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class WebsiteDailyTests(unittest.TestCase):
    def test_receipt_write_is_readable_and_hash_detects_content_change(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'state.json'
            module.save(target, {'status': 'verified'})
            old = module.digest(target)
            self.assertEqual(json.loads(target.read_text()), {'status': 'verified'})
            module.save(target, {'status': 'failed'})
            self.assertNotEqual(old, module.digest(target))
            self.assertFalse(target.with_suffix('.tmp').exists())

    def test_live_check_requires_both_actual_headlines_not_just_http_200(self):
        class Response:
            status = 200
            def __init__(self, body): self.body = body
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return self.body.encode()
        with patch.object(module.urllib.request, 'urlopen', side_effect=[Response('<h1>New &amp; Good</h1>'), Response('<h1>旧文章</h1>')]):
            self.assertFalse(module.live_matches('https://example.com', '2026-09-29', {'en': 'New & Good', 'zh': '新文章'}))
        with patch.object(module.urllib.request, 'urlopen', side_effect=[Response('<h1>New &amp; Good</h1>'), Response('<h1><span>新文章</span></h1>')]) as fetch:
            self.assertTrue(module.live_matches('https://example.com', '2026-09-29', {'en': 'New & Good', 'zh': '新文章'}))
            self.assertEqual(fetch.call_args_list[1].args[0].full_url, 'https://example.com/zh/newsletter/2026-09-29')

    def test_failed_push_keeps_receipt_and_retry_does_not_regenerate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'scripts').mkdir()
            publisher = root / 'publisher'
            publisher.mkdir()
            state = root / 'state'
            argv = ['runner', 'newsletter', '--publisher', str(publisher), '--state-dir', str(state), '--expected-revision', 'verified-sha', '--date', '2026-09-29']
            calls = []
            fail_push = [True]
            def command(args, cwd, capture=False):
                calls.append(args)
                if args == ['git', 'rev-parse', 'HEAD']: return 'verified-sha\n'
                if args == ['git', 'branch', '--show-current']: return 'main\n'
                if 'scripts/write-newsletter.ts' in args:
                    self.assertIn('--website-only', args)
                    self.assertIn('--skip-seeds', args)
                    for lang in ['en', 'zh']:
                        out = root / f'content/newsletters/{lang}/2026-09-29.md'
                        out.parent.mkdir(parents=True)
                        out.write_text('# Current headline\n')
                if args[:2] == ['git', 'push'] and fail_push[0]:
                    raise module.subprocess.CalledProcessError(1, args)
                return ''
            original_open = open
            def safe_open(name, *args, **kwargs):
                return original_open(root / 'test.lock' if str(name) == '/tmp/loreai-pipeline.lock' else name, *args, **kwargs)
            with patch.object(module, '__file__', str(root / 'scripts/run.py')), patch('sys.argv', argv), patch.dict(module.os.environ, {'NEWSLETTER_AI_PROVIDER': 'codex', 'NEWSLETTER_CODEX_MODEL': 'gpt-6-sol'}), patch.object(module, 'run', side_effect=command), patch.object(module, 'open', side_effect=safe_open, create=True), patch.object(module, 'live_matches', return_value=True) as live:
                argv.append('--generate-only')
                module.main()
                self.assertEqual(json.loads((state / 'newsletter-2026-09-29.json').read_text())['status'], 'generated')
                self.assertFalse(any(call[:2] == ['git', 'push'] for call in calls))
                live.assert_not_called()
                argv.pop()
                with self.assertRaises(module.subprocess.CalledProcessError): module.main()
                live.assert_not_called()
                self.assertEqual(json.loads((state / 'newsletter-2026-09-29.json').read_text())['status'], 'failed')
                self.assertTrue((state / 'generated-2026-09-29.json').exists())
                fail_push[0] = False
                module.main()
                self.assertEqual(sum('scripts/write-newsletter.ts' in call for call in calls), 1)
                self.assertFalse(any('scripts/send-newsletter.ts' in call for call in calls))
                self.assertEqual(json.loads((state / 'newsletter-2026-09-29.json').read_text())['status'], 'verified')

    def test_subprocess_failure_is_not_swallowed(self):
        with self.assertRaises(module.subprocess.CalledProcessError):
            module.run(['python3', '-c', 'raise SystemExit(7)'], Path.cwd(), True)


if __name__ == '__main__':
    unittest.main()
