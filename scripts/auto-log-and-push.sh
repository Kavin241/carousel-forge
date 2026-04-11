#!/bin/bash
# =============================================================================
# CarouselForge — Auto Document & Push
# =============================================================================
# Triggered by Claude Code's Stop hook after every AI response.
#
# WHAT IT DOES:
#   1. Checks if any source files changed since the last commit.
#   2. If yes  → appends an entry to PROJECT_LOG.md with timestamp + author.
#              → stages all changes (code + log).
#              → commits with "Claude Code: [timestamp]" attribution.
#   3. Always attempts to push any unpushed commits to origin/master.
#
# ATTRIBUTION:
#   - Changes made by Claude Code (this script) → marked "Claude Code"
#   - Manual changes by the user                → commit manually with:
#       git commit -m "Anti Gravity: <description>"
# =============================================================================

PROJECT_DIR="C:/Users/Kavin/AntiGravity Folders/CarouselForge"
LOG_FILE="$PROJECT_DIR/PROJECT_LOG.md"
BRANCH="master"

cd "$PROJECT_DIR" || exit 1

# --- Detect uncommitted source-file changes (ignore PROJECT_LOG.md itself) ---
CHANGED=$(git status --porcelain | grep -v "PROJECT_LOG.md" | grep -v "^?? scripts/" | grep -v "^?? .claude/")

# --- Also check for any commits not yet pushed to remote ---
UNPUSHED=$(git log "origin/$BRANCH..HEAD" --oneline 2>/dev/null)

# Nothing to do
if [ -z "$CHANGED" ] && [ -z "$UNPUSHED" ]; then
  exit 0
fi

# --- If there are new local changes, log them and commit ---
if [ -n "$CHANGED" ]; then
  TIMESTAMP=$(date -u "+%Y-%m-%d %H:%M UTC")
  CHANGED_FILES=$(git status --short | grep -v "PROJECT_LOG.md")

  printf '\n---\n### Auto-logged — %s | Author: Claude Code\n\n**Files changed:**\n```\n%s\n```\n' \
    "$TIMESTAMP" "$CHANGED_FILES" >> "$LOG_FILE"

  git add -A
  git commit -m "Claude Code: auto-commit [$TIMESTAMP]"
fi

# --- Push (local commits or retried from a previous failed push) ---
git push origin "$BRANCH" 2>&1 || echo "[auto-push] Push failed — will retry next session."
