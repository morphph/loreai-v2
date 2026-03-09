#!/bin/bash
# LoreAI v2 — Ralph Loop (Autonomous Development)
#
# Usage:
#   ./scripts/ralph.sh plan       # Planning mode (gap analysis, generate plan)
#   ./scripts/ralph.sh build 10   # Build mode, max 10 iterations
#   ./scripts/ralph.sh build      # Build mode, default 5 iterations
#
# Based on Geoffrey Huntley's Ralph pattern + obra's Superpowers principles

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

MODE=${1:-build}
MAX=${2:-5}
ITERATION=0
BRANCH=$(git branch --show-current)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  LoreAI v2 — Ralph Loop"
echo "  Mode:   $MODE"
echo "  Branch: $BRANCH"
echo "  Max:    $MAX iterations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify prompt files exist
if [ "$MODE" = "plan" ] && [ ! -f "docs/prompts/PROMPT_plan.md" ]; then
  echo "Error: docs/prompts/PROMPT_plan.md not found"
  exit 1
fi

if [ "$MODE" = "build" ] && [ ! -f "docs/prompts/PROMPT_build.md" ]; then
  echo "Error: docs/prompts/PROMPT_build.md not found"
  exit 1
fi

while [ $ITERATION -lt $MAX ]; do
  echo -e "\n══════════════════════════════════════════"
  echo "  Iteration $((ITERATION + 1)) / $MAX"
  echo "══════════════════════════════════════════"

  if [ "$MODE" = "plan" ]; then
    cat docs/prompts/PROMPT_plan.md | claude -p \
      --dangerously-skip-permissions \
      --verbose
  else
    cat docs/prompts/PROMPT_build.md | claude -p \
      --dangerously-skip-permissions \
      --verbose
  fi

  # Push changes after each iteration
  git push origin "$BRANCH" 2>/dev/null || {
    echo "Creating remote branch..."
    git push -u origin "$BRANCH"
  }

  ITERATION=$((ITERATION + 1))
  echo -e "\n  ✅ Iteration $ITERATION complete\n"
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ralph Loop finished: $ITERATION iterations"
echo "  Review: git log --oneline -$ITERATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
