# Platform Atlas — Design Doc

Status: map implemented, study loop not started
Last updated: 2026-10-22

## What this app is

Platform Atlas is a personal map of the tools you can build a company on, plus a
spaced-repetition loop for learning them. Two jobs, one artifact:

1. **Map** — which tool exists, what it does, what it runs on, what to compare
   it against. Zoomable, navigable, showing how the market fits together.
2. **Study** — a daily generated list of what to review, with recall scoring.

The catalog is the corpus. The map is the interface. The learning loop is the
spine.

## The map model

A force-layout graph of 179 nodes is a hairball. Force layouts suit an unknown
network you are exploring; this is a hierarchy we already know — 6 domains, 26
categories, 179 products. So layout comes from the hierarchy, not a simulation.

Three zoom levels, one hierarchy:

- Zoomed out: 6 domain regions
- Mid zoom: categories as clusters inside each region
- Zoomed in: products as nodes inside each cluster
- Edges drawn on top as links

### Two edge granularities

- **Product level** — alternatives. A compares with B. Derived from existing data.
- **Category level** — layer. This category's products run on that category's
  products. Vercel runs on AWS; dbt runs inside Snowflake.

Product-level layer edges would be 179 nodes times several edges each, which is
the hairball again. Category-level layer edges are 18 lines and they teach the
market structure. Alternatives stay at product level where they belong.

Layer edges are the most valuable and the most dangerous: a wrong one teaches
something false about the market. They are derived from category adjacency and
kept few, not enumerated.

## Decisions

### 1. Catalog lives in code, study state lives in the database

The catalog changes when the market changes. Study state changes every day.
Different lifecycles, different homes.

- Catalog: typed TypeScript module, version-controlled, reviewed in PRs.
- Study state: Postgres, per user, per product, per core set, append-only.

Keeping them separate means a catalog edit is never a migration over user data,
and a state bug can never corrupt the catalog.

### 2. Deployment constraint: Vercel serverless has no writable filesystem

Anything written to disk at runtime is gone on the next invocation. So
SQLite-as-a-file is out. Neon hosts the database and connects over HTTP, and its
free plan has no time limit and no inactivity pausing.

Supabase was rejected: free projects pause after a week of low database activity
and must be kept alive with a scheduled ping.

### 3. Core set: membership, not a flag

A product can be core for one career target and lookup-only for another. A
membership table keeps the product row untouched; a flag would put a
many-to-many relationship inside one column.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Your primary study stack |
| Rendering | Canvas 2D + d3-zoom | 179 nodes is trivial for canvas; no WebGL needed |
| Layout | Computed from hierarchy | Nobody hand-places 179 nodes |
| Database | Neon Postgres (free) | No pausing, no time limit, scale-to-zero |
| ORM | Drizzle | You already use it in northstar-api |
| Auth | Refresh-cookie auth, httpOnly | You already built this for Northstar |
| Deployment | Vercel | Serverless, free, matches the DB decision |

## Migration path

`Platform Atlas.html` was a single self-contained file with an inline
`var CATS` array of pipe-delimited rows: 26 categories, 179 products.

1. `scripts/extract-catalog.mjs` parses the legacy rows into typed TypeScript.
2. `scripts/validate-catalog.ts` fails on any dangling reference, any node
   outside the map bounds, or any two nodes sharing a cell.
3. The legacy file is replaced by the Vite entry.
4. The map reads the typed catalog.

## Open items

- Study state schema and scheduler
- Auth decision: real auth, or one implicit profile
- First core set: which career target, and what makes a product eligible
- Mobile layout target
