/**
 * Learning-track content for the AI Engineering domain.
 *
 * Kept separate from `products.ts` on purpose: the catalog describes the market
 * (what a tool is), while this file describes how to learn it (syntax, terms,
 * drills, roadmap order). A product can gain a track without its catalog entry
 * changing, and the track can be reordered without touching product data.
 */
import type { Product } from './types';

export interface SyntaxExample {
  title: string;
  code: string;
  lang?: string;
}

export interface Term {
  term: string;
  definition: string;
}

export interface Comparison {
  /** Technology the engineer already knows. */
  legacy: string;
  /** The modern tool this entry teaches. */
  modern: string;
  /** How the two relate, in one sentence a transitioning engineer can act on. */
  note: string;
}

export interface Exercise {
  title: string;
  prompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estMinutes: number;
}

export interface LearningEntry {
  /** Category the product sits in. */
  track: string;
  /** Roadmap phase, 1-9. */
  phase: number;
  /** Order within the phase. */
  order: number;
  /** What you can do once this product is practiced. */
  goal: string;
  /** Migration mapping: what you already know -> what this tool changes. */
  comparisons: Comparison[];
  syntax: SyntaxExample[];
  terminology: Term[];
  exercises: Exercise[];
}

export interface TrackPhase {
  phase: number;
  title: string;
  categoryIds: string[];
  outcome: string;
}

/**
 * The nine-phase AI Engineering roadmap. Order matters: each phase builds on the
 * previous one, and the category list is what the track page renders.
 */
export const TRACK_PHASES: TrackPhase[] = [
  {
    phase: 1,
    title: 'Data Foundations',
    categoryIds: ['ai-parsing', 'ai-tabular'],
    outcome: 'Turn raw PDFs and CSVs into clean, chunkable, analysis-ready data.',
  },
  {
    phase: 2,
    title: 'Vector & Retrieval',
    categoryIds: ['ai-vector-db'],
    outcome: 'Store embeddings and run hybrid search with metadata filters.',
  },
  {
    phase: 3,
    title: 'Agents & Orchestration',
    categoryIds: ['ai-agent-orchestration'],
    outcome: 'Build stateful multi-step agents that call tools and recover from failure.',
  },
  {
    phase: 4,
    title: 'Structured Output',
    categoryIds: ['ai-structured-output'],
    outcome: 'Force LLMs to return validated, type-safe JSON your API can trust.',
  },
  {
    phase: 5,
    title: 'Evals & Observability',
    categoryIds: ['ai-evals-observability'],
    outcome: 'Measure faithfulness and cost, and gate regressions in CI.',
  },
  {
    phase: 6,
    title: 'Pipelines',
    categoryIds: ['ai-pipelines'],
    outcome: 'Ingest and embed documents on a schedule without blocking the API.',
  },
  {
    phase: 7,
    title: 'Serving & Backend',
    categoryIds: ['ai-backend-serving'],
    outcome: 'Serve streaming AI behind a gateway with fallbacks and budgets.',
  },
  {
    phase: 8,
    title: 'Frontend & UX',
    categoryIds: ['ai-frontend-ui'],
    outcome: 'Ship streaming chat, citations, and generative UI components.',
  },
  {
    phase: 9,
    title: 'Core ML, Infra, Security & Protocols',
    categoryIds: ['ai-core-ml', 'ai-infra-cost', 'ai-security-governance', 'ai-protocols-ux'],
    outcome: 'Run, deploy, and govern models: local inference, cost control, guardrails, MCP.',
  },
];

export const TRACK_CATEGORY_PHASE: Record<string, number> = Object.fromEntries(
  TRACK_PHASES.flatMap((p) => p.categoryIds.map((id) => [id, p.phase])),
);

/** Products that belong to the AI Engineering domain, in phase then order. */
export function trackProducts(all: Product[]): Product[] {
  return all
    .filter((p) => TRACK_CATEGORY_PHASE[p.categoryId] !== undefined)
    .sort((a, b) => {
      const pa = TRACK_CATEGORY_PHASE[a.categoryId];
      const pb = TRACK_CATEGORY_PHASE[b.categoryId];
      if (pa !== pb) return pa - pb;
      return (LEARNING[a.id]?.order ?? 999) - (LEARNING[b.id]?.order ?? 999);
    });
}

export const LEARNING: Record<string, LearningEntry> = {
  // ── Phase 1: Data Foundations ────────────────────────────────────────────
  docling: {
    track: 'ai-parsing',
    phase: 1,
    order: 1,
    goal: 'Parse a complex PDF into structured Markdown with tables intact.',
    comparisons: [
      {
        legacy: 'PyPDF2 / pdfplumber',
        modern: 'Docling',
        note: 'Both pull text out of a PDF. Docling also reconstructs layout and table structure, so you get Markdown with intact tables instead of a bag of strings.',
      },
      {
        legacy: 'Unstructured.io',
        modern: 'Docling',
        note: 'Same job, different trade-off: Unstructured is a pipeline of pluggable partitioners; Docling is one model stack that is stronger on tables and scanned pages.',
      },
    ],
    syntax: [
      {
        title: 'Convert a PDF to Markdown',
        lang: 'bash',
        code: 'docling document.pdf --output ./out --to md',
      },
      {
        title: 'Python API',
        lang: 'python',
        code: `from docling.document_converter import DocumentConverter\nsource = "report.pdf"\nresult = DocumentConverter().convert(source)\nprint(result.document.export_to_markdown())`,
      },
    ],
    terminology: [
      {
        term: 'Layout analysis',
        definition:
          'Detecting blocks (title, table, paragraph) and their reading order before extraction.',
      },
      {
        term: 'OCR fallback',
        definition: 'Running character recognition on scanned pages when no text layer exists.',
      },
      {
        term: 'Table structure recognition',
        definition: 'Rebuilding rows/columns/headers from ruling lines or whitespace.',
      },
    ],
    exercises: [
      {
        title: 'Parse a 3-layout corpus',
        prompt:
          'Run Docling over 10 varied PDFs (multi-column, tables, scanned). Record which need OCR and how long each takes.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'Table fidelity check',
        prompt:
          'Extract 5 table-heavy pages and diff the Markdown tables against the source. Note every cell that broke.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
    ],
  },
  'unstructured-io': {
    track: 'ai-parsing',
    phase: 1,
    order: 2,
    goal: 'Ingest from cloud sources and partition documents with the right strategy.',
    comparisons: [
      {
        legacy: 'PyPDF2 / pdfplumber',
        modern: 'Unstructured.io',
        note: 'Replace hand-rolled extraction with a partitioner that returns typed elements (Table, Title, NarrativeText) you can chunk directly.',
      },
      {
        legacy: 'Docling',
        modern: 'Unstructured.io',
        note: 'Unstructured is the more pluggable choice; Docling is stronger out of the box on tables and scans.',
      },
    ],
    syntax: [
      {
        title: 'Partition a file',
        lang: 'python',
        code: `from unstructured.partition.auto import partition\nelements = partition(filename="doc.pdf", strategy="hi_res")\nfor el in elements:\n    print(el.category, el.text[:80])`,
      },
      {
        title: 'Partition from a URL',
        lang: 'python',
        code: `from unstructured.partition.html import partition_html\nelements = partition_html(url="https://example.com")`,
      },
    ],
    terminology: [
      {
        term: 'Partitioning strategy',
        definition: 'fast / hi_res / ocr_only — trade speed against layout fidelity.',
      },
      {
        term: 'Element',
        definition: 'A chunk of a document with a category (Table, NarrativeText, Title).',
      },
      {
        term: 'Enrichment',
        definition: 'Adding summaries, embeddings, or NER to elements after partitioning.',
      },
    ],
    exercises: [
      {
        title: 'Strategy bake-off',
        prompt:
          'Partition the same 5 files with fast, hi_res, and ocr_only. Compare element quality and runtime.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'S3 ingestion',
        prompt:
          'Use the S3 source connector to list and partition every PDF in a bucket into a local index.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  polars: {
    track: 'ai-tabular',
    phase: 1,
    order: 3,
    goal: 'Clean and transform a dataset larger than RAM with lazy queries.',
    comparisons: [
      {
        legacy: 'Pandas',
        modern: 'Polars',
        note: 'Same DataFrame mental model. read_csv becomes scan_csv, and a chain of operations becomes a lazy query plan you inspect with explain() before collecting.',
      },
      {
        legacy: 'Dask',
        modern: 'Polars',
        note: 'Both handle data larger than RAM; Polars does it in one process with streaming, Dask across a cluster.',
      },
    ],
    syntax: [
      {
        title: 'Lazy scan + filter + collect',
        lang: 'python',
        code: `import polars as pl\ndf = pl.scan_csv("big.csv").filter(pl.col("score") > 0.8).collect(streaming=True)`,
      },
      {
        title: 'Explain the query plan',
        lang: 'python',
        code: `q = pl.scan_parquet("data.parquet").group_by("tenant").agg(pl.col("amt").sum())\nprint(q.explain())`,
      },
    ],
    terminology: [
      {
        term: 'Lazy evaluation',
        definition: 'Builds a query plan first; nothing runs until collect() or fetch().',
      },
      {
        term: 'Streaming',
        definition: 'Executes the plan in chunks so data larger than memory still fits.',
      },
      {
        term: 'Predicate pushdown',
        definition: 'Moving filters down to the scan so less data is read.',
      },
    ],
    exercises: [
      {
        title: 'Pandas-to-Polars rewrite',
        prompt:
          'Rewrite your heaviest Pandas ETL in Polars. Measure the speedup on the same input.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Out-of-core aggregation',
        prompt:
          'Aggregate a 5 GB CSV using streaming=True on a 2 GB RAM limit. Confirm it completes.',
        difficulty: 'advanced',
        estMinutes: 40,
      },
    ],
  },
  pandas: {
    track: 'ai-tabular',
    phase: 1,
    order: 4,
    goal: 'Explore small datasets interactively and know when to graduate to Polars.',
    comparisons: [
      {
        legacy: 'Polars',
        modern: 'Pandas',
        note: 'Pandas is eager and interactive; Polars is lazy and faster. Keep Pandas for exploration and reach for Polars when the frame outgrows RAM.',
      },
    ],
    syntax: [
      {
        title: 'Load, filter, group',
        lang: 'python',
        code: `import pandas as pd\ndf = pd.read_csv("data.csv")\ndf[df.score > 0.8].groupby("tenant").amt.sum()`,
      },
      {
        title: 'Profile a frame',
        lang: 'python',
        code: `df.describe(include="all")\ndf.isna().sum()`,
      },
    ],
    terminology: [
      {
        term: 'DataFrame',
        definition: 'A 2D labeled structure with columns of possibly different types.',
      },
      {
        term: 'Eager evaluation',
        definition: 'Each operation runs immediately and materializes the result.',
      },
      {
        term: 'Copy-on-Write',
        definition: 'Pandas 2.x semantics: derived frames share data until mutated.',
      },
    ],
    exercises: [
      {
        title: 'Profile a messy CSV',
        prompt:
          'Load a real CSV, report dtypes, nulls, and cardinality per column. Fix three data-quality issues.',
        difficulty: 'beginner',
        estMinutes: 25,
      },
      {
        title: 'Know-your-limit',
        prompt:
          'Time a groupby at 100 MB, 1 GB, and 5 GB. Note where Pandas becomes painful and why.',
        difficulty: 'intermediate',
        estMinutes: 30,
      },
    ],
  },

  // ── Phase 2: Vector & Retrieval ──────────────────────────────────────────
  pgvector: {
    track: 'ai-vector-db',
    phase: 2,
    order: 1,
    goal: 'Run hybrid search (vector + keyword) with metadata filters in Postgres.',
    comparisons: [
      {
        legacy: 'Postgres + Elasticsearch',
        modern: 'pgvector',
        note: 'Stop running two stores: pgvector keeps vectors in the same transactional database, so tenant filters and vector search share one query plan.',
      },
      {
        legacy: 'Pinecone',
        modern: 'pgvector',
        note: 'Pinecone is managed and zero-ops; pgvector is Postgres you already run, with no new infrastructure.',
      },
    ],
    syntax: [
      {
        title: 'Enable and store',
        lang: 'sql',
        code: `CREATE EXTENSION vector;\nCREATE TABLE docs (id bigserial, body text, embedding vector(1536), tenant text);\nCREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);`,
      },
      {
        title: 'Hybrid query',
        lang: 'sql',
        code: `SELECT id, 0.7*(1 - (embedding <=> $1::vector)) + 0.3*ts_rank_cd(tsv, websearch_to_tsquery($2)) AS rank\nFROM docs WHERE tenant = $3 ORDER BY rank DESC LIMIT 10;`,
      },
    ],
    terminology: [
      {
        term: 'Embedding',
        definition: 'A dense vector where semantic similarity equals geometric closeness.',
      },
      {
        term: 'HNSW',
        definition:
          'Hierarchical navigable small world — a graph index for fast approximate nearest neighbours.',
      },
      {
        term: 'Hybrid search',
        definition:
          'Combining vector similarity with BM25/keyword rank so both semantics and exact terms count.',
      },
      {
        term: 'Cosine distance',
        definition: '1 - cosine similarity; pgvector exposes it as the <=> operator.',
      },
    ],
    exercises: [
      {
        title: 'Build a hybrid index',
        prompt:
          'Create a 100k-row docs table, add HNSW, and run a hybrid query. Measure p95 latency.',
        difficulty: 'intermediate',
        estMinutes: 60,
      },
      {
        title: 'Isolation test',
        prompt: 'Add a tenant column and prove a query for tenant A never returns tenant B rows.',
        difficulty: 'beginner',
        estMinutes: 25,
      },
    ],
  },
  pinecone: {
    track: 'ai-vector-db',
    phase: 2,
    order: 2,
    goal: 'Use a managed vector DB with namespaces and hybrid sparse+dense search.',
    comparisons: [
      {
        legacy: 'pgvector',
        modern: 'Pinecone',
        note: 'Pinecone removes the ops burden and scales to billions; pgvector is cheaper and simpler while your data fits in one Postgres.',
      },
      {
        legacy: 'Elasticsearch',
        modern: 'Pinecone',
        note: 'Both do hybrid search; Pinecone is built for vectors first, Elasticsearch for inverted indexes first.',
      },
    ],
    syntax: [
      {
        title: 'Create an index and upsert',
        lang: 'python',
        code: `import pinecone\npc = pinecone.Pinecone(api_key="...")\nidx = pc.Index("docs")\nidx.upsert(vectors=[{"id": "1", "values": [0.1, 0.2], "metadata": {"tenant": "a"}}])`,
      },
      {
        title: 'Hybrid query',
        lang: 'python',
        code: `idx.query(vector=dense, sparse_vector={"indices": [12, 340], "values": [0.9, 0.4]},\n        top_k=10, filter={"tenant": "a"})`,
      },
    ],
    terminology: [
      {
        term: 'Namespace',
        definition: 'A partition inside an index, used for tenant or dataset isolation.',
      },
      {
        term: 'Sparse vector',
        definition: 'BM25-style weighted token indices for keyword matching.',
      },
      {
        term: 'Serverless index',
        definition: 'Scales to zero and bills per read/write rather than per pod.',
      },
    ],
    exercises: [
      {
        title: 'Namespace isolation',
        prompt:
          'Upsert two tenants into separate namespaces and verify cross-tenant queries return nothing.',
        difficulty: 'beginner',
        estMinutes: 20,
      },
      {
        title: 'Dense vs hybrid recall',
        prompt: 'Compare recall@10 for dense-only and hybrid on 20 queries. Explain the gap.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },
  chroma: {
    track: 'ai-vector-db',
    phase: 2,
    order: 3,
    goal: 'Prototype a vector store locally and persist it to disk.',
    comparisons: [
      {
        legacy: 'Pinecone',
        modern: 'Chroma',
        note: 'Chroma runs in-process or on disk, so it is the fastest way to prototype; Pinecone is the managed scale-out.',
      },
      {
        legacy: 'FAISS',
        modern: 'Chroma',
        note: 'FAISS is a library you embed; Chroma is a store with metadata, collections, and a query API.',
      },
    ],
    syntax: [
      {
        title: 'In-process add + query',
        lang: 'python',
        code: `import chromadb\nclient = chromadb.Client()\ncol = client.get_or_create_collection("docs")\ncol.add(ids=["1"], documents=["hello"], embeddings=[[0.1, 0.2]])\ncol.query(query_embeddings=[[0.1, 0.2]], n_results=5)`,
      },
      {
        title: 'Persist to disk',
        lang: 'python',
        code: `client = chromadb.PersistentClient(path="./chroma")`,
      },
    ],
    terminology: [
      {
        term: 'Collection',
        definition: 'A named set of embeddings with optional metadata and documents.',
      },
      {
        term: 'PersistentClient',
        definition: 'A client that writes the index to disk so it survives restarts.',
      },
      {
        term: 'Where filter',
        definition: 'Metadata predicate applied before or after vector search.',
      },
    ],
    exercises: [
      {
        title: 'Embed a folder',
        prompt:
          'Embed 200 text files into a persistent collection and query the top 5 for a prompt.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'Metadata filtering',
        prompt:
          'Tag chunks by source and date, then query with a where filter. Verify only matching chunks return.',
        difficulty: 'intermediate',
        estMinutes: 35,
      },
    ],
  },
  weaviate: {
    track: 'ai-vector-db',
    phase: 2,
    order: 4,
    goal: 'Run a self-hosted vector DB with GraphQL and built-in vectorizers.',
    comparisons: [
      {
        legacy: 'Elasticsearch',
        modern: 'Weaviate',
        note: 'Weaviate adds vector search and pluggable vectorizers to a document store you can query with GraphQL.',
      },
      {
        legacy: 'Milvus',
        modern: 'Weaviate',
        note: 'Both are dedicated vector databases; Weaviate leans on modules and GraphQL, Milvus on scale and GPU indexes.',
      },
    ],
    syntax: [
      {
        title: 'Create a class',
        lang: 'python',
        code: `import weaviate\nclient = weaviate.connect_to_local()\nclient.collections.create(name="Doc", vectorizer_config=weaviate.config.Configure.Vectorizer.text2vec_openai())`,
      },
      {
        title: 'Hybrid query',
        lang: 'python',
        code: `col = client.collections.get("Doc")\ncol.query.hybrid(query="refund policy", alpha=0.5, limit=5)`,
      },
    ],
    terminology: [
      {
        term: 'Class',
        definition: "Weaviate's schema object — a collection with properties and a vectorizer.",
      },
      {
        term: 'alpha',
        definition: 'Blend weight: 0 = pure keyword, 1 = pure vector in hybrid search.',
      },
      {
        term: 'Module',
        definition: 'Pluggable capability (vectorizer, reranker, generative) attached to a class.',
      },
    ],
    exercises: [
      {
        title: 'Self-host in Docker',
        prompt:
          'Run Weaviate locally, create a class, import 100 objects, and query with hybrid search.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Rerank pipeline',
        prompt: 'Add a reranker module and compare top-5 before/after reranking on 10 queries.',
        difficulty: 'advanced',
        estMinutes: 45,
      },
    ],
  },
  qdrant: {
    track: 'ai-vector-db',
    phase: 2,
    order: 5,
    goal: 'Use payload indexes and quantization for fast, cheap vector search.',
    comparisons: [
      {
        legacy: 'Pinecone',
        modern: 'Qdrant',
        note: 'Qdrant is self-hosted with payload indexes and quantization; Pinecone is the managed equivalent.',
      },
      {
        legacy: 'Elasticsearch',
        modern: 'Qdrant',
        note: 'A payload index is to vectors what a secondary index is to text: it makes filtered search fast.',
      },
    ],
    syntax: [
      {
        title: 'Create a collection',
        lang: 'python',
        code: `from qdrant_client import QdrantClient, models\nclient = QdrantClient(url="http://localhost:6333")\nclient.create_collection("docs", vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE))`,
      },
      {
        title: 'Filtered search',
        lang: 'python',
        code: `client.query_points("docs", query=[0.1]*1536, query_filter=models.Filter(must=[models.FieldCondition(key="tenant", match=models.MatchValue(value="a"))]), limit=10)`,
      },
    ],
    terminology: [
      {
        term: 'Payload',
        definition: 'Arbitrary metadata stored with a point and used for filtering.',
      },
      {
        term: 'Payload index',
        definition: 'An index on a metadata field that makes filtered search fast.',
      },
      {
        term: 'Scalar quantization',
        definition:
          'Compressing vectors to 1 bit per dimension, trading a little recall for large memory savings.',
      },
    ],
    exercises: [
      {
        title: 'Payload index benchmark',
        prompt: 'Compare filtered search latency with and without a payload index on 100k points.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'Quantization trade-off',
        prompt: 'Enable scalar quantization and measure recall@10 vs memory on 1M points.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },

  // ── Phase 3: Agents & Orchestration ──────────────────────────────────────
  langgraph: {
    track: 'ai-agent-orchestration',
    phase: 3,
    order: 1,
    goal: 'Build a stateful agent graph with tools, retries, and human approval.',
    comparisons: [
      {
        legacy: 'Airflow / Celery',
        modern: 'LangGraph',
        note: 'DAGs model fixed pipelines; graphs model agents that decide their own next step and loop.',
      },
      {
        legacy: 'AutoGen / CrewAI',
        modern: 'LangGraph',
        note: 'Those are multi-agent frameworks; LangGraph is the lower-level graph and checkpointer you build agents on.',
      },
    ],
    syntax: [
      {
        title: 'Define a graph',
        lang: 'python',
        code: `from langgraph.graph import StateGraph, START, END\nclass S(TypedDict): messages: list\ng = StateGraph(S)\ng.add_node("agent", agent_node)\ng.add_edge(START, "agent")\ng.add_edge("agent", END)\napp = g.compile()`,
      },
      {
        title: 'Add a checkpointer',
        lang: 'python',
        code: `from langgraph.checkpoint.sqlite import SqliteSaver\napp = g.compile(checkpointer=SqliteSaver.from_conn_string("state.db"))`,
      },
    ],
    terminology: [
      {
        term: 'State',
        definition: 'A typed dict passed between nodes; each node returns a partial update.',
      },
      {
        term: 'Checkpointer',
        definition: 'Persists state after every step so a run can resume or be interrupted.',
      },
      {
        term: 'Human-in-the-loop',
        definition: 'Interrupt before an edge, wait for approval, then resume with the decision.',
      },
    ],
    exercises: [
      {
        title: 'Retrieve-grade-generate',
        prompt:
          'Build a 3-node RAG graph (retrieve, grade, generate) with a retry loop when grading fails.',
        difficulty: 'intermediate',
        estMinutes: 60,
      },
      {
        title: 'Approval gate',
        prompt:
          'Interrupt before a "delete" tool call, wait for human input, then continue. Persist with a checkpointer.',
        difficulty: 'advanced',
        estMinutes: 75,
      },
    ],
  },
  llamaindex: {
    track: 'ai-agent-orchestration',
    phase: 3,
    order: 2,
    goal: 'Build a RAG query engine with smart chunking and recursive retrieval.',
    comparisons: [
      {
        legacy: 'LangChain',
        modern: 'LlamaIndex',
        note: 'LlamaIndex is data-framework-first (index, retrieve, query); LangChain is chain-first.',
      },
      {
        legacy: 'Raw vector search',
        modern: 'LlamaIndex',
        note: 'LlamaIndex adds chunking, recursive retrieval, and a response synthesizer on top of a vector store.',
      },
    ],
    syntax: [
      {
        title: 'Load and index',
        lang: 'python',
        code: `from llama_index.core import VectorStoreIndex, SimpleDirectoryReader\ndocs = SimpleDirectoryReader("./data").load_data()\nindex = VectorStoreIndex.from_documents(docs)`,
      },
      {
        title: 'Query',
        lang: 'python',
        code: `engine = index.as_query_engine(similarity_top_k=5)\nprint(engine.query("what is the refund policy?"))`,
      },
    ],
    terminology: [
      {
        term: 'Node parser',
        definition: 'Splits a document into chunks (semantic, sentence, fixed-size).',
      },
      {
        term: 'Retriever',
        definition: 'Fetches relevant chunks; can be recursive or auto-merging.',
      },
      {
        term: 'Response synthesizer',
        definition: 'Turns retrieved chunks + prompt into the final answer.',
      },
    ],
    exercises: [
      {
        title: 'Chunking comparison',
        prompt:
          'Index the same docs with fixed vs semantic chunking. Compare answer quality on 10 questions.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Sub-question engine',
        prompt:
          'Wire a SubQuestionQueryEngine over a multi-topic corpus and inspect the generated sub-questions.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  'pydantic-ai': {
    track: 'ai-agent-orchestration',
    phase: 3,
    order: 3,
    goal: 'Write type-safe agents that retry on validation failure automatically.',
    comparisons: [
      {
        legacy: 'LangChain tools',
        modern: 'PydanticAI',
        note: 'PydanticAI gives you typed results and automatic retries on validation failure, instead of parsing strings yourself.',
      },
      {
        legacy: 'OpenAI function calling',
        modern: 'PydanticAI',
        note: 'Same tool-calling idea, but the result is a Pydantic model your API can trust without re-validating.',
      },
    ],
    syntax: [
      {
        title: 'Typed agent',
        lang: 'python',
        code: `from pydantic_ai import Agent\nagent = Agent("openai:gpt-4o", result_type=list[str], system_prompt="Extract names.")\nresult = agent.run_sync("Anna and Bob joined")\nprint(result.data)`,
      },
      {
        title: 'Tool with dependencies',
        lang: 'python',
        code: `agent = Agent(..., deps_type=Deps)\n@agent.tool\ndef lookup(ctx: RunContext[Deps], id: str) -> str:\n    return ctx.deps.db[id]`,
      },
    ],
    terminology: [
      { term: 'result_type', definition: 'A Pydantic model the LLM output must satisfy.' },
      { term: 'RunContext', definition: 'Carries dependencies and state into a tool call.' },
      {
        term: 'Retry-on-validation',
        definition: 'On a schema mismatch the error is fed back to the model for another attempt.',
      },
    ],
    exercises: [
      {
        title: 'Structured extraction agent',
        prompt:
          'Build an agent with result_type=Invoice that extracts from messy text. Log every validation retry.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Tool dependency injection',
        prompt:
          'Give an agent a DB dependency and a tool that queries it. Prove the tool sees the injected deps.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },

  // ── Phase 4: Structured Output ──────────────────────────────────────────
  pydantic: {
    track: 'ai-structured-output',
    phase: 4,
    order: 1,
    goal: 'Define schemas that parse and validate untrusted input safely.',
    comparisons: [
      {
        legacy: 'Python dataclasses',
        modern: 'Pydantic',
        note: 'Dataclasses are shapes; Pydantic validates and coerces untrusted input at the boundary.',
      },
      {
        legacy: 'attrs / marshmallow',
        modern: 'Pydantic',
        note: 'Same validation role; the JSON Schema Pydantic emits is what structured-output libraries build on.',
      },
    ],
    syntax: [
      {
        title: 'Define and validate',
        lang: 'python',
        code: `from pydantic import BaseModel, Field\nclass Invoice(BaseModel):\n    vendor: str\n    total: float = Field(gt=0)\nInvoice.model_validate_json('{"vendor":"Acme","total":12.5}')`,
      },
      {
        title: 'Emit JSON Schema',
        lang: 'python',
        code: `print(Invoice.model_json_schema())`,
      },
    ],
    terminology: [
      { term: 'BaseModel', definition: 'A class whose fields are validated on construction.' },
      {
        term: 'model_validate_json',
        definition: 'Parses a JSON string and validates it against the schema.',
      },
      { term: 'Constraint', definition: 'Field-level rules such as gt=0 or min_length=1.' },
    ],
    exercises: [
      {
        title: 'Schema from an API',
        prompt:
          'Write models for a real API response, validate 100 sample payloads, and report every failure.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'Version migration',
        prompt:
          'Add a field to a model and write a validator that accepts both v1 and v2 payloads.',
        difficulty: 'advanced',
        estMinutes: 45,
      },
    ],
  },
  instructor: {
    track: 'ai-structured-output',
    phase: 4,
    order: 2,
    goal: 'Force any LLM to return validated Pydantic objects with retries.',
    comparisons: [
      {
        legacy: 'Manual JSON parsing',
        modern: 'Instructor',
        note: 'Stop writing json.loads with try/except; Instructor coerces the LLM response into a model and asks again on failure.',
      },
      {
        legacy: 'OpenAI structured outputs',
        modern: 'Instructor',
        note: 'Both force a schema; Instructor wraps any provider and adds the retry loop.',
      },
    ],
    syntax: [
      {
        title: 'Patch a client',
        lang: 'python',
        code: `import instructor, openai\nclient = instructor.patch(openai.OpenAI())\nresp = client.chat.completions.create(model="gpt-4o", response_model=Invoice, messages=[{"role":"user","content":text}])`,
      },
      {
        title: 'Max retries',
        lang: 'python',
        code: `client.chat.completions.create(..., max_retries=3, response_model=Invoice)`,
      },
    ],
    terminology: [
      { term: 'response_model', definition: 'The Pydantic type the LLM output is coerced into.' },
      {
        term: 'Validation feedback loop',
        definition: 'On failure the validator message is appended and the model retries.',
      },
      {
        term: 'JSON mode',
        definition: 'Provider-guaranteed JSON output, still validated by Pydantic.',
      },
    ],
    exercises: [
      {
        title: 'Zero-parse-failure pipeline',
        prompt:
          'Run 100 messy inputs through an Instructor-wrapped model with a strict schema. Target zero json errors.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Nested schema',
        prompt:
          'Model a nested structure (company → departments → employees) and extract it from text.',
        difficulty: 'advanced',
        estMinutes: 55,
      },
    ],
  },

  // ── Phase 5: Evals & Observability ──────────────────────────────────────
  langsmith: {
    track: 'ai-evals-observability',
    phase: 5,
    order: 1,
    goal: 'Trace every LLM call and gate prompt changes with an eval suite.',
    comparisons: [
      {
        legacy: 'print() logging',
        modern: 'LangSmith',
        note: 'LangSmith turns every call into a trace tree with inputs, outputs, latency, and tokens you can filter and diff.',
      },
      {
        legacy: 'Langfuse / Phoenix',
        modern: 'LangSmith',
        note: 'LangSmith is the hosted SaaS; Phoenix and Langfuse are the self-hosted alternatives.',
      },
    ],
    syntax: [
      {
        title: 'Trace a function',
        lang: 'python',
        code: `import langsmith as ls\n@ls.traceable\ndef retrieve(q: str) -> list[str]:\n    return vector_db.search(q)`,
      },
      {
        title: 'Run an eval',
        lang: 'bash',
        code: `langsmith eval --dataset rag-golden --evaluators faithfulness,answer_relevancy`,
      },
    ],
    terminology: [
      {
        term: 'Trace',
        definition: 'A tree of spans recording inputs, outputs, latency, and tokens.',
      },
      { term: 'Dataset', definition: 'A curated set of inputs with optional ground-truth labels.' },
      {
        term: 'Evaluator',
        definition: 'A function or LLM judge that scores a run against a metric.',
      },
    ],
    exercises: [
      {
        title: 'Instrument an agent',
        prompt:
          'Trace every node of a LangGraph agent. In the UI, find the slowest span and explain it.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'CI eval gate',
        prompt:
          'Build a 50-item golden dataset and a GitHub Action that fails when faithfulness drops below 0.85.',
        difficulty: 'advanced',
        estMinutes: 75,
      },
    ],
  },
  'arize-phoenix': {
    track: 'ai-evals-observability',
    phase: 5,
    order: 2,
    goal: 'Run local, self-hosted observability without sending data to a SaaS.',
    comparisons: [
      {
        legacy: 'LangSmith',
        modern: 'Arize Phoenix',
        note: 'Phoenix runs in your own cluster, so traces never leave your infrastructure.',
      },
      {
        legacy: 'OpenTelemetry',
        modern: 'Arize Phoenix',
        note: 'Phoenix speaks OTel through OpenInference, so you keep your existing tracing pipeline.',
      },
    ],
    syntax: [
      {
        title: 'Launch in a notebook',
        lang: 'python',
        code: `import phoenix as px\npx.launch_app()\n# spans appear after your OpenInference-instrumented calls`,
      },
      {
        title: 'Instrument OpenAI',
        lang: 'python',
        code: `from openinference.instrumentation.openai import OpenAIInstrumentor\nOpenAIInstrumentor().instrument(tracer_provider=tracer)`,
      },
    ],
    terminology: [
      {
        term: 'Span',
        definition: 'One unit of work (an LLM call, a retrieval, a tool) with timing.',
      },
      { term: 'OpenInference', definition: 'OpenTelemetry semantic conventions for GenAI spans.' },
      {
        term: 'Local-first',
        definition: 'Tracing data stays in your process/infra, not a vendor cloud.',
      },
    ],
    exercises: [
      {
        title: 'Trace a RAG call',
        prompt: 'Instrument a retrieve-then-generate flow and view the trace tree in Phoenix.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'RAGAS in Phoenix',
        prompt: 'Compute faithfulness and context recall over 30 traces and export the report.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
    ],
  },
  ragas: {
    track: 'ai-evals-observability',
    phase: 5,
    order: 3,
    goal: 'Score RAG answers without ground-truth references.',
    comparisons: [
      {
        legacy: 'Manual spot checks',
        modern: 'RAGAS',
        note: 'RAGAS scores faithfulness and context recall without hand-labeling a gold answer.',
      },
      {
        legacy: 'DeepEval',
        modern: 'RAGAS',
        note: 'Both are reference-free eval frameworks; RAGAS is RAG-specific, DeepEval is general-purpose.',
      },
    ],
    syntax: [
      {
        title: 'Evaluate a dataset',
        lang: 'python',
        code: `from ragas import evaluate\nfrom ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall\nresult = evaluate(dataset, metrics=[faithfulness, context_recall])`,
      },
      {
        title: 'Single sample',
        lang: 'python',
        code: `from ragas import SingleTurnSample\nfrom ragas.metrics import Faithfulness\nFaithfulness(llm=judge).single_turn_score(SingleTurnSample(user_input=q, response=a, retrieved_contexts=[c]))`,
      },
    ],
    terminology: [
      {
        term: 'Faithfulness',
        definition:
          'Fraction of answer claims supported by the retrieved context (hallucination proxy).',
      },
      {
        term: 'Context precision',
        definition: 'How much of the retrieved context is actually relevant, ranked by position.',
      },
      {
        term: 'Reference-free',
        definition: 'Metrics that need no gold answer — an LLM judge grades the pair.',
      },
    ],
    exercises: [
      {
        title: 'Score 30 answers',
        prompt:
          'Score 30 RAG answers for faithfulness and context recall. Find the worst three and explain why.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Judge drift',
        prompt:
          'Compare GPT-4o vs a local judge on the same 20 samples. Report agreement and cost.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  langfuse: {
    track: 'ai-evals-observability',
    phase: 5,
    order: 4,
    goal: 'Self-host observability with prompt versioning and score tracking.',
    comparisons: [
      {
        legacy: 'LangSmith',
        modern: 'Langfuse',
        note: 'Langfuse is the self-hostable equivalent, with versioned prompts and scores.',
      },
      {
        legacy: 'Helicone',
        modern: 'Langfuse',
        note: 'Helicone is a proxy you add without code; Langfuse is an SDK you instrument with.',
      },
    ],
    syntax: [
      {
        title: 'Create a trace',
        lang: 'python',
        code: `from langfuse import Langfuse\nlangfuse = Langfuse()\ntrace = langfuse.trace(name="rag", input={"q": q})`,
      },
      {
        title: 'Fetch a prompt',
        lang: 'python',
        code: `prompt = langfuse.get_prompt("answer-v2")\nprint(prompt.compile(context=ctx))`,
      },
    ],
    terminology: [
      { term: 'Prompt management', definition: 'Versioned prompts with labels for prod/staging.' },
      {
        term: 'Score',
        definition: 'A numeric or categorical value attached to a trace or generation.',
      },
      {
        term: 'Self-hosted',
        definition: 'Run Langfuse in your own cluster; data never leaves it.',
      },
    ],
    exercises: [
      {
        title: 'Self-host + trace',
        prompt:
          'Docker Compose up Langfuse, trace a chat call, and confirm the trace appears in the UI.',
        difficulty: 'intermediate',
        estMinutes: 60,
      },
      {
        title: 'Prompt A/B',
        prompt: 'Serve two prompt versions, log scores, and pick a winner from the dashboard.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  helicone: {
    track: 'ai-evals-observability',
    phase: 5,
    order: 5,
    goal: 'Add observability by changing one base URL — no code changes.',
    comparisons: [
      {
        legacy: 'LangSmith',
        modern: 'Helicone',
        note: 'Helicone needs no code change: point your client at a URL and every request is logged.',
      },
      {
        legacy: 'Manual cost dashboards',
        modern: 'Helicone',
        note: 'Per-property cost and caching appear without building a metrics pipeline.',
      },
    ],
    syntax: [
      {
        title: 'Point the client at Helicone',
        lang: 'python',
        code: `client = OpenAI(base_url="https://oai.helicone.ai/v1", api_key=HELICONE_KEY)\n# identical calls, now logged`,
      },
      {
        title: 'Add a property',
        lang: 'python',
        code: `headers={"Helicone-Property-User": user_id, "Helicone-Property-Tenant": tenant}`,
      },
    ],
    terminology: [
      { term: 'Proxy', definition: 'A middle layer that forwards requests and records them.' },
      { term: 'Property', definition: 'A custom key/value tag for slicing cost and usage.' },
      {
        term: 'Semantic cache',
        definition: 'Reuse a past answer when a new query is semantically close.',
      },
    ],
    exercises: [
      {
        title: 'Zero-code logging',
        prompt:
          'Point an existing script at Helicone and confirm requests appear with cost per property.',
        difficulty: 'beginner',
        estMinutes: 20,
      },
      {
        title: 'Cache savings',
        prompt: 'Enable caching and measure the cost reduction across 100 repeated-ish queries.',
        difficulty: 'intermediate',
        estMinutes: 35,
      },
    ],
  },

  // ── Phase 6: Pipelines ──────────────────────────────────────────────────
  dagster: {
    track: 'ai-pipelines',
    phase: 6,
    order: 1,
    goal: 'Model ingestion as assets with lineage, sensors, and partitions.',
    comparisons: [
      {
        legacy: 'Airflow',
        modern: 'Dagster',
        note: 'Airflow schedules task DAGs; Dagster models data assets with lineage, so you can see what a run actually produced.',
      },
      {
        legacy: 'dbt',
        modern: 'Dagster',
        note: 'dbt transforms tables; Dagster owns the pipeline around them, including software-defined assets.',
      },
    ],
    syntax: [
      {
        title: 'Define assets',
        lang: 'python',
        code: `@asset\ndef parsed_pdfs() -> pl.DataFrame: ...\n\n@asset(deps=[parsed_pdfs])\ndef embedded_chunks(parsed_pdfs): ...`,
      },
      {
        title: 'Sensor on S3',
        lang: 'python',
        code: `@sensor(job=embed_job)\ndef new_pdf_sensor(context):\n    for key in s3.list_objects("incoming"):\n        yield RunRequest(run_key=key)`,
      },
    ],
    terminology: [
      {
        term: 'Asset',
        definition: 'A data product declared in code with dependencies and lineage.',
      },
      { term: 'Sensor', definition: 'Polls an external system and yields run requests on change.' },
      {
        term: 'Partition',
        definition: 'A labelled slice (day, tenant) so jobs run per slice and backfill cleanly.',
      },
    ],
    exercises: [
      {
        title: 'Three-asset pipeline',
        prompt: 'Build raw→parsed→embedded assets with lineage visible in the Dagster UI.',
        difficulty: 'intermediate',
        estMinutes: 60,
      },
      {
        title: 'Sensor + backfill',
        prompt: 'Trigger a job when a file lands in S3, then backfill a month of partitions.',
        difficulty: 'advanced',
        estMinutes: 75,
      },
    ],
  },
  prefect: {
    track: 'ai-pipelines',
    phase: 6,
    order: 2,
    goal: 'Write flows and tasks as plain Python with retries and scheduling.',
    comparisons: [
      {
        legacy: 'Airflow',
        modern: 'Prefect',
        note: 'Prefect flows are plain Python with retries and schedules, not DAG files.',
      },
      {
        legacy: 'Celery',
        modern: 'Prefect',
        note: 'Celery is a task queue; Prefect adds scheduling, observability, and deployment.',
      },
    ],
    syntax: [
      {
        title: 'Flow and task',
        lang: 'python',
        code: `@flow(name="ingest")\ndef ingest():\n    paths = list_pdf_paths()\n    parse.map(paths)\n\n@task(retries=3)\ndef parse(path: str): ...`,
      },
      {
        title: 'Schedule',
        lang: 'python',
        code: `ingest.serve(name="nightly", cron="0 2 * * *")`,
      },
    ],
    terminology: [
      {
        term: 'Flow',
        definition: 'An orchestration function that calls tasks in order or in parallel.',
      },
      { term: 'Task', definition: 'A single unit of work with its own retry and cache policy.' },
      { term: 'Work pool', definition: 'A queue plus workers that execute submitted flow runs.' },
    ],
    exercises: [
      {
        title: 'Parallel parse',
        prompt:
          'Write a flow that parses 50 PDFs concurrently with a concurrency limit and retries.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Cron deployment',
        prompt: 'Deploy the flow on a cron schedule and confirm two runs appear in the UI.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
    ],
  },
  temporal: {
    track: 'ai-pipelines',
    phase: 6,
    order: 3,
    goal: 'Write durable workflows that survive crashes and wait on humans.',
    comparisons: [
      {
        legacy: 'Airflow',
        modern: 'Temporal',
        note: 'Airflow retries a task; Temporal replays the whole workflow from history after a crash.',
      },
      {
        legacy: 'Cadence',
        modern: 'Temporal',
        note: 'Same durable-execution model; Temporal is the newer, more actively developed fork.',
      },
    ],
    syntax: [
      {
        title: 'Workflow + activity',
        lang: 'python',
        code: `@workflow.defn\nclass Ingest:\n    @workflow.run\n    async def run(self, path: str) -> str:\n        return await workflow.execute_activity(parse_pdf, path, start_to_close_timeout=timedelta(minutes=5))`,
      },
      {
        title: 'Wait for a signal',
        lang: 'python',
        code: `await workflow.wait_condition(lambda: self.approved)\nawait workflow.execute_activity(apply_changes, ...)`,
      },
    ],
    terminology: [
      {
        term: 'Durable execution',
        definition: 'Every step is replayed from history, so a crash resumes mid-workflow.',
      },
      {
        term: 'Activity',
        definition: 'A side-effecting function (IO, API call) distinct from workflow code.',
      },
      { term: 'Signal', definition: 'An external event that unblocks a waiting workflow.' },
    ],
    exercises: [
      {
        title: 'Crash recovery',
        prompt:
          'Kill the worker mid-workflow and restart it. Confirm the workflow completes without re-running finished activities.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
      {
        title: 'Human approval',
        prompt: 'Build a workflow that waits for an approval signal before applying changes.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
    ],
  },
  airflow: {
    track: 'ai-pipelines',
    phase: 6,
    order: 4,
    goal: 'Define DAGs as code and reason about their trade-offs.',
    comparisons: [
      {
        legacy: 'Cron + scripts',
        modern: 'Airflow',
        note: 'Airflow gives cron observability, retries, and a DAG view.',
      },
      {
        legacy: 'Dagster',
        modern: 'Airflow',
        note: 'Dagster is the asset-oriented successor; Airflow is still the hiring-market default.',
      },
    ],
    syntax: [
      {
        title: 'A minimal DAG',
        lang: 'python',
        code: `with DAG("embed", schedule="@daily", start_date=days_ago(1)) as dag:\n    extract = PythonOperator(task_id="extract", python_callable=extract)\n    embed = PythonOperator(task_id="embed", python_callable=embed)\n    extract >> embed`,
      },
      {
        title: 'Dynamic mapping',
        lang: 'python',
        code: `process.expand(path=get_pdf_paths())`,
      },
    ],
    terminology: [
      { term: 'DAG', definition: 'Directed acyclic graph of tasks with dependencies.' },
      { term: 'Operator', definition: 'A task type (PythonOperator, BashOperator) doing one job.' },
      {
        term: 'Dynamic task mapping',
        definition: 'Fan out one task over a runtime list of inputs.',
      },
    ],
    exercises: [
      {
        title: 'DAG with retries',
        prompt: 'Write a 3-task DAG with retries and a sla, then trigger it manually in the UI.',
        difficulty: 'beginner',
        estMinutes: 35,
      },
      {
        title: 'Migration plan',
        prompt:
          'Sketch how you would move an Airflow DAG to Dagster assets, listing the mapping for operators and lineage.',
        difficulty: 'advanced',
        estMinutes: 40,
      },
    ],
  },

  // ── Phase 7: Serving & Backend ──────────────────────────────────────────
  fastapi: {
    track: 'ai-backend-serving',
    phase: 7,
    order: 1,
    goal: 'Serve a streaming AI endpoint with validation and OpenAPI docs.',
    comparisons: [
      {
        legacy: 'Express (Node.js)',
        modern: 'FastAPI',
        note: 'Same async request handling, but Pydantic models give you validation and OpenAPI for free.',
      },
      {
        legacy: 'Flask',
        modern: 'FastAPI',
        note: 'Flask is sync and minimal; FastAPI is async, typed, and self-documenting.',
      },
    ],
    syntax: [
      {
        title: 'SSE streaming endpoint',
        lang: 'python',
        code: `@app.post("/chat")\nasync def chat(req: ChatRequest):\n    async def gen():\n        async for tok in llm.stream(req.prompt):\n            yield f"data: {json.dumps({'t': tok})}\\n\\n"\n    return EventSourceResponse(gen())`,
      },
      {
        title: 'Dependency injection',
        lang: 'python',
        code: `def get_db() -> Session: ...\n@app.get("/docs/{id}")\ndef get_doc(id: int, db: Session = Depends(get_db)): ...`,
      },
    ],
    terminology: [
      { term: 'SSE', definition: 'Server-Sent Events: a one-way stream of deltas over HTTP.' },
      {
        term: 'Dependency injection',
        definition: 'FastAPI resolves and caches callables per request via Depends.',
      },
      { term: 'OpenAPI', definition: 'Auto-generated schema from type hints and Pydantic models.' },
    ],
    exercises: [
      {
        title: 'Stream tokens',
        prompt:
          'Wrap a fake LLM and stream tokens over SSE. Measure time-to-first-token in a client.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Containerize',
        prompt: 'Write a multi-stage Dockerfile for the API, run it, and hit /health and /docs.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
    ],
  },
  litellm: {
    track: 'ai-backend-serving',
    phase: 7,
    order: 2,
    goal: 'Route every provider behind one OpenAI-compatible API with fallbacks.',
    comparisons: [
      {
        legacy: 'OpenAI SDK',
        modern: 'LiteLLM',
        note: 'Point one client at LiteLLM and it speaks OpenAI, Anthropic, and local models through the same interface.',
      },
      {
        legacy: 'AWS Bedrock',
        modern: 'LiteLLM',
        note: 'LiteLLM normalizes providers behind one API and adds fallbacks and budgets.',
      },
    ],
    syntax: [
      {
        title: 'Proxy a model',
        lang: 'bash',
        code: `litellm --model gpt-4o --port 4000`,
      },
      {
        title: 'Fallbacks and budgets',
        lang: 'yaml',
        code: `model_list:\n  - model_name: gpt-4o\n    litellm_params: {model: openai/gpt-4o, api_key: os.environ/OPENAI_KEY}\n  - model_name: gpt-4o\n    litellm_params: {model: anthropic/claude-3-5-sonnet, api_key: os.environ/ANTHROPIC_KEY}\nfallbacks: [{gpt-4o: [anthropic/claude-3-5-sonnet]}]`,
      },
    ],
    terminology: [
      { term: 'Fallback', definition: 'An ordered alternate model used when the primary errors.' },
      {
        term: 'Budget',
        definition: 'A per-key or per-team token/spend cap enforced by the proxy.',
      },
      {
        term: 'Virtual key',
        definition: 'A LiteLLM-issued key that maps to provider keys and policies.',
      },
    ],
    exercises: [
      {
        title: 'Fallback drill',
        prompt:
          'Point LiteLLM at a model, fail it intentionally, and confirm traffic routes to the fallback.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'Cost dashboard',
        prompt: 'Send 100 calls through two models and compare cost per model in the UI.',
        difficulty: 'beginner',
        estMinutes: 25,
      },
    ],
  },
  docker: {
    track: 'ai-backend-serving',
    phase: 7,
    order: 3,
    goal: 'Ship a reproducible AI service image with a health check.',
    comparisons: [
      {
        legacy: 'Vagrant / manual deploys',
        modern: 'Docker',
        note: 'Docker makes the runtime reproducible from a Dockerfile instead of a runbook.',
      },
      {
        legacy: 'Virtual machines',
        modern: 'Docker',
        note: 'Containers share the host kernel, so they start in milliseconds and ship less baggage.',
      },
    ],
    syntax: [
      {
        title: 'Multi-stage build',
        lang: 'dockerfile',
        code: `FROM python:3.11-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --user -r requirements.txt\n\nFROM python:3.11-slim\nCOPY --from=builder /root/.local /root/.local\nCOPY . .\nUSER 1000\nHEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1\nCMD ["uvicorn", "app:app", "--host", "0.0.0.0"]`,
      },
    ],
    terminology: [
      {
        term: 'Multi-stage build',
        definition: 'Build deps in one stage, copy artifacts into a slim runtime stage.',
      },
      {
        term: 'Health check',
        definition: 'A command Docker runs to decide if the container is ready.',
      },
      {
        term: 'Non-root user',
        definition: 'Running as UID 1000 to reduce blast radius if the app is compromised.',
      },
    ],
    exercises: [
      {
        title: 'Build and run',
        prompt:
          'Build a slim image for the FastAPI service, run it, and verify /health returns 200.',
        difficulty: 'beginner',
        estMinutes: 35,
      },
      {
        title: 'Compose stack',
        prompt:
          'Write a compose file with API + Postgres(pgvector) + LiteLLM and bring the stack up.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
    ],
  },

  // ── Phase 8: Frontend & UX ──────────────────────────────────────────────
  'vercel-ai-sdk': {
    track: 'ai-frontend-ui',
    phase: 8,
    order: 1,
    goal: 'Stream chat and render generative UI from the server.',
    comparisons: [
      {
        legacy: 'Manual SSE parsing',
        modern: 'Vercel AI SDK',
        note: 'The SDK types the stream and gives you useChat, so you do not hand-roll SSE parsing or state.',
      },
      {
        legacy: 'OpenAI streaming API',
        modern: 'Vercel AI SDK',
        note: 'It is provider-agnostic: the same hooks work across OpenAI, Anthropic, and others.',
      },
    ],
    syntax: [
      {
        title: 'Server stream',
        lang: 'tsx',
        code: `const result = await streamText({ model, messages, tools })\nreturn result.toDataStreamResponse()`,
      },
      {
        title: 'Client chat hook',
        lang: 'tsx',
        code: `const { messages, input, handleSubmit } = useChat({ api: '/api/chat' })\nreturn <form onSubmit={handleSubmit}><input value={input} onChange={e=>setInput(e.target.value)} />`,
      },
    ],
    terminology: [
      { term: 'useChat', definition: 'React hook managing streaming messages, input, and submit.' },
      {
        term: 'streamUI',
        definition: 'Lets a tool return a React component rendered in the chat.',
      },
      {
        term: 'Data stream',
        definition: 'A binary SSE-ish transport for typed chunks (text, tool calls, sources).',
      },
    ],
    exercises: [
      {
        title: 'Streaming chat',
        prompt: 'Build a minimal chat UI with useChat. Measure first-token paint time.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Generative component',
        prompt: 'Add a tool that returns a table component from the server and renders it inline.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  nextjs: {
    track: 'ai-frontend-ui',
    phase: 8,
    order: 2,
    goal: 'Structure an AI app with the App Router, streaming, and edge runtime.',
    comparisons: [
      {
        legacy: 'Vite + React SPA',
        modern: 'Next.js App Router',
        note: 'The App Router moves data fetching and streaming to the server, so less ships to the client.',
      },
      {
        legacy: 'Create React App',
        modern: 'Next.js',
        note: 'CRA is unmaintained; the App Router gives you server components and route handlers.',
      },
    ],
    syntax: [
      {
        title: 'Streaming route handler',
        lang: 'ts',
        code: `export const runtime = "edge"\nexport async function POST(req: Request) {\n  const result = await streamText({ model, messages })\n  return result.toDataStreamResponse()\n}`,
      },
      {
        title: 'Server Component fetch',
        lang: 'tsx',
        code: `export default async function Page() {\n  const docs = await fetch(process.env.API + '/docs').then(r => r.json())\n  return <List docs={docs} />\n}`,
      },
    ],
    terminology: [
      {
        term: 'Server Component',
        definition: 'Renders on the server; no client JS, secrets stay server-side.',
      },
      {
        term: 'Route handler',
        definition: 'A file exporting HTTP verbs to build an endpoint in the App Router.',
      },
      {
        term: 'Edge runtime',
        definition: 'A lightweight V8 runtime for low-latency responses close to users.',
      },
    ],
    exercises: [
      {
        title: 'Stream from a route',
        prompt: 'Create an /api/chat route that streams and a client page that consumes it.',
        difficulty: 'intermediate',
        estMinutes: 55,
      },
      {
        title: 'Citation viewer',
        prompt: 'Render sources from the stream as clickable citations that scroll to the chunk.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  copilotkit: {
    track: 'ai-frontend-ui',
    phase: 8,
    order: 3,
    goal: 'Embed an AI copilot that reads and writes your app state.',
    comparisons: [
      {
        legacy: 'Building a chat UI from scratch',
        modern: 'CopilotKit',
        note: 'CopilotKit wires an agent to your React state with useCopilotReadable and useCopilotAction.',
      },
      {
        legacy: 'LangGraph JS',
        modern: 'CopilotKit',
        note: 'CopilotKit sits on top of your agent runtime and renders the copilot chrome.',
      },
    ],
    syntax: [
      {
        title: 'Wrap the app',
        lang: 'tsx',
        code: `<CopilotKit runtimeUrl="/api/copilot">\n  <CopilotSidebar />\\n</CopilotKit>`,
      },
      {
        title: 'Readable + action',
        lang: 'tsx',
        code: `useCopilotReadable({ description: "rows", value: rows })\nuseCopilotAction({ name: "addRow", parameters: [\"name\"], handler: async ({name}) => setRows(r=>[...r,{name}]) })`,
      },
    ],
    terminology: [
      {
        term: 'Copilot runtime',
        definition: 'The server endpoint that proxies the agent and its tools.',
      },
      { term: 'useCopilotReadable', definition: "Publishes React state into the agent's context." },
      { term: 'useCopilotAction', definition: 'Exposes a frontend function the agent can call.' },
    ],
    exercises: [
      {
        title: 'State-reading copilot',
        prompt:
          'Wrap a table app, publish its rows as readable, and ask the copilot a question about them.',
        difficulty: 'intermediate',
        estMinutes: 55,
      },
      {
        title: 'Frontend action',
        prompt: 'Add an action that adds a row and confirm the agent can call it.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },

  // ── Phase 9: Core ML, Infra, Security & Protocols ───────────────────────
  pytorch: {
    track: 'ai-core-ml',
    phase: 9,
    order: 1,
    goal: 'Load, run, and export an open model locally.',
    comparisons: [
      {
        legacy: 'NumPy',
        modern: 'PyTorch',
        note: 'A torch.Tensor is a NumPy array with autograd and a GPU backend.',
      },
      {
        legacy: 'TensorFlow / Keras',
        modern: 'PyTorch',
        note: 'PyTorch is eager and Pythonic; TensorFlow is graph-first with a larger production ecosystem.',
      },
    ],
    syntax: [
      {
        title: 'Load and run',
        lang: 'python',
        code: `import torch\nfrom transformers import AutoModel, AutoTokenizer\ntok = AutoTokenizer.from_pretrained("BAAI/bge-small-en-v1.5")\nmodel = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5").eval()`,
      },
      {
        title: 'Export to ONNX',
        lang: 'python',
        code: `torch.onnx.export(model, dummy, "model.onnx", opset_version=17)`,
      },
    ],
    terminology: [
      {
        term: 'Tensor',
        definition: 'An n-dimensional array; on GPU with autograd it is the unit of deep learning.',
      },
      { term: 'eval()', definition: 'Disables dropout and batch-norm updates for inference.' },
      {
        term: 'torch.compile',
        definition: 'JIT-compiles a model for a large speedup with no code change.',
      },
    ],
    exercises: [
      {
        title: 'Local embeddings',
        prompt: 'Embed 10k sentences with a local model and time it on CPU and GPU/MPS.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Quantize + export',
        prompt: 'Dynamic-quantize a model, export to ONNX, and compare size and latency.',
        difficulty: 'advanced',
        estMinutes: 60,
      },
    ],
  },
  'hugging-face': {
    track: 'ai-core-ml',
    phase: 9,
    order: 2,
    goal: 'Find, download, and run any open model in three lines.',
    comparisons: [
      {
        legacy: 'Downloading model weights manually',
        modern: 'Hugging Face',
        note: 'The Hub versions models, datasets, and spaces, and transformers gives you a three-line pipeline.',
      },
      {
        legacy: 'OpenAI API',
        modern: 'Hugging Face',
        note: 'For many tasks a local model on the Hub removes the per-token bill and the data-residency problem.',
      },
    ],
    syntax: [
      {
        title: 'Three-line embedding',
        lang: 'python',
        code: `from transformers import pipeline\npipe = pipeline("feature-extraction", model="BAAI/bge-small-en-v1.5")`,
      },
      {
        title: 'Push to the Hub',
        lang: 'python',
        code: `model.push_to_hub("my-finetuned-model")`,
      },
    ],
    terminology: [
      {
        term: 'Hub',
        definition: 'The repository of models, datasets, and spaces with versioning.',
      },
      {
        term: 'Pipeline',
        definition: 'A high-level wrapper that handles tokenization and postprocessing.',
      },
      {
        term: 'Model card',
        definition: 'The Hub README documenting intended use, limits, and metrics.',
      },
    ],
    exercises: [
      {
        title: 'Model selection',
        prompt:
          'Pick an embedding model from the MTEB leaderboard for your language and justify the choice.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'Fine-tune + push',
        prompt: 'Fine-tune a small classifier on a HF dataset and push it to the Hub.',
        difficulty: 'advanced',
        estMinutes: 90,
      },
    ],
  },
  'sentence-transformers': {
    track: 'ai-core-ml',
    phase: 9,
    order: 3,
    goal: 'Encode text and rerank results with cross-encoders.',
    comparisons: [
      {
        legacy: 'OpenAI embeddings',
        modern: 'Sentence-Transformers',
        note: 'Same idea, but you run the embedding model yourself and pay no per-call cost.',
      },
      {
        legacy: 'FAISS alone',
        modern: 'Sentence-Transformers',
        note: 'It gives you the vectors; pair it with a store like pgvector for metadata and filtering.',
      },
    ],
    syntax: [
      {
        title: 'Encode',
        lang: 'python',
        code: `from sentence_transformers import SentenceTransformer\nm = SentenceTransformer("BAAI/bge-small-en-v1.5")\nemb = m.encode(docs, batch_size=32, normalize_embeddings=True)`,
      },
      {
        title: 'Rerank',
        lang: 'python',
        code: `from sentence_transformers import CrossEncoder\nreranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")\nscores = reranker.predict([(q, d) for d in candidates])`,
      },
    ],
    terminology: [
      {
        term: 'Bi-encoder',
        definition: 'Encodes query and document separately; fast, scalable retrieval.',
      },
      {
        term: 'Cross-encoder',
        definition: 'Scores a query-document pair jointly; slower but more accurate reranking.',
      },
      {
        term: 'Matryoshka',
        definition:
          'Embeddings whose prefix dimensions still work, letting you trade size for quality.',
      },
    ],
    exercises: [
      {
        title: 'Build a retriever',
        prompt: 'Embed 5k docs, index with pgvector, and answer 20 queries. Report recall@5.',
        difficulty: 'intermediate',
        estMinutes: 55,
      },
      {
        title: 'Rerank gain',
        prompt:
          'Add a cross-encoder reranker over the top-50 and measure the recall@10 improvement.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },
  'scikit-learn': {
    track: 'ai-core-ml',
    phase: 9,
    order: 4,
    goal: 'Use cheap classical models for routing and classification.',
    comparisons: [
      {
        legacy: 'Hand-written rules',
        modern: 'Scikit-Learn',
        note: 'A LogisticRegression router is trained in minutes and beats a rule list on maintenance.',
      },
      {
        legacy: 'PyTorch',
        modern: 'Scikit-Learn',
        note: 'Reach for classical ML when the problem is tabular and small; deep learning is overkill.',
      },
    ],
    syntax: [
      {
        title: 'Train a router',
        lang: 'python',
        code: `from sklearn.linear_model import LogisticRegression\nclf = LogisticRegression(max_iter=1000).fit(X_train, y_train)\nclf.predict_proba([vec])`,
      },
      {
        title: 'Export to ONNX',
        lang: 'python',
        code: `from skl2onnx import convert_sklearn\nonnx_model = convert_sklearn(clf, initial_types=[("input", FloatTensorType([None, X.shape[1]]))])`,
      },
    ],
    terminology: [
      { term: 'Estimator', definition: 'A model with fit/predict; the uniform sklearn API.' },
      { term: 'Class weight', definition: 'Rebalances training for imbalanced labels.' },
      { term: 'skl2onnx', definition: 'Converts fitted sklearn estimators to ONNX graphs.' },
    ],
    exercises: [
      {
        title: 'Query router',
        prompt:
          'Train a classifier that routes questions to SQL vs LLM. Measure accuracy and cost saved.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'ONNX serving',
        prompt:
          'Export the router to ONNX and serve it with ONNX Runtime; compare latency to sklearn.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },
  'onnx-runtime': {
    track: 'ai-core-ml',
    phase: 9,
    order: 5,
    goal: 'Serve exported models on CPU with 2-5x speedups.',
    comparisons: [
      {
        legacy: 'PyTorch serving',
        modern: 'ONNX Runtime',
        note: 'Export the model to ONNX and serve it on CPU with 2-5x better throughput and no Python overhead.',
      },
      {
        legacy: 'TensorFlow Serving',
        modern: 'ONNX Runtime',
        note: 'Both serve graphs; ORT is lighter and framework-agnostic.',
      },
    ],
    syntax: [
      {
        title: 'Run a session',
        lang: 'python',
        code: `import onnxruntime as ort\nsess = ort.InferenceSession("model.onnx", providers=["CPUExecutionProvider"])\nout = sess.run(None, {"input_ids": ids})`,
      },
      {
        title: 'Dynamic quantize',
        lang: 'python',
        code: `from onnxruntime.quantization import quantize_dynamic\nquantize_dynamic("model.onnx", "model.q.onnx", weight_type=QuantType.QInt8)`,
      },
    ],
    terminology: [
      {
        term: 'Execution provider',
        definition: 'Backend that runs the graph (CPU, CUDA, TensorRT, OpenVINO).',
      },
      {
        term: 'Dynamic quantization',
        definition: 'Converts weights to int8 at load time for a smaller, faster model.',
      },
      { term: 'Graph', definition: 'The ONNX model: nodes (ops) and tensors (edges).' },
    ],
    exercises: [
      {
        title: 'ORT benchmark',
        prompt:
          'Run the same embedding model in PyTorch and ONNX Runtime. Compare throughput and memory.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Quantization recall',
        prompt: 'Quantize an embedding model and measure recall@10 against the float model.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },
  vllm: {
    track: 'ai-core-ml',
    phase: 9,
    order: 6,
    goal: 'Serve an open LLM with OpenAI-compatible APIs at high throughput.',
    comparisons: [
      {
        legacy: 'Ollama',
        modern: 'vLLM',
        note: 'Ollama is for local development; vLLM is the production server with continuous batching and high throughput.',
      },
      {
        legacy: 'Text-generation-inference',
        modern: 'vLLM',
        note: 'PagedAttention is the reason vLLM beats earlier TensorFlow-based servers on throughput.',
      },
    ],
    syntax: [
      {
        title: 'Serve a model',
        lang: 'bash',
        code: `docker run --gpus all -p 8000:8000 vllm/vllm-openai --model meta-llama/Meta-Llama-3.1-8B-Instruct`,
      },
      {
        title: 'Call it',
        lang: 'bash',
        code: `curl localhost:8000/v1/chat/completions -d '{"model":"llama","messages":[{"role":"user","content":"hi"}]}'`,
      },
    ],
    terminology: [
      {
        term: 'PagedAttention',
        definition: 'KV-cache paging that removes fragmentation and lifts throughput.',
      },
      {
        term: 'Continuous batching',
        definition: 'Adding requests to a running batch so GPUs stay saturated.',
      },
      {
        term: 'Prefix caching',
        definition: 'Reusing KV for a shared prompt prefix across requests.',
      },
    ],
    exercises: [
      {
        title: 'Serve locally',
        prompt:
          'Serve a small open model with vLLM and benchmark tokens/sec at concurrency 1 and 16.',
        difficulty: 'advanced',
        estMinutes: 90,
      },
      {
        title: 'Quantized serving',
        prompt:
          'Serve an AWQ-quantized model and compare throughput and memory to the float model.',
        difficulty: 'advanced',
        estMinutes: 75,
      },
    ],
  },
  ollama: {
    track: 'ai-core-ml',
    phase: 9,
    order: 7,
    goal: 'Run a local LLM for development with zero setup.',
    comparisons: [
      {
        legacy: 'vLLM',
        modern: 'Ollama',
        note: 'Ollama trades some throughput for a one-command local development loop.',
      },
      {
        legacy: 'llama.cpp',
        modern: 'Ollama',
        note: 'Same local-inference goal; Ollama adds a model hub and an OpenAI-compatible API.',
      },
    ],
    syntax: [
      {
        title: 'Run a model',
        lang: 'bash',
        code: `ollama serve\nollama run llama3.1:8b`,
      },
      {
        title: 'Generate',
        lang: 'bash',
        code: `curl http://localhost:11434/api/generate -d '{"model":"llama3.1","prompt":"explain RAG"}'`,
      },
    ],
    terminology: [
      {
        term: 'Quantization tag',
        definition: 'Model variants like q4_k_m that trade quality for size/speed.',
      },
      {
        term: 'Modelfile',
        definition: 'A recipe that defines a model, its base, and its parameters.',
      },
      {
        term: 'OpenAI-compatible',
        definition: 'Exposes /v1 endpoints so existing clients work unchanged.',
      },
    ],
    exercises: [
      {
        title: 'Local dev loop',
        prompt: 'Run a model locally, point LiteLLM at it, and route a query through the gateway.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'Custom Modelfile',
        prompt:
          'Write a Modelfile with a system prompt and temperature, build it, and test the behaviour.',
        difficulty: 'intermediate',
        estMinutes: 35,
      },
    ],
  },
  modal: {
    track: 'ai-infra-cost',
    phase: 9,
    order: 8,
    goal: 'Deploy GPU workloads as serverless Python functions.',
    comparisons: [
      {
        legacy: 'AWS Lambda',
        modern: 'Modal',
        note: 'Modal gives you serverless GPUs that scale to zero, so you pay only while a job runs.',
      },
      {
        legacy: 'Ray',
        modern: 'Modal',
        note: 'Ray is a cluster you manage; Modal is a function you deploy.',
      },
    ],
    syntax: [
      {
        title: 'GPU function',
        lang: 'python',
        code: `import modal\napp = modal.App("embed")\n@app.function(gpu="A100", image=image)\ndef run(texts): ...`,
      },
      {
        title: 'Deploy and call',
        lang: 'bash',
        code: `modal deploy app.py\nmodal run app.py::run`,
      },
    ],
    terminology: [
      { term: 'Scale to zero', definition: 'No GPU billed when no requests are in flight.' },
      {
        term: 'Image',
        definition: 'A container definition (base, pip packages, secrets) for a function.',
      },
      {
        term: 'Volume',
        definition: 'Durable storage mounted into functions for model weights and caches.',
      },
    ],
    exercises: [
      {
        title: 'Serverless embed',
        prompt: 'Deploy a Modal function that embeds text on a GPU and call it from your laptop.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Batch 100k',
        prompt:
          'Batch-embed 100k rows on Modal with a concurrency cap. Measure cost and wall time.',
        difficulty: 'advanced',
        estMinutes: 70,
      },
    ],
  },
  promptfoo: {
    track: 'ai-infra-cost',
    phase: 9,
    order: 9,
    goal: 'Version prompts and gate changes with assertions in CI.',
    comparisons: [
      {
        legacy: 'Manual prompt testing',
        modern: 'Promptfoo',
        note: 'Promptfoo versions prompts and runs assertion suites in CI, so a prompt change is a reviewed artifact.',
      },
      {
        legacy: 'A/B tests in app code',
        modern: 'Promptfoo',
        note: 'Move the comparison out of the codebase and into a config you can diff.',
      },
    ],
    syntax: [
      {
        title: 'Config',
        lang: 'yaml',
        code: `prompts: ["Answer: {{question}}"]\nproviders: [openai:gpt-4o, anthropic:claude-3-5-sonnet]\ntests:\n  - vars: {question: "What is refund policy?"}\n    assert: [{type: contains, value: "30 days"}]`,
      },
      {
        title: 'Evaluate',
        lang: 'bash',
        code: `npx promptfoo eval -o results.json`,
      },
    ],
    terminology: [
      {
        term: 'Assertion',
        definition: 'A check on the output: contains, regex, JSON schema, or custom JS.',
      },
      { term: 'Vars', definition: 'Placeholder values injected into a prompt template.' },
      {
        term: 'Red team',
        definition: 'Automated adversarial prompts that probe for unsafe outputs.',
      },
    ],
    exercises: [
      {
        title: 'Prompt regression',
        prompt:
          'Write 20 assertions for a support prompt and run them across two models. Pick the winner.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'CI gate',
        prompt: 'Add a GitHub Action that runs promptfoo on PRs and comments the pass/fail table.',
        difficulty: 'advanced',
        estMinutes: 55,
      },
    ],
  },
  'nemo-guardrails': {
    track: 'ai-security-governance',
    phase: 9,
    order: 10,
    goal: 'Block jailbreaks and off-topic requests before the LLM sees them.',
    comparisons: [
      {
        legacy: 'If/else checks in prompts',
        modern: 'NeMo Guardrails',
        note: 'Colang turns safety rules into declarative rails that run before and after the LLM call.',
      },
      {
        legacy: 'Llama Guard',
        modern: 'NeMo Guardrails',
        note: 'Llama Guard is a classifier model; NeMo is a dialog-flow rule engine you can audit.',
      },
    ],
    syntax: [
      {
        title: 'Define a flow',
        lang: 'colang',
        code: `define flow refuse refund abuse\n  user asks for an unauthorized refund\n  bot refuse with "I can't do that"`,
      },
      {
        title: 'Generate with rails',
        lang: 'python',
        code: `rails = RailsConfig.from_path("config")\nawait rails.generate_async(messages=[{"role":"user","content":q}])`,
      },
    ],
    terminology: [
      { term: 'Colang', definition: 'The DSL for defining dialog flows and rails.' },
      { term: 'Input rail', definition: 'Checks the user message before the LLM call.' },
      { term: 'Dialog rail', definition: 'Stateful multi-turn rules (what the bot may say next).' },
    ],
    exercises: [
      {
        title: 'Jailbreak block',
        prompt:
          'Write a rail that refuses prompt-injection patterns and test it against 10 attacks.',
        difficulty: 'intermediate',
        estMinutes: 45,
      },
      {
        title: 'Off-topic drift',
        prompt: 'Add a rail that keeps a support bot on-topic and redirects everything else.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
    ],
  },
  presidio: {
    track: 'ai-security-governance',
    phase: 9,
    order: 11,
    goal: 'Detect and redact PII before it leaves your system.',
    comparisons: [
      {
        legacy: 'Regex redaction',
        modern: 'Presidio',
        note: 'Presidio adds NER and checksum recognizers, so it catches PII your regex list misses.',
      },
      {
        legacy: 'AWS Macie',
        modern: 'Presidio',
        note: 'Macie is the managed cloud scanner; Presidio runs inside your own code.',
      },
    ],
    syntax: [
      {
        title: 'Analyze + anonymize',
        lang: 'python',
        code: `from presidio_analyzer import AnalyzerEngine\nfrom presidio_anonymizer import AnonymizerEngine\nres = AnalyzerEngine().analyze(text, language="en")\nprint(AnonymizerEngine().anonymize(text, res).text)`,
      },
      {
        title: 'Custom recognizer',
        lang: 'python',
        code: `from presidio_analyzer import PatternRecognizer, Pattern\nPatternRecognizer(supported_entity="EMP_ID", patterns=[Pattern("emp", r"EMP-\\d{5}", 0.6)])`,
      },
    ],
    terminology: [
      { term: 'Entity', definition: 'A class of PII (PERSON, EMAIL_ADDRESS, CREDIT_CARD).' },
      { term: 'Recognizer', definition: 'A detector: regex, NLP, or checksum-based.' },
      {
        term: 'Anonymizer',
        definition: 'Replaces detected spans with placeholders or fake values.',
      },
    ],
    exercises: [
      {
        title: 'Redact a corpus',
        prompt:
          'Run Presidio over 100 chat logs; report entity counts and a sample redacted transcript.',
        difficulty: 'beginner',
        estMinutes: 30,
      },
      {
        title: 'Custom entity',
        prompt: 'Add a recognizer for your internal ticket IDs and prove it redacts them.',
        difficulty: 'intermediate',
        estMinutes: 35,
      },
    ],
  },
  'guardrails-ai': {
    track: 'ai-security-governance',
    phase: 9,
    order: 12,
    goal: 'Validate LLM output and re-ask on failure.',
    comparisons: [
      {
        legacy: 'Post-hoc regex checks',
        modern: 'Guardrails AI',
        note: 'Guardrails binds a schema to the LLM call and asks again on failure, instead of validating after the fact.',
      },
      {
        legacy: 'Pydantic + manual retry',
        modern: 'Guardrails AI',
        note: 'Same idea, packaged as a guard with a library of validators.',
      },
    ],
    syntax: [
      {
        title: 'Guard from a model',
        lang: 'python',
        code: `from guardrails import Guard\nfrom pydantic import BaseModel\nclass Reply(BaseModel):\n    answer: str\n    citations: list[str]\nguard = Guard().use(Reply)`,
      },
      {
        title: 'Validate',
        lang: 'python',
        code: `out = guard.parse(llm_output, model="gpt-4o")\nprint(out.validated_output)`,
      },
    ],
    terminology: [
      { term: 'Guard', definition: 'A reusable validator bound to a schema.' },
      {
        term: 'Re-ask',
        definition: 'On failure, resend the original plus the error to the model.',
      },
      {
        term: 'Validator',
        definition: 'A rule on a field: length, regex, SQL, semantic similarity.',
      },
    ],
    exercises: [
      {
        title: 'Structured reply guard',
        prompt:
          'Guard a reply schema with a citations array and prove it re-asks when citations are missing.',
        difficulty: 'intermediate',
        estMinutes: 40,
      },
      {
        title: 'Semantic validator',
        prompt: 'Add an embedding-similarity validator that rejects off-topic answers.',
        difficulty: 'advanced',
        estMinutes: 50,
      },
    ],
  },
  mcp: {
    track: 'ai-protocols-ux',
    phase: 9,
    order: 13,
    goal: 'Expose your data as a tool any MCP client can call.',
    comparisons: [
      {
        legacy: 'Custom tool JSON',
        modern: 'MCP',
        note: 'MCP standardizes how an agent discovers and calls your tools, so you write the tool once for every client.',
      },
      {
        legacy: 'OpenAPI / function calling',
        modern: 'MCP',
        note: 'Function calling is per-provider; MCP is a shared protocol for tools, resources, and prompts.',
      },
    ],
    syntax: [
      {
        title: 'Define a server',
        lang: 'python',
        code: `from mcp.server.fastmcp import FastMCP\nmcp = FastMCP("atlas")\n@mcp.tool()\ndef search_docs(q: str) -> list[str]:\n    return vector_db.search(q)`,
      },
      {
        title: 'Run it',
        lang: 'bash',
        code: `mcp.run(transport="stdio")`,
      },
    ],
    terminology: [
      {
        term: 'MCP server',
        definition: 'Exposes resources, tools, and prompts over a standard protocol.',
      },
      {
        term: 'MCP client',
        definition: 'An agent/host (Claude, Cursor) that discovers and calls servers.',
      },
      { term: 'Transport', definition: 'stdio for local processes, HTTP/SSE for remote servers.' },
    ],
    exercises: [
      {
        title: 'Wrap your search',
        prompt: 'Expose pgvector search as an MCP tool and call it from a client.',
        difficulty: 'intermediate',
        estMinutes: 50,
      },
      {
        title: 'Multi-server agent',
        prompt:
          'Connect an agent to two MCP servers (docs + database) and have it answer a joined question.',
        difficulty: 'advanced',
        estMinutes: 70,
      },
    ],
  },
};
