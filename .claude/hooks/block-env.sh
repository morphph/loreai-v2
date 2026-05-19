#!/usr/bin/env bash
# PreToolUse hook: block edits/writes to .env files.
# Reads tool input JSON from stdin, returns exit code 2 to block, 0 to allow.

set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

basename_only="$(basename "$file_path")"

case "$basename_only" in
  .env|.env.*|*.env|.env.local|.env.production|.env.development)
    {
      echo "Blocked: $file_path"
      echo "Reason: .env files contain secrets. Edit them manually outside Claude Code,"
      echo "or temporarily disable this hook in .claude/settings.json if you're sure."
    } >&2
    exit 2
    ;;
esac

exit 0
