import { getBrandIcon, getCategory, getProduct, getProductLinks, recommendFor } from './catalog';
import type { Product } from './catalog/types';
import type { Recommendation } from './catalog/recommendations';

interface Props {
  productId: string;
  /** Navigate to another product, used by the alternative and recommendation links. */
  onSelect: (productId: string) => void;
  onClose: () => void;
  /** Open the full product guide page. */
  onOpenGuide?: (productId: string) => void;
}

const MODEL_LABEL: Record<Product['model'], string> = {
  S: 'Managed',
  O: 'Open source',
  B: 'Both',
  C: 'Cloud',
};

function RecSection({
  recs,
  onSelect,
}: {
  recs: Recommendation[];
  onSelect: (id: string) => void;
}) {
  if (recs.length === 0) return null;
  return (
    <div className="recs">
      <h3>Recommended for you</h3>
      <div className="rec-list">
        {recs.map(({ product, reason }) => (
          <button
            key={product.id}
            type="button"
            className="rec"
            onClick={() => onSelect(product.id)}
            title={reason}
          >
            <span className="rec-name">{product.name}</span>
            <span className="rec-reason">{reason}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail({ productId, onSelect, onClose, onOpenGuide }: Props) {
  const product = getProduct(productId);
  const category = getCategory(product.categoryId);
  const brandIcon = getBrandIcon(product.id);
  const alternatives = product.alternatives.map((id) => getProduct(id));
  const links = getProductLinks(product.id);
  const recommendations = recommendFor(productId, 6);

  return (
    <aside className="detail" aria-label={`Details for ${product.name}`}>
      <div className="detail-head">
        {brandIcon && (
          <svg className="detail-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d={brandIcon} />
          </svg>
        )}
        <span className={`badge b-${product.model}`}>{MODEL_LABEL[product.model]}</span>
        <button type="button" className="close" onClick={onClose}>
          Close
        </button>
      </div>

      <h2>{product.name}</h2>
      <p className="category">{category.name}</p>
      {product.lastUpdated && (
        <p className="freshness">
          Data as of{' '}
          {new Date(product.lastUpdated).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
      <p className="what">{product.what}</p>

      {links && (
        <div className="links">
          <a className="link" href={links.docs} target="_blank" rel="noreferrer noopener">
            Documentation
          </a>
          <a className="link" href={links.site} target="_blank" rel="noreferrer noopener">
            Website
          </a>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="alts">
          <h3>Compare with</h3>
          <div className="alt-list">
            {alternatives.map((alt) => (
              <button key={alt.id} type="button" className="alt" onClick={() => onSelect(alt.id)}>
                {alt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <RecSection recs={recommendations} onSelect={onSelect} />

      {onOpenGuide && (
        <button
          type="button"
          className="guide-open"
          onClick={() => onOpenGuide(productId)}
          aria-label={`Open full guide for ${product.name}`}
        >
          Full guide →
        </button>
      )}

      {product.externalAlternatives.length > 0 && (
        <p className="external">
          Also compared against, not in this catalog: {product.externalAlternatives.join(', ')}
        </p>
      )}
    </aside>
  );
}
