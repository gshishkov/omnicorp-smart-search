---
name: adr
description: Create or update an Architecture Decision Record in docs/adr. Use when choosing a framework, library, data store, integration pattern, deployment approach, or any decision that is costly to reverse.
---

# Architecture Decision Records

1. List `docs/adr/` and take the next number (4 digits, e.g. `0003`).
2. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-kebab-title.md`.
3. Fill Context, Decision, Alternatives (at least two, with why rejected), Consequences.
4. Status `Proposed` until the user agrees; then `Accepted`. Superseding: mark the old one `Superseded by ADR-NNNN`.
5. Mention the ADR in the turn's history-log summary.

Keep each ADR under ~40 lines. Decisions, not documentation.
