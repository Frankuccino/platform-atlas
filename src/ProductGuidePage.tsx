import { useRef, useState } from 'react';
import {
  getProduct,
  getCategory,
  getBrandIcon,
  productById,
  LEARNING,
  TRACK_PHASES,
  usageFor,
  type UsageEntry,
} from './catalog';
import CodeBlock from './syntax/CodeBlock';
import type { Product } from './catalog/types';

interface Props {
  productId: string;
  /** Where the back button returns to, e.g. "Back to track". */
  backLabel: string;
  onBack: () => void;
  /** Open another product's guide, used by comparison and alternative links. */
  onOpenProduct: (productId: string) => void;
}

const MODEL_LABEL: Record<Product['model'], string> = {
  S: 'Managed',
  O: 'Open source',
  B: 'Both',
  C: 'Cloud',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="guide-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

/** Resolve a free-text legacy name to a catalog product, so it can be a link. */
function findProductByName(name: string): Product | undefined {
  const needle = name.toLowerCase();
  return Array.from(productById.values()).find((p) => p.name.toLowerCase() === needle);
}

function Rail({
  product,
  onOpenProduct,
}: {
  product: Product;
  onOpenProduct: (id: string) => void;
}) {
  const entry = LEARNING[product.id];
  const phase = entry ? TRACK_PHASES.find((p) => p.phase === entry.phase) : undefined;

  return (
    <aside className="guide-rail">
      {entry && phase && (
        <div className="rail-card">
          <h3 className="rail-title">Track position</h3>
          <dl className="rail-facts">
            <div>
              <dt>Phase</dt>
              <dd>
                {entry.phase}. {phase.title}
              </dd>
            </div>
            <div>
              <dt>Order</dt>
              <dd>{entry.order}</dd>
            </div>
            <div>
              <dt>Drills</dt>
              <dd>{entry.exercises.length}</dd>
            </div>
          </dl>
        </div>
      )}

      {entry && entry.comparisons.length > 0 && (
        <div className="rail-card">
          <h3 className="rail-title">Coming from</h3>
          <ul className="rail-comparisons">
            {entry.comparisons.map((cmp) => {
              const legacy = findProductByName(cmp.legacy);
              return (
                <li key={cmp.legacy} className="rail-comparison">
                  <div className="rail-comparison-head">
                    {legacy ? (
                      <button
                        type="button"
                        className="rail-link"
                        onClick={() => onOpenProduct(legacy.id)}
                        title={`Open the ${legacy.name} guide`}
                      >
                        {cmp.legacy}
                      </button>
                    ) : (
                      <span className="rail-legacy">{cmp.legacy}</span>
                    )}
                    <span className="rail-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="rail-modern">{cmp.modern}</span>
                  </div>
                  <p className="rail-note">{cmp.note}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {product.alternatives.length > 0 && (
        <div className="rail-card">
          <h3 className="rail-title">Alternatives</h3>
          <ul className="rail-alts">
            {product.alternatives.map((id) => {
              const alt = productById.get(id);
              if (!alt) return null;
              return (
                <li key={id}>
                  <button type="button" className="rail-link" onClick={() => onOpenProduct(alt.id)}>
                    {alt.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}

type GuideTab = 'guide' | 'capabilities' | 'synergies';

const GUIDE_TABS: { id: GuideTab; label: string }[] = [
  { id: 'guide', label: 'Guide' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'synergies', label: 'Synergies' },
];

/**
 * The guide's section switch.
 *
 * Roving tabindex: only the selected tab is in the tab order, and arrow keys
 * move selection, which is the pattern screen readers expect from a tablist.
 */
function GuideTabs({ tab, onChange }: { tab: GuideTab; onChange: (tab: GuideTab) => void }) {
  const refs = useRef<Record<GuideTab, HTMLButtonElement | null>>({
    guide: null,
    capabilities: null,
    synergies: null,
  });

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const index = GUIDE_TABS.findIndex((t) => t.id === tab);
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % GUIDE_TABS.length
        : (index - 1 + GUIDE_TABS.length) % GUIDE_TABS.length;
    const target = GUIDE_TABS[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  }

  return (
    <div className="guide-tabs" role="tablist" aria-label="Guide sections">
      {GUIDE_TABS.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          type="button"
          role="tab"
          id={`guide-tab-${t.id}`}
          aria-selected={tab === t.id}
          aria-controls={`guide-panel-${t.id}`}
          tabIndex={tab === t.id ? 0 : -1}
          className={tab === t.id ? 'guide-tab is-active' : 'guide-tab'}
          onClick={() => onChange(t.id)}
          onKeyDown={onKeyDown}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** All the techniques and methods the technology is used for. */
function CapabilitiesPanel({ product, usage }: { product: Product; usage: UsageEntry }) {
  return (
    <section
      className="guide-section"
      role="tabpanel"
      id="guide-panel-capabilities"
      aria-labelledby="guide-tab-capabilities"
    >
      <h3>Capabilities</h3>
      <p className="guide-section-sub">
        Every technique and method {product.name} is used for. Each one ships a runnable example and
        a note on what to change.
      </p>
      <div className="cap-list">
        {usage.capabilities.map((capability) => (
          <div key={capability.name} className="cap-item">
            <h4>{capability.name}</h4>
            <p className="cap-detail">{capability.detail}</p>
            <CodeBlock code={capability.example.code} lang={capability.example.lang} />
            <p className="cap-explain">{capability.example.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** What the technology pairs with, and what the pairing buys you. */
function SynergiesPanel({
  product,
  usage,
  onOpenProduct,
}: {
  product: Product;
  usage: UsageEntry;
  onOpenProduct: (id: string) => void;
}) {
  return (
    <section
      className="guide-section"
      role="tabpanel"
      id="guide-panel-synergies"
      aria-labelledby="guide-tab-synergies"
    >
      <h3>Synergies</h3>
      <p className="guide-section-sub">
        What {product.name} pairs with, and what the combination buys you. Each pairing ships a
        snippet that composes the two.
      </p>
      <ul className="synergy-list">
        {usage.synergies.map((synergy) => {
          const other = productById.get(synergy.withId);
          return (
            <li key={synergy.withId} className="synergy">
              <div className="synergy-head">
                {other ? (
                  <button
                    type="button"
                    className="rail-link"
                    onClick={() => onOpenProduct(other.id)}
                    title={`Open the ${other.name} guide`}
                  >
                    {other.name}
                  </button>
                ) : (
                  <span className="rail-legacy">{synergy.withId}</span>
                )}
                {other && <span className="synergy-cat">{getCategory(other.categoryId).name}</span>}
              </div>
              <p className="rail-note">{synergy.note}</p>
              <CodeBlock code={synergy.example.code} lang={synergy.example.lang} />
              <p className="cap-explain">{synergy.example.explanation}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function ProductGuidePage({ productId, backLabel, onBack, onOpenProduct }: Props) {
  const [tab, setTab] = useState<GuideTab>('guide');
  const product = getProduct(productId);
  const category = getCategory(product.categoryId);
  const brandIcon = getBrandIcon(product.id);
  const guide = product.guide;
  const learning = LEARNING[productId];
  const usage = usageFor(productId);
  const phase = learning ? TRACK_PHASES.find((p) => p.phase === learning.phase) : undefined;

  return (
    <div className="guide-page">
      <header className="guide-head">
        <button type="button" className="guide-back" onClick={onBack}>
          ← {backLabel}
        </button>
        <div className="guide-bar">
          {brandIcon && (
            <svg className="guide-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={brandIcon} />
            </svg>
          )}
          <h1>{product.name}</h1>
          <span className={`badge b-${product.model}`}>{MODEL_LABEL[product.model]}</span>
          <span className="guide-bar-phase">
            {phase ? `Phase ${phase.phase} · ${phase.title}` : category.name}
          </span>
        </div>
      </header>

      <div className="guide-lead">
        <p className="guide-lead-meta">
          <span className="guide-category">{category.name}</span>
          {product.lastUpdated && (
            <span className="guide-freshness">
              · Updated{' '}
              {new Date(product.lastUpdated).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
        </p>
        {learning && <p className="guide-lead-goal">{learning.goal}</p>}
      </div>

      {/* Only rendered when the product has usage data: an empty Capabilities or
          Synergies tab is a dead end, so an untracked guide stays as it was. */}
      {usage && <GuideTabs tab={tab} onChange={setTab} />}

      {guide || learning || usage ? (
        <div className="guide-cols">
          <div className="guide-main">
            {tab === 'guide' && (
              <div
                className="guide-tabpanel"
                role="tabpanel"
                id="guide-panel-guide"
                aria-labelledby="guide-tab-guide"
              >
                {guide && (
                  <Section title="Overview">
                    <p className="guide-description">{guide.description}</p>
                  </Section>
                )}

                {learning && learning.syntax.length > 0 && (
                  <Section title="Syntax quickstart">
                    <div className="guide-code-list">
                      {learning.syntax.map((ex) => (
                        <CodeBlock key={ex.title} code={ex.code} lang={ex.lang} title={ex.title} />
                      ))}
                    </div>
                  </Section>
                )}

                {learning && learning.terminology.length > 0 && (
                  <Section title="Terminology">
                    <dl className="guide-terms">
                      {learning.terminology.map((t) => (
                        <div key={t.term} className="guide-term">
                          <dt>{t.term}</dt>
                          <dd>{t.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </Section>
                )}

                {learning && learning.exercises.length > 0 && (
                  <Section title="Hands-on practice">
                    <ul className="guide-exercises">
                      {learning.exercises.map((ex) => (
                        <li key={ex.title} className="guide-exercise">
                          <div className="guide-exercise-head">
                            <span className="guide-exercise-title">{ex.title}</span>
                            <span className={`guide-difficulty d-${ex.difficulty}`}>
                              {DIFFICULTY_LABEL[ex.difficulty]}
                            </span>
                            <span className="guide-minutes">{ex.estMinutes} min</span>
                          </div>
                          <p className="guide-exercise-prompt">{ex.prompt}</p>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {guide && guide.certificates.length > 0 && (
                  <Section title="Certificates">
                    <ul className="guide-list">
                      {guide.certificates.map((cert) => (
                        <li key={cert}>{cert}</li>
                      ))}
                    </ul>
                  </Section>
                )}

                {guide?.stats && Object.values(guide.stats).some((v) => v) && (
                  <Section title="Key stats">
                    <dl className="guide-stats">
                      {Object.entries(guide.stats).map(
                        ([key, value]) =>
                          value && (
                            <div key={key} className="guide-stat">
                              <dt>{key}</dt>
                              <dd>{value}</dd>
                            </div>
                          ),
                      )}
                    </dl>
                  </Section>
                )}

                {guide && guide.trends.length > 0 && (
                  <Section title="Current trends">
                    <ul className="guide-trends">
                      {guide.trends.map((trend) => (
                        <li key={trend.title} className="guide-trend">
                          <span className="guide-trend-title">{trend.title}</span>
                          <span className="guide-trend-meta">
                            {trend.source} · {formatDate(trend.date)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {guide && guide.blogPosts.length > 0 && (
                  <Section title="Recent posts">
                    <ul className="guide-blogs">
                      {guide.blogPosts.map((post) => (
                        <li key={post.url}>
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="guide-blog-link"
                          >
                            <span className="guide-blog-title">{post.title}</span>
                            <span className="guide-blog-date">{formatDate(post.date)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            )}

            {tab === 'capabilities' && usage && (
              <CapabilitiesPanel product={product} usage={usage} />
            )}

            {tab === 'synergies' && usage && (
              <SynergiesPanel product={product} usage={usage} onOpenProduct={onOpenProduct} />
            )}
          </div>

          <Rail product={product} onOpenProduct={onOpenProduct} />
        </div>
      ) : (
        <div className="guide-empty">
          <p>
            A comprehensive guide for <strong>{product.name}</strong> has not been written yet.
          </p>
          <p className="guide-empty-hint">
            Check back later — guides are being added across the catalog.
          </p>
        </div>
      )}
    </div>
  );
}
