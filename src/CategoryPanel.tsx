import { CATEGORY_ICONS, DOMAINS, getBrandIcon, getCategory, getProduct } from './catalog';
import { MODEL_LABELS } from './catalog/icons';
import type { Product } from './catalog/types';

interface Props {
  categoryId: string;
  /** Move the camera to a product and open its detail panel. */
  onSelect: (productId: string) => void;
  /** Move the camera to the containing domain. */
  onJump: (domainId: string) => void;
  onClose: () => void;
}

/**
 * Side panel listing everything in one category.
 *
 * Clicking a category block on the map is the coarse gesture; this panel is the
 * fine one. It turns "I can see there is a payments cluster over there" into
 * "here are the 12 payments vendors, pick one", without requiring the user to
 * zoom in and read tiny labels.
 *
 * The list is the catalog order, which is deliberate: it is stable, so a row
 * does not jump around between renders, and it matches the order the products
 * appear in the cluster.
 */
export default function CategoryPanel({ categoryId, onSelect, onJump, onClose }: Props) {
  const category = getCategory(categoryId);
  const domain = DOMAINS.find((d) => d.categoryIds.includes(categoryId));

  return (
    <aside className="panel" aria-label={`Products in ${category.name}`}>
      <div className="panel-head">
        <span className="panel-icon" aria-hidden="true">
          {CATEGORY_ICONS[categoryId] && <path d={CATEGORY_ICONS[categoryId]} />}
        </span>
        <h2>{category.name}</h2>
        <button type="button" className="close" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="blurb">{category.blurb}</p>

      {domain && (
        <button type="button" className="jump" onClick={() => onJump(domain.id)}>
          {domain.name}
        </button>
      )}

      <ul className="rows">
        {category.productIds.map((productId) => (
          <ProductRow key={productId} product={getProduct(productId)} onSelect={onSelect} />
        ))}
      </ul>
    </aside>
  );
}

function ProductRow({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (productId: string) => void;
}) {
  const brandIcon = getBrandIcon(product.id);
  const initial = (product.name.match(/[A-Za-z0-9]/)?.[0] ?? '?').toUpperCase();

  return (
    <li>
      <button type="button" className="row" onClick={() => onSelect(product.id)}>
        {brandIcon ? (
          <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d={brandIcon} />
          </svg>
        ) : (
          <span className="swatch" aria-hidden="true">
            {initial}
          </span>
        )}
        <span className="row-name">{product.name}</span>
        <span className="row-model">{MODEL_LABELS[product.model]}</span>
      </button>
    </li>
  );
}
