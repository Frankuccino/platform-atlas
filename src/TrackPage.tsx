import { CATEGORIES, DOMAINS, LEARNING, PRODUCTS, TRACK_PHASES, getCategory } from './catalog';

interface Props {
  onOpenProduct: (productId: string) => void;
}

/**
 * The AI Engineering roadmap: nine phases, each with its categories and the
 * products to practice. This is the "dashboard track" — it answers "what do I
 * work on today?" by walking the phases in order.
 */
export default function TrackPage({ onOpenProduct }: Props) {
  const trackDomain = DOMAINS.find((d) => d.id === 'ai-engineering');
  const products = PRODUCTS.filter((p) => trackDomain?.categoryIds.includes(p.categoryId));
  const focusId = nextPracticeProduct();
  const focus = focusId ? PRODUCTS.find((p) => p.id === focusId) : undefined;
  const focusEntry = focusId ? LEARNING[focusId] : undefined;
  const focusPhase = focusEntry
    ? TRACK_PHASES.find((p) => p.phase === focusEntry.phase)
    : undefined;
  const focusDrill = focusEntry?.exercises[0];

  return (
    <div className="track-page">
      <header className="track-head">
        <h1>AI Engineering Track</h1>
        <p className="track-sub">
          {products.length} technologies across {TRACK_PHASES.length} phases. Work top to bottom;
          each product has syntax, terminology, and a hands-on drill.
        </p>
      </header>

      {focus && focusEntry && focusPhase && (
        <section className="track-focus">
          <div className="track-focus-head">
            <span className="track-focus-label">Today's focus</span>
            <span className="track-focus-phase">
              Phase {focusEntry.phase} · {focusPhase.title}
            </span>
          </div>
          <div className="track-focus-body">
            <div className="track-focus-main">
              <h2 className="track-focus-name">{focus.name}</h2>
              <p className="track-focus-goal">{focusEntry.goal}</p>
            </div>
            <div className="track-focus-drill">
              {focusDrill ? (
                <>
                  <span className="track-focus-drill-label">Start with this drill</span>
                  <span className="track-focus-drill-title">{focusDrill.title}</span>
                  <span className="track-focus-drill-meta">
                    {focusDrill.difficulty} · {focusDrill.estMinutes} min
                  </span>
                </>
              ) : (
                <span className="track-focus-drill-label">No drill yet</span>
              )}
            </div>
            <button
              type="button"
              className="track-focus-open"
              onClick={() => onOpenProduct(focus.id)}
            >
              Open guide
            </button>
          </div>
        </section>
      )}

      <ol className="track-phases">
        {TRACK_PHASES.map((phase) => {
          const cats = phase.categoryIds
            .map((id) => CATEGORIES.find((c) => c.id === id))
            .filter((c): c is NonNullable<typeof c> => Boolean(c));
          const phaseProducts = products.filter((p) => phase.categoryIds.includes(p.categoryId));
          return (
            <li key={phase.phase} className="track-phase">
              <div className="track-phase-head">
                <span className="track-phase-num">{phase.phase}</span>
                <div>
                  <h2>{phase.title}</h2>
                  <p className="track-phase-outcome">{phase.outcome}</p>
                </div>
                <span className="track-phase-count">{phaseProducts.length} tools</span>
              </div>

              <div className="track-cats">
                {cats.map((cat) => {
                  const items = phaseProducts.filter((p) => p.categoryId === cat.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.id} className="track-cat">
                      <h3 className="track-cat-name">{cat.name}</h3>
                      <ul className="track-items">
                        {items
                          .slice()
                          .sort(
                            (a, b) =>
                              (LEARNING[a.id]?.order ?? 999) - (LEARNING[b.id]?.order ?? 999),
                          )
                          .map((p) => {
                            const entry = LEARNING[p.id];
                            return (
                              <li key={p.id}>
                                <button
                                  type="button"
                                  className="track-item"
                                  onClick={() => onOpenProduct(p.id)}
                                >
                                  <span className="track-item-name">{p.name}</span>
                                  <span className="track-item-meta">
                                    {getCategory(p.categoryId).name}
                                    {entry ? ` · P${entry.phase}.${entry.order}` : ''}
                                    {entry ? ` · ${entry.exercises.length} drills` : ''}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="track-foot">
        <p>
          Suggested daily loop: pick one product, read its syntax quickstart, then complete one
          drill and log the minutes. Move to the next product only when the drill feels boring.
        </p>
      </footer>
    </div>
  );
}

/** Next product to practice, in phase/order sequence. */
export function nextPracticeProduct(): string | null {
  const ordered = PRODUCTS.filter((p) => LEARNING[p.id]).sort((a, b) => {
    const la = LEARNING[a.id];
    const lb = LEARNING[b.id];
    return la.phase - lb.phase || la.order - lb.order;
  });
  return ordered[0]?.id ?? null;
}
