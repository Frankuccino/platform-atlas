# Platform Atlas — Docs Index

Status: in progress

Platform Atlas is a personal map of the tools you can build a company on, plus a
spaced-repetition loop for learning them.

## Docs

| Doc | What it covers |
| --- | --- |
| [design.md](design.md) | The two non-obvious decisions, stack choice, migration path |
| [data-model.md](data-model.md) | Catalog in code, study state in Postgres, core set membership |
| [scheduler.md](scheduler.md) | Due calculation, intervals, skip behaviour, determinism |
| [navigation.md](navigation.md) | Domain grouping for the 26-category index |
| [features.md](features.md) | Confirmed scope, open questions, non-goals |

## Quick facts

- Catalog: 26 categories, roughly 180 products, migrating from a single HTML file
- Database: Neon Postgres free, via the Vercel Marketplace
- Auth: refresh-cookie, httpOnly, session stored server-side
- Deployment: Vercel

## Rejected options and why

| Option | Why not |
| --- | --- |
| SQLite file on Vercel | No writable persistent filesystem on serverless |
| Turso | Viable, but an extra hosted dependency for a local-first app |
| Vercel Postgres | Discontinued; existing instances moved to Neon in Dec 2024 |
| Supabase free | Pauses after a week of low DB activity; needs a keep-alive cron |
| localStorage only | Loses multi-device; no sync path |
