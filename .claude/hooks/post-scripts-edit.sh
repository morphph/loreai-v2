#!/usr/bin/env bash
# PostToolUse hook: after editing a pipeline script, nudge Claude to run
# the pipeline-reviewer subagent and validate-pipeline.ts before committing.
#
# Triggered on Edit/Write/MultiEdit. We do NOT run validate-pipeline.ts here
# directly — it can take >60s and Claude may make many edits in a row.
# Instead we emit a reminder; Claude decides when to actually validate.

set -euo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only fire for pipeline scripts.
case "$file_path" in
  */scripts/*.ts|scripts/*.ts)
    ;;
  *)
    exit 0
    ;;
esac

# Skip test files — those are not pipeline production code.
case "$file_path" in
  */__tests__/*|*.test.ts|*.spec.ts)
    exit 0
    ;;
esac

basename_only="$(basename "$file_path")"
cat <<EOF
[hook] Edited pipeline script: $basename_only
Reminder for the agent (do this before commit, not necessarily right now):
  1. Invoke the pipeline-reviewer subagent to cross-check the change against .claude/known-issues.md
  2. Run: npx tsx scripts/validate-pipeline.ts
EOF

exit 0
