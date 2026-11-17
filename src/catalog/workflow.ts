/**
 * Workflow layer: the AI application pipeline, and which catalog products do
 * each stage's work.
 *
 * Deliberately a third axis, orthogonal to the other two:
 * - `products.ts` says what a thing *is*;
 * - `learning.ts` says in what order a person should *practice* them;
 * - `usage.ts` says what a thing is *for* and what it pairs with;
 * - this module says where it sits in the *pipeline you would actually build*.
 *
 * The practice order and the build order are not the same. A learner meets
 * parsing before retrieval because parsing is simpler; a builder meets
 * ingestion before governance because governance has nothing to govern yet.
 * Conflating the two is how a roadmap ends up teaching tools in an order that
 * cannot be shipped in.
 *
 * Each product appears in exactly one stage — the stage where it does its main
 * work. Real tools span stages, so the stage is a home, not a prison: the
 * product's own guide carries its capabilities and synergies, and those are the
 * place to read about the neighbouring stages.
 */

import { PRODUCTS } from './products';
import type { Product } from './types';

export interface WorkflowStage {
  /** Stable key, also used as the DOM id fragment. */
  id: string;
  /** The stage name, written as a verb phrase. */
  title: string;
  /** One line on what this stage hands to the next one. */
  outcome: string;
  /** Catalog product ids, in the order a builder would reach for them. */
  productIds: string[];
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'ingest',
    title: 'Ingest',
    outcome:
      'Source documents become clean text, parsed once and re-run on a schedule rather than by hand.',
    productIds: ['docling', 'unstructured-io', 'dagster', 'prefect', 'temporal', 'airflow'],
  },
  {
    id: 'prepare',
    title: 'Prepare',
    outcome: 'Text is cleaned, chunked, and shaped so it embeds well and stays cheap to store.',
    productIds: ['polars', 'pandas', 'llamaindex'],
  },
  {
    id: 'embed-index',
    title: 'Embed & index',
    outcome: 'Chunks become vectors in a store you can search by meaning and by keyword.',
    productIds: [
      'sentence-transformers',
      'hugging-face',
      'pytorch',
      'pgvector',
      'pinecone',
      'chroma',
      'weaviate',
      'qdrant',
    ],
  },
  {
    id: 'retrieve',
    title: 'Retrieve',
    outcome: 'The right context is found, ranked, and handed to the model as a tool it can call.',
    productIds: ['scikit-learn', 'mcp'],
  },
  {
    id: 'generate',
    title: 'Generate',
    outcome: 'A model produces the answer, with typed output and a fallback when a provider fails.',
    productIds: ['langgraph', 'pydantic-ai', 'pydantic', 'instructor', 'litellm'],
  },
  {
    id: 'evaluate',
    title: 'Evaluate & observe',
    outcome: 'Quality and cost are measured on a schedule, and a regression blocks the merge.',
    productIds: ['langsmith', 'arize-phoenix', 'ragas', 'langfuse', 'helicone', 'promptfoo'],
  },
  {
    id: 'serve',
    title: 'Serve',
    outcome: 'The API, the interface, and the model behind them ship to real users.',
    productIds: [
      'fastapi',
      'docker',
      'nextjs',
      'vercel-ai-sdk',
      'copilotkit',
      'vllm',
      'ollama',
      'onnx-runtime',
      'modal',
    ],
  },
  {
    id: 'govern',
    title: 'Govern',
    outcome: 'Input rails, redaction, and output guards keep the system inside its policy.',
    productIds: ['nemo-guardrails', 'presidio', 'guardrails-ai'],
  },
];

const productMap: ReadonlyMap<string, Product> = new Map(PRODUCTS.map((p) => [p.id, p]));

/** Products in one stage, in the order the stage lists them. */
export function workflowStageProducts(stage: WorkflowStage): Product[] {
  return stage.productIds
    .map((id) => productMap.get(id))
    .filter((product): product is Product => Boolean(product));
}

/** Every product placed on the workflow, in stage order. */
export function workflowProducts(): Product[] {
  return WORKFLOW_STAGES.flatMap(workflowStageProducts);
}
