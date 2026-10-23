import { DOMAINS, getCategory } from './catalog';
import { CATEGORY_ICONS } from './catalog/icons';

interface Props {
  /** Move the camera to a domain. */
  onJumpDomain: (domainId: string) => void;
  /** Open a category's product list. */
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Left navigation listing every domain and the categories inside it.
 *
 * This is the coarse-to-fine counterpart to the canvas: the canvas shows how the
 * market is shaped, this list shows what is in it and lets you jump straight to
 * any category without hunting for its card. Categories are grouped under their
 * domain so the hierarchy matches the map.
 *
 * Domains and categories are listed in catalog order, which is stable, so a row
 * never moves between renders.
 */
export default function DomainNav({ onJumpDomain, onSelectCategory }: Props) {
  return (
    <nav className="sidebar" aria-label="Browse the map">
      <h2 className="sidebar-title">Browse</h2>

      {DOMAINS.map((domain) => (
        <section key={domain.id} className="nav-domain">
          <button
            type="button"
            className="nav-domain-head"
            onClick={() => onJumpDomain(domain.id)}
          >
            <span className="nav-domain-name">{domain.name}</span>
            <span className="nav-count">{domain.categoryIds.length}</span>
          </button>

          <ul className="nav-cats">
            {domain.categoryIds.map((categoryId) => {
              const category = getCategory(categoryId);
              return (
                <li key={categoryId}>
                  <button
                    type="button"
                    className="nav-cat"
                    onClick={() => onSelectCategory(categoryId)}
                  >
                    {CATEGORY_ICONS[categoryId] && (
                      <svg className="nav-cat-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={CATEGORY_ICONS[categoryId]} />
                      </svg>
                    )}
                    <span className="nav-cat-name">{category.name}</span>
                    <span className="nav-count">{category.productIds.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
