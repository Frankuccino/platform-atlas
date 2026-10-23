import { CATEGORIES } from './categories';
import { DOMAINS } from './domains';
import { LAYER_EDGES } from './edges';
import { PRODUCTS } from './products';
import type { Category, Domain, Product } from './types';

export * from './types';
export { CATEGORIES, DOMAINS, LAYER_EDGES, PRODUCTS };
export { CATEGORY_ICONS, MODEL_COLORS, MODEL_LABELS } from './icons';
export { BRAND_ICONS, getBrandIcon } from './brand-icons';

export const productById: ReadonlyMap<string, Product> = new Map(PRODUCTS.map((p) => [p.id, p]));
export const categoryById: ReadonlyMap<string, Category> = new Map(
  CATEGORIES.map((c) => [c.id, c]),
);
export const domainById: ReadonlyMap<string, Domain> = new Map(DOMAINS.map((d) => [d.id, d]));

export function getProduct(id: string): Product {
  const product = productById.get(id);
  if (!product) throw new Error(`Unknown product id: ${id}`);
  return product;
}

export function getCategory(id: string): Category {
  const category = categoryById.get(id);
  if (!category) throw new Error(`Unknown category id: ${id}`);
  return category;
}

export function getDomain(id: string): Domain {
  const domain = domainById.get(id);
  if (!domain) throw new Error(`Unknown domain id: ${id}`);
  return domain;
}

/** The domain a category belongs to. */
export function domainOfCategory(categoryId: string): Domain | undefined {
  return DOMAINS.find((d) => d.categoryIds.includes(categoryId));
}

/** All products in a domain, in category then catalog order. */
export function productsInDomain(domainId: string): Product[] {
  const domain = getDomain(domainId);
  return domain.categoryIds.flatMap((categoryId) =>
    getCategory(categoryId).productIds.map((id) => getProduct(id)),
  );
}

/** Alternative edges, derived from each product's resolved alternatives. */
export const ALTERNATIVE_EDGES: { from: string; to: string; kind: 'alternative' }[] = PRODUCTS.flatMap(
  (p) => p.alternatives.map((to) => ({ from: p.id, to, kind: 'alternative' as const })),
);

/**
 * Fails on any dangling reference. Run in tests and at build time: an edge to a
 * product that no longer exists is a silent lie in the map.
 */
export function validateCatalog(): string[] {
  const errors: string[] = [];

  for (const product of PRODUCTS) {
    if (!categoryById.has(product.categoryId)) {
      errors.push(`product ${product.id} references unknown category ${product.categoryId}`);
    }
    for (const alt of product.alternatives) {
      if (!productById.has(alt)) errors.push(`product ${product.id} references unknown product ${alt}`);
    }
  }

  for (const category of CATEGORIES) {
    if (!domainOfCategory(category.id)) {
      errors.push(`category ${category.id} is not in any domain`);
    }
    for (const productId of category.productIds) {
      if (!productById.has(productId)) {
        errors.push(`category ${category.id} references unknown product ${productId}`);
      }
    }
  }

  for (const domain of DOMAINS) {
    for (const categoryId of domain.categoryIds) {
      if (!categoryById.has(categoryId)) {
        errors.push(`domain ${domain.id} references unknown category ${categoryId}`);
      }
    }
  }

  for (const edge of LAYER_EDGES) {
    if (!categoryById.has(edge.from)) errors.push(`layer edge from unknown category ${edge.from}`);
    if (!categoryById.has(edge.to)) errors.push(`layer edge to unknown category ${edge.to}`);
  }

  return errors;
}
