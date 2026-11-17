# AI Engineering Learning Track

The **AI Engineering** domain is a learning track, not just a market map. It holds
42 technologies grouped into 13 categories and ordered into 9 phases. Each product
has a deep-dive guide with documentation links, syntax, terminology, and hands-on
drills.

Open it from the toolbar: **AI Track**.

The track is ordered by _conceptual difficulty_ — what to practise next. The
**Workflow** page is a separate view over the same 42 products, ordered by _data
flow_ — where each tool sits in the system you are building. See
[workflow.md](workflow.md).

## The nine phases

| #   | Phase                                | Categories                                | Outcome                                          |
| --- | ------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| 1   | Data Foundations                     | Unstructured Parsing, Tabular Data Prep   | Raw PDFs/CSVs → clean, chunkable data            |
| 2   | Vector & Retrieval                   | Vector Databases & Hybrid Search          | Store embeddings, run hybrid search with filters |
| 3   | Agents & Orchestration               | Agentic Orchestration                     | Stateful agents that call tools and recover      |
| 4   | Structured Output                    | Structured Outputs & Validation           | Validated, type-safe JSON from LLMs              |
| 5   | Evals & Observability                | Evaluations & Observability               | Measure faithfulness/cost, gate regressions      |
| 6   | Pipelines                            | Background Pipelines & Orchestration      | Scheduled ingestion without blocking the API     |
| 7   | Serving & Backend                    | Backend Serving & Streaming               | Streaming AI behind a gateway with fallbacks     |
| 8   | Frontend & UX                        | Frontend AI UI & Generative Components    | Streaming chat, citations, generative UI         |
| 9   | Core ML, Infra, Security & Protocols | Core ML/DL, AI Infra, Security, Protocols | Run, deploy, and govern models                   |

## Where the content lives

| File                       | Responsibility                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/catalog/learning.ts`  | Per-product syntax, terminology, drills, migration comparisons, phase/order. Also `TRACK_PHASES`. |
| `src/catalog/usage.ts`     | Per-product capabilities (techniques and methods) and synergies (what it pairs with).             |
| `src/catalog/products.ts`  | Product catalog entry + market guide (overview, trends, stats, posts).                            |
| `src/TrackPage.tsx`        | The roadmap view: phases → categories → products.                                                 |
| `src/ProductGuidePage.tsx` | The per-product guide: tabs, content column, sticky context rail.                                 |

Keeping `learning.ts` and `usage.ts` separate from the catalog means the catalog
can change (new products, new categories) without touching either. They are also
separate from each other because they answer different questions and change for
different reasons: `learning.ts` is _how do I practice this_ (syntax, terms,
drills, migration comparisons), `usage.ts` is _what is this for and what does it
combine with_.

## The guide page

The guide is a two-column layout. A tab bar switches the left column between:

- **Guide** — overview, syntax quickstart, terminology, hands-on practice,
  certificates, key stats, trends, and posts.
- **Capabilities** — every technique and method the technology is used for. Each one
  is a named technique with a one-line description, a runnable snippet (syntax
  highlighted, in the language it is written in), and an explanation that says
  what the snippet shows and what to change to make it yours (`capabilities` on
  the usage entry).
- **Synergies** — what it pairs with and what the pairing buys you. Each one ships
  a snippet that composes the two technologies plus an explanation of why the
  composition works (`synergies` on the usage entry). Each partner renders as a
  link into that product's guide.

The tab bar uses a roving tabindex: only the selected tab is in the tab order and
the arrow keys move selection. It renders only when the product has a usage
entry, so an untracked product keeps the original single-panel guide instead of
showing two empty tabs.

The right rail is sticky and holds:

- **Track position** — phase, order, drill count.
- **Coming from** — the migration comparisons (`comparisons` on the learning
  entry): a legacy technology the engineer already knows → the modern tool, with
  a one-sentence note on how they relate. When the legacy name matches a catalog
  product, it renders as a link into that product's guide.
- **Alternatives** — the product's catalog alternatives, each opening its guide.

The guide remembers which view it was opened from (`guideFrom` in `App.tsx`), so
**Back** returns to the track or the map rather than always to the map. When it
returns to the map, the camera is restored to where the user left it
(`savedCameraRef`) instead of re-fitting, so opening a guide does not throw away
the zoom they were reading at. Reset clears the saved camera, because Reset means
start over.

## Adding a product to the track

1. Add the product to `products.ts` with a `categoryId` in the AI Engineering domain.
2. Add its id to that category's `productIds` in `categories.ts`.
3. Add a `LEARNING` entry in `learning.ts` with `track`, `phase`, `order`, `goal`,
   `comparisons`, `syntax`, `terminology`, and `exercises`.
4. Add a `USAGE` entry in `usage.ts` with at least three `capabilities` and at
   least two `synergies`, every `withId` pointing at a real product. Each
   capability needs a `name`, a `detail`, and an `example` with a `code` string,
   a `lang` the highlighter knows, and an `explanation`. Each synergy needs a
   `note` and the same `example` shape — the snippet must compose the two, not
   just demonstrate one of them.
5. Run `npm run validate` and `npm run test` — `learning.test.ts` fails if a track
   product has no entry, or an entry has no syntax/terminology/drill/comparison.

The track page leads with a **Today's focus** card: the next product in phase/order
sequence, its goal, and its first drill, with a button straight into the guide. It uses
`nextPracticeProduct()` from `TrackPage.tsx`.

## Suggested daily loop

Pick the next product in phase order, read its syntax quickstart, complete one
drill, and log the minutes. Move on only when the drill feels boring. The track
page orders products by `phase` then `order`, so "next" is always the topmost
unfinished item.
