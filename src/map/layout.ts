import { CATEGORIES, DOMAINS, PRODUCTS, getCategory } from '../catalog';

export interface NodeLayout {
  productId: string;
  categoryId: string;
  x: number;
  y: number;
  radius: number;
}

export interface ClusterLayout {
  categoryId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeCount: number;
}

export interface DomainLayout {
  domainId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clusters: ClusterLayout[];
}

export interface MapLayout {
  width: number;
  height: number;
  domains: DomainLayout[];
  nodes: NodeLayout[];
  nodeById: ReadonlyMap<string, NodeLayout>;
  clusterById: ReadonlyMap<string, ClusterLayout>;
  domainById: ReadonlyMap<string, DomainLayout>;
}

// Geometry constants. Nodes are laid out on a fixed grid, so positions are
// computed rather than authored: nobody hand-places 179 products.
// These are deliberately tight. A looser grid made the map 4204px wide, which
// fitted into a 1280px viewport at scale 0.28 — an orientation view too small
// to read the domain labels comfortably.
/**
 * Vertical band reserved at the top of each domain for its label.
 *
 * Labels are drawn at a screen-constant size, which means their world-space
 * height grows as you zoom out. Without a reserved band the label collides with
 * the cluster cards below it. The renderer clamps the label to this band, so the
 * band is the single source of truth for how much room a label needs.
 */
export const DOMAIN_LABEL_BAND = 46;

/** Same idea for the category label and icon at the top of each cluster. */
export const CLUSTER_LABEL_BAND = 32;

const PRODUCT_CELL_W = 112;
/**
 * Vertical distance between two adjacent nodes, in world units.
 *
 * This is deliberately larger than the horizontal cell. A node is 44 units
 * across and its label is drawn below it, so the vertical cell has to hold the
 * node, the label, and a gap before the next row's node.
 *
 * The label is drawn at a screen-constant size, so its world height grows as you
 * zoom out: at scale 0.5 it is 22 units tall. The cell therefore has to be large
 * enough for the node, the label, and clearance at the zoom where labels first
 * appear. 80 units gives 36 units of gap, which fits a 22-unit label with room
 * to spare. The original 56 put the label's baseline inside the next row's node,
 * so rows read as one crowded block and the text was unreadable.
 */
const PRODUCT_CELL_H = 80;
const CLUSTER_PADDING = 8 + CLUSTER_LABEL_BAND;
const CLUSTER_GAP = 30;
const DOMAIN_PADDING = 12 + DOMAIN_LABEL_BAND;
const DOMAIN_GAP = 40;

/**
 * Horizontal distance between two adjacent nodes, in world units.
 *
 * Exported so the renderer can decide whether a label fits between neighbours.
 * A label that is wider than this pitch would collide with the node beside it, so
 * it is only drawn once there is room.
 */
export const NODE_PITCH = PRODUCT_CELL_W;

/**
 * Vertical distance between two adjacent nodes, in world units.
 *
 * Exported so the renderer can check that a label fits between its node and the
 * row below before drawing it. Without that check a label drawn at low zoom
 * would paint across the next row's nodes.
 */
export const NODE_PITCH_H = PRODUCT_CELL_H;

/** Columns that fit `count` items into a roughly square block. */
function gridColumns(count: number): number {
  if (count <= 0) return 1;
  return Math.ceil(Math.sqrt(count));
}

function layoutCategory(categoryId: string, originX: number, originY: number) {
  const category = getCategory(categoryId);
  const count = category.productIds.length;
  const cols = gridColumns(count);
  const rows = Math.ceil(count / cols);

  const width = cols * PRODUCT_CELL_W;
  const height = rows * PRODUCT_CELL_H;

  const nodes: NodeLayout[] = category.productIds.map((productId, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      productId,
      categoryId,
      // Relative to the cluster's content box. The caller adds the cluster
      // offset, so these must NOT include originX/originY.
      x: col * PRODUCT_CELL_W + PRODUCT_CELL_W / 2,
      y: row * PRODUCT_CELL_H + PRODUCT_CELL_H / 2,
      radius: 22,
    };
  });

  return {
    cluster: {
      categoryId,
      x: originX - CLUSTER_PADDING,
      y: originY - CLUSTER_PADDING,
      width: width + CLUSTER_PADDING * 2,
      height: height + CLUSTER_PADDING * 2,
      nodeCount: count,
    } satisfies ClusterLayout,
    nodes,
  };
}

/** Lay out the whole map deterministically from the catalog hierarchy. */
export function computeLayout(): MapLayout {
  const domainColumns = 3;
  const domainRows = Math.ceil(DOMAINS.length / domainColumns);

  const domainLayouts: DomainLayout[] = [];
  const allNodes: NodeLayout[] = [];
  const clusterById = new Map<string, ClusterLayout>();

  for (let d = 0; d < DOMAINS.length; d++) {
    const domain = DOMAINS[d];

    // Categories inside a domain are arranged in a grid so a domain stays
    // roughly square. A single-column stack made the map 2736px tall, which
    // meant the whole map fit at a scale too small to read.
    const catCols = Math.max(1, Math.ceil(Math.sqrt(domain.categoryIds.length)));
    // The cursor starts at CLUSTER_PADDING because each cluster box extends that
    // far above and left of its content origin. Starting at 0 would put the
    // cluster box at DOMAIN_PADDING - CLUSTER_PADDING, which is inside the label
    // band and collides with the domain label.
    let cursorX = CLUSTER_PADDING;
    let cursorY = CLUSTER_PADDING;
    let rowHeight = 0;
    const clusters: ClusterLayout[] = [];

    for (let i = 0; i < domain.categoryIds.length; i++) {
      const categoryId = domain.categoryIds[i];
      const { cluster, nodes } = layoutCategory(categoryId, cursorX, cursorY);
      clusters.push(cluster);
      clusterById.set(categoryId, cluster);
      allNodes.push(...nodes);

      cursorX += cluster.width + CLUSTER_GAP;
      rowHeight = Math.max(rowHeight, cluster.height);

      if ((i + 1) % catCols === 0) {
        cursorX = 0;
        cursorY += rowHeight + CLUSTER_GAP;
        rowHeight = 0;
      }
    }

    const innerWidth = Math.max(...clusters.map((c) => c.x + c.width), 0);
    const innerHeight = Math.max(...clusters.map((c) => c.y + c.height), 0);

    domainLayouts.push({
      domainId: domain.id,
      x: 0, // resolved below, once widths are known
      y: 0,
      width: innerWidth + DOMAIN_PADDING * 2,
      height: innerHeight + DOMAIN_PADDING * 2,
      clusters,
    });
  }

  // Domain widths differ, so place them on a shared baseline and then spread
  // them horizontally using their real widths.
  const columnWidths: number[] = [];
  for (let col = 0; col < domainColumns; col++) {
    columnWidths.push(
      Math.max(
        ...domainLayouts
          .filter((_, i) => i % domainColumns === col)
          .map((d) => d.width),
        0,
      ),
    );
  }

  const columnX: number[] = [];
  let cursorX = 0;
  for (let col = 0; col < domainColumns; col++) {
    columnX.push(cursorX);
    cursorX += columnWidths[col] + DOMAIN_GAP;
  }

  const rowHeights: number[] = [];
  for (let row = 0; row < domainRows; row++) {
    rowHeights.push(
      Math.max(
        ...domainLayouts
          .filter((_, i) => Math.floor(i / domainColumns) === row)
          .map((d) => d.height),
        0,
      ),
    );
  }

  const rowY: number[] = [];
  let cursorY2 = 0;
  for (let row = 0; row < domainRows; row++) {
    rowY.push(cursorY2);
    cursorY2 += rowHeights[row] + DOMAIN_GAP;
  }

  for (let d = 0; d < domainLayouts.length; d++) {
    const layout = domainLayouts[d];
    const col = d % domainColumns;
    const row = Math.floor(d / domainColumns);

    layout.x = columnX[col];
    layout.y = rowY[row];

    const offsetX = layout.x + DOMAIN_PADDING;
    const offsetY = layout.y + DOMAIN_PADDING;

    for (const cluster of layout.clusters) {
      cluster.x += offsetX;
      cluster.y += offsetY;
    }
  }

  const nodeById = new Map<string, NodeLayout>();
  for (const node of allNodes) {
    const domainIndex = DOMAINS.findIndex((dm) =>
      dm.categoryIds.includes(node.categoryId),
    );
    const domainLayout = domainLayouts[domainIndex];
    const cluster = clusterById.get(node.categoryId)!;

    node.x += cluster.x + CLUSTER_PADDING;
    node.y += cluster.y + CLUSTER_PADDING;

    // Domain-level offset is already folded into the cluster, so nothing else
    // is needed here. Keep the lookup for readability.
    void domainLayout;

    nodeById.set(node.productId, node);
  }

  const width = Math.max(...domainLayouts.map((d) => d.x + d.width), 0);
  const height = Math.max(...domainLayouts.map((d) => d.y + d.height), 0);

  const domainById = new Map(domainLayouts.map((d) => [d.domainId, d]));

  return {
    width,
    height,
    domains: domainLayouts,
    nodes: allNodes,
    nodeById,
    clusterById,
    domainById,
  };
}

/** Products whose name or description matches a query, in catalog order. */
export function searchProducts(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.what.toLowerCase().includes(q) ||
      CATEGORIES.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q),
  ).map((p) => p.id);
}

export { CATEGORIES };
