import { CATEGORY_ICONS, DOMAINS, getCategory } from './catalog';

interface Props {
  domainId: string;
  /** Open one of this domain's categories. */
  onSelect: (categoryId: string) => void;
  /** Move the camera to this domain. */
  onJump: (domainId: string) => void;
  onClose: () => void;
}

/**
 * Side panel listing every category in one domain.
 *
 * This is the domain-level counterpart to CategoryPanel. The canvas shows three
 * levels of grouping - domains, categories, products - and the panels mirror
 * that: a domain panel lists its categories, a category panel lists its
 * products. Without this, the only way into a domain was the jump buttons, which
 * move the camera but never show what is inside.
 *
 * Categories are listed in catalog order, matching the order they appear in the
 * domain on the map, so a row never moves between renders.
 */
export default function DomainPanel({ domainId, onSelect, onJump, onClose }: Props) {
  const domain = DOMAINS.find((d) => d.id === domainId);
  if (!domain) return null;

  const total = domain.categoryIds.reduce(
    (sum, id) => sum + getCategory(id).productIds.length,
    0,
  );

  return (
    <aside className="panel" aria-label={`Categories in ${domain.name}`}>
      <div className="panel-head">
        <span className="panel-icon" aria-hidden="true" />
        <h2>{domain.name}</h2>
        <button type="button" className="close" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="blurb">
        {domain.categoryIds.length} categories, {total} products
      </p>

      <button type="button" className="jump" onClick={() => onJump(domain.id)}>
        Jump to this domain
      </button>

      <ul className="rows">
        {domain.categoryIds.map((categoryId) => {
          const category = getCategory(categoryId);
          return (
            <li key={categoryId}>
              <button type="button" className="row" onClick={() => onSelect(categoryId)}>
                {CATEGORY_ICONS[categoryId] && (
                  <svg className="row-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={CATEGORY_ICONS[categoryId]} />
                  </svg>
                )}
                <span className="row-name">{category.name}</span>
                <span className="row-model">{category.productIds.length}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
