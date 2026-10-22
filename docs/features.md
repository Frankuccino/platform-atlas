# Platform Atlas — Features

Status: pending user input. This is the slot for the feature list.

## Confirmed by the user

- **Purpose**: decision reference, career map, and spaced-repetition, with the
  learning loop as the spine.
- **Per-product state**: status, free-text notes, confidence, sources/links, plus
  a scheduled question per product with the answer scored later.
- **Daily workflow**: a generated "today's list", with the option to accept or skip.
- **Output**: value lands inside the app only. No Obsidian sync, no GitHub-commit
  automation.
- **Core sets**: multiple, one per career target. A product can be core for one
  target and lookup-only for another.
- **Database**: Neon free, through the Vercel Marketplace, no paid tier.

## Open questions

- Which career target gets the first core set, and what is the membership rule?
- Does login happen at all, or is there one implicit profile?
- Is there a mobile layout target, or desktop-first?
- What happens to an item you have not touched in a long time — decay, or keep
  the interval?

## Candidate features

Rough, unranked, to be cut or kept:

- Today view with due count and streak
- Per-product detail: notes, sources, review history, alternatives
- Core set switcher
- Coverage view: mastered / known / learning / unseen per category
- Search across the whole catalog, ignoring collapsed groups
- Import/export state as JSON
- Keyboard navigation for review

## Non-goals

Explicitly out of scope, so scope creep has somewhere to be refused:

- No social or sharing features
- No public API for the catalog
- No team or multi-tenant features
- No mobile native app
- No GitHub streak automation
