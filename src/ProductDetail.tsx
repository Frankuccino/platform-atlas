import { getBrandIcon, getCategory, getProduct, getProductLinks } from './catalog';
import type { Product } from './catalog/types';

interface Props {
  productId: string;
  /** Navigate to another product, used by the alternative links. */
  onSelect: (productId: string) => void;
  onClose: () => void;
}

const MODEL_LABEL: Record<Product['model'], string> = {
  S: 'Managed',
  O: 'Open source',
  B: 'Both',
  C: 'Cloud',
};

/**
 * Detail panel for one product.
 *
 * Shows the catalog entry: what it is, when to reach for it, and what to
 * compare it against. Alternatives are links that move the camera, so comparing
 * two vendors is one click rather than two searches.
 *
 * Study state (status, confidence, notes) is not here yet. It belongs in this
 * panel once the study loop exists, because the panel is where you look at a
 * product and where you would record what you know about it.
 */
export default function ProductDetail({ productId, onSelect, onClose }: Props) {
  const product = getProduct(productId);
  const category = getCategory(product.categoryId);
  const brandIcon = getBrandIcon(product.id);
  const alternatives = product.alternatives.map((id) => getProduct(id));
  const links = getProductLinks(product.id);

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

      {product.externalAlternatives.length > 0 && (
        <p className="external">
          Also compared against, not in this catalog: {product.externalAlternatives.join(', ')}
        </p>
      )}
    </aside>
  );
}
