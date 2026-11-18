#!/usr/bin/env bash
# Point git at the versioned hooks in .githooks (run once per clone)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
chmod +x .githooks/* .claude/hooks/*.sh
git config core.hooksPath .githooks
echo "git hooks path set to .githooks"
