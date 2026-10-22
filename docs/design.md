# Platform Atlas — Design Doc

Status: proposed, not yet implemented
Last updated: 2026-10-22

## What this app is

Platform Atlas is a personal map of the tools you can build a company on, plus a
spaced-repetition loop for learning them. Two jobs, one artifact:

1. **Reference** — which tool exists, what it does, what to compare it against.
2. **Study** — a daily generated list of what to review, with recall scoring.

The catalog is the corpus. The learning loop is the spine.

## The two non-obvious decisions

### 1. Catalog lives in code, study state lives in the database

The catalog changes when the market changes. Study state changes every day. They
have different lifecycles, so they do not share a table.

- Catalog: typed TypeScript module, version-controlled, reviewed in PRs. You can
  see the market change in git history.
- Study state: Postgres, per user, per product, per core set, append-only review
  history.

Keeping them separate means a catalog edit is never a migration over user data,
and a state bug can never corrupt the catalog. It also means the catalog can be
queried instead of filtered in memory.

### 2. Deployment constraint: Vercel serverless has no writable filesystem

Vercel functions run in ephemeral containers. Anything written to disk at runtime
is gone on the next invocation. So SQLite-as-a-file is out — not because SQLite is
bad, but because there is nowhere durable to put the file.

Neon is the answer because it hosts the database and connects over HTTP. Its free
plan has no time limit and no inactivity pausing, which matters: this app's
traffic pattern is a few queries a day, and that is exactly the pattern Supabase's
free tier pauses.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Your primary study stack; Bulletproof React patterns |
| Database | Neon Postgres (free) | No pausing, no time limit, scale-to-zero |
| ORM | Drizzle | You already use it in northstar-api |
| Auth | Refresh-cookie auth, httpOnly | You already built this for Northstar |
| Deployment | Vercel | Serverless, free, matches the DB decision |

Supabase was rejected: free projects pause after a week of low database activity
and must be kept alive with a scheduled ping. That is a standing failure mode that
fires precisely when you study least.

## Migration path from the current file

`Platform Atlas.html` is a single self-contained file with an inline
`var CATS = [...]` array of pipe-delimited rows: 26 categories, roughly 180
products. No content is lost in the migration.

1. Parse the existing rows into the new typed catalog module.
2. Run a verification script that asserts every row round-trips: count, category,
   model tag, alternatives, description text. Any drift fails the build.
3. Add the study-state schema alongside it.
4. Layer the UI on top: catalog view, today view, category navigation.

## Open items

- Feature list — being specified with the user.
- Core set definitions — one per career target.
- Category navigation — the 26-category index needs hierarchy, not more chrome.
