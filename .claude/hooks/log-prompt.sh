#!/usr/bin/env bash
# UserPromptSubmit hook: append each user prompt to history/prompts/YYYY-MM-DD.md
set -euo pipefail

input="$(cat)"
prompt="$(printf '%s' "$input" | jq -r '.prompt // empty')"
[ -z "$prompt" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
dir="$root/history/prompts"
mkdir -p "$dir"
file="$dir/$(date +%Y-%m-%d).md"

[ -f "$file" ] || printf '# Prompts — %s\n' "$(date +%Y-%m-%d)" > "$file"

{
  printf '\n## %s — Prompt\n\n' "$(date +%H:%M)"
  printf '%s\n' "$prompt"
} >> "$file"

exit 0
