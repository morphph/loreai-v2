#!/bin/bash
# parallel-implement.sh — Run multiple specs with dependency-aware phasing
#
# Usage:
#   # All parallel (no dependencies):
#   ./scripts/parallel-implement.sh docs/specs/C5.md docs/specs/C6.md docs/specs/C7.md
#
#   # Phased execution (use -- to separate phases):
#   ./scripts/parallel-implement.sh docs/specs/C5.md docs/specs/C6.md -- docs/specs/C7.md -- docs/specs/C8.md
#
#   Phase 1: C5 and C6 run in parallel
#   Phase 2: C7 starts after Phase 1 completes
#   Phase 3: C8 starts after Phase 2 completes
#
# Logs go to /tmp/implement-logs-<timestamp>/

set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -eq 0 ]; then
  echo "Usage: $0 <spec1.md> [spec2.md ...] [-- spec3.md ...] [-- spec4.md ...]"
  echo ""
  echo "Examples:"
  echo "  # All parallel:"
  echo "  $0 docs/specs/C5.md docs/specs/C6.md docs/specs/C7.md"
  echo ""
  echo "  # Phased (-- separates phases, phases run sequentially):"
  echo "  $0 docs/specs/C5.md docs/specs/C6.md -- docs/specs/C7.md -- docs/specs/C8.md"
  echo "  # Phase 1: C5+C6 parallel → Phase 2: C7 → Phase 3: C8"
  exit 1
fi

LOG_DIR="/tmp/implement-logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$LOG_DIR"

# Parse args into phases (split by --)
PHASES=()
CURRENT_PHASE=()
for arg in "$@"; do
  if [ "$arg" = "--" ]; then
    if [ ${#CURRENT_PHASE[@]} -gt 0 ]; then
      PHASES+=("$(printf '%s\n' "${CURRENT_PHASE[@]}")")
      CURRENT_PHASE=()
    fi
  else
    CURRENT_PHASE+=("$arg")
  fi
done
if [ ${#CURRENT_PHASE[@]} -gt 0 ]; then
  PHASES+=("$(printf '%s\n' "${CURRENT_PHASE[@]}")")
fi

TOTAL_PHASES=${#PHASES[@]}
TOTAL_SPECS=0
TOTAL_FAILED=0

echo "========================================="
echo " Parallel Implement — $(date)"
echo " Phases: $TOTAL_PHASES"
echo " Logs:   $LOG_DIR"
echo "========================================="
echo ""

# Execute phase by phase
for phase_idx in "${!PHASES[@]}"; do
  phase_num=$((phase_idx + 1))
  IFS=$'\n' read -rd '' -a specs <<< "${PHASES[$phase_idx]}" || true

  echo "-----------------------------------------"
  echo " Phase $phase_num/$TOTAL_PHASES — ${#specs[@]} spec(s)"
  echo "-----------------------------------------"

  PIDS=()
  NAMES=()

  for spec in "${specs[@]}"; do
    if [ ! -f "$spec" ]; then
      echo "  [SKIP] File not found: $spec"
      continue
    fi

    name=$(basename "$spec" .md)
    log="$LOG_DIR/${name}.log"

    echo "  [START] $name → $log"

    claude -p "/implement-spec $spec" \
      --allowedTools "Bash,Read,Write,Edit,Grep,Glob,Agent" \
      > "$log" 2>&1 &

    PIDS+=($!)
    NAMES+=("$name")
    TOTAL_SPECS=$((TOTAL_SPECS + 1))
  done

  # Wait for all specs in this phase to complete
  PHASE_FAILED=0
  for i in "${!PIDS[@]}"; do
    pid=${PIDS[$i]}
    name=${NAMES[$i]}
    if wait "$pid"; then
      echo "  [DONE] $name"
    else
      echo "  [FAIL] $name (exit code: $?)"
      PHASE_FAILED=$((PHASE_FAILED + 1))
    fi
  done

  TOTAL_FAILED=$((TOTAL_FAILED + PHASE_FAILED))

  if [ $PHASE_FAILED -gt 0 ] && [ $phase_num -lt $TOTAL_PHASES ]; then
    echo ""
    echo "  ⚠ Phase $phase_num had $PHASE_FAILED failure(s)."
    echo "  Next phases depend on this — aborting remaining phases."
    echo "  Fix the failures and re-run from Phase $((phase_num + 1))."
    break
  fi

  echo ""
done

echo "========================================="
echo " Summary"
echo " Phases: $TOTAL_PHASES"
echo " Total:  $TOTAL_SPECS"
echo " Passed: $((TOTAL_SPECS - TOTAL_FAILED))"
echo " Failed: $TOTAL_FAILED"
echo " Logs:   $LOG_DIR"
echo "========================================="

# Quick glance
echo ""
echo "--- Quick glance (last 3 lines per log) ---"
for log in "$LOG_DIR"/*.log; do
  name=$(basename "$log" .log)
  echo ""
  echo "[$name]"
  tail -3 "$log" 2>/dev/null || echo "(no log)"
done
