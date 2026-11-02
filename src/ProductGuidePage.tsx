import { getProduct, getCategory, getBrandIcon } from './catalog';
import type { Product } from './catalog/types';

interface Props {
  productId: string;
  onBack: () => void;
}

const MODEL_LABEL: Record<Product['model'], string> = {
  S: 'Managed',
  O: 'Open source',
  B: 'Both',
  C: 'Cloud',
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

export default function ProductGuidePage({ productId, onBack }: Props) {
  const product = getProduct(productId);
  const category = getCategory(product.categoryId);
  const brandIcon = getBrandIcon(product.id);
  const guide = product.guide;

  return (
    <div className="guide-page">
      <header className="guide-head">
        <button type="button" className="guide-back" onClick={onBack}>
          ← Back to map
        </button>
        <div className="guide-title-row">
          {brandIcon && (
            <svg className="guide-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={brandIcon} />
            </svg>
          )}
          <div>
            <h1>{product.name}</h1>
            <p className="guide-meta">
              <span className={`badge b-${product.model}`}>{MODEL_LABEL[product.model]}</span>
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
          </div>
        </div>
      </header>

      {guide ? (
        <div className="guide-body">
          <Section title="Overview">
            <p className="guide-description">{guide.description}</p>
          </Section>

          {guide.certificates.length > 0 && (
            <Section title="Certificates">
              <ul className="guide-list">
                {guide.certificates.map((cert) => (
                  <li key={cert}>{cert}</li>
                ))}
              </ul>
            </Section>
          )}

          {guide.stats && Object.values(guide.stats).some((v) => v) && (
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

          {guide.trends.length > 0 && (
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

          {guide.blogPosts.length > 0 && (
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
