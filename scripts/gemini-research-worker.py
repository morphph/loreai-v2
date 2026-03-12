#!/usr/bin/env python3
"""
Gemini Deep Research API Worker
Adapted from hot2content-init's research-gemini-deep.py.
Called by scripts/lib/gemini-research.ts via execSync.

Environment variables:
  RESEARCH_TOPIC  — topic to research (required)
  OUTPUT_PATH     — path to write output file (required)
  GEMINI_API_KEY  — API key (required, or from .env)
"""

import os
import time
import sys
from datetime import datetime
from pathlib import Path
from google import genai
from packaging.version import Version

# SDK version check — Interactions API requires >= 1.55.0
_min_version = "1.55.0"
_sdk_version = getattr(genai, "__version__", "0.0.0")
if Version(_sdk_version) < Version(_min_version):
    print(
        f"google-genai {_sdk_version} is too old. "
        f"Interactions API requires >= {_min_version}.\n"
        f"Upgrade: pip3 install --upgrade 'google-genai>={_min_version}'",
        file=sys.stderr,
    )
    sys.exit(1)

# Load API key
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    # Try loading from .env
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith('GEMINI_API_KEY='):
                api_key = line.split('=', 1)[1].strip()
                break

if not api_key:
    print("GEMINI_API_KEY not found", file=sys.stderr)
    sys.exit(1)

topic = os.environ.get('RESEARCH_TOPIC')
if not topic:
    print("RESEARCH_TOPIC not set", file=sys.stderr)
    sys.exit(1)

output_path = os.environ.get('OUTPUT_PATH')
if not output_path:
    print("OUTPUT_PATH not set", file=sys.stderr)
    sys.exit(1)

client = genai.Client(api_key=api_key)

prompt = f"""
Research the following topic thoroughly using web search:

TOPIC: {topic}

This research will be used to write a tech blog article for developers and AI practitioners. Include direct quotes from key people involved.

Focus on:
1. What exactly happened and when? (timeline, key dates)
2. Technical details (how it works, architecture, specs)
3. Key players and their direct quotes
4. Market context and competitive landscape
5. Community reactions and early adoption experiences

Requirements:
- Use ONLY information from web search results
- Include specific dates, versions, and technical details
- Cite all sources with URLs and exact dates
- If information is not found via search, explicitly state that

Format as a structured research report with clear sections.
"""

print(f"Starting Gemini Deep Research for: {topic}")
print(f"Started: {datetime.now().isoformat()}")

start_time = time.time()

try:
    interaction = client.interactions.create(
        agent='deep-research-pro-preview-12-2025',
        input=prompt,
        background=True
    )

    print(f"Interaction ID: {interaction.id}")
    print("Polling for results", end="", flush=True)

    max_wait = 1200  # 20 minutes
    poll_start = time.time()
    while True:
        interaction = client.interactions.get(interaction.id)
        if interaction.status == "completed":
            print("\nResearch completed!")
            break
        elif interaction.status == "failed":
            print(f"\nResearch failed: {interaction.error}", file=sys.stderr)
            sys.exit(1)

        elapsed_poll = time.time() - poll_start
        if elapsed_poll > max_wait:
            print(f"\nTimeout after {elapsed_poll:.0f}s", file=sys.stderr)
            sys.exit(1)

        print(".", end="", flush=True)
        time.sleep(10)

    elapsed = time.time() - start_time
    report = interaction.outputs[-1].text if interaction.outputs else "No output"

    with open(output_path, 'w') as f:
        f.write(f"# Gemini Deep Research Report\n\n")
        f.write(f"**Topic:** {topic}\n\n")
        f.write(f"**Generated:** {datetime.now().isoformat()}\n\n")
        f.write(f"**Time taken:** {elapsed:.1f} seconds\n\n")
        f.write(f"**Method:** Gemini Deep Research API (deep-research-pro-preview-12-2025)\n\n")
        f.write("---\n\n")
        f.write(report)

    print(f"Report saved to: {output_path}")
    print(f"Time taken: {elapsed:.1f} seconds")
    print(f"Report length: {len(report)} characters")

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
