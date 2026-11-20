import { DOMAINS, WORKFLOW_STAGES, getCategory, workflowStageProducts } from './catalog';

interface Props {
  onOpenProduct: (productId: string) => void;
}

/**
 * The AI application workflow: the pipeline in the order you would build it.
 *
 * Deliberately a different axis from the learning track. The track answers "what
 * do I practise next"; this answers "where does this tool sit in the thing I am
 * building". Each product gets exactly one stage — its main work — and the
 * product's own guide is where the neighbouring stages are described.
 */
export default function WorkflowPage({ onOpenProduct }: Props) {
  const trackDomain = DOMAINS.find((d) => d.id === 'ai-engineering');
  const total = WORKFLOW_STAGES.reduce((sum, stage) => sum + stage.productIds.length, 0);

  return (
    <div className="workflow-page">
      <header className="workflow-head">
        <h1>AI Application Workflow</h1>
        <p className="workflow-sub">
          {WORKFLOW_STAGES.length} stages, {total} technologies, in the order you would build them.
          This is not the order to learn them in — the{' '}
          <span className="workflow-sub-em">AI Track</span> is that. Each stage names the tools that
          do its work; open one for its syntax, capabilities, and synergies.
        </p>
        {trackDomain && (
          <p className="workflow-note">
            Scope: the {trackDomain.name} domain. One home per tool — a product that spans two
            stages is placed where it does its main work.
          </p>
        )}
      </header>

      <ol className="workflow-stages">
        {WORKFLOW_STAGES.map((stage, index) => {
          const products = workflowStageProducts(stage);
          return (
            <li key={stage.id} className="wf-stage" id={stage.id}>
              <div className="wf-rail" aria-hidden="true">
                <span className="wf-num">{index + 1}</span>
              </div>

              <section className="wf-body">
                <header className="wf-head">
                  <div>
                    <h2>{stage.title}</h2>
                    <p className="wf-outcome">{stage.outcome}</p>
                  </div>
                  <span className="wf-count">{products.length} tools</span>
                </header>

                <ul className="wf-items">
                  {products.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        className="wf-item"
                        onClick={() => onOpenProduct(product.id)}
                      >
                        <span className="wf-item-name">{product.name}</span>
                        <span className="wf-item-meta">{getCategory(product.categoryId).name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          );
        })}
      </ol>

      <footer className="workflow-foot">
        <p>
          Two orderings, two uses. The workflow runs in the order a system is built; the track runs
          in the order a person learns. A tool you meet early in the track may sit late in the
          workflow — governance has nothing to govern until there is a system to govern.
        </p>
      </footer>
    </div>
  );
}
