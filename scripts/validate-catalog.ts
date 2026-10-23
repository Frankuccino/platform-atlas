/**
 * Validates the catalog and the computed layout.
 *
 * Run with: npx tsx scripts/validate-catalog.ts
 *
 * This is the check that protects the 179 hand-written entries from a refactor:
 * it fails on any dangling reference, any product outside the map bounds, and
 * any two products occupying the same cell.
 */
import {
  ALTERNATIVE_EDGES,
  CATEGORIES,
  DOMAINS,
  LAYER_EDGES,
  PRODUCTS,
  validateCatalog,
} from '../src/catalog';
import { computeLayout } from '../src/map/layout';

const errors: string[] = [];

const catalogErrors = validateCatalog();
errors.push(...catalogErrors);

const layout = computeLayout();

// Every product must have exactly one node.
if (layout.nodes.length !== PRODUCTS.length) {
  errors.push(`layout has ${layout.nodes.length} nodes but catalog has ${PRODUCTS.length} products`);
}
for (const product of PRODUCTS) {
  if (!layout.nodeById.has(product.id)) errors.push(`no layout node for product ${product.id}`);
}

// Every category must have a cluster inside its own domain.
for (const category of CATEGORIES) {
  const cluster = layout.clusterById.get(category.id);
  if (!cluster) {
    errors.push(`no cluster for category ${category.id}`);
    continue;
  }
  const domain = DOMAINS.find((d) => d.categoryIds.includes(category.id));
  if (!domain) {
    errors.push(`category ${category.id} is in no domain`);
    continue;
  }
  const domainLayout = layout.domainById.get(domain.id)!;
  const inside =
    cluster.x >= domainLayout.x &&
    cluster.y >= domainLayout.y &&
    cluster.x + cluster.width <= domainLayout.x + domainLayout.width &&
    cluster.y + cluster.height <= domainLayout.y + domainLayout.height;
  if (!inside) errors.push(`cluster ${category.id} is not inside domain ${domain.id}`);
}

// No two nodes may share a cell.
const seen = new Set<string>();
for (const node of layout.nodes) {
  const key = `${Math.round(node.x)},${Math.round(node.y)}`;
  if (seen.has(key)) errors.push(`two nodes share a cell at ${key}`);
  seen.add(key);
}

// Every node must be inside the map bounds.
for (const node of layout.nodes) {
  if (node.x < 0 || node.y < 0 || node.x > layout.width || node.y > layout.height) {
    errors.push(`node ${node.productId} is outside map bounds`);
  }
}

// Every edge endpoint must resolve.
for (const edge of ALTERNATIVE_EDGES) {
  if (!layout.nodeById.has(edge.from)) errors.push(`alternative edge from unknown ${edge.from}`);
  if (!layout.nodeById.has(edge.to)) errors.push(`alternative edge to unknown ${edge.to}`);
}
for (const edge of LAYER_EDGES) {
  if (!layout.clusterById.has(edge.from)) errors.push(`layer edge from unknown ${edge.from}`);
  if (!layout.clusterById.has(edge.to)) errors.push(`layer edge to unknown ${edge.to}`);
}

console.log(`categories:      ${CATEGORIES.length}`);
console.log(`domains:         ${DOMAINS.length}`);
console.log(`products:        ${PRODUCTS.length}`);
console.log(`layout nodes:    ${layout.nodes.length}`);
console.log(`map size:        ${layout.width} x ${layout.height}`);
console.log(`alternative edges: ${ALTERNATIVE_EDGES.length}`);
console.log(`layer edges:     ${LAYER_EDGES.length}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('\ncatalog and layout are consistent.');
