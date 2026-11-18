---
name: history-log
description: Append the "Work done" summary for the current prompt to history/prompts/YYYY-MM-DD.md. Use at the end of every turn in this repo that changed files, ran commands, or made a decision.
---

# History log

The `UserPromptSubmit` hook already appended the user's prompt to `history/prompts/<today>.md`.
Your job is to add the summary **directly under the last prompt entry** (end of file).

Format (append, never rewrite earlier entries):

```markdown

**Work done:**
- <what changed — files/areas, 1 line each>
- <decisions made, with ADR link if any>
- <what's left / open questions>
```

Rules:
- 3–8 bullets, past tense, concrete (paths, commands, outcomes). No marketing language.
- Say honestly what was not done or not verified.
- If today's file doesn't exist (hook failed), create it with `# Prompts — YYYY-MM-DD`, add the prompt verbatim under `## HH:MM — Prompt`, then the summary.
- Do not touch `history/COMMITS.md` — the git hook owns it.
