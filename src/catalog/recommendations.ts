import { PRODUCTS, CATEGORIES, LAYER_EDGES, DOMAINS, type Product, type Category } from './index';

/**
 * Rule-based recommendations for a product.
 *
 * Strategy:
 * 1. Same-category alternatives (already on the product).
 * 2. Products in categories this product's category runs on (upstream deps).
 * 3. Products in categories that run on this product's category (downstream deps).
 * 4. Adjacent categories in the same domain.
 *
 * All results are de-duplicated and scored by relevance.
 */
export interface Recommendation {
  product: Product;
  reason: string;
  score: number; // higher = more relevant
}

function categoryOf(productId: string): Category | undefined {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return undefined;
  return CATEGORIES.find((c) => c.id === product.categoryId);
}

function productsInCategory(categoryId: string): Product[] {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [];
  return category.productIds.map((id) => PRODUCTS.find((p) => p.id === id)!).filter(Boolean);
}

function domainOf(categoryId: string): string | undefined {
  for (const domain of DOMAINS) {
    if (domain.categoryIds.includes(categoryId)) return domain.id;
  }
  return undefined;
}

/** Derive recommendations for a single product. */
export function recommendFor(productId: string, limit = 8): Recommendation[] {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return [];

  const category = categoryOf(productId);
  if (!category) return [];

  const seen = new Set<string>([productId, ...product.alternatives]);
  const results: Recommendation[] = [];

  // 1. Same-category alternatives (already on the product — highest signal).
  for (const altId of product.alternatives) {
    const alt = PRODUCTS.find((p) => p.id === altId);
    if (alt) results.push({ product: alt, reason: `Alternative in ${category.name}`, score: 10 });
  }

  // 2. Upstream: this category runs on other categories.
  for (const edge of LAYER_EDGES) {
    if (edge.from === category.id) {
      const upstream = productsInCategory(edge.to);
      for (const p of upstream) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        results.push({
          product: p,
          reason: `${category.name} runs on ${CATEGORIES.find((c) => c.id === edge.to)?.name ?? edge.to}`,
          score: 8,
        });
      }
    }
  }

  // 3. Downstream: other categories run on this category.
  for (const edge of LAYER_EDGES) {
    if (edge.to === category.id) {
      const downstream = productsInCategory(edge.from);
      for (const p of downstream) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        results.push({
          product: p,
          reason: `${CATEGORIES.find((c) => c.id === edge.from)?.name ?? edge.from} runs on ${category.name}`,
          score: 7,
        });
      }
    }
  }

  // 4. Adjacent categories in the same domain.
  const domainId = domainOf(category.id);
  if (domainId) {
    const domain = DOMAINS.find((d) => d.id === domainId);
    if (domain) {
      for (const catId of domain.categoryIds) {
        if (catId === category.id) continue;
        const siblings = productsInCategory(catId);
        for (const p of siblings) {
          if (seen.has(p.id)) continue;
          seen.add(p.id);
          results.push({
            product: p,
            reason: `Related in ${CATEGORIES.find((c) => c.id === catId)?.name ?? catId}`,
            score: 4,
          });
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
