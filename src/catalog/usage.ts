/**
 * Usage layer: what each technology is actually used for, and what it pairs
 * with.
 *
 * Deliberately separate from `learning.ts`. That module answers "how do I
 * practice this" (syntax, terminology, drills, migration comparisons); this one
 * answers "what is this for and what does it combine with". They change for
 * different reasons — a new drill does not change a product's capabilities, and
 * a new capability does not change its exercises.
 *
 * Every capability carries a runnable snippet and an explanation of it. A
 * technique the reader cannot see in action is just a name, so the snippet
 * demonstrates one idea and the explanation says what to change to make it
 * yours. Keep snippets short and self-contained; they are teaching units, not
 * production code.
 *
 * Both maps are keyed by catalog product id, and `synergies[].withId` must
 * resolve to a real product. The validator and the test suite enforce both.
 */

export interface Example {
  /** Runnable snippet demonstrating the technique or the pairing. */
  code: string;
  /** Language key for the syntax highlighter; omit for plain text. */
  lang?: string;
  /** What the snippet shows and what to change to make it yours. */
  explanation: string;
}

export interface Capability {
  /** The technique or method, named as a practitioner would say it. */
  name: string;
  /** One line on what it is for and when you reach for it. */
  detail: string;
  example: Example;
}

export interface Synergy {
  /** Catalog id of the technology this one pairs with. */
  withId: string;
  /** What the pairing buys you that neither gives alone. */
  note: string;
  /** The two composed in one snippet, and why the composition works. */
  example: Example;
}

export interface UsageEntry {
  capabilities: Capability[];
  synergies: Synergy[];
}

export const USAGE: Record<string, UsageEntry> = {
  // ── Data foundations ───────────────────────────────────────────────────
  docling: {
    capabilities: [
      {
        name: 'PDF to Markdown',
        detail: 'Converts a PDF into Markdown while keeping headings, lists, and reading order.',
        example: {
          lang: 'bash',
          code: 'docling report.pdf --output ./out --to md\n# emit JSON too when a pipeline consumes the output\ndocling report.pdf --output ./out --to json',
          explanation:
            'Run this on a real PDF you already have, then read the Markdown. Heading levels and list nesting surviving the trip is the whole test.',
        },
      },
      {
        name: 'Table structure recognition',
        detail: 'Rebuilds rows, columns, and headers from ruling lines or whitespace.',
        example: {
          lang: 'python',
          code: 'from docling.document_converter import DocumentConverter\n\nresult = DocumentConverter().convert("tables.pdf")\nmd = result.document.export_to_markdown()\nprint(md[md.index("|"):][:400])',
          explanation:
            'The slice prints the first table it finds. If cells arrive merged or out of order, that page needs layout analysis rather than plain text extraction.',
        },
      },
      {
        name: 'Layout analysis',
        detail: 'Detects blocks and reading order first, so multi-column pages stay coherent.',
        example: {
          lang: 'python',
          code: 'from docling.datamodel.pipeline_options import PdfPipelineOptions\n\nopts = PdfPipelineOptions()\nopts.do_table_structure = True\nopts.do_ocr = False',
          explanation:
            'These flags decide how much layout work runs. Turn OCR on only for scanned files — it is the slowest and most expensive stage by far.',
        },
      },
      {
        name: 'Retrieval chunking',
        detail: 'Emits elements sized for embedding rather than whole documents.',
        example: {
          lang: 'python',
          code: 'for el in result.document.texts[:10]:\n    print(el.label, len(el.text), el.text[:60].replace("\\n", " "))',
          explanation:
            'Look at the label and length of each element. Anything much past 500 characters is a poor embedding unit and should be split again.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pgvector',
        note: 'Embed Docling chunks and query them with hybrid SQL plus vector search.',
        example: {
          lang: 'python',
          code: 'result = DocumentConverter().convert("report.pdf")\nchunks = [el.text for el in result.document.texts if len(el.text) > 80]\n\ndb.executemany(\n    "INSERT INTO docs (body, embedding) VALUES (%s, %s)",\n    [(c, embed(c)) for c in chunks],\n)',
          explanation:
            'Docling gives the chunk, pgvector stores it with its embedding in the same row — one transaction, so a re-parse never leaves orphans behind.',
        },
      },
      {
        withId: 'llamaindex',
        note: 'Feed Docling output straight into LlamaIndex nodes, retrievers, and query engines.',
        example: {
          lang: 'python',
          code: 'docs = [Document(text=el.text, metadata=el.meta) for el in result.document.texts]\nindex = VectorStoreIndex.from_documents(docs)\nengine = index.as_query_engine()',
          explanation:
            'The Document is the unit both sides speak. Keep Docling’s element label in the metadata so a retrieval hit can name the page it came from.',
        },
      },
      {
        withId: 'sentence-transformers',
        note: 'Embed the extracted chunks locally for offline, no-bill search.',
        example: {
          lang: 'python',
          code: 'from sentence_transformers import SentenceTransformer\n\nm = SentenceTransformer("BAAI/bge-small-en-v1.5")\nemb = m.encode(chunks, normalize_embeddings=True)',
          explanation:
            'Normalize so cosine becomes a dot product. Run this once over the corpus and store the vectors — re-encoding every query is the expensive habit to avoid.',
        },
      },
      {
        withId: 'unstructured-io',
        note: 'Swap parsers when a document needs connectors Docling does not have.',
        example: {
          lang: 'python',
          code: '# Two parsers, one downstream shape.\npdf = DocumentConverter().convert("report.pdf")\ndrive = partition("s3://bucket/contracts/")',
          explanation:
            'Standardize on element text plus metadata so swapping one parser for the other does not touch the index. The rule is coarse on purpose.',
        },
      },
    ],
  },
  'unstructured-io': {
    capabilities: [
      {
        name: 'Auto partitioning',
        detail: 'Picks a strategy from the file type and returns titled elements.',
        example: {
          lang: 'python',
          code: 'from unstructured.partition.auto import partition\n\nelements = partition(filename="doc.pdf")\nprint([(el.category, len(el.text)) for el in elements[:8]])',
          explanation:
            'The category tells you what each element is — Table, NarrativeText, Title. That label is what you filter on before embedding.',
        },
      },
      {
        name: 'hi_res strategy',
        detail: 'Layout-aware extraction for tables and forms, at a higher time cost.',
        example: {
          lang: 'python',
          code: 'elements = partition(\n    filename="form.pdf",\n    strategy="hi_res",\n    infer_table_structure=True,\n)',
          explanation:
            'hi_res is the slow path. Run fast and hi_res over the same file and keep hi_res only for pages where tables or forms actually matter.',
        },
      },
      {
        name: 'Cloud source connectors',
        detail: 'Reads straight from S3, Google Drive, and SharePoint.',
        example: {
          lang: 'python',
          code: 'from unstructured.partition.s3 import partition_s3\n\nelements = partition_s3(bucket="docs", key="contracts/2026.pdf")',
          explanation:
            'Credentials come from the environment, not the call. Move the bucket name into configuration so the same code runs in dev and prod.',
        },
      },
      {
        name: 'Element enrichment',
        detail: 'Summarises, embeds, or runs NER over partitioned elements.',
        example: {
          lang: 'python',
          code: 'from unstructured.cleaners.core import clean\n\ncleaned = [\n    clean(el.text, bullets=False, extra_whitespace=True)\n    for el in elements\n]',
          explanation:
            'Cleaning is cheap and removes the artefacts that hurt retrieval most: stray bullets, repeated spaces, trailing hyphenation.',
        },
      },
    ],
    synergies: [
      {
        withId: 'docling',
        note: 'Prefer Docling when table fidelity matters more than connector breadth.',
        example: {
          lang: 'python',
          code: 'from docling.document_converter import DocumentConverter\n\nif path.endswith(".pdf"):\n    docs = DocumentConverter().convert(path).document.texts\nelse:\n    docs = partition(path)   # Office, HTML, images',
          explanation:
            'Route by source type. A parser chosen by file extension is easier to reason about than one chosen by sniffing content, and the index sees one shape either way.',
        },
      },
      {
        withId: 'pgvector',
        note: 'Store the partitioned chunks and search them with metadata filters.',
        example: {
          lang: 'python',
          code: 'elements = partition(filename="doc.pdf", strategy="hi_res")\nrows = [(el.text, embed(el.text), el.metadata.page_number) for el in elements]\ndb.executemany(\n    "INSERT INTO docs (body, embedding, page) VALUES (%s, %s, %s)", rows\n)',
          explanation:
            'The page number is the field that makes a citation trustworthy. Carry metadata through at insert time, not as a second lookup.',
        },
      },
      {
        withId: 'sentence-transformers',
        note: 'Embed chunks with a local model to keep ingestion offline.',
        example: {
          lang: 'python',
          code: 'texts = [el.text for el in partition(filename="doc.docx")]\nemb = SentenceTransformer("BAAI/bge-small-en-v1.5").encode(texts)',
          explanation:
            'Partition first, embed second. Embedding raw file bytes produces a vector that matches nothing.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Hand the chunks to an agent as a retrieval tool.',
        example: {
          lang: 'python',
          code: '@tool\ndef ingest_doc(path: str) -> int:\n    els = partition(filename=path)\n    db.insert_many([{"body": e.text} for e in els])\n    return len(els)',
          explanation:
            'The agent needs one tool. Ingestion stays deterministic and replayable because the graph owns the retry, not the parser.',
        },
      },
    ],
  },
  polars: {
    capabilities: [
      {
        name: 'Lazy query plans',
        detail: 'Builds a plan first and runs it on collect(), pushing filters down.',
        example: {
          lang: 'python',
          code: 'import polars as pl\n\ndf = (\n    pl.scan_parquet("events.parquet")\n    .filter(pl.col("score") > 0.8)\n    .group_by("tenant")\n    .agg(pl.col("amt").sum())\n)\nprint(df.explain())',
          explanation:
            'explain() shows the plan before anything runs. Look for the filter sitting next to the scan — that is predicate pushdown, and it is why lazy is faster.',
        },
      },
      {
        name: 'Out-of-core processing',
        detail: 'Streams a dataset larger than RAM with streaming=True.',
        example: {
          lang: 'python',
          code: 'df = pl.scan_csv("big.csv").group_by("tenant").agg(pl.len())\nresult = df.collect(streaming=True)\nprint(result.height)',
          explanation:
            'If this finishes on a machine smaller than the file, streaming worked. If it still swaps, reduce the batch size before switching tools.',
        },
      },
      {
        name: 'Fast aggregations',
        detail: 'Multi-threaded group-bys and joins over millions of rows.',
        example: {
          lang: 'python',
          code: 'df.group_by("tenant").agg([\n    pl.col("amt").sum().alias("total"),\n    pl.col("amt").mean().alias("avg"),\n    pl.len().alias("rows"),\n]).sort("total", descending=True)',
          explanation:
            'One pass computes every aggregate. Sort once at the end — sorting between aggregations forces an early materialisation.',
        },
      },
      {
        name: 'Expression API',
        detail: 'Composes transformations declaratively and reuses them in pipelines.',
        example: {
          lang: 'python',
          code: 'total = (pl.col("qty") * pl.col("price")).alias("total")\n\ndf.with_columns(total).filter(pl.col("total") > 100)',
          explanation:
            'Name the expression once and reuse it across frames. Expressions are plan fragments, so reuse does not copy data.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pandas',
        note: 'Drop-in replacement for the ETL that outgrows Pandas’ single-threaded engine.',
        example: {
          lang: 'python',
          code: 'import polars as pl\n\nout = (\n    pl.from_pandas(pd.read_csv("events.csv"))\n    .group_by("tenant")\n    .agg(pl.col("amt").sum())\n    .to_pandas()\n)',
          explanation:
            'Convert once at the boundary. Doing pandas work in the middle of a Polars plan means paying the conversion on every row.',
        },
      },
      {
        withId: 'dagster',
        note: 'Load and clean raw files as assets before anything is embedded.',
        example: {
          lang: 'python',
          code: 'from dagster import asset\n\n@asset\ndef clean_events(raw: pl.DataFrame) -> pl.DataFrame:\n    return raw.filter(pl.col("amt") > 0).unique(subset=["id"])',
          explanation:
            'The asset is the frame. Dagster tracks when it ran; Polars decides how. Neither needs to know the other’s job.',
        },
      },
      {
        withId: 'docling',
        note: 'Turn parsed PDF elements into a frame for bulk cleaning and deduping.',
        example: {
          lang: 'python',
          code: 'df = pl.DataFrame([\n    {"label": el.label, "text": el.text}\n    for el in result.document.texts\n]).filter(pl.col("text").str.len_chars() > 60)',
          explanation:
            'A frame makes the messy part explicit: dedupe, drop short fragments, cast types — before the text reaches an embedder.',
        },
      },
      {
        withId: 'modal',
        note: 'Run the heaviest transforms on a serverless worker that scales to zero.',
        example: {
          lang: 'python',
          code: '@app.function(gpu="A100")\ndef transform(path: str) -> str:\n    return (\n        pl.scan_parquet(path)\n        .group_by("tenant")\n        .agg(pl.len())\n        .write_parquet("/out/summary.parquet")\n    )',
          explanation:
            'The function is where the frame is processed. Modal supplies the machine; Polars decides whether the work fits in memory.',
        },
      },
    ],
  },
  pandas: {
    capabilities: [
      {
        name: 'Interactive exploration',
        detail: 'Inspects and filters small datasets directly in a notebook.',
        example: {
          lang: 'python',
          code: 'import pandas as pd\n\ndf = pd.read_csv("data.csv")\ndf[df.score > 0.8].groupby("tenant").amt.sum()',
          explanation:
            'This is the loop to use while you are still shaping the question. Once the query is stable, move it into a script.',
        },
      },
      {
        name: 'Data cleaning',
        detail: 'Handles nulls, duplicates, and type coercion with familiar APIs.',
        example: {
          lang: 'python',
          code: 'df = (\n    df.drop_duplicates(subset=["id"])\n    .assign(amt=lambda d: pd.to_numeric(d.amt, errors="coerce"))\n    .dropna(subset=["amt"])\n)',
          explanation:
            'Coerce with errors="coerce" rather than letting one bad row raise. Count the NaNs afterwards — a silent coerce can erase the signal you wanted.',
        },
      },
      {
        name: 'Group-by analysis',
        detail: 'Aggregates and pivots business metrics without leaving the frame.',
        example: {
          lang: 'python',
          code: 'df.pivot_table(\n    index="tenant",\n    columns="month",\n    values="amt",\n    aggfunc="sum",\n    fill_value=0,\n)',
          explanation:
            'pivot_table reshapes for reading; groupby reshapes for further computation. Pick based on what the result is for.',
        },
      },
    ],
    synergies: [
      {
        withId: 'polars',
        note: 'Rewrite the heaviest transforms in Polars once Pandas becomes the bottleneck.',
        example: {
          lang: 'python',
          code: 'import polars as pl\n\ndf = pl.from_pandas(df).group_by("tenant").agg(pl.col("amt").sum())',
          explanation:
            'Wrap the frame once and let the query planner handle the rest. If this is slow, the problem is usually the aggregation, not the library.',
        },
      },
      {
        withId: 'scikit-learn',
        note: 'Hand a cleaned, tidy DataFrame straight to a classifier.',
        example: {
          lang: 'python',
          code: 'X = df[["amt", "qty"]].to_numpy()\ny = df["churned"].to_numpy()\nclf.fit(X, y)',
          explanation:
            'The split is the contract: everything upstream is Pandas, everything downstream is NumPy. Convert at exactly that line.',
        },
      },
      {
        withId: 'docling',
        note: 'Normalise parsed PDF tables into a frame you can actually query.',
        example: {
          lang: 'python',
          code: 'tables = [el for el in result.document.tables]\ndf = pl.DataFrame([{"cell": c.text} for c in tables[0].data]).to_pandas()',
          explanation:
            'Parsed tables arrive as structured cells. Normalize them here, once, so the notebook never re-parses the PDF.',
        },
      },
    ],
  },
  pgvector: {
    capabilities: [
      {
        name: 'Vectors in Postgres',
        detail: 'Stores embeddings beside the rows they describe, in one transaction.',
        example: {
          lang: 'sql',
          code: 'CREATE EXTENSION vector;\n\nCREATE TABLE docs (\n    id bigserial PRIMARY KEY,\n    body text,\n    tenant text,\n    embedding vector(1536)\n);',
          explanation:
            'Keeping the embedding in the same row means a delete or a tenant update is one transaction, not two systems to keep in sync.',
        },
      },
      {
        name: 'Approximate nearest neighbours',
        detail: 'HNSW indexing for fast similarity search at million-row scale.',
        example: {
          lang: 'sql',
          code: 'CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops);\n\nSELECT id, embedding <=> $1::vector AS distance\nFROM docs\nORDER BY distance\nLIMIT 10;',
          explanation:
            'Build the index after the bulk load. Incremental inserts keep it fast, but a bulk rebuild is still cheaper than thousands of small updates.',
        },
      },
      {
        name: 'Hybrid search',
        detail: 'Blends cosine similarity with BM25 keyword ranking in one query.',
        example: {
          lang: 'sql',
          code: 'SELECT id,\n       0.7 * (1 - (embedding <=> $1::vector))\n     + 0.3 * ts_rank_cd(tsv, websearch_to_tsquery($2)) AS rank\nFROM docs\nWHERE tenant = $3\nORDER BY rank DESC\nLIMIT 10;',
          explanation:
            'The two weights are the tuning knob. Start at 0.7 / 0.3 and move them only after measuring recall on your own queries.',
        },
      },
      {
        name: 'Metadata filtering',
        detail: 'Narrows by tenant, date, or tag before or after the vector search.',
        example: {
          lang: 'sql',
          code: "SELECT id\nFROM docs\nWHERE tenant = $1\n  AND created_at > now() - interval '30 days'\nORDER BY embedding <=> $2::vector\nLIMIT 10;",
          explanation:
            'Put the equality filter in WHERE and keep the vector sort last, so Postgres can narrow with an index scan before the expensive ordering.',
        },
      },
    ],
    synergies: [
      {
        withId: 'sentence-transformers',
        note: 'Generates the embeddings you store and search.',
        example: {
          lang: 'python',
          code: 'emb = SentenceTransformer("BAAI/bge-small-en-v1.5").encode(docs, normalize_embeddings=True)\ndb.executemany(\n    "INSERT INTO docs (body, embedding) VALUES (%s, %s)", zip(docs, emb)\n)',
          explanation:
            'Normalised vectors let Postgres use a dot product for cosine. That one flag is the difference between a fast index and a slow one.',
        },
      },
      {
        withId: 'docling',
        note: 'Chunks the source documents before anything is embedded.',
        example: {
          lang: 'python',
          code: 'for el in result.document.texts:\n    db.execute(\n        "INSERT INTO docs (body, page, tenant) VALUES (%s, %s, %s)",\n        (el.text, el.meta.page, tenant),\n    )',
          explanation:
            'Docling gives the page, pgvector keeps it. A citation without a page number is a guess the reader cannot check.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Becomes a tool an agent calls to look things up.',
        example: {
          lang: 'python',
          code: '@tool\ndef search_docs(q: str) -> list[str]:\n    return db.query(\n        "SELECT body FROM docs ORDER BY embedding <=> %s::vector LIMIT 5", embed(q)\n    )',
          explanation:
            'The tool is one SQL statement. The graph decides when to call it; the database decides what is relevant.',
        },
      },
      {
        withId: 'litellm',
        note: 'Compare retrieval quality across models on the same stored vectors.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=messages)\ndb.execute(\n    "INSERT INTO traces (body, embedding) VALUES (%s, %s)",\n    (resp.choices[0].message.content, embed(resp.choices[0].message.content)),\n)',
          explanation:
            'Store what the model said beside its embedding. You can then retrieve past answers instead of paying for the same question twice.',
        },
      },
    ],
  },
  pinecone: {
    capabilities: [
      {
        name: 'Managed vector index',
        detail: 'Serverless indexes that scale to zero when idle.',
        example: {
          lang: 'python',
          code: 'import pinecone\n\npc = pinecone.Pinecone(api_key="...")\nidx = pc.Index("docs")\nidx.upsert(vectors=[{\n    "id": "1",\n    "values": [0.1, 0.2],\n    "metadata": {"tenant": "a"},\n}])',
          explanation:
            'Upsert in batches of a few hundred vectors. One request per row hits the rate limit long before the index does.',
        },
      },
      {
        name: 'Namespaces',
        detail: 'Partitions one index per tenant or dataset without extra clusters.',
        example: {
          lang: 'python',
          code: 'idx.upsert(vectors=batch, namespace="tenant-a")\nidx.query(vector=q, namespace="tenant-a", top_k=10)',
          explanation:
            'Namespaces are the isolation boundary, so put the tenant there and keep metadata for everything finer-grained.',
        },
      },
      {
        name: 'Hybrid sparse and dense',
        detail: 'Blends keyword and semantic matching in a single query.',
        example: {
          lang: 'python',
          code: 'idx.query(\n    vector=dense_vector,\n    sparse_vector={"indices": [12, 340], "values": [0.9, 0.4]},\n    top_k=10,\n)',
          explanation:
            'The sparse half carries exact terms. When a query fails on a product name or an error code, that is the half that fixes it.',
        },
      },
    ],
    synergies: [
      {
        withId: 'sentence-transformers',
        note: 'Produces the dense and sparse vectors the index stores.',
        example: {
          lang: 'python',
          code: 'idx.upsert(vectors=[{"id": str(i), "values": v} for i, v in enumerate(emb)])',
          explanation:
            'The id is yours, so make it meaningful — a document id lets you delete a whole document without scanning for its vectors.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Traces retrieval quality so a re-index is measurable.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="search")\nres = idx.query(vector=emb, top_k=10)\ntrace.score(name="hit_rate", value=len(res.matches) / 10)',
          explanation:
            'Score the retrieval, not the answer. A hit rate that falls after a re-embed tells you the model changed, not the prompt.',
        },
      },
      {
        withId: 'litellm',
        note: 'Routes queries across models and compares what comes back.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=[{"role": "user", "content": ctx}])\nidx.upsert(vectors=[{"id": q_id, "values": embed(ctx)}])',
          explanation:
            'Log what was asked and what was answered. Without the stored vector you cannot compare one model’s retrieval against another’s.',
        },
      },
    ],
  },
  chroma: {
    capabilities: [
      {
        name: 'In-process vector store',
        detail: 'Prototypes RAG with no server to run or pay for.',
        example: {
          lang: 'python',
          code: 'import chromadb\n\nclient = chromadb.Client()\ncol = client.get_or_create_collection("docs")\ncol.add(ids=["1"], documents=["hello"], embeddings=[[0.1, 0.2]])\ncol.query(query_embeddings=[[0.1, 0.2]], n_results=5)',
          explanation:
            'Everything lives in the process, which is exactly why this is a prototype tool. Keep the collection calls identical and moving to a server later stays small.',
        },
      },
      {
        name: 'Persistent collections',
        detail: 'Writes the index to disk so it survives a restart.',
        example: {
          lang: 'python',
          code: 'client = chromadb.PersistentClient(path="./chroma")\ncol = client.get_or_create_collection("docs")\nprint(col.count())',
          explanation:
            'Point the path at a real directory and back it up like data. The collection is only as durable as that folder.',
        },
      },
      {
        name: 'Where-filters',
        detail: 'Filters results by document metadata before ranking.',
        example: {
          lang: 'python',
          code: 'col.query(\n    query_embeddings=[[0.1, 0.2]],\n    where={"tenant": {"$eq": "a"}},\n    n_results=5,\n)',
          explanation:
            'Filter on fields you always restrict by, like tenant or source. Filtering on highly unique fields throws the recall away.',
        },
      },
    ],
    synergies: [
      {
        withId: 'sentence-transformers',
        note: 'Embeds the text you add to a collection.',
        example: {
          lang: 'python',
          code: 'col.add(\n    ids=[str(i) for i in range(len(docs))],\n    documents=docs,\n    embeddings=emb,\n)',
          explanation:
            'Pass precomputed embeddings so Chroma does not embed twice. That is the single biggest speed-up available at this scale.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Serves as the retriever behind an agent tool.',
        example: {
          lang: 'python',
          code: '@tool\ndef lookup(q: str) -> str:\n    hits = col.query(query_embeddings=[embed(q)], n_results=3)\n    return "\\n".join(hits["documents"][0])',
          explanation:
            'Return the documents, not the ids. The model can only use what it can read.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Regression-tests the retriever when prompts change.',
        example: {
          lang: 'python',
          code: 'hits = col.query(query_embeddings=[embed(question)], n_results=5)\nassert any("30 days" in d for d in hits["documents"][0])',
          explanation:
            'Assert on the retrieved text, not on the final answer. When retrieval is wrong the answer is wrong, and the answer is where you will look last.',
        },
      },
    ],
  },
  weaviate: {
    capabilities: [
      {
        name: 'GraphQL vector queries',
        detail: 'Searches through a typed GraphQL API instead of SDK calls.',
        example: {
          lang: 'graphql',
          code: '{\n  Get {\n    Doc(\n      nearVector: { vector: [0.1, 0.2] }\n      limit: 10\n    ) {\n      body\n      tenant\n    }\n  }\n}',
          explanation:
            'nearVector is the vector path; nearText delegates embedding to a module. Pick one per class and stay consistent across the schema.',
        },
      },
      {
        name: 'Built-in vectorizers',
        detail: 'Lets the database embed text for you.',
        example: {
          lang: 'python',
          code: 'import weaviate\n\nclient = weaviate.connect_to_local()\nclient.collections.create(\n    name="Doc",\n    vectorizer_config=weaviate.config.Configure.Vectorizer.text2vec_openai(),\n)',
          explanation:
            'Convenient for a prototype, but it hides the model version. For anything you compare over time, embed yourself and store the vectors.',
        },
      },
      {
        name: 'Hybrid alpha blending',
        detail: 'Tunes keyword versus vector weight per query.',
        example: {
          lang: 'python',
          code: 'col = client.collections.get("Doc")\ncol.query.hybrid(query="refund policy", alpha=0.5, limit=5)',
          explanation:
            'alpha 0 is pure keyword and alpha 1 is pure vector. 0.5 is the neutral start — measure before moving it.',
        },
      },
    ],
    synergies: [
      {
        withId: 'sentence-transformers',
        note: 'Runs as the module that vectorises each object.',
        example: {
          lang: 'python',
          code: 'col = client.collections.get("Doc")\ncol.data.insert_many([\n    {"body": d, "vector": v} for d, v in zip(docs, emb)\n])',
          explanation:
            'Bringing your own vectors means the model version is recorded in your code, not hidden in a database module.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Acts as an agent’s search tool over a shared schema.',
        example: {
          lang: 'python',
          code: '@tool\ndef search(q: str) -> str:\n    hits = col.query.near_text(query=q, limit=3)\n    return "\\n".join(o.properties["body"] for o in hits.objects)',
          explanation:
            'near_text lets Weaviate embed; near_vector uses yours. Pick one and record which, or two runs of the same query will disagree.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Lets you A/B hybrid weights with assertions.',
        example: {
          lang: 'python',
          code: 'hits = col.query.hybrid(query=question, alpha=0.5, limit=5)\nassert max(h.score for h in hits.objects) > 0.6',
          explanation:
            'Hybrid alpha is a tunable, so treat it as one. Assert a score floor and a change to the weight fails the suite instead of shipping quietly.',
        },
      },
    ],
  },
  qdrant: {
    capabilities: [
      {
        name: 'Payload indexing',
        detail: 'Indexes metadata so filtered vector search stays fast.',
        example: {
          lang: 'python',
          code: 'from qdrant_client import models\n\nclient.create_payload_index(\n    "docs",\n    field_name="tenant",\n    field_schema=models.PayloadSchemaType.KEYWORD,\n)',
          explanation:
            'Without a payload index, a filtered search scans everything. Create the index once, before the bulk load.',
        },
      },
      {
        name: 'Scalar quantization',
        detail: 'Compresses vectors to save memory at a small recall cost.',
        example: {
          lang: 'python',
          code: 'quantization = models.ScalarQuantization(\n    scalar=models.ScalarQuantizationConfig(\n        type=models.ScalarType.INT8,\n        always_ram=True,\n    )\n)',
          explanation:
            'INT8 cuts memory roughly fourfold. Measure recall@10 afterwards — if it falls more than a point or two the trade is not worth it.',
        },
      },
      {
        name: 'Filtered search',
        detail: 'Narrows results by payload before the vector sort.',
        example: {
          lang: 'python',
          code: 'client.query_points(\n    collection_name="docs",\n    query=[0.1] * 1536,\n    query_filter=models.Filter(must=[\n        models.FieldCondition(\n            key="tenant",\n            match=models.MatchValue(value="a"),\n        )\n    ]),\n    limit=10,\n)',
          explanation:
            'The filter runs against the payload index, then the vector search runs on the survivors. Put the most selective condition first.',
        },
      },
    ],
    synergies: [
      {
        withId: 'sentence-transformers',
        note: 'Supplies the embeddings stored as points.',
        example: {
          lang: 'python',
          code: 'client.upsert(\n    "docs",\n    points=[\n        models.PointStruct(id=i, vector=v, payload={"body": d})\n        for i, (d, v) in enumerate(zip(docs, emb))\n    ],\n)',
          explanation:
            'The payload is where filtering lives. Put the tenant there and the vector search never needs to know about it.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Tracks recall so quantization trade-offs are visible.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="retrieve")\nres = client.query_points("docs", query=emb, limit=5)\ntrace.score(name="recall", value=len(res.points) / 5)',
          explanation:
            'Score retrieval before generation. Recall is the metric that moves when the embeddings change, and generation scores will not show it.',
        },
      },
      {
        withId: 'litellm',
        note: 'Serves the same vectors to every model you route to.',
        example: {
          lang: 'python',
          code: 'litellm.completion(model="gpt-4o", messages=messages)\nclient.upsert(\n    "logs",\n    points=[{"id": str(i), "vector": v} for i, v in enumerate(emb)],\n)',
          explanation:
            'One call, one stored vector. Later you can search past conversations by meaning instead of by keyword.',
        },
      },
    ],
  },

  // ── Agents and orchestration ──────────────────────────────────────────
  langgraph: {
    capabilities: [
      {
        name: 'Stateful graphs',
        detail: 'Models an agent as nodes and edges sharing one typed state.',
        example: {
          lang: 'python',
          code: 'from langgraph.graph import StateGraph, START, END\nfrom typing import TypedDict\n\nclass S(TypedDict):\n    messages: list\n\ng = StateGraph(S)\ng.add_node("agent", agent_node)\ng.add_edge(START, "agent")\ng.add_edge("agent", END)\napp = g.compile()',
          explanation:
            'The state schema is the contract. Every node returns a partial update, so two nodes must never write the same key unless you meant them to.',
        },
      },
      {
        name: 'Cycles and loops',
        detail: 'Lets an agent retry, reflect, or call tools repeatedly.',
        example: {
          lang: 'python',
          code: 'def route(state: S) -> str:\n    last = state["messages"][-1]\n    return "tools" if last.tool_calls else END\n\ng.add_conditional_edges("agent", route, {"tools": "tools", END: END})',
          explanation:
            'A conditional edge is how you leave the loop. Without a terminating condition the graph runs forever, so test the exit path first.',
        },
      },
      {
        name: 'Checkpointers',
        detail: 'Persists state per thread and resumes after a failure.',
        example: {
          lang: 'python',
          code: 'from langgraph.checkpoint.sqlite import SqliteSaver\n\napp = g.compile(checkpointer=SqliteSaver.from_conn_string("state.db"))\napp.invoke(\n    {"messages": []},\n    config={"configurable": {"thread_id": "42"}},\n)',
          explanation:
            'The thread_id is the conversation. Reuse it to resume, change it to start a new one — mixing the two is the most common bug.',
        },
      },
      {
        name: 'Human-in-the-loop',
        detail: 'Interrupts on an edge and resumes with a human decision.',
        example: {
          lang: 'python',
          code: 'app = g.compile(checkpointer=saver, interrupt_before=["delete_node"])\n\napp.update_state(config, {"approved": True}, as_node="human")\napp.invoke(None, config)',
          explanation:
            'interrupt_before names the node that must not run unattended. update_state injects the decision, and invoke(None) resumes without re-running the graph.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pydantic',
        note: 'Types the state that flows between nodes.',
        example: {
          lang: 'python',
          code: 'class S(TypedDict, total=False):\n    invoice: Invoice\n\ndef node(state: S) -> S:\n    return {"invoice": Invoice.model_validate(state["raw"])}',
          explanation:
            'The model travels inside the state, so every node downstream is typed. A dict at the boundary becomes a model once.',
        },
      },
      {
        withId: 'instructor',
        note: 'Keeps each node’s output structurally valid.',
        example: {
          lang: 'python',
          code: '@app.tool\ndef extract_invoice(text: str) -> Invoice:\n    return client.chat.completions.create(\n        model="gpt-4o", response_model=Invoice,\n        messages=[{"role": "user", "content": text}],\n    )',
          explanation:
            'The tool returns a validated model, so the graph can rely on its fields. An invalid reply is retried before any node sees it.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Traces every node and tool call as one run.',
        example: {
          lang: 'python',
          code: '@ls.traceable\ndef agent_node(state: S) -> S: ...\n\napp.invoke({"messages": []}, config={"configurable": {"thread_id": "42"}})',
          explanation:
            'Trace the node, not the whole app. One span per node is what makes a 40-step run readable in the UI.',
        },
      },
      {
        withId: 'pgvector',
        note: 'Becomes the retrieval tool an agent calls mid-graph.',
        example: {
          lang: 'python',
          code: '@tool\ndef search_docs(q: str) -> list[str]:\n    return db.query(\n        "SELECT body FROM docs ORDER BY embedding <=> %s::vector LIMIT 5", embed(q)\n    )',
          explanation:
            'The tool is one SQL statement. The graph decides when to call it; the database decides what is relevant.',
        },
      },
      {
        withId: 'mcp',
        note: 'Connects external tool servers without custom adapters.',
        example: {
          lang: 'python',
          code: 'from langchain_mcp_adapters.client import MultiServerMCPClient\n\nclient = MultiServerMCPClient({"atlas": {"url": "http://localhost:8000/mcp"}})\ng.add_node("tools", ToolNode(await client.get_tools()))',
          explanation:
            'The MCP tools appear in the graph as ordinary nodes. That is the point: a new server is a config change, not a rewrite.',
        },
      },
      {
        withId: 'fastapi',
        note: 'Serves a compiled graph behind a typed HTTP endpoint.',
        example: {
          lang: 'python',
          code: '@app.post("/chat")\nasync def chat(req: ChatRequest):\n    return StreamingResponse(\n        app.astream(\n            {"messages": req.messages},\n            {"configurable": {"thread_id": req.user_id}},\n        )\n    )',
          explanation:
            'The thread_id comes from the user, so a reload resumes the same conversation. Generating a new id per request is how state gets lost.',
        },
      },
    ],
  },
  llamaindex: {
    capabilities: [
      {
        name: 'Document loaders',
        detail: 'Ingests PDFs, databases, and APIs as index nodes.',
        example: {
          lang: 'python',
          code: 'from llama_index.core import SimpleDirectoryReader\n\ndocs = SimpleDirectoryReader("./data", recursive=True).load_data()\nprint(len(docs), docs[0].metadata)',
          explanation:
            'Metadata travels with each node. Set it deliberately at load time — it is the only filtering you get for free later.',
        },
      },
      {
        name: 'Index construction',
        detail: 'Builds vector, keyword, or auto-merging indexes.',
        example: {
          lang: 'python',
          code: 'from llama_index.core import VectorStoreIndex\n\nindex = VectorStoreIndex.from_documents(docs)\nindex.storage_context.persist(persist_dir="./storage")',
          explanation:
            'persist() writes the index to disk. Rebuilding from source should be a deliberate choice, not something you do every run.',
        },
      },
      {
        name: 'Query engines',
        detail: 'Answers questions with sub-question decomposition.',
        example: {
          lang: 'python',
          code: 'engine = index.as_query_engine(similarity_top_k=5)\nresponse = engine.query("what is the refund policy?")\nprint(response.source_nodes[0].score)',
          explanation:
            'Inspect source_nodes, not just the answer. A low top score means the answer was synthesised from weak evidence.',
        },
      },
      {
        name: 'Routers',
        detail: 'Picks the right index or tool for each query.',
        example: {
          lang: 'python',
          code: 'from llama_index.core.tools import QueryEngineTool\nfrom llama_index.core.agent import ReActAgent\n\nagent = ReActAgent.from_tools([QueryEngineTool.from_defaults(engine)])',
          explanation:
            'Route on what the query is asking for, not on keywords. A router built on a word list breaks the moment a user paraphrases.',
        },
      },
    ],
    synergies: [
      {
        withId: 'docling',
        note: 'Parses source PDFs before they become index nodes.',
        example: {
          lang: 'python',
          code: 'docs = [\n    Document(text=el.text)\n    for el in DocumentConverter().convert("report.pdf").document.texts\n]\nindex = VectorStoreIndex.from_documents(docs)',
          explanation:
            'The parser and the index never need to know about each other. That boundary is what lets you swap Docling for something else later.',
        },
      },
      {
        withId: 'pgvector',
        note: 'Backs the index with Postgres so metadata filters come free.',
        example: {
          lang: 'python',
          code: 'from llama_index.vector_stores.postgres import PGVectorStore\n\nstore = PGVectorStore.from_params(\n    database="atlas", table_name="docs", embed_dim=1536\n)\nindex = VectorStoreIndex.from_vector_store(store)',
          explanation:
            'LlamaIndex supplies the retrieval logic; Postgres supplies the storage and the metadata filters. Neither reimplements the other.',
        },
      },
      {
        withId: 'pydantic-ai',
        note: 'Wraps a query engine as a typed tool for an agent.',
        example: {
          lang: 'python',
          code: '@agent.tool\ndef search(q: str) -> str:\n    return str(engine.query(q))',
          explanation:
            'The query engine becomes one tool. The agent decides when to search; the index decides what to return.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Traces retrieval and synthesis as separate spans.',
        example: {
          lang: 'python',
          code: '@ls.traceable\ndef retrieve(q: str) -> list:\n    return engine.query(q).source_nodes',
          explanation:
            'Trace the retrieval call separately from the generation call. They fail for different reasons and should not share one span.',
        },
      },
    ],
  },
  'pydantic-ai': {
    capabilities: [
      {
        name: 'Typed agents',
        detail: 'Declares result_type and gets validated output back.',
        example: {
          lang: 'python',
          code: 'from pydantic_ai import Agent\n\nagent = Agent(\n    "openai:gpt-4o",\n    result_type=list[str],\n    system_prompt="Extract names from the text.",\n)\nprint(agent.run_sync("Anna and Bob joined").data)',
          explanation:
            'result_type is the contract. If the model cannot satisfy it you get a validation error rather than a value your code mis-reads later.',
        },
      },
      {
        name: 'Dependency injection',
        detail: 'Passes services into tools through RunContext.',
        example: {
          lang: 'python',
          code: 'from pydantic_ai import Agent, RunContext\n\n@agent.tool\ndef lookup(ctx: RunContext[Deps], id: str) -> str:\n    return ctx.deps.db[id]',
          explanation:
            'Deps carries exactly what the tool needs. Keeping the database out of the tool signature is what makes the tool testable without one.',
        },
      },
      {
        name: 'Retry on validation',
        detail: 'Feeds a schema error back to the model for another attempt.',
        example: {
          lang: 'python',
          code: 'agent = Agent(\n    "openai:gpt-4o",\n    result_type=Invoice,\n    retries=3,\n    system_prompt="Extract one invoice.",\n)',
          explanation:
            'Each retry appends the validator’s complaint to the conversation. Three is usually enough — beyond that the prompt, not the model, is the problem.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pydantic',
        note: 'Defines the result and tool schemas the agent must satisfy.',
        example: {
          lang: 'python',
          code: 'agent = Agent("openai:gpt-4o", result_type=Invoice, deps_type=Deps)',
          explanation:
            'The same model describes the wire format and the agent result. One definition, two jobs, no drift.',
        },
      },
      {
        withId: 'fastapi',
        note: 'Serves the agent from the same app that exposes it.',
        example: {
          lang: 'python',
          code: '@app.post("/extract", response_model=Invoice)\nasync def extract(text: str):\n    return (await agent.run(text)).data',
          explanation:
            'The endpoint and the agent share the result type, so FastAPI’s validation is a second check rather than a second definition.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Traces each agent run and its tool calls.',
        example: {
          lang: 'python',
          code: '@ls.traceable\nasync def run_agent(text: str) -> Invoice:\n    return (await agent.run(text)).data',
          explanation:
            'Wrap the run, not the model call, so the trace shows the whole agent — tool calls, retries, and the final object.',
        },
      },
      {
        withId: 'mcp',
        note: 'Calls MCP tools without hand-writing a client for each one.',
        example: {
          lang: 'python',
          code: 'agent = Agent("openai:gpt-4o", tools=await mcp_client.get_tools())',
          explanation:
            'MCP tools arrive as callables with schemas the agent can read. No adapter per server.',
        },
      },
    ],
  },

  // ── Structured output ─────────────────────────────────────────────────
  pydantic: {
    capabilities: [
      {
        name: 'Schema definition',
        detail: 'Describes data with typed models instead of dicts.',
        example: {
          lang: 'python',
          code: 'from pydantic import BaseModel, Field\n\nclass Invoice(BaseModel):\n    vendor: str\n    total: float = Field(gt=0)\n    paid: bool = False',
          explanation:
            'Field(gt=0) is the constraint your database wishes it had. Put the rule next to the type, not in a service method three files away.',
        },
      },
      {
        name: 'Boundary validation',
        detail: 'Parses and rejects untrusted input where it enters.',
        example: {
          lang: 'python',
          code: 'invoice = Invoice.model_validate_json(raw)\n# or, from a dict:\ninvoice = Invoice.model_validate(payload)',
          explanation:
            'Validate at the edge, then pass the typed object inward. Code below the boundary never re-checks types.',
        },
      },
      {
        name: 'JSON Schema export',
        detail: 'Emits a schema an LLM can be asked to satisfy.',
        example: {
          lang: 'python',
          code: 'print(Invoice.model_json_schema())',
          explanation:
            'Feed this to a model’s response_format or to Instructor. Schema and validator cannot drift apart because they are the same object.',
        },
      },
      {
        name: 'Serialization',
        detail: 'Converts between models and JSON without losing types.',
        example: {
          lang: 'python',
          code: 'json = invoice.model_dump_json(exclude={"paid"})\nback = Invoice.model_validate_json(json)',
          explanation:
            'model_dump and model_validate are the round trip. Keep them symmetric — a field you exclude on the way out must be optional on the way in.',
        },
      },
    ],
    synergies: [
      {
        withId: 'instructor',
        note: 'Supplies the response_model that constrains LLM output.',
        example: {
          lang: 'python',
          code: 'resp = client.chat.completions.create(\n    model="gpt-4o", response_model=Invoice, messages=[...]\n)',
          explanation:
            'One object is the schema and the validator. Instructor does not need a second definition to check the reply.',
        },
      },
      {
        withId: 'fastapi',
        note: 'Defines request and response bodies with validation for free.',
        example: {
          lang: 'python',
          code: '@app.post("/invoice", response_model=Invoice)\ndef create(req: Invoice) -> Invoice: ...',
          explanation:
            'The model is the request, the response, and the OpenAPI schema. Adding a field updates all three at once.',
        },
      },
      {
        withId: 'pydantic-ai',
        note: 'Types agent results so a bad response is retried, not stored.',
        example: {
          lang: 'python',
          code: 'class Answer(BaseModel):\n    invoice: Invoice\n    reasoning: str\n\nagent = Agent("openai:gpt-4o", result_type=Answer)',
          explanation:
            'Compose models rather than flattening fields. Nested models keep the agent’s output structure honest.',
        },
      },
      {
        withId: 'litellm',
        note: 'Validates what came back from any provider, uniformly.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=messages)\ninvoice = Invoice.model_validate_json(resp.choices[0].message.content)',
          explanation:
            'Validate whatever came back, whatever provider sent it. The schema is the one place a bad reply is caught.',
        },
      },
    ],
  },
  instructor: {
    capabilities: [
      {
        name: 'Structured extraction',
        detail: 'Forces an LLM to return a validated Pydantic model.',
        example: {
          lang: 'python',
          code: 'import instructor, openai\n\nclient = instructor.patch(openai.OpenAI())\nresp = client.chat.completions.create(\n    model="gpt-4o",\n    response_model=Invoice,\n    messages=[{"role": "user", "content": text}],\n)',
          explanation:
            'response_model is the whole trick: the schema goes to the model and the reply is validated on arrival. One call, no parsing code.',
        },
      },
      {
        name: 'Automatic re-asks',
        detail: 'Appends the validation error and retries the call.',
        example: {
          lang: 'python',
          code: 'resp = client.chat.completions.create(\n    model="gpt-4o",\n    response_model=Invoice,\n    max_retries=3,\n    messages=[{"role": "user", "content": text}],\n)',
          explanation:
            'A retry only helps if the validator’s complaint is fed back — that is what max_retries does. Log the attempts to see whether retries fix format or facts.',
        },
      },
      {
        name: 'Streaming validation',
        detail: 'Validates partial responses as they arrive.',
        example: {
          lang: 'python',
          code: 'partial = client.chat.completions.create_partial(\n    model="gpt-4o",\n    response_model=Invoice,\n    messages=[{"role": "user", "content": text}],\n)\nfor chunk in partial:\n    print(chunk.total)',
          explanation:
            'Partial hands you the object while it is being built, which is what lets a UI show a form filling in rather than a spinner.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pydantic',
        note: 'Provides the schema every extraction must satisfy.',
        example: {
          lang: 'python',
          code: 'class Invoice(BaseModel):\n    total: float = Field(gt=0)\n\nresp = client.chat.completions.create(response_model=Invoice, ...)',
          explanation:
            'The model is imported, not re-declared. That is what keeps the prompt, the schema, and the validator in one place.',
        },
      },
      {
        withId: 'litellm',
        note: 'Works across providers behind one interface.',
        example: {
          lang: 'python',
          code: 'import instructor, litellm\n\nclient = instructor.from_litellm(litellm.completion)\nresp = client.chat.completions.create(\n    model="gpt-4o", response_model=Invoice, messages=[...]\n)',
          explanation:
            'from_litellm wraps the proxy, so retries, fallbacks, and cost tracking keep working while the reply is still validated.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Counts retries so a weak model is visible in the trace.',
        example: {
          lang: 'python',
          code: '@ls.traceable\ndef extract(text: str) -> Invoice:\n    return client.chat.completions.create(\n        response_model=Invoice, messages=[{"role": "user", "content": text}]\n    )',
          explanation:
            'One span per extraction shows the retries. A model that needs three attempts is a fact you want on the dashboard, not in a log.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Asserts that a prompt change did not break extraction.',
        example: {
          lang: 'yaml',
          code: 'tests:\n  - vars: {text: "invoice for 3 seats at $50"}\n    assert:\n      - type: is-json\n        value: \'{"total": 150}\'',
          explanation:
            'Assert the parsed object, not the raw text. Format drift fails the test before it reaches your validator.',
        },
      },
    ],
  },

  // ── Evals and observability ───────────────────────────────────────────
  langsmith: {
    capabilities: [
      {
        name: 'Tracing',
        detail: 'Records every LLM call as a tree of spans with inputs and outputs.',
        example: {
          lang: 'python',
          code: 'import langsmith as ls\n\n@ls.traceable\ndef retrieve(q: str) -> list[str]:\n    return vector_db.search(q)',
          explanation:
            'Decorate the functions you actually suspect. Tracing everything makes the trace unreadable and the bill large.',
        },
      },
      {
        name: 'Datasets',
        detail: 'Curates golden inputs and expected outputs for an eval.',
        example: {
          lang: 'python',
          code: 'dataset = client.create_dataset("rag-golden")\nclient.create_examples(\n    dataset_id=dataset.id,\n    inputs=[{"q": q} for q in questions],\n)',
          explanation:
            'Write the inputs first and add expected outputs only where you truly know them — a guessed gold answer teaches the eval nothing.',
        },
      },
      {
        name: 'Evaluators',
        detail: 'Scores runs with functions or an LLM judge.',
        example: {
          lang: 'python',
          code: 'from langsmith import evaluate\n\nresults = evaluate(retrieve, data="rag-golden",\n                   evaluators=[faithfulness, answer_relevancy])',
          explanation:
            'Run this on a schedule, not only before a launch. A metric that exists only at release time cannot explain a regression.',
        },
      },
      {
        name: 'CI gating',
        detail: 'Fails a pipeline when a metric drops below a threshold.',
        example: {
          lang: 'python',
          code: 'score = evaluate(retrieve, data="rag-golden",\n                  evaluators=[faithfulness])\nassert score["faithfulness"] >= 0.85, "faithfulness regressed"',
          explanation:
            'Asserting on the number is what turns an eval into a gate. Put this in CI and a drop blocks the merge.',
        },
      },
    ],
    synergies: [
      {
        withId: 'langgraph',
        note: 'Traces each node, checkpointer save, and tool call.',
        example: {
          lang: 'python',
          code: '@ls.traceable\ndef retrieve(q: str) -> list[str]: ...\n\nresults = evaluate(retrieve, data="rag-golden", evaluators=[faithfulness])',
          explanation:
            'Evaluate the tool in isolation. If the retriever fails the eval, no prompt tuning will rescue the answer.',
        },
      },
      {
        withId: 'litellm',
        note: 'Sees every provider call through one proxy.',
        example: {
          lang: 'python',
          code: 'import litellm\nlitellm.success_callback = ["langsmith"]\nresp = litellm.completion(model="gpt-4o", messages=[...])',
          explanation:
            'One line sends every provider call to LangSmith. Because it is a callback, it sees fallback retries too — which is exactly what you want to count.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Runs the same assertions offline and in CI.',
        example: {
          lang: 'python',
          code: 'score = evaluate(retrieve, data="rag-golden", evaluators=[faithfulness])\nassert score["faithfulness"] >= 0.85',
          explanation:
            'Run the same assertion offline and in CI. The metric is only a gate if a number can fail a build.',
        },
      },
      {
        withId: 'helicone',
        note: 'Adds cost and rate-limit context to the same traces.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=[...],\n                          metadata={"tenant": tenant})\nlangsmith_client.score(run_id=resp.id, name="faithfulness", value=0.9)',
          explanation:
            'Cost comes from the proxy, quality from the evaluator. Scoring both on the same run is what makes a per-tenant dashboard possible.',
        },
      },
    ],
  },
  'arize-phoenix': {
    capabilities: [
      {
        name: 'Local tracing',
        detail: 'Inspects spans without sending data to a vendor.',
        example: {
          lang: 'python',
          code: 'import phoenix as px\n\npx.launch_app()   # then call your instrumented code',
          explanation:
            'Nothing leaves your machine, which is why this is the right first step when you cannot send prompts to a third party.',
        },
      },
      {
        name: 'OpenInference instrumentation',
        detail: 'Uses standard span semantics for GenAI calls.',
        example: {
          lang: 'python',
          code: 'from openinference.instrumentation.openai import OpenAIInstrumentor\nfrom opentelemetry.sdk.trace import TracerProvider\n\nprovider = TracerProvider()\nOpenAIInstrumentor().instrument(tracer_provider=provider)',
          explanation:
            'The instrumentor patches the client so spans appear without touching call sites. The conventions matter more than the backend — they let you switch later.',
        },
      },
      {
        name: 'RAG metrics',
        detail: 'Computes faithfulness and context recall over traces.',
        example: {
          lang: 'python',
          code: 'session = px.active_session()\ndf = session.get_spans_dataframe()\nprint(df.groupby("name")["latency_ms"].mean())',
          explanation:
            'Spans land in a DataFrame you can aggregate directly. Start here before building a metrics pipeline — it answers most "where is it slow" questions.',
        },
      },
      {
        name: 'Dataset experiments',
        detail: 'Compares prompt versions over the same recorded traces.',
        example: {
          lang: 'python',
          code: 'from phoenix import Client\n\nclient = Client()\nexperiment = client.run_experiment(\n    dataset=golden_dataset,\n    task=retrieve_then_answer,\n)',
          explanation:
            'Run both prompt versions over the identical inputs. Comparing two runs on different data tells you nothing about the prompt.',
        },
      },
    ],
    synergies: [
      {
        withId: 'ragas',
        note: 'Supplies the reference-free metrics scored in the UI.',
        example: {
          lang: 'python',
          code: 'import phoenix as px\nfrom ragas.metrics import faithfulness\n\nsession = px.active_session()\ndf = session.get_spans_dataframe()\nscores = evaluate(df, metrics=[faithfulness])',
          explanation:
            'Phoenix collects, Ragas scores. Keeping them separate means you can change the metric without re-collecting a single trace.',
        },
      },
      {
        withId: 'langfuse',
        note: 'An alternative self-hosted backend for the same spans.',
        example: {
          lang: 'python',
          code: 'from openinference.instrumentation.openai import OpenAIInstrumentor\nfrom opentelemetry.sdk.trace import TracerProvider\n\nprovider = TracerProvider()\nOpenAIInstrumentor().instrument(tracer_provider=provider)',
          explanation:
            'The instrumentor is the constant; the backend is a configuration choice. That is why switching from Phoenix to Langfuse is a config change, not a code change.',
        },
      },
      {
        withId: 'litellm',
        note: 'Instruments every provider call through one client.',
        example: {
          lang: 'python',
          code: 'from openinference.instrumentation.litellm import LiteLLMInstrumentor\n\nLiteLLMInstrumentor().instrument(tracer_provider=provider)\nresp = litellm.completion(model="gpt-4o", messages=[...])',
          explanation:
            'One instrumentor sees every provider, so a fallback from GPT-4o to Claude still shows up as one trace.',
        },
      },
    ],
  },
  ragas: {
    capabilities: [
      {
        name: 'Faithfulness scoring',
        detail: 'Measures whether each claim is supported by the context.',
        example: {
          lang: 'python',
          code: 'from ragas import evaluate\nfrom ragas.metrics import faithfulness\n\nresult = evaluate(dataset, metrics=[faithfulness])\nprint(result["faithfulness"])',
          explanation:
            'A score near 1.0 means every claim is grounded. Treat a drop as a retrieval problem first and a prompt problem second.',
        },
      },
      {
        name: 'Context precision',
        detail: 'Checks how much of the retrieved context was relevant.',
        example: {
          lang: 'python',
          code: 'from ragas.metrics import context_precision\n\nresult = evaluate(dataset, metrics=[context_precision])',
          explanation:
            'Low precision means the retriever returned filler alongside the answer. Fix the top-k or the chunking before touching the prompt.',
        },
      },
      {
        name: 'Context recall',
        detail: 'Measures whether the retriever found the supporting text.',
        example: {
          lang: 'python',
          code: 'from ragas.metrics import context_recall\n\nresult = evaluate(dataset, metrics=[context_recall])',
          explanation:
            'Low recall means the evidence never reached the model. This is a retrieval bug, and no prompt change will fix it.',
        },
      },
      {
        name: 'Reference-free evaluation',
        detail: 'Scores answers without hand-written gold outputs.',
        example: {
          lang: 'python',
          code: 'from ragas import SingleTurnSample\nfrom ragas.metrics import Faithfulness\n\nsample = SingleTurnSample(\n    user_input=q, response=a, retrieved_contexts=[c],\n)\nawait Faithfulness(llm=judge).single_turn_score(sample)',
          explanation:
            'Score single turns as they happen, not only in a batch job. A per-turn score is what lets you flag a bad answer in production.',
        },
      },
    ],
    synergies: [
      {
        withId: 'langsmith',
        note: 'Runs as an evaluator over a curated dataset.',
        example: {
          lang: 'python',
          code: 'from ragas import evaluate\nfrom langsmith import Client\n\nscore = evaluate(dataset, metrics=[faithfulness])\nClient().create_feedback(run_id, key="faithfulness", score=score["faithfulness"])',
          explanation:
            'Ragas produces the number, LangSmith stores it against the run. Two libraries, one job each — and you can replace either.',
        },
      },
      {
        withId: 'arize-phoenix',
        note: 'Scores traces collected in a local UI.',
        example: {
          lang: 'python',
          code: 'import phoenix as px\nfrom ragas.metrics import faithfulness\n\ndf = px.active_session().get_spans_dataframe()\nscores = evaluate(df, metrics=[faithfulness])',
          explanation:
            'Score in Ragas, look at it in Phoenix. The metric is a function; the trace is the data it runs on.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Gates a prompt change with the same metrics in CI.',
        example: {
          lang: 'python',
          code: 'from ragas import evaluate\nfrom ragas.metrics import faithfulness\n\nscore = evaluate(dataset, metrics=[faithfulness])\nassert score["faithfulness"] >= 0.85',
          explanation:
            'Promptfoo decides which cases to run; Ragas decides how good the answer is. Composing them turns a quality metric into a CI gate.',
        },
      },
    ],
  },
  langfuse: {
    capabilities: [
      {
        name: 'Self-hosted tracing',
        detail: 'Keeps observability inside your own cluster.',
        example: {
          lang: 'yaml',
          code: 'services:\n  langfuse:\n    image: langfuse/langfuse:latest\n    ports: ["3000:3000"]\n    environment:\n      DATABASE_URL: postgresql://postgres:postgres@db:5432/langfuse',
          explanation:
            'Self-hosting means the traces live in your cluster. Put the database on a managed instance if you can — it is the part that grows.',
        },
      },
      {
        name: 'Prompt management',
        detail: 'Versions prompts and promotes them by label.',
        example: {
          lang: 'python',
          code: 'prompt = langfuse.get_prompt("answer-v2")\nmessages = prompt.compile(context=ctx)',
          explanation:
            'compile() fills the template. A prompt referenced by name can be promoted to prod without a deploy, which is the point of versioning.',
        },
      },
      {
        name: 'Score tracking',
        detail: 'Attaches numeric or categorical scores to runs.',
        example: {
          lang: 'python',
          code: 'langfuse.score(id=trace_id, name="faithfulness", value=0.9)',
          explanation:
            'Attach the score to the trace it describes. A score with no trace is just a number in a table.',
        },
      },
      {
        name: 'Cost analytics',
        detail: 'Attributes spend to users, features, and models.',
        example: {
          lang: 'python',
          code: 'langfuse.trace(name="rag", metadata={"tenant": tenant, "feature": "support"})',
          explanation:
            'Tag every trace with tenant and feature. Cost per tenant is the number that changes behaviour; total cost alone is not actionable.',
        },
      },
    ],
    synergies: [
      {
        withId: 'litellm',
        note: 'Reads model and token metadata from the proxy logs.',
        example: {
          lang: 'python',
          code: 'import litellm\nlitellm.success_callback = ["langfuse"]\nresp = litellm.completion(model="gpt-4o", messages=[...])',
          explanation:
            'One line, and every provider call lands in Langfuse with its model, tokens, and cost already attached.',
        },
      },
      {
        withId: 'qdrant',
        note: 'Traces retrieval so a re-index is measurable.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="retrieve")\nres = client.query_points("docs", query=emb, limit=5)\ntrace.score(name="recall", value=len(res.points))',
          explanation:
            'The trace records the query and the score; Qdrant records what it found. Separating them is what lets you re-score old traces after a re-embed.',
        },
      },
      {
        withId: 'nextjs',
        note: 'Traces the client stream alongside the server run.',
        example: {
          lang: 'ts',
          code: 'const trace = langfuse.trace({ name: "chat", sessionId: threadId })\nconst result = await streamText({ model, messages })\ntrace.generation({ name: "answer", model })\nreturn result.toDataStreamResponse()',
          explanation:
            'The session id ties the client stream to the server trace. Without it, the UI shows a conversation the dashboard cannot find.',
        },
      },
    ],
  },
  helicone: {
    capabilities: [
      {
        name: 'Proxy logging',
        detail: 'Observes calls by changing one base URL, no code changes.',
        example: {
          lang: 'python',
          code: 'client = OpenAI(\n    base_url="https://oai.helicone.ai/v1",\n    api_key=HELICONE_KEY,\n)',
          explanation:
            'Point the client at the proxy and every call is recorded. Nothing else in the file changes, which is what makes this safe to add late.',
        },
      },
      {
        name: 'Custom properties',
        detail: 'Slices cost and usage by user, tenant, or feature.',
        example: {
          lang: 'python',
          code: 'client = OpenAI(\n    base_url="https://oai.helicone.ai/v1",\n    api_key=HELICONE_KEY,\n    default_headers={\n        "Helicone-Property-Tenant": tenant,\n        "Helicone-Property-User": user_id,\n    },\n)',
          explanation:
            'Properties are how you slice the dashboard. Tag every call with the dimension you will argue about later.',
        },
      },
      {
        name: 'Semantic caching',
        detail: 'Reuses an answer for a near-identical query.',
        example: {
          lang: 'python',
          code: 'client = OpenAI(\n    base_url="https://oai.helicone.ai/v1",\n    api_key=HELICONE_KEY,\n    default_headers={"Helicone-Cache Enabled": "true"},\n)',
          explanation:
            'Caching is a header, not a code path. Measure the hit rate before trusting it — a cache that misses 95% of the time is pure overhead.',
        },
      },
      {
        name: 'Budgets and rate limits',
        detail: 'Caps spend and throughput per key.',
        example: {
          lang: 'bash',
          code: '# budgets live on virtual keys, set in the dashboard:\n#   key -> monthly spend limit, requests per minute\n# then hand each tenant its own key\ncurl https://api.helicone.ai/v1/key -d \'{"tenant": "a", "limit": 50}\'',
          explanation:
            'Enforcement happens at the proxy, so a runaway loop is stopped before it becomes a bill. One key per tenant is the unit of control.',
        },
      },
    ],
    synergies: [
      {
        withId: 'litellm',
        note: 'Sits in front of the same providers with a second layer of policy.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(\n    model="gpt-4o", messages=[...],\n    metadata={"Helicone-Property-Tenant": tenant},\n)',
          explanation:
            'The property travels with the call, so cost per tenant is a dashboard filter rather than a query you write.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Adds cost context to the traces you already collect.',
        example: {
          lang: 'python',
          code: 'resp = client.chat.completions.create(\n    model="gpt-4o", messages=[...],\n    extra_body={"Helicone-Property-Tenant": tenant},\n)\nlangsmith_client.score(run_id=run_id, name="faithfulness", value=0.9)',
          explanation:
            'Cost comes from the proxy, quality from the evaluator, and the run id joins them. A cheap model that scores badly is not a saving.',
        },
      },
      {
        withId: 'promptfoo',
        note: 'Measures the savings from caching on repeat queries.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=[...],\n                          cache={"ttl": 3600})',
          explanation:
            'Measure the cache hit rate on the exact prompt set you assert on. A cache that hides a regression is worse than no cache.',
        },
      },
    ],
  },

  // ── Pipelines ─────────────────────────────────────────────────────────
  dagster: {
    capabilities: [
      {
        name: 'Asset graphs',
        detail: 'Declares data products with dependencies and lineage.',
        example: {
          lang: 'python',
          code: 'import polars as pl\nfrom dagster import asset\n\n@asset\ndef parsed_pdfs() -> pl.DataFrame: ...\n\n@asset(deps=[parsed_pdfs])\ndef embedded_chunks(parsed_pdfs: pl.DataFrame): ...',
          explanation:
            'An asset is a data product, not a step. Naming the dependency is what gives you lineage for free.',
        },
      },
      {
        name: 'Sensors',
        detail: 'Triggers runs when an external system changes.',
        example: {
          lang: 'python',
          code: 'from dagster import sensor, RunRequest\n\n@sensor(job=embed_job)\ndef new_pdf_sensor(context):\n    for key in s3.list_objects("incoming"):\n        yield RunRequest(run_key=key)',
          explanation:
            'Use run_key so the same file is not materialised twice. Idempotence by keying is easier than deduplicating after the fact.',
        },
      },
      {
        name: 'Partitions and backfills',
        detail: 'Processes by day or tenant and replays cleanly.',
        example: {
          lang: 'python',
          code: 'from dagster import DailyPartitionsDefinition\n\n@asset(partitions_def=DailyPartitionsDefinition(start_date="2026-01-01"))\ndef daily_embed(): ...',
          explanation:
            'Partitions turn a rerun into a selection. Backfilling a month is then a UI action rather than a script.',
        },
      },
      {
        name: 'Software-defined assets',
        detail: 'Writes pipelines as plain Python, not DAG configuration.',
        example: {
          lang: 'python',
          code: 'from dagster import Definitions, define_asset_job\n\ndefs = Definitions(\n    assets=[parsed_pdfs, embedded_chunks],\n    jobs=[define_asset_job("embed_all")],\n)',
          explanation:
            'Definitions is the entry point. Everything is importable and testable, which is the difference between an asset graph and a DAG file.',
        },
      },
    ],
    synergies: [
      {
        withId: 'polars',
        note: 'Runs the transformations that turn raw files into assets.',
        example: {
          lang: 'python',
          code: '@asset\ndef summary(raw: pl.DataFrame) -> pl.DataFrame:\n    return raw.group_by("tenant").agg(pl.col("amt").sum())',
          explanation:
            'The asset returns a frame, so the next asset can keep using the same API. That is what makes a chain of transforms composable.',
        },
      },
      {
        withId: 'prefect',
        note: 'The usual target when migrating flows to assets.',
        example: {
          lang: 'python',
          code: '# From a Prefect task...\n@task\ndef embed_chunks(df):\n    return df.with_columns(embedding=embed("text"))\n\n# ...to a Dagster asset.\n@asset\ndef embedded_chunks(parsed: pl.DataFrame) -> pl.DataFrame:\n    return parsed.with_columns(embedding=embed("text"))',
          explanation:
            'The body is identical; only the decorator changed. That is the migration cost when you move from flows to assets.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Monitors the embed jobs that feed the tracer.',
        example: {
          lang: 'python',
          code: '@asset\ndef scored():\n    with langfuse.trace(name="embed") as trace:\n        rows = embed(df)\n    trace.score(name="rows", value=len(rows))\n    return rows',
          explanation:
            'The asset owns the work; Langfuse owns the observation. A nightly job that silently embeds half the corpus shows up as a score that dropped.',
        },
      },
    ],
  },
  prefect: {
    capabilities: [
      {
        name: 'Flows and tasks',
        detail: 'Orchestrates plain Python with retries and caching.',
        example: {
          lang: 'python',
          code: 'from prefect import flow, task\n\n@task(retries=3)\ndef parse(path: str): ...\n\n@flow(name="ingest")\ndef ingest():\n    parse.map(paths)',
          explanation:
            'A flow is ordinary Python, so you can branch and loop. Tasks are the unit that gets a retry policy and its own log.',
        },
      },
      {
        name: 'Schedules',
        detail: 'Deploys flows on a calendar or an interval.',
        example: {
          lang: 'bash',
          code: 'prefect deploy --cron "0 2 * * *" --name nightly-embed',
          explanation:
            'Deploy with a schedule and the flow runs without you keeping a process alive. Check the deployment’s last-run status before assuming it worked.',
        },
      },
      {
        name: 'Work pools',
        detail: 'Runs flows on workers you control.',
        example: {
          lang: 'bash',
          code: 'prefect work-pool create gpu-pool\nprefect worker start --pool gpu-pool',
          explanation:
            'The pool decides where work runs. Separate pools by capability (GPU, network access) rather than by team.',
        },
      },
      {
        name: 'Failure alerts',
        detail: 'Notifies a channel when a flow fails.',
        example: {
          lang: 'python',
          code: 'from prefect.blocks.notifications import Webhook\n\nwebhook = Webhook.load("alerts")\nwebhook.notify("ingest failed")',
          explanation:
            'Notification blocks are reusable across flows. Alert on the flow, not on every task — one failure should produce one message.',
        },
      },
    ],
    synergies: [
      {
        withId: 'polars',
        note: 'Runs the transforms inside each task.',
        example: {
          lang: 'python',
          code: '@task\ndef aggregate(path: str) -> pl.DataFrame:\n    return (\n        pl.scan_parquet(path)\n        .group_by("tenant")\n        .agg(pl.len())\n        .collect()\n    )',
          explanation:
            'The task is the unit of retry, the frame is the unit of work. Keeping them aligned means one retry re-runs exactly one transformation.',
        },
      },
      {
        withId: 'dagster',
        note: 'Migrates to assets when lineage matters more than tasks.',
        example: {
          lang: 'python',
          code: '# Keep the transform in a plain function so either scheduler can call it.\ndef embed_chunks(parsed: pl.DataFrame) -> pl.DataFrame:\n    return parsed.with_columns(embedding=embed("text"))\n\n@asset\ndef embedded_chunks(parsed: pl.DataFrame) -> pl.DataFrame:\n    return embed_chunks(parsed)\n\n@task\ndef nightly(parsed: pl.DataFrame) -> pl.DataFrame:\n    return embed_chunks(parsed)   # same function, different calendar',
          explanation:
            'Keeping the transform out of the decorator is what makes the migration cheap. The scheduler is a decorator, not a way of writing the logic.',
        },
      },
      {
        withId: 'modal',
        note: 'Pushes heavy task work to serverless workers.',
        example: {
          lang: 'python',
          code: '@app.function(gpu="A100")\ndef embed_batch(texts: list[str]) -> list[list[float]]: ...\n\n@task\ndef embed_task(texts):\n    return embed_batch.remote(texts)',
          explanation:
            'The task hands work to the serverless function and returns. Prefect retries the task; Modal bills for the seconds it ran.',
        },
      },
    ],
  },
  temporal: {
    capabilities: [
      {
        name: 'Durable execution',
        detail: 'Replays workflow history after a crash and resumes.',
        example: {
          lang: 'python',
          code: 'from temporalio import workflow\nfrom datetime import timedelta\n\n@workflow.defn\nclass Ingest:\n    @workflow.run\n    async def run(self, path: str) -> str:\n        return await workflow.execute_activity(\n            parse_pdf, path,\n            start_to_close_timeout=timedelta(minutes=5),\n        )',
          explanation:
            'Workflow code must be deterministic; all I/O belongs in activities. That split is what lets a crash replay safely.',
        },
      },
      {
        name: 'Activities',
        detail: 'Isolates side effects with their own retries and timeouts.',
        example: {
          lang: 'python',
          code: 'from temporalio import activity\n\n@activity.defn\nasync def parse_pdf(path: str) -> str:\n    return (await httpx.get(path)).text',
          explanation:
            'Activities get their own retry policy and heartbeat. Keep them short and idempotent so a retry cannot double-write.',
        },
      },
      {
        name: 'Signals and queries',
        detail: 'Lets the outside world unblock or inspect a workflow.',
        example: {
          lang: 'python',
          code: 'await workflow.wait_condition(lambda: self.approved)\nawait workflow.execute_activity(apply_changes, ...)',
          explanation:
            'A signal unblocks a waiting workflow from outside. Use queries for reads so inspection never mutates history.',
        },
      },
      {
        name: 'Long-running workflows',
        detail: 'Sleeps for days without holding a process.',
        example: {
          lang: 'python',
          code: 'from datetime import timedelta\n\nawait workflow.sleep(timedelta(days=7))',
          explanation:
            'The sleep is reconstructed from history, not held in memory. That is why a workflow can wait a week on a laptop-sized worker.',
        },
      },
    ],
    synergies: [
      {
        withId: 'fastapi',
        note: 'Starts and signals workflows from an HTTP endpoint.',
        example: {
          lang: 'python',
          code: '@app.post("/ingest")\nasync def start_ingest(path: str):\n    handle = await client.start_workflow(\n        Ingest.run, path, id=f"ingest-{path}"\n    )\n    return {"id": handle.id}',
          explanation:
            'The endpoint starts the workflow and returns immediately. The browser polls a separate status endpoint rather than holding the request open.',
        },
      },
      {
        withId: 'litellm',
        note: 'Retries model calls as activities with their own timeout.',
        example: {
          lang: 'python',
          code: '@activity.defn\nasync def call_model(messages: list) -> str:\n    resp = await litellm.acompletion(model="gpt-4o", messages=messages)\n    return resp.choices[0].message.content',
          explanation:
            'The model call is an activity, so it gets its own timeout and retry. A rate limit becomes a retry instead of a lost workflow.',
        },
      },
      {
        withId: 'dagster',
        note: 'Replaces the scheduler when steps must survive a deploy.',
        example: {
          lang: 'python',
          code: '@activity.defn\ndef materialize(asset_key: str) -> None: ...\n\n@workflow.defn\nclass Nightly:\n    @workflow.run\n    async def run(self) -> None:\n        for key in ["parsed", "embedded"]:\n            await workflow.execute_activity(materialize, key)',
          explanation:
            'Dagster describes the graph; Temporal makes it survive a deploy. If the process dies mid-run, the workflow resumes at the last completed activity.',
        },
      },
    ],
  },
  airflow: {
    capabilities: [
      {
        name: 'DAG definitions',
        detail: 'Expresses task dependencies as code.',
        example: {
          lang: 'python',
          code: 'from airflow import DAG\nfrom airflow.utils.dates import days_ago\n\nwith DAG("embed", schedule="@daily", start_date=days_ago(1)) as dag:\n    extract >> embed',
          explanation:
            'The >> operator is the dependency. Read the DAG top to bottom: upstream first, then downstream.',
        },
      },
      {
        name: 'Operators',
        detail: 'Reuses task types for Python, Bash, and HTTP work.',
        example: {
          lang: 'python',
          code: 'from airflow.operators.python import PythonOperator\n\nextract = PythonOperator(task_id="extract", python_callable=extract)',
          explanation:
            'Prefer an existing operator over a BashOperator. Operators carry retries, logging, and connection handling you would otherwise rewrite.',
        },
      },
      {
        name: 'Dynamic task mapping',
        detail: 'Fans one task out over a runtime list of inputs.',
        example: {
          lang: 'python',
          code: 'process.expand(path=get_pdf_paths())',
          explanation:
            'Mapping happens at parse time from a runtime value, so the fan-out adapts to the data. Each mapped instance is retried independently.',
        },
      },
      {
        name: 'Schedules and SLAs',
        detail: 'Runs on a calendar and alerts on misses.',
        example: {
          lang: 'python',
          code: 'PythonOperator(\n    task_id="embed",\n    python_callable=embed,\n    sla=timedelta(hours=2),\n)',
          explanation:
            'The SLA is a promise about freshness, not a timeout. Use it to alert when a daily job is late, which is different from killing a slow run.',
        },
      },
    ],
    synergies: [
      {
        withId: 'dagster',
        note: 'The migration target when you want asset lineage.',
        example: {
          lang: 'python',
          code: '@asset\ndef parsed() -> pl.DataFrame: ...\n\n@asset(deps=[parsed])\ndef embedded(parsed: pl.DataFrame): ...',
          explanation:
            'The lineage you lost in a DAG file comes back for free. The cost is giving up dynamic task mapping, which assets do not have.',
        },
      },
      {
        withId: 'polars',
        note: 'Runs the frame transforms inside PythonOperators.',
        example: {
          lang: 'python',
          code: 'def extract(**ctx) -> None:\n    df = pl.read_parquet(f"s3://incoming/{ctx[\'ds\']}.parquet")\n    df.write_parquet(f"s3://clean/{ctx[\'ds\']}.parquet")',
          explanation:
            'The execution date is in the context, so the task is naturally partitioned. That is the argument for keeping the frame library out of the scheduler.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Watches the embed jobs that feed the tracer.',
        example: {
          lang: 'python',
          code: 'def embed(**ctx):\n    with langfuse.trace(name="airflow-embed", tags=[ctx["ds"]]) as trace:\n        rows = embed_all(ctx["ds"])\n    trace.score(name="rows", value=rows)',
          explanation:
            'Tag the trace with the execution date so a failed backfill is visible in the tracer, not only in the scheduler’s UI.',
        },
      },
    ],
  },

  // ── Serving and backend ───────────────────────────────────────────────
  fastapi: {
    capabilities: [
      {
        name: 'Typed endpoints',
        detail: 'Builds APIs from Pydantic models with validation.',
        example: {
          lang: 'python',
          code: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.post("/chat", response_model=ChatResponse)\nasync def chat(req: ChatRequest) -> ChatResponse: ...',
          explanation:
            'The request and response models are the contract. FastAPI validates on the way in and serialises on the way out from the same types.',
        },
      },
      {
        name: 'Streaming responses',
        detail: 'Serves SSE or chunked output for LLM tokens.',
        example: {
          lang: 'python',
          code: 'from fastapi.responses import EventSourceResponse\n\n@app.post("/chat")\nasync def chat(req: ChatRequest):\n    async def gen():\n        async for tok in llm.stream(req.prompt):\n            yield "data: " + json.dumps({"t": tok}) + "\\n\\n"\n    return EventSourceResponse(gen())',
          explanation:
            'Yield one SSE frame per token. The client paints progressively, which is what makes a long answer feel fast.',
        },
      },
      {
        name: 'Dependency injection',
        detail: 'Shares DB sessions and auth per request.',
        example: {
          lang: 'python',
          code: 'from fastapi import Depends\n\ndef get_db() -> Session: ...\n\n@app.get("/docs/{id}")\ndef get_doc(id: int, db: Session = Depends(get_db)): ...',
          explanation:
            'Depends runs per request, so a session opened there is closed there. That is what prevents a connection leak under load.',
        },
      },
      {
        name: 'Async handlers',
        detail: 'Runs I/O-bound work concurrently in one process.',
        example: {
          lang: 'python',
          code: 'import httpx\n\n@app.get("/search")\nasync def search(q: str):\n    async with httpx.AsyncClient() as client:\n        return await client.get(f"http://api/?q={q}")',
          explanation:
            'Async only helps while you wait on I/O. A CPU-bound handler blocks the loop, so move that work to a worker instead.',
        },
      },
    ],
    synergies: [
      {
        withId: 'litellm',
        note: 'Fronts the proxy with typed request and response models.',
        example: {
          lang: 'python',
          code: '@app.post("/chat")\nasync def chat(req: ChatRequest):\n    resp = await litellm.acompletion(model=req.model, messages=req.messages)\n    return {"text": resp.choices[0].message.content}',
          explanation:
            'Change req.model and the handler does not change. That is the point of putting the proxy behind the API rather than calling providers directly.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Serves a compiled graph as an endpoint.',
        example: {
          lang: 'python',
          code: '@app.post("/chat")\nasync def chat(req: ChatRequest):\n    return StreamingResponse(\n        app.astream(\n            {"messages": req.messages},\n            {"configurable": {"thread_id": req.thread}},\n        )\n    )',
          explanation:
            'The graph is the same object you tested locally. FastAPI only adds HTTP and a thread id.',
        },
      },
      {
        withId: 'pydantic',
        note: 'Defines every request and response body.',
        example: {
          lang: 'python',
          code: 'class ChatRequest(BaseModel):\n    messages: list[dict]\n    thread: str = "anon"\n\n@app.post("/chat")\nasync def chat(req: ChatRequest): ...',
          explanation:
            'The request model is the boundary. Everything the handler touches is already typed and validated.',
        },
      },
      {
        withId: 'docker',
        note: 'Ships the API as a slim, health-checked image.',
        example: {
          lang: 'dockerfile',
          code: 'FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install --no-cache-dir -r requirements.txt\nHEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0"]',
          explanation:
            'The health check probes the endpoint the app actually serves. A container that is up but cannot answer is not healthy.',
        },
      },
    ],
  },
  litellm: {
    capabilities: [
      {
        name: 'Unified API',
        detail: 'Calls any provider through one OpenAI-compatible interface.',
        example: {
          lang: 'python',
          code: 'import litellm\n\nresp = litellm.completion(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "hi"}],\n)\nprint(resp.choices[0].message.content)',
          explanation:
            'Change only the model string to switch providers. Your handler code, including streaming, stays identical.',
        },
      },
      {
        name: 'Fallbacks and retries',
        detail: 'Routes to a backup model when the primary fails.',
        example: {
          lang: 'yaml',
          code: 'model_list:\n  - model_name: gpt-4o\n    litellm_params: {model: openai/gpt-4o, api_key: os.environ/OPENAI_KEY}\n  - model_name: gpt-4o\n    litellm_params: {model: anthropic/claude-3-5-sonnet, api_key: os.environ/ANTHROPIC_KEY}\nfallbacks:\n  - gpt-4o: [anthropic/claude-3-5-sonnet]',
          explanation:
            'Fallbacks are declared, not coded. Keep the same model_name on both entries so callers never see the switch.',
        },
      },
      {
        name: 'Budgets and rate limits',
        detail: 'Caps spend and throughput per key.',
        example: {
          lang: 'python',
          code: 'litellm.completion(\n    model="gpt-4o",\n    messages=[...],\n    metadata={"user": user_id},   # enforced against the key\'s budget\n)',
          explanation:
            'Budgets attach to virtual keys, not to code. One key per tenant is what makes a cap meaningful.',
        },
      },
      {
        name: 'Caching',
        detail: 'Reuses responses across providers.',
        example: {
          lang: 'python',
          code: 'litellm.completion(\n    model="gpt-4o",\n    messages=[...],\n    cache={"ttl": 3600},\n)',
          explanation:
            'Cache only deterministic prompts. Anything with a timestamp or a user-specific context will return a stale answer.',
        },
      },
    ],
    synergies: [
      {
        withId: 'fastapi',
        note: 'Sits behind the API so handlers stay provider-agnostic.',
        example: {
          lang: 'python',
          code: 'import litellm\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.post("/chat")\nasync def chat(req: ChatRequest):\n    return await litellm.acompletion(model=req.model, messages=req.messages)',
          explanation:
            'FastAPI validates the request; LiteLLM abstracts the provider. Neither knows about the other, which is exactly why you can swap either.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Emits one trace per routed call.',
        example: {
          lang: 'python',
          code: 'import litellm\nlitellm.success_callback = ["langsmith"]\nresp = litellm.completion(model="gpt-4o", messages=[...])',
          explanation:
            'The callback sees the whole route, including a fallback. That is the difference between counting requests and counting calls to a provider.',
        },
      },
      {
        withId: 'helicone',
        note: 'Adds a second policy layer for cost and caching.',
        example: {
          lang: 'python',
          code: 'client = OpenAI(\n    base_url="https://oai.helicone.ai/v1",\n    api_key=HELICONE_KEY,\n    default_headers={"Helicone-Property-Tenant": tenant},\n)\nresp = litellm.completion(model="gpt-4o", messages=[...])',
          explanation:
            'Two layers, two jobs: Helicone enforces budgets and caches, LiteLLM routes and falls back. Neither can do the other’s work.',
        },
      },
      {
        withId: 'instructor',
        note: 'Keeps structured extraction working across every model.',
        example: {
          lang: 'python',
          code: 'import instructor, litellm\n\nclient = instructor.from_litellm(litellm.completion)\nresp = client.chat.completions.create(\n    model="gpt-4o", response_model=Invoice, messages=[...]\n)',
          explanation:
            'The proxy and the validator compose in one line. Retries, fallbacks, and structured output all stay in play.',
        },
      },
    ],
  },
  docker: {
    capabilities: [
      {
        name: 'Multi-stage builds',
        detail: 'Keeps runtime images small by copying only artifacts.',
        example: {
          lang: 'dockerfile',
          code: 'FROM python:3.11-slim AS builder\nCOPY requirements.txt .\nRUN pip install --user -r requirements.txt\n\nFROM python:3.11-slim\nCOPY --from=builder /root/.local /root/.local\nCOPY . .',
          explanation:
            'The builder stage can be large; the runtime stage should not be. Only what the app executes gets copied across.',
        },
      },
      {
        name: 'Health checks',
        detail: 'Lets the orchestrator decide when a container is ready.',
        example: {
          lang: 'dockerfile',
          code: 'HEALTHCHECK --interval=30s --timeout=3s \\\n  CMD curl -f http://localhost:8000/health || exit 1',
          explanation:
            'Probe the dependency the app actually needs, not just the port. A health check that passes while the database is down is worse than none.',
        },
      },
      {
        name: 'Non-root containers',
        detail: 'Reduces blast radius if the app is compromised.',
        example: {
          lang: 'dockerfile',
          code: 'RUN useradd -r -u 1000 app\nUSER 1000',
          explanation:
            'Run as a non-root user from the start. Adding it later means re-testing every path that writes to disk.',
        },
      },
      {
        name: 'Compose stacks',
        detail: 'Runs an app with its database on one command.',
        example: {
          lang: 'yaml',
          code: 'services:\n  api:\n    build: .\n    ports: ["8000:8000"]\n  db:\n    image: pgvector/pgvector:pg16\n    environment:\n      POSTGRES_PASSWORD: dev',
          explanation:
            'Compose is for local parity. Keep the image tags pinned — a floating latest tag makes "it worked yesterday" unreproducible.',
        },
      },
    ],
    synergies: [
      {
        withId: 'fastapi',
        note: 'Ships the API with a health check and a non-root user.',
        example: {
          lang: 'dockerfile',
          code: 'FROM python:3.11-slim AS builder\nRUN pip install --user -r requirements.txt\n\nFROM python:3.11-slim\nCOPY --from=builder /root/.local /root/.local',
          explanation:
            'The builder stage installs; the runtime stage copies. The image the registry stores is the second one, and it is the one that matters.',
        },
      },
      {
        withId: 'modal',
        note: 'Builds the image a serverless function runs in.',
        example: {
          lang: 'python',
          code: 'import modal\n\napp = modal.App("api")\nimage = modal.Image.from_dockerfile("./Dockerfile")',
          explanation:
            'Modal builds the Dockerfile for you and caches the layers. The same file you use in CI is the one the function runs on.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Self-hosts the tracer in your own cluster.',
        example: {
          lang: 'yaml',
          code: 'services:\n  langfuse:\n    image: langfuse/langfuse:latest\n    ports: ["3000:3000"]\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_PASSWORD: dev',
          explanation:
            'The compose file is the deployment. Keep it in the repo so a new engineer’s docker compose up matches production.',
        },
      },
    ],
  },

  // ── Frontend and UX ───────────────────────────────────────────────────
  'vercel-ai-sdk': {
    capabilities: [
      {
        name: 'Streaming chat',
        detail: 'useChat manages messages, input, and submit for you.',
        example: {
          lang: 'tsx',
          code: 'const { messages, input, setInput, handleSubmit } = useChat({\n  api: "/api/chat",\n})',
          explanation:
            'The hook owns the message list and the request lifecycle. You render messages; it handles streaming, retries, and the pending state.',
        },
      },
      {
        name: 'Generative UI',
        detail: 'Returns React components from server-side tools.',
        example: {
          lang: 'tsx',
          code: 'const result = await streamUI({\n  model,\n  tools: {\n    showInvoice: {\n      generate: async function* () {\n        yield <Skeleton />\n        const invoice = await load(id)\n        return <InvoiceCard invoice={invoice} />\n      },\n    },\n  },\n})',
          explanation:
            'The tool yields a loading state, then the real component. The UI renders in the chat without a round trip to the client.',
        },
      },
      {
        name: 'Data streams',
        detail: 'Sends typed chunks such as text, tool calls, and sources.',
        example: {
          lang: 'ts',
          code: 'const result = await streamText({ model, messages, tools })\nreturn result.toDataStreamResponse()',
          explanation:
            'The data stream carries typed parts, so the client can render citations and tool state without parsing text.',
        },
      },
      {
        name: 'Provider abstraction',
        detail: 'Swaps models without touching the component tree.',
        example: {
          lang: 'ts',
          code: "import { openai } from '@ai-sdk/openai'\n\nconst model = openai('gpt-4o')",
          explanation:
            'The provider package is the only thing that names a vendor. Everything above it is model-agnostic.',
        },
      },
    ],
    synergies: [
      {
        withId: 'nextjs',
        note: 'Pairs with route handlers to stream from server to client.',
        example: {
          lang: 'ts',
          code: 'const result = await streamText({ model, messages })\nreturn result.toDataStreamResponse()',
          explanation:
            'The route handler is four lines. The SDK turns a model call into a response the client hook already understands.',
        },
      },
      {
        withId: 'fastapi',
        note: 'Keeps the same streaming protocol if the backend is not JS.',
        example: {
          lang: 'python',
          code: '@app.post("/api/chat")\nasync def chat(req: ChatRequest):\n    async def gen():\n        async for tok in llm.stream(req.prompt):\n            yield "data: " + tok + "\\n\\n"\n    return EventSourceResponse(gen())',
          explanation:
            'The transport is the contract. If the protocol matches, the frontend does not know the backend changed language.',
        },
      },
      {
        withId: 'litellm',
        note: 'Points the data stream at any provider behind one URL.',
        example: {
          lang: 'ts',
          code: '// Point the SDK at a LiteLLM proxy URL and the model string stays the same.\nconst model = openai("gpt-4o", { baseURL: "http://localhost:4000" })',
          explanation:
            'The base URL is the only thing that changes. Model routing, fallbacks, and budgets all happen behind the proxy.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Traces the server side of the same conversation.',
        example: {
          lang: 'ts',
          code: 'const trace = langfuse.trace({ name: "chat" })\nconst result = await streamText({ model, messages })\ntrace.generation({ name: "answer", model })\nreturn result.toDataStreamResponse()',
          explanation:
            'Trace before you stream. Once the response is a stream, the server no longer knows when it finished.',
        },
      },
    ],
  },
  nextjs: {
    capabilities: [
      {
        name: 'Server Components',
        detail: 'Renders on the server with no client JS shipped.',
        example: {
          lang: 'tsx',
          code: 'export default async function Page() {\n  const docs = await fetch(`${process.env.API}/docs`).then((r) => r.json())\n  return <List docs={docs} />\n}',
          explanation:
            'Anything without state or handlers belongs here. Secrets stay on the server because the component never ships to the browser.',
        },
      },
      {
        name: 'Route handlers',
        detail: 'Builds HTTP endpoints inside the app router.',
        example: {
          lang: 'ts',
          code: 'export const runtime = "edge"\n\nexport async function POST(req: Request) {\n  const body = await req.json()\n  return Response.json({ ok: true })\n}',
          explanation:
            'A route handler is the seam between your UI and your model. Keeping it thin means the same endpoint serves web and mobile.',
        },
      },
      {
        name: 'Streaming SSR',
        detail: 'Streams a page as its data resolves.',
        example: {
          lang: 'tsx',
          code: '<Suspense fallback={<TableSkeleton />}>\n  <SlowTable />\n</Suspense>',
          explanation:
            'Suspense boundaries decide what the user sees first. Wrap the slow part, not the whole page, so the shell paints immediately.',
        },
      },
      {
        name: 'Metadata and SEO',
        detail: 'Manages social and search tags from one file.',
        example: {
          lang: 'ts',
          code: 'export const metadata = {\n  title: "Platform Atlas",\n  openGraph: { images: ["/og.png"] },\n}',
          explanation:
            'Export metadata from the page and the framework renders it. Per-page metadata is what makes shared links look right.',
        },
      },
    ],
    synergies: [
      {
        withId: 'vercel-ai-sdk',
        note: 'Hosts the chat UI and its streaming route together.',
        example: {
          lang: 'tsx',
          code: 'export default function Chat() {\n  const { messages, input, handleSubmit } = useChat({ api: "/api/chat" })\n  return <div>{messages.length} messages</div>\n}',
          explanation:
            'The hook owns the request. The component renders what it is given, so streaming arrives without any effect or state management.',
        },
      },
      {
        withId: 'fastapi',
        note: 'A separate typed API when the model work is in Python.',
        example: {
          lang: 'ts',
          code: 'const res = await fetch(`${process.env.API}/docs`).then((r) => r.json())',
          explanation:
            'The URL is configuration, not code. The same build works against a local FastAPI and a deployed one.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Traces both the server render and the client stream.',
        example: {
          lang: 'ts',
          code: 'export async function POST(req: Request) {\n  const trace = langfuse.trace({ name: "api/chat" })\n  const result = await streamText({ model, messages })\n  trace.generation({ name: "answer" })\n  return result.toDataStreamResponse()\n}',
          explanation:
            'Create the trace in the route handler, not in the component. The component is client-side and cannot see the server run.',
        },
      },
    ],
  },
  copilotkit: {
    capabilities: [
      {
        name: 'Context sharing',
        detail: 'Publishes React state into the agent’s context.',
        example: {
          lang: 'tsx',
          code: 'useCopilotReadable({\n  description: "Rows currently shown",\n  value: rows,\n})',
          explanation:
            'Anything the agent should know but cannot see belongs here. Describe it well — the description is what the model reads.',
        },
      },
      {
        name: 'Frontend actions',
        detail: 'Lets the agent call functions inside your app.',
        example: {
          lang: 'tsx',
          code: 'useCopilotAction({\n  name: "addRow",\n  parameters: ["name"],\n  handler: async ({ name }) => setRows((r) => [...r, { name }]),\n})',
          explanation:
            'The action is a real function in your app, so the agent can only do what you exposed. Keep the parameter list small and typed.',
        },
      },
      {
        name: 'Embedded sidebar',
        detail: 'Drops a copilot into a product you already ship.',
        example: {
          lang: 'tsx',
          code: '<CopilotKit runtimeUrl="/api/copilot">\n  <CopilotSidebar />\n</CopilotKit>',
          explanation:
            'The provider is the only wrapper. Everything inside it can read context and call actions; everything outside cannot.',
        },
      },
    ],
    synergies: [
      {
        withId: 'vercel-ai-sdk',
        note: 'Shares the same streaming transport as the chat UI.',
        example: {
          lang: 'tsx',
          code: '<CopilotKit runtimeUrl="/api/copilot">\n  <CopilotSidebar />\n</CopilotKit>',
          explanation:
            'The runtime URL is the only wiring. The copilot and the chat UI speak the same protocol, so they share one backend.',
        },
      },
      {
        withId: 'nextjs',
        note: 'Mounts the copilot inside an existing app router page.',
        example: {
          lang: 'tsx',
          code: 'export default function Page() {\n  return (\n    <CopilotKit runtimeUrl="/api/copilot">\n      <YourApp />\n    </CopilotKit>\n  )\n}',
          explanation:
            'Wrap the page, not a component inside it. Everything inside the provider can read context and call actions.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Backs the copilot with a durable agent runtime.',
        example: {
          lang: 'python',
          code: 'app = g.compile(checkpointer=saver)   # the same graph you test in scripts',
          explanation:
            'The graph is unchanged; CopilotKit only adds a runtime endpoint in front of it. A durable graph and a copilot are the same object.',
        },
      },
      {
        withId: 'mcp',
        note: 'Gives the copilot tools from any MCP server.',
        example: {
          lang: 'tsx',
          code: 'useCopilotAction({\n  name: "searchDocs",\n  handler: async () => {\n    const res = await fetch("/api/mcp/search", { method: "POST" })\n    return res.json()\n  },\n})',
          explanation:
            'The action is the bridge. The copilot only knows the function you wrote; MCP supplies the tool on the other side.',
        },
      },
    ],
  },

  // ── Core ML ───────────────────────────────────────────────────────────
  pytorch: {
    capabilities: [
      {
        name: 'Tensor computation',
        detail: 'n-dimensional arrays with GPU and MPS acceleration.',
        example: {
          lang: 'python',
          code: 'import torch\n\nx = torch.randn(8, 1536, device="cuda")\nprint(x.device, x.dtype)',
          explanation:
            'The device is explicit. Moving a model without moving its inputs is the classic first error.',
        },
      },
      {
        name: 'Autograd',
        detail: 'Automatic differentiation for training and fine-tuning.',
        example: {
          lang: 'python',
          code: 'x = torch.randn(4, requires_grad=True)\nloss = (x ** 2).sum()\nloss.backward()\nprint(x.grad)',
          explanation:
            'requires_grad turns a tensor into something you can differentiate. Call backward() once per step, then zero the gradients.',
        },
      },
      {
        name: 'torch.compile',
        detail: 'JIT-compiles a model for a large speedup, unchanged code.',
        example: {
          lang: 'python',
          code: 'model = torch.compile(model)\nout = model(x)   # first call compiles, later calls are fast',
          explanation:
            'The first call is slow because it compiles. Benchmark after warm-up or you will measure compilation, not inference.',
        },
      },
      {
        name: 'Model export',
        detail: 'Serializes to ONNX or TorchScript for serving.',
        example: {
          lang: 'python',
          code: 'torch.onnx.export(model, dummy, "model.onnx", opset_version=17)',
          explanation:
            'Export with a fixed input shape and you get a portable graph. Dynamic shapes are supported but cost performance in most runtimes.',
        },
      },
    ],
    synergies: [
      {
        withId: 'hugging-face',
        note: 'Loads and runs the Hub’s model weights.',
        example: {
          lang: 'python',
          code: 'import torch\nfrom transformers import AutoModel\n\nmodel = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5").to("cuda")\nemb = model(**tok(texts, return_tensors="pt").to("cuda"))',
          explanation:
            'Weights load as a Hub repo and run as a PyTorch module. The Hub is the source of truth; PyTorch is the engine.',
        },
      },
      {
        withId: 'onnx-runtime',
        note: 'Exports a trained model for cross-platform serving.',
        example: {
          lang: 'python',
          code: 'torch.onnx.export(model, dummy, "model.onnx", opset_version=17)\n\nimport onnxruntime as ort\nsess = ort.InferenceSession("model.onnx")',
          explanation:
            'Export once, serve anywhere. The ONNX file is the handoff between training and the serving runtime.',
        },
      },
      {
        withId: 'vllm',
        note: 'Serves the same weights at much higher throughput.',
        example: {
          lang: 'python',
          code: 'torch.save(model.state_dict(), "adapter.pt")\n# vllm serve <hub-repo> --port 8000',
          explanation:
            'Training and serving are separate runtimes over the same weights. Keep the Hub repo as the single artifact both read.',
        },
      },
      {
        withId: 'modal',
        note: 'Runs training or batch jobs on a serverless GPU.',
        example: {
          lang: 'python',
          code: '@app.function(gpu="A100", image=image)\ndef train(dataset: str):\n    model = Model().cuda()\n    ...',
          explanation:
            'The function gets a GPU for the seconds it trains. Nothing is provisioned between runs.',
        },
      },
    ],
  },
  'hugging-face': {
    capabilities: [
      {
        name: 'Model Hub',
        detail: 'Discovers, downloads, and versions models and datasets.',
        example: {
          lang: 'python',
          code: 'from transformers import AutoModel, AutoTokenizer\n\ntok = AutoTokenizer.from_pretrained("BAAI/bge-small-en-v1.5")\nmodel = AutoModel.from_pretrained("BAAI/bge-small-en-v1.5").eval()',
          explanation:
            'Always load the tokenizer and model from the same repo. A mismatched pair produces plausible-looking garbage.',
        },
      },
      {
        name: 'Pipelines',
        detail: 'Runs inference with three lines of code.',
        example: {
          lang: 'python',
          code: 'from transformers import pipeline\n\npipe = pipeline("feature-extraction", model="BAAI/bge-small-en-v1.5")\nprint(pipe("hello")[0][0][:5])',
          explanation:
            'Pipelines hide tokenization and batching. Fine for a prototype; for throughput you will eventually call the model directly.',
        },
      },
      {
        name: 'Fine-tuning',
        detail: 'Adapts a pretrained model with the Trainer API.',
        example: {
          lang: 'python',
          code: 'from transformers import Trainer, TrainingArguments\n\nTrainer(\n    model=model,\n    args=TrainingArguments(output_dir="./out", num_train_epochs=1),\n    train_dataset=ds,\n).train()',
          explanation:
            'One epoch on a small dataset is the usual starting point. Hold out an eval split before you start, not after you pick the winner.',
        },
      },
      {
        name: 'Publishing models',
        detail: 'Pushes a model or dataset back to the Hub.',
        example: {
          lang: 'python',
          code: 'model.push_to_hub("my-finetuned-model")\ntokenizer.push_to_hub("my-finetuned-model")',
          explanation:
            'Push the tokenizer with the model or nobody can reproduce your results. Write the model card at the same time.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pytorch',
        note: 'Is the tensor backend every Transformers model runs on.',
        example: {
          lang: 'python',
          code: 'from transformers import AutoModelForSequenceClassification\nimport torch\n\nmodel = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased").to("cuda")\nout = model(**inputs)',
          explanation:
            'Every Transformers model is a PyTorch module. Moving it to a device is the same call you would use on a model you wrote.',
        },
      },
      {
        withId: 'sentence-transformers',
        note: 'Supplies the embedding models you fine-tune.',
        example: {
          lang: 'python',
          code: 'from sentence_transformers import SentenceTransformer\nfrom transformers import AutoTokenizer\n\ntok = AutoTokenizer.from_pretrained("BAAI/bge-small-en-v1.5")\nm = SentenceTransformer("BAAI/bge-small-en-v1.5")',
          explanation:
            'SentenceTransformers builds on Transformers. The tokenizer is shared, so tokenization cannot drift between training and search.',
        },
      },
      {
        withId: 'vllm',
        note: 'Serves the same Hub repos in production.',
        example: {
          lang: 'bash',
          code: 'vllm serve BAAI/bge-small-en-v1.5 --port 8000\ncurl localhost:8000/v1/models',
          explanation:
            'No conversion, no wrapper: the repo id is the argument. That is the shortest path from a Hub model to an OpenAI-compatible endpoint.',
        },
      },
      {
        withId: 'onnx-runtime',
        note: 'Exports Hub models for CPU and edge serving.',
        example: {
          lang: 'python',
          code: 'from transformers import AutoModel\nimport torch\n\nmodel = AutoModel.from_pretrained("distilbert-base-uncased").eval()\ntorch.onnx.export(model, dummy, "distilbert.onnx")',
          explanation:
            'Export the smallest model that meets your latency target. DistilBERT rather than BERT is usually the right first answer.',
        },
      },
    ],
  },
  'sentence-transformers': {
    capabilities: [
      {
        name: 'Bi-encoder embeddings',
        detail: 'Encodes queries and documents separately for fast retrieval.',
        example: {
          lang: 'python',
          code: 'from sentence_transformers import SentenceTransformer\n\nm = SentenceTransformer("BAAI/bge-small-en-v1.5")\nemb = m.encode(docs, batch_size=32, normalize_embeddings=True)',
          explanation:
            'normalize_embeddings makes cosine a dot product, which every vector index is optimised for. Encode docs once, queries per request.',
        },
      },
      {
        name: 'Cross-encoder reranking',
        detail: 'Rescores the top-k jointly for accuracy.',
        example: {
          lang: 'python',
          code: 'from sentence_transformers import CrossEncoder\n\nreranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")\nscores = reranker.predict([(q, d) for d in candidates])',
          explanation:
            'Rerank the top 50, not the whole corpus — a cross-encoder is a hundred times slower than a dot product.',
        },
      },
      {
        name: 'Semantic search',
        detail: 'Builds a similarity index over a text corpus.',
        example: {
          lang: 'python',
          code: 'import numpy as np\n\nscores = emb @ query_emb\nprint(np.argsort(-scores)[:10])',
          explanation:
            'A matrix product is the whole search at this scale. Move to an index only when the corpus is too large for one multiply.',
        },
      },
      {
        name: 'Clustering and deduping',
        detail: 'Groups near-identical documents by embedding distance.',
        example: {
          lang: 'python',
          code: 'from sentence_transformers.util import community_detection\n\nclusters = community_detection(emb, threshold=0.75)',
          explanation:
            'The threshold is the whole result. Sweep it on a labelled sample rather than accepting the default.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pgvector',
        note: 'Fills the vector column you query with hybrid search.',
        example: {
          lang: 'python',
          code: 'emb = SentenceTransformer("BAAI/bge-small-en-v1.5").encode(docs, normalize_embeddings=True)\ndb.executemany(\n    "INSERT INTO docs (body, embedding) VALUES (%s, %s)", zip(docs, emb)\n)',
          explanation:
            'Normalised embeddings make cosine a dot product. The model produces the vector; Postgres does the search.',
        },
      },
      {
        withId: 'qdrant',
        note: 'Produces the points stored in a self-hosted index.',
        example: {
          lang: 'python',
          code: 'm = SentenceTransformer("BAAI/bge-small-en-v1.5")\nclient.upsert(\n    "docs",\n    points=[\n        models.PointStruct(id=i, vector=v, payload={"body": d})\n        for i, (d, v) in enumerate(zip(docs, m.encode(docs)))\n    ],\n)',
          explanation:
            'Compute the vector once and store it. Re-encoding on every query is the cost this pairing removes.',
        },
      },
      {
        withId: 'chroma',
        note: 'Embeds text into an in-process collection.',
        example: {
          lang: 'python',
          code: 'col.add(\n    documents=docs,\n    embeddings=SentenceTransformer("BAAI/bge-small-en-v1.5").encode(docs),\n)',
          explanation:
            'Pass the embeddings so Chroma does not run its own model. Then the vector version is recorded in your code.',
        },
      },
      {
        withId: 'llamaindex',
        note: 'Backs the vector index a query engine reads.',
        example: {
          lang: 'python',
          code: 'from llama_index.embeddings.huggingface import HuggingFaceEmbedding\n\nembed = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")\nindex = VectorStoreIndex.from_documents(docs, embed_model=embed)',
          explanation:
            'The embedding model is injected into the index. Swapping it later is a constructor argument, not a rewrite of every node.',
        },
      },
    ],
  },
  'scikit-learn': {
    capabilities: [
      {
        name: 'Classical models',
        detail: 'Classifiers, regressors, and clustering behind one API.',
        example: {
          lang: 'python',
          code: 'from sklearn.linear_model import LogisticRegression\n\nclf = LogisticRegression(max_iter=1000).fit(X_train, y_train)\nprint(clf.predict_proba(X_test)[:3])',
          explanation:
            'fit and predict are the whole contract. Everything else in the library hangs off that uniformity.',
        },
      },
      {
        name: 'Feature pipelines',
        detail: 'Chains scaling, encoding, and selection into one object.',
        example: {
          lang: 'python',
          code: 'from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\n\npipe = make_pipeline(StandardScaler(), LogisticRegression())\npipe.fit(X_train, y_train)',
          explanation:
            'A pipeline guarantees the scaler is fit on training data only. Without it, scaling before the split leaks information.',
        },
      },
      {
        name: 'Model selection',
        detail: 'Cross-validates and tunes hyperparameters.',
        example: {
          lang: 'python',
          code: 'from sklearn.model_selection import cross_val_score\n\nscores = cross_val_score(clf, X, y, cv=5)\nprint(scores.mean(), scores.std())',
          explanation:
            'Report the spread, not just the mean. A model that wins by less than one standard deviation is not a winner.',
        },
      },
      {
        name: 'ONNX export',
        detail: 'Serves a fitted model outside Python.',
        example: {
          lang: 'python',
          code: 'from skl2onnx import convert_sklearn\nfrom skl2onnx.common.data_types import FloatTensorType\n\nonnx_model = convert_sklearn(\n    clf, initial_types=[("input", FloatTensorType([None, X.shape[1]]))]\n)',
          explanation:
            'Set the first dimension to None so batches of any size are accepted. A fixed batch size is the usual surprise in production.',
        },
      },
    ],
    synergies: [
      {
        withId: 'polars',
        note: 'Consumes cleaned frames directly as arrays.',
        example: {
          lang: 'python',
          code: 'X = df.select(["amt", "qty"]).to_numpy()\ny = df["churned"].to_numpy()\nclf.fit(X, y)',
          explanation:
            'The frame hands over a matrix. Everything before to_numpy is Polars; everything after is scikit-learn.',
        },
      },
      {
        withId: 'pandas',
        note: 'The usual way to hand it a DataFrame.',
        example: {
          lang: 'python',
          code: 'df = pd.DataFrame(X, columns=features)\nclf.fit(df[features], df["label"])',
          explanation:
            'scikit-learn accepts a DataFrame and keeps the column names. That is why feature names survive into get_feature_names_out.',
        },
      },
      {
        withId: 'onnx-runtime',
        note: 'Exports a router or classifier for cheap CPU serving.',
        example: {
          lang: 'python',
          code: 'from skl2onnx import convert_sklearn\nfrom skl2onnx.common.data_types import FloatTensorType\n\nconvert_sklearn(clf, initial_types=[("input", FloatTensorType([None, 4]))])',
          explanation:
            'The first dimension is None so batches of any size work. A fixed batch size is the surprise that shows up in production.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Powers a query router that picks the right agent path.',
        example: {
          lang: 'python',
          code: '@tool\ndef route(q: str) -> str:\n    return "billing" if clf.predict([embed(q)])[0] == 1 else "support"',
          explanation:
            'The classifier decides which node runs. A router that is 95% accurate still saves the cost of running both agents.',
        },
      },
    ],
  },
  'onnx-runtime': {
    capabilities: [
      {
        name: 'Cross-platform inference',
        detail: 'Runs exported models on CPU, GPU, or edge devices.',
        example: {
          lang: 'python',
          code: 'import onnxruntime as ort\n\nsess = ort.InferenceSession("model.onnx")\nout = sess.run(None, {"input_ids": ids})',
          explanation:
            'The session is the expensive object — create it once at startup and reuse it across requests.',
        },
      },
      {
        name: 'Execution providers',
        detail: 'Plugs in CUDA, TensorRT, or OpenVINO per machine.',
        example: {
          lang: 'python',
          code: 'sess = ort.InferenceSession(\n    "model.onnx",\n    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],\n)',
          explanation:
            'List fallbacks in order. If the GPU provider is unavailable the session still starts on CPU instead of failing.',
        },
      },
      {
        name: 'Quantization',
        detail: 'Shrinks and speeds up a model at load time.',
        example: {
          lang: 'python',
          code: 'from onnxruntime.quantization import quantize_dynamic, QuantType\n\nquantize_dynamic("model.onnx", "model.q.onnx",\n                  weight_type=QuantType.QInt8)',
          explanation:
            'Quantize after measuring the float model. An int8 model that is fast but wrong is worse than a slow correct one.',
        },
      },
      {
        name: 'Graph inspection',
        detail: 'Reads ops and tensors to debug a conversion.',
        example: {
          lang: 'python',
          code: 'print([i.name for i in sess.get_inputs()])\nprint([o.shape for o in sess.get_outputs()])',
          explanation:
            'Name and shape mismatches are the common cause of garbage output. Check them before blaming the model.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pytorch',
        note: 'Runs a model exported from a training notebook.',
        example: {
          lang: 'python',
          code: 'import torch\nimport onnxruntime as ort\n\ntorch.onnx.export(model, dummy, "m.onnx")\nsess = ort.InferenceSession("m.onnx")\nprint(sess.run(None, {"input": x.numpy()}))',
          explanation:
            'The same weights, two runtimes. Compare outputs once after export — a mismatch means an op was not translated, not that the model changed.',
        },
      },
      {
        withId: 'scikit-learn',
        note: 'Serves a fitted classical model with skl2onnx.',
        example: {
          lang: 'python',
          code: 'from skl2onnx import convert_sklearn\nconvert_sklearn(pipe, initial_types=[("input", FloatTensorType([None, X.shape[1]]))])',
          explanation:
            'Export the whole pipeline, scaler included. Exporting only the classifier silently applies the wrong scaling.',
        },
      },
      {
        withId: 'hugging-face',
        note: 'Runs exporter output from the Hub.',
        example: {
          lang: 'python',
          code: 'from transformers import AutoModel\nimport torch\n\ntorch.onnx.export(AutoModel.from_pretrained("distilbert-base-uncased").eval(), dummy, "m.onnx")',
          explanation:
            'Any Transformers model exports the same way. Pick the smallest repo that passes your quality bar before you optimise.',
        },
      },
      {
        withId: 'vllm',
        note: 'Handles the small models that do not need a full server.',
        example: {
          lang: 'python',
          code: 'sess = ort.InferenceSession("reranker.onnx", providers=["CPUExecutionProvider"])\nscores = sess.run(None, {"input_ids": ids})[0]',
          explanation:
            'A reranker or a router is small enough for CPU. Reserve the GPU server for generation, where batching actually pays.',
        },
      },
    ],
  },
  vllm: {
    capabilities: [
      {
        name: 'High-throughput serving',
        detail: 'PagedAttention and continuous batching keep GPUs busy.',
        example: {
          lang: 'bash',
          code: 'vllm serve meta-llama/Meta-Llama-3.1-8B-Instruct --port 8000',
          explanation:
            'One command starts an OpenAI-compatible server. Benchmark at your real concurrency — throughput at concurrency 1 is meaningless.',
        },
      },
      {
        name: 'OpenAI-compatible API',
        detail: 'Drops in as a replacement for an existing client.',
        example: {
          lang: 'bash',
          code: 'curl localhost:8000/v1/chat/completions \\\n  -d \'{"model":"llama","messages":[{"role":"user","content":"hi"}]}\'',
          explanation:
            'Point an existing OpenAI client at this URL and change nothing else. That is the migration path for most apps.',
        },
      },
      {
        name: 'Quantized serving',
        detail: 'Runs AWQ or GPTQ models with less memory.',
        example: {
          lang: 'bash',
          code: 'vllm serve TheBloke/Llama-2-7B-AWQ --quantization awq',
          explanation:
            'Quantization buys memory, not free quality. Compare outputs against the float model on a sample before committing.',
        },
      },
      {
        name: 'Prefix caching',
        detail: 'Reuses KV for a shared prompt prefix across requests.',
        example: {
          lang: 'bash',
          code: '# enabled by default; disable only to measure its effect\nvllm serve model --no-enable-prefix-caching',
          explanation:
            'If every request shares a long system prompt, prefix caching is a large win. Measure with it off once so you know what it is worth.',
        },
      },
    ],
    synergies: [
      {
        withId: 'hugging-face',
        note: 'Serves the Hub repos you would otherwise wrap yourself.',
        example: {
          lang: 'bash',
          code: 'vllm serve meta-llama/Meta-Llama-3.1-8B-Instruct --port 8000\ncurl localhost:8000/v1/models',
          explanation:
            'The repo id is the only input. Everything else — tokenizer, chat template, weights — comes from the Hub.',
        },
      },
      {
        withId: 'litellm',
        note: 'Appears as one more model behind the proxy.',
        example: {
          lang: 'yaml',
          code: 'model_list:\n  - model_name: llama\n    litellm_params: {model: openai/llama, api_base: "http://localhost:8000/v1"}',
          explanation:
            'Point LiteLLM at the vLLM URL and it becomes one model among many. Fallbacks and budgets then apply to it like any other.',
        },
      },
      {
        withId: 'docker',
        note: 'Ships as a container with a GPU device attached.',
        example: {
          lang: 'bash',
          code: 'docker run --gpus all -p 8000:8000 vllm/vllm-openai \\\n  --model meta-llama/Meta-Llama-3.1-8B-Instruct',
          explanation:
            'The --gpus flag is the only hardware requirement. Everything else is the same image you would run on a bare-metal host.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Traces throughput and token cost per model.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="generate")\nresp = requests.post("http://localhost:8000/v1/chat/completions", json=payload)\ntrace.score(name="tokens", value=resp.json()["usage"]["total_tokens"])',
          explanation:
            'The endpoint is OpenAI-compatible, so the trace records the same fields as any other provider.',
        },
      },
    ],
  },
  ollama: {
    capabilities: [
      {
        name: 'Local model runner',
        detail: 'Pulls and runs open models with one command.',
        example: {
          lang: 'bash',
          code: 'ollama serve\nollama run llama3.1:8b',
          explanation:
            'The model downloads on first run. Keep the served model small enough to leave room for your actual workload.',
        },
      },
      {
        name: 'Modelfiles',
        detail: 'Defines a model’s base weights, prompt, and parameters.',
        example: {
          lang: 'dockerfile',
          code: 'FROM llama3.1:8b\nSYSTEM "You are a support agent for Atlas."\nPARAMETER temperature 0.2',
          explanation:
            'A Modelfile turns a base model into your model. Commit it — it is the only record of how the assistant was configured.',
        },
      },
      {
        name: 'OpenAI-compatible API',
        detail: 'Points existing clients at localhost.',
        example: {
          lang: 'bash',
          code: 'curl http://localhost:11434/api/generate \\\n  -d \'{"model":"llama3.1","prompt":"explain RAG"}\'',
          explanation:
            'The same /v1 surface means an existing SDK works unchanged. That is what makes local development cheap.',
        },
      },
      {
        name: 'Quantized variants',
        detail: 'Trades quality for size with q4 and q5 tags.',
        example: {
          lang: 'bash',
          code: 'ollama run llama3.1:8b-q4_K_M',
          explanation:
            'Pick the largest quant that fits your memory and still answers well. Test it on your own questions, not on benchmarks.',
        },
      },
    ],
    synergies: [
      {
        withId: 'litellm',
        note: 'Routes to a local model for free during development.',
        example: {
          lang: 'yaml',
          code: 'model_list:\n  - model_name: llama\n    litellm_params: {model: ollama/llama3.1, api_base: "http://localhost:11434"}',
          explanation:
            'A local model appears in the same routing table as a paid one. That is what lets you compare quality before you commit.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Watches local runs with the same dashboard.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="local")\nresp = requests.post("http://localhost:11434/api/generate",\n                     json={"model": "llama3.1", "prompt": q})\ntrace.score(name="tokens", value=resp.json()["eval_count"])',
          explanation:
            'Local runs are free but not unmeasurable. The same dashboard shows both, so you compare like with like.',
        },
      },
      {
        withId: 'docker',
        note: 'Runs the same runtime containerized for a team.',
        example: {
          lang: 'bash',
          code: 'docker run -p 11434:11434 ollama/ollama\ndocker exec ollama ollama run llama3.1:8b',
          explanation:
            'Containerising gives you a pinned runtime and an easy reset. The models live in a volume, not in the image.',
        },
      },
    ],
  },

  // ── Infra and cost ────────────────────────────────────────────────────
  modal: {
    capabilities: [
      {
        name: 'Serverless GPU functions',
        detail: 'Runs workloads that scale to zero when idle.',
        example: {
          lang: 'python',
          code: 'import modal\n\napp = modal.App("embed")\n\n@app.function(gpu="A100", image=image)\ndef run(texts: list[str]) -> list[list[float]]:\n    return model.encode(texts)',
          explanation:
            'The decorator turns a function into a service. You pay for the seconds it runs, and it is cold when nobody calls it.',
        },
      },
      {
        name: 'Container images',
        detail: 'Defines dependencies as code, not a base image.',
        example: {
          lang: 'python',
          code: 'image = modal.Image.debian_slim().pip_install(\n    "sentence-transformers", "polars"\n)',
          explanation:
            'Pin versions here exactly as you would in a requirements file. An unpinned image makes a working function unreproducible.',
        },
      },
      {
        name: 'Volumes',
        detail: 'Mounts durable storage for weights and caches.',
        example: {
          lang: 'python',
          code: 'vol = modal.Volume.from_name("models")\n\n@app.function(volumes={"/root/models": vol})\ndef load():\n    return os.listdir("/root/models")',
          explanation:
            'A volume survives between invocations, which is where model weights belong. Do not re-download them on every cold start.',
        },
      },
      {
        name: 'Scheduled jobs',
        detail: 'Runs batch work on a cron schedule.',
        example: {
          lang: 'python',
          code: '@app.function(schedule=modal.Cron("0 2 * * *"))\ndef nightly():\n    reindex_all()',
          explanation:
            'The schedule is part of the function definition, so it is versioned with the code that runs it.',
        },
      },
    ],
    synergies: [
      {
        withId: 'polars',
        note: 'Runs heavy transforms without provisioning a machine.',
        example: {
          lang: 'python',
          code: '@app.function\ndef aggregate(path: str):\n    return (\n        pl.scan_parquet(path)\n        .group_by("tenant")\n        .agg(pl.len())\n        .to_pandas()\n    )',
          explanation:
            'The function runs where the data is. Moving a frame across the network is slower than moving the query.',
        },
      },
      {
        withId: 'dagster',
        note: 'Executes asset materializations as serverless tasks.',
        example: {
          lang: 'python',
          code: '@asset\ndef nightly_embed():\n    return embed_batch.remote(all_docs)',
          explanation:
            'The asset triggers the work and records that it happened. Modal bills for the seconds the GPU was busy.',
        },
      },
      {
        withId: 'hugging-face',
        note: 'Fine-tunes or batch-embeds on a GPU that scales to zero.',
        example: {
          lang: 'python',
          code: '@app.function(gpu="A100", image=image)\ndef finetune(repo: str):\n    model = AutoModel.from_pretrained(repo)\n    Trainer(model=model, args=args, train_dataset=ds).train()',
          explanation:
            'The Hub supplies the starting weights; Modal supplies the GPU. Nothing is left running when the run ends.',
        },
      },
    ],
  },
  promptfoo: {
    capabilities: [
      {
        name: 'Prompt assertions',
        detail: 'Checks outputs with contains, regex, or JSON schema.',
        example: {
          lang: 'yaml',
          code: 'tests:\n  - vars: {question: "What is the refund policy?"}\n    assert:\n      - type: contains\n        value: "30 days"',
          explanation:
            'One assertion per behaviour you care about. A single assert-everything block fails for the wrong reason and tells you nothing.',
        },
      },
      {
        name: 'Model comparison',
        detail: 'Runs the same test suite across providers.',
        example: {
          lang: 'yaml',
          code: 'prompts: ["Answer: {{question}}"]\nproviders:\n  - openai:gpt-4o\n  - anthropic:claude-3-5-sonnet',
          explanation:
            'Same prompts, same assertions, different providers. The diff is the only honest way to choose a model for a prompt.',
        },
      },
      {
        name: 'CI gating',
        detail: 'Fails a build when a prompt change regresses.',
        example: {
          lang: 'bash',
          code: 'npx promptfoo eval   # exits non-zero when an assertion fails',
          explanation:
            'That exit code is the gate. Add it as a CI step and a failing assertion blocks the merge.',
        },
      },
      {
        name: 'Red teaming',
        detail: 'Probes for unsafe outputs automatically.',
        example: {
          lang: 'yaml',
          code: 'redteam:\n  plugins: [prompt-injection, jailbreak]\n  numTests: 20',
          explanation:
            'Run red-team cases on a schedule, not once. Attack patterns change, and a pass last quarter is not a pass now.',
        },
      },
    ],
    synergies: [
      {
        withId: 'instructor',
        note: 'Asserts that structured extraction still validates.',
        example: {
          lang: 'python',
          code: '# Run the suite against the extraction path you ship, not a mock.\nresp = extract(invoice_text)\nassert resp.total == 150',
          explanation:
            'Test the extraction you ship. A mock that returns a dict proves the mock works, not the model.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Runs the same checks over recorded production traces.',
        example: {
          lang: 'python',
          code: 'score = evaluate(retrieve, data="rag-golden", evaluators=[faithfulness])\nassert score["faithfulness"] >= 0.85',
          explanation:
            'Promptfoo supplies the cases, LangSmith stores the trend. The assertion is what fails the build; the history is what explains the failure.',
        },
      },
      {
        withId: 'helicone',
        note: 'Measures cost alongside correctness.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(model="gpt-4o", messages=[...],\n                          cache={"ttl": 3600})\nassert resp.cached or resp.usage.total_tokens < 400',
          explanation:
            'Assert on cost as well as content. A correct answer that got three times more expensive is a regression too.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Compares prompt versions scored in the tracer.',
        example: {
          lang: 'python',
          code: 'trace = langfuse.trace(name="eval")\nresults = run_eval(prompt, provider)\ntrace.score(name="pass_rate",\n            value=sum(r.passed for r in results) / len(results))',
          explanation:
            'Record the pass rate as a score on the eval run. A prompt change then shows up in the same dashboard as production quality.',
        },
      },
    ],
  },

  // ── Security and governance ───────────────────────────────────────────
  'nemo-guardrails': {
    capabilities: [
      {
        name: 'Input rails',
        detail: 'Checks a user message before the model ever sees it.',
        example: {
          lang: 'python',
          code: 'from nemoguardrails import RailsConfig, LLMRails\n\nconfig = RailsConfig.from_path("config")\nrails = LLMRails(config)\nres = rails.generate(messages=[{"role": "user", "content": q}])',
          explanation:
            'The rail runs before the LLM call, so a blocked message costs nothing. Log the block reason — it is your signal that the rail is too strict.',
        },
      },
      {
        name: 'Dialog rails',
        detail: 'Enforces multi-turn conversation rules.',
        example: {
          lang: 'colang',
          code: 'define flow refuse refund abuse\n  user asks for an unauthorized refund\n  bot refuse with "I cannot process that refund"',
          explanation:
            'Flows describe allowed and refused dialogues, not code. Write them as conversations so a non-engineer can review them.',
        },
      },
      {
        name: 'Colang flows',
        detail: 'Defines allowed and refused dialogues as code.',
        example: {
          lang: 'colang',
          code: 'define user asks for an unauthorized refund\n  "refund a closed account"\n  "bypass the refund limit"\n\ndefine bot refuse\n  "I cannot process that refund"',
          explanation:
            'The user examples are the test set. Add a new utterance every time a real user finds a gap.',
        },
      },
      {
        name: 'Jailbreak detection',
        detail: 'Blocks prompt-injection patterns at the boundary.',
        example: {
          lang: 'python',
          code: 'res = rails.generate(messages=[{"role": "user", "content": q}])\nif res["rail_output"] is None:\n    print("blocked by a rail")',
          explanation:
            'A blocked message looks like an empty response. Make that path explicit in your UI rather than showing a generic error.',
        },
      },
    ],
    synergies: [
      {
        withId: 'presidio',
        note: 'Redacts PII before a rail decides what to refuse.',
        example: {
          lang: 'python',
          code: 'from presidio_analyzer import AnalyzerEngine\nfrom presidio_anonymizer import AnonymizerEngine\n\nclean = AnonymizerEngine().anonymize(\n    text, AnalyzerEngine().analyze(text, language="en")\n).text\nres = rails.generate(messages=[{"role": "user", "content": clean}])',
          explanation:
            'Redact first, judge second. A rail that refuses a message containing an email is a rail that will refuse your users.',
        },
      },
      {
        withId: 'langgraph',
        note: 'Wraps an agent so every turn passes a rail.',
        example: {
          lang: 'python',
          code: 'def rail_node(state):\n    out = rails.generate(messages=state["messages"])\n    return {"messages": state["messages"] + [out["messages"][-1]]}\n\ng.add_node("rail", rail_node)',
          explanation:
            'The rail is a node like any other. Because it sits in the graph, every turn passes through it — there is no path that skips it.',
        },
      },
      {
        withId: 'litellm',
        note: 'Guards every provider behind one policy layer.',
        example: {
          lang: 'python',
          code: 'resp = litellm.completion(\n    model=req.model, messages=rail(clean_messages)\n)',
          explanation:
            'Guard the input before the proxy, so a fallback to another provider cannot bypass the rail.',
        },
      },
    ],
  },
  presidio: {
    capabilities: [
      {
        name: 'PII detection',
        detail: 'Finds names, emails, card numbers, and more.',
        example: {
          lang: 'python',
          code: 'from presidio_analyzer import AnalyzerEngine\n\nresults = AnalyzerEngine().analyze(text, language="en")\nfor r in results:\n    print(r.entity_type, text[r.start:r.end])',
          explanation:
            'The score travels with each hit. Set a threshold above the default if false positives are costing you trust.',
        },
      },
      {
        name: 'Custom recognizers',
        detail: 'Adds regex or checksum detectors for internal formats.',
        example: {
          lang: 'python',
          code: 'from presidio_analyzer import PatternRecognizer, Pattern\n\nPatternRecognizer(\n    supported_entity="EMP_ID",\n    patterns=[Pattern("emp", r"EMP-\\d{5}", 0.6)],\n)',
          explanation:
            'Internal identifiers are never in a stock model. A checksum-backed recogniser is far more precise than a regex alone.',
        },
      },
      {
        name: 'Anonymization',
        detail: 'Replaces or masks detected spans.',
        example: {
          lang: 'python',
          code: 'from presidio_anonymizer import AnonymizerEngine\n\nout = AnonymizerEngine().anonymize(text, results)\nprint(out.text)',
          explanation:
            'Redact before the text reaches a trace or a log. Once PII is stored, deleting it is a migration.',
        },
      },
      {
        name: 'Multilingual detection',
        detail: 'Detects entities across many languages.',
        example: {
          lang: 'python',
          code: 'from presidio_analyzer.nlp_engine import NlpEngineProvider\n\nprovider = NlpEngineProvider(nlp_models=[\n    {"lang_code": "de", "model_name": "de_core_news_lg"}\n])',
          explanation:
            'Load only the languages you actually serve. Each model is memory you pay for on every start.',
        },
      },
    ],
    synergies: [
      {
        withId: 'nemo-guardrails',
        note: 'Cleans a message before a dialog rail judges it.',
        example: {
          lang: 'python',
          code: 'hits = AnalyzerEngine().analyze(text, language="en")\nif any(h.entity_type == "PERSON" for h in hits):\n    text = AnonymizerEngine().anonymize(text, hits).text',
          explanation:
            'Decide what to do per entity type. Redacting everything is safe and useless; redacting names only is both.',
        },
      },
      {
        withId: 'langfuse',
        note: 'Keeps traces free of the PII they would otherwise store.',
        example: {
          lang: 'python',
          code: 'hits = AnalyzerEngine().analyze(prompt, language="en")\ntrace = langfuse.trace(\n    name="chat", input=AnonymizerEngine().anonymize(prompt, hits).text\n)',
          explanation:
            'Redact before you store. A trace that contains a real email is a data-breach waiting for a retention policy.',
        },
      },
      {
        withId: 'litellm',
        note: 'Redacts prompts on the way to any provider.',
        example: {
          lang: 'python',
          code: 'clean = AnonymizerEngine().anonymize(\n    prompt, AnalyzerEngine().analyze(prompt, language="en")\n).text\nresp = litellm.completion(model="gpt-4o",\n                          messages=[{"role": "user", "content": clean}])',
          explanation:
            'Redact on the way out, not after storage. Once the prompt is in a log, deleting it is a migration.',
        },
      },
    ],
  },
  'guardrails-ai': {
    capabilities: [
      {
        name: 'Output guards',
        detail: 'Validates LLM output against a declared schema.',
        example: {
          lang: 'python',
          code: 'from guardrails import Guard\n\nguard = Guard().use(ReplySchema)\nout = guard.parse(llm_output, model="gpt-4o")\nprint(out.validated_output)',
          explanation:
            'validated_output is the only value you should pass on. If it is empty, the guard rejected the response and re-asked.',
        },
      },
      {
        name: 'Re-asking',
        detail: 'Resends the validation error to the model.',
        example: {
          lang: 'python',
          code: 'guard = Guard().use(ReplySchema).use(ValidLength(1, 200), on_fail="reask")',
          explanation:
            'on_fail decides what happens. Use reask for format problems and fix for ones you can repair deterministically.',
        },
      },
      {
        name: 'Field validators',
        detail: 'Applies length, regex, SQL, and similarity rules.',
        example: {
          lang: 'python',
          code: 'from guardrails.hub import ValidLength, ValidRegex\n\nguard = Guard().use(ValidLength(min_val=1, max_val=200))',
          explanation:
            'Compose validators rather than writing one big check. Each one reports its own failure, which is what makes a rejection debuggable.',
        },
      },
      {
        name: 'Guard composition',
        detail: 'Stacks several validators on one output.',
        example: {
          lang: 'python',
          code: 'Guard().use(ValidLength(1, 200)).use(ValidRegex(regex="^[A-Z]"))',
          explanation:
            'Order matters only for cost. Put the cheapest, most-likely-to-fail check first.',
        },
      },
    ],
    synergies: [
      {
        withId: 'pydantic',
        note: 'Shares the same schema vocabulary for validation.',
        example: {
          lang: 'python',
          code: 'from pydantic import BaseModel\nfrom guardrails import Guard\n\nclass Reply(BaseModel):\n    answer: str\n\nguard = Guard().use(Reply)',
          explanation:
            'The schema is written once. Guardrails adds the refusal and the re-ask on top of it.',
        },
      },
      {
        withId: 'instructor',
        note: 'Adds refusals and re-asks around structured extraction.',
        example: {
          lang: 'python',
          code: 'from guardrails.hub import ValidLength\n\nguard = Guard().use(Reply).use(ValidLength(1, 200), on_fail="reask")\nout = guard.parse(llm_output, model="gpt-4o")',
          explanation:
            'Shape and content are separate checks. A reply that is valid JSON and still too long is the case only the second validator catches.',
        },
      },
      {
        withId: 'langsmith',
        note: 'Counts guard failures so a weak prompt is visible.',
        example: {
          lang: 'python',
          code: '@ls.traceable\ndef guarded(text: str) -> str:\n    return guard.parse(llm.run(text), model="gpt-4o").validated_output',
          explanation:
            'Trace the whole guarded call. A spike in re-asks shows up as a slower, more expensive run — not as a user-facing error.',
        },
      },
      {
        withId: 'fastapi',
        note: 'Guards responses at the API boundary.',
        example: {
          lang: 'python',
          code: '@app.post("/answer", response_model=Reply)\nasync def answer(req: ChatRequest):\n    out = guard.parse(llm.run(req.q), model="gpt-4o")\n    return {"answer": out.validated_output}',
          explanation:
            'The guard sits at the boundary, so a bad reply never leaves the process. The response model is the second check.',
        },
      },
    ],
  },

  // ── Protocols ─────────────────────────────────────────────────────────
  mcp: {
    capabilities: [
      {
        name: 'Tool exposure',
        detail: 'Publishes your data as tools over a standard protocol.',
        example: {
          lang: 'python',
          code: 'from mcp.server.fastmcp import FastMCP\n\nmcp = FastMCP("atlas")\n\n@mcp.tool()\ndef search_docs(q: str) -> list[str]:\n    """Search the atlas docs."""\n    return vector_db.search(q)',
          explanation:
            'The docstring becomes the tool description the model reads. Write it for the model, not for your colleagues.',
        },
      },
      {
        name: 'Resource sharing',
        detail: 'Exposes documents and schemas to any client.',
        example: {
          lang: 'python',
          code: '@mcp.resource("atlas://docs/{id}")\ndef get_doc(id: str) -> str:\n    return docs[id]',
          explanation:
            'Resources are reads the client can address by URI. Use them for reference material, tools for actions.',
        },
      },
      {
        name: 'Transport choice',
        detail: 'Runs over stdio locally or HTTP remotely.',
        example: {
          lang: 'python',
          code: 'mcp.run(transport="stdio")      # local process\nmcp.run(transport="streamable-http")  # remote server',
          explanation:
            'stdio is one process per client and nothing to secure. HTTP is shared, so it needs auth before you expose it.',
        },
      },
      {
        name: 'Client interoperability',
        detail: 'Works with any MCP host, not one vendor.',
        example: {
          lang: 'python',
          code: 'from mcp import ClientSession, StdioServerParameters\n\nparams = StdioServerParameters(command="python", args=["server.py"])\nasync with ClientSession(params) as session:\n    await session.call_tool("search_docs", {"q": "refund"})',
          explanation:
            'One client, many servers. That is the point of a protocol: you can replace the agent without rewriting your tools.',
        },
      },
    ],
    synergies: [
      {
        withId: 'langgraph',
        note: 'Gives an agent external tools without custom adapters.',
        example: {
          lang: 'python',
          code: 'from langchain_mcp_adapters.client import MultiServerMCPClient\n\nclient = MultiServerMCPClient({"atlas": {"url": "http://localhost:8000/mcp"}})\ng.add_node("tools", ToolNode(await client.get_tools()))',
          explanation:
            'The tools are discovered at runtime, not hand-written. A new MCP server is a config entry, not a new node.',
        },
      },
      {
        withId: 'copilotkit',
        note: 'Lets a copilot call the same tools as your backend.',
        example: {
          lang: 'tsx',
          code: 'useCopilotAction({\n  name: "searchDocs",\n  handler: async () => (await fetch("/api/mcp/search", { method: "POST" })).json(),\n})',
          explanation:
            'CopilotKit exposes the action; MCP supplies the tool. The copilot never learns the tool’s real name.',
        },
      },
      {
        withId: 'presidio',
        note: 'Wraps redaction as a tool any client can call.',
        example: {
          lang: 'python',
          code: '@mcp.tool()\ndef search_docs(q: str) -> list[str]:\n    clean = AnonymizerEngine().anonymize(\n        q, AnalyzerEngine().analyze(q, language="en")\n    ).text\n    return vector_db.search(clean)',
          explanation:
            'Redaction inside the tool means every client is covered. A tool that trusts its caller is the gap.',
        },
      },
      {
        withId: 'pgvector',
        note: 'Exposes search as a tool rather than a bespoke endpoint.',
        example: {
          lang: 'python',
          code: '@mcp.tool()\ndef search_docs(q: str) -> list[str]:\n    return db.query(\n        "SELECT body FROM docs ORDER BY embedding <=> %s::vector LIMIT 5", embed(q)\n    )',
          explanation:
            'The tool is one query. Any MCP client that can call it gets the same retrieval, with no bespoke endpoint.',
        },
      },
    ],
  },
};

/** Usage entry for a product, or undefined when the product is untracked. */
export function usageFor(productId: string): UsageEntry | undefined {
  return USAGE[productId];
}
