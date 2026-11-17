# AI Application Workflow

Status: shipped.

The workflow page is the answer to "where does this tool sit in the thing I am
building?" It is a third axis over the same catalog, deliberately separate from
what a product _is_ and from the order a person should _learn_ it in.

| Layer          | Module        | Question it answers                            |
| -------------- | ------------- | ---------------------------------------------- |
| Catalog        | `products.ts` | What is this thing?                            |
| Learning track | `learning.ts` | What should I practise next?                   |
| Usage          | `usage.ts`    | What is it for, and what does it pair with?    |
| Workflow       | `workflow.ts` | Where does it sit in the system I am building? |

## Why a separate ordering

The practice order and the build order are not the same, and conflating them
produces a curriculum that cannot be shipped in.

A learner meets parsing before retrieval because parsing is simpler. A builder
meets ingestion before governance because governance has nothing to govern until
there is a system to govern. The track is ordered by _conceptual difficulty_; the
workflow is ordered by _data flow_.

## The eight stages

| #   | Stage              | Outcome                                                                                      | Tools |
| --- | ------------------ | -------------------------------------------------------------------------------------------- | ----- |
| 1   | Ingest             | Source documents become clean text, parsed once and re-run on a schedule rather than by hand | 6     |
| 2   | Prepare            | Text is cleaned, chunked, and shaped so it embeds well and stays cheap to store              | 3     |
| 3   | Embed & index      | Chunks become vectors in a store you can search by meaning and by keyword                    | 8     |
| 4   | Retrieve           | The right context is found, ranked, and handed to the model as a tool it can call            | 2     |
| 5   | Generate           | A model produces the answer, with typed output and a fallback when a provider fails          | 5     |
| 6   | Evaluate & observe | Quality and cost are measured on a schedule, and a regression blocks the merge               | 6     |
| 7   | Serve              | The API, the interface, and the model behind them ship to real users                         | 9     |
| 8   | Govern             | Input rails, redaction, and output guards keep the system inside its policy                  | 3     |

42 technologies, one home each.

## Content model

```ts
export interface WorkflowStage {
  id: string; // stable key, also the DOM id fragment
  title: string; // verb phrase, e.g. "Embed & index"
  outcome: string; // one line on what this stage hands to the next
  productIds: string[];
}
```

`WORKFLOW_STAGES` is a plain ordered array in `src/catalog/workflow.ts`. The page
renders it directly; there is no per-product workflow field to keep in sync.

## Rules

1. **One home per product.** Every AI track product appears in exactly one
   stage — the stage where it does its _main_ work. Real tools span stages; the
   stage is a home, not a prison. The product's own guide carries its
   capabilities and synergies, and that is where the neighbouring stages are
   described.
2. **Coverage is enforced, not eyeballed.** `workflow.test.ts` fails if a stage
   references an unknown product, if a product appears twice, or if the workflow
   and the track disagree about which products belong to the AI Engineering
   domain. Adding a product to the track without placing it breaks the suite.
3. **Scope is the AI Engineering domain.** The workflow is the AI application
   pipeline, not the whole catalog. Products outside that domain do not belong
   here; `productsInDomain` and the `ai-engineering` domain are the boundary.

## Adding or moving a product

1. Add it to a `productIds` array in `src/catalog/workflow.ts`.
2. Run `npm run test` — the coverage test names anything unplaced or duplicated.
3. If the stage's `outcome` no longer describes the group, rewrite the outcome,
   not the product list.

## Toolbar budget

The workflow adds a fourth view control to the toolbar. Below 1760px the brand
count and the eight domain pills are hidden — they are decoration and duplicate
the Browse drawer and the sidebar — so the search field keeps a usable width.
The search never collapses: `.tools` carries `flex: 1 1 200px; min-width: 160px`.
Before that fix the bar overflowed by 92px at 1440 and the search silently
shrank to 22px.
