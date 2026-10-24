import {
  BRAND_ICONS,
  CATEGORY_ICONS,
  LAYER_EDGES,
  MODEL_COLORS,
  getCategory,
  getDomain,
  getProduct,
} from '../catalog';
import type { MapLayout } from './layout';
import { CLUSTER_LABEL_BAND, DOMAIN_LABEL_BAND, NODE_PITCH, NODE_PITCH_H } from './layout';

/** Categories that the given category's products run on top of. */
function layerEdgeTargets(categoryId: string): string[] {
  return LAYER_EDGES.filter((e) => e.from === categoryId).map((e) => e.to);
}

/** The first letter of a product name, for nodes without a brand mark. */
function initialOf(name: string): string {
  const match = name.match(/[A-Za-z0-9]/);
  return (match ? match[0] : '?').toUpperCase();
}

/**
 * Draw a category icon centred on a world-space point.
 *
 * The path is scaled to fit `box` world units. Icons are drawn at a fixed
 * screen size, so they stay legible at every zoom.
 */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  svgPath: string,
  cx: number,
  cy: number,
  box: number,
) {
  const scale = box / 24;
  ctx.save();
  ctx.translate(cx - box / 2, cy - box / 2);
  ctx.scale(scale, scale);
  ctx.fill(new Path2D(svgPath));
  ctx.restore();
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface RenderOptions {
  camera: Camera;
  width: number;
  height: number;
  /** 0 = fully zoomed out, 1 = fully zoomed in. Drives edge and label density. */
  zoomT: number;
  highlightedProductId: string | null;
  /**
   * Transient "you are here" marker for a node the user just jumped to.
   *
   * `phase` runs 0..1 and is advanced by the caller on each animation frame, so
   * the ring expands and fades in a loop rather than being a static outline.
   */
  pulse?: { productId: string; phase: number } | null;
}

/**
 * Minimum world-space gap between a label and the next row's node.
 *
 * Without it a label is drawn flush against the row below, which reads as the
 * label belonging to that row instead of its own.
 */
const LABEL_CLEARANCE = 10;

const COLORS = {
  bg: '#edf0f3',
  domainFill: '#ffffff',
  domainStroke: '#d3dae1',
  clusterFill: '#f7f9fb',
  clusterStroke: '#d3dae1',
  domainLabel: '#556473',
  clusterLabel: '#556473',
  nodeFill: '#ffffff',
  nodeStroke: '#c3ccd5',
  nodeLabel: '#111b25',
  nodeLabelMuted: '#556473',
  edgeAlternative: '#9fb3c4',
  edgeLayer: '#0a6a86',
  highlight: '#0a6a86',
};

function applyCamera(ctx: CanvasRenderingContext2D, camera: Camera, width: number, height: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.x, camera.y);
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  layout: MapLayout,
  options: RenderOptions,
): void {
  const { camera, zoomT, highlightedProductId } = options;
  const pulse = options.pulse ?? null;

  applyCamera(ctx, camera, options.width, options.height);

  // Font sizes are expressed in screen pixels and divided by the camera scale,
  // so a label is the same readable size at every zoom level. World-space fonts
  // would shrink to nothing when the whole map is fitted into the viewport.
  const invScale = 1 / camera.scale;

  ctx.lineWidth = 1;

  // Domains first: they are the outermost grouping. The box is drawn here but
  // the label is deferred to after the clusters, because the clusters are drawn
  // later and would otherwise paint over it.
  for (const domain of layout.domains) {
    ctx.fillStyle = COLORS.domainFill;
    ctx.strokeStyle = COLORS.domainStroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, domain.x, domain.y, domain.width, domain.height, 14);
    ctx.fill();
    ctx.stroke();
  }

  // Clusters: the category boxes inside each domain.
  for (const domain of layout.domains) {
    for (const cluster of domain.clusters) {
      ctx.fillStyle = COLORS.clusterFill;
      ctx.strokeStyle = COLORS.clusterStroke;
      ctx.lineWidth = 1;
      roundRect(ctx, cluster.x, cluster.y, cluster.width, cluster.height, 10);
      ctx.fill();
      ctx.stroke();

      if (zoomT > 0.03) {
        const category = getCategory(cluster.categoryId);
        // Clamped to the reserved band, so the label cannot run down into the
        // nodes below it.
        const labelHeight = Math.min(11 * invScale, CLUSTER_LABEL_BAND);
        ctx.fillStyle = COLORS.clusterLabel;
        ctx.font = `500 ${labelHeight}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(category.name.toUpperCase(), cluster.x + 10 + 16 * invScale, cluster.y + 8);

        const iconPath = CATEGORY_ICONS[cluster.categoryId];
        if (iconPath) {
          ctx.fillStyle = COLORS.clusterLabel;
          drawIcon(ctx, iconPath, cluster.x + 10 + 8 * invScale, cluster.y + 8 + labelHeight / 2, labelHeight);
        }
      }
    }
  }

  // Domain labels, drawn last so they sit on top of the cluster cards. Each
  // label lives in the band reserved above its domain's clusters, so it does not
  // visually collide with them; drawing it last means it can never be hidden.
  if (zoomT > 0.015) {
    for (const domain of layout.domains) {
      const labelHeight = Math.min(13 * invScale, DOMAIN_LABEL_BAND);
      ctx.fillStyle = COLORS.domainLabel;
      ctx.font = `600 ${labelHeight}px "IBM Plex Sans Condensed", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(getDomain(domain.domainId).name.toUpperCase(), domain.x + 14, domain.y + 12);
    }
  }

  // Layer edges: category-to-category, only when zoomed out enough to read them.
  // They are the map's structural story, so they fade in as you zoom out rather
  // than appearing at a hard threshold.
  if (zoomT < 0.6) {
    const alpha = Math.min(1, (0.6 - zoomT) / 0.35);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLORS.edgeLayer;
    // Screen-constant width, so the layer lines stay visible when the whole
    // map is fitted into the viewport. lineWidth is in world units and is
    // scaled by the camera transform, so the clamp must happen in screen space
    // before dividing by the scale.
    const edgeScreenWidth = Math.min(2.5, Math.max(1, 1.8));
    ctx.lineWidth = edgeScreenWidth * invScale;
    ctx.lineCap = 'round';

    for (const domain of layout.domains) {
      for (const cluster of domain.clusters) {
        for (const targetId of layerEdgeTargets(cluster.categoryId)) {
          const target = layout.clusterById.get(targetId);
          if (!target) continue;
          const fromX = cluster.x + cluster.width / 2;
          const fromY = cluster.y + cluster.height / 2;
          const toX = target.x + target.width / 2;
          const toY = target.y + target.height / 2;

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          const midX = (fromX + toX) / 2;
          ctx.quadraticCurveTo(midX, fromY, toX, toY);
          ctx.stroke();

          // Arrowhead, so direction is unambiguous.
          const angle = Math.atan2(toY - fromY, toX - midX);
          const head = 7;
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(toX - head * Math.cos(angle - 0.4), toY - head * Math.sin(angle - 0.4));
          ctx.lineTo(toX - head * Math.cos(angle + 0.4), toY - head * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fillStyle = COLORS.edgeLayer;
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Product nodes. Fill encodes the delivery model, so the four kinds of vendor
  // are distinguishable at a glance without reading anything.
  const nameFont = `500 ${11 * invScale}px "IBM Plex Sans", sans-serif`;

  for (const node of layout.nodes) {
    const isHighlighted = node.productId === highlightedProductId;
    const model = MODEL_COLORS[getProduct(node.productId).model] ?? COLORS;

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? COLORS.highlight : model.fill;
    ctx.fill();
    ctx.strokeStyle = isHighlighted ? COLORS.highlight : model.stroke;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();

    // Transient "you are here" marker. The user asked for this when jumping to a
    // product from a panel: the camera keeps its zoom and only pans, so without
    // something moving the target is easy to lose among a hundred identical dots.
    //
    // A ring that expands and fades in a loop reads as "this one" at any zoom,
    // including fit-to-view where a node is only a few pixels across.
    if (pulse && pulse.productId === node.productId) {
      const spread = 4 + pulse.phase * 12;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + spread, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.highlight;
      ctx.globalAlpha = (1 - pulse.phase) * 0.85;
      ctx.lineWidth = 2 * invScale;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Brand mark inside the node, only once the node is large enough on screen
    // for the shape to be legible. At fit-to-view a node is about 11px across,
    // which is too small for any logo to read.
    //
    // Products without a brand mark get their initial instead. The initial is
    // not a logo, but it gives every node an identity, so the map never shows a
    // bare dot that could be mistaken for a failed load.
    const brandPath = BRAND_ICONS[node.productId];
    if (brandPath && node.radius * camera.scale > 13) {
      ctx.fillStyle = isHighlighted ? '#ffffff' : model.stroke;
      drawIcon(ctx, brandPath, node.x, node.y, node.radius * 1.15);
    } else if (node.radius * camera.scale > 13) {
      ctx.fillStyle = isHighlighted ? '#ffffff' : model.stroke;
      ctx.font = `600 ${node.radius * 1.1}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initialOf(getProduct(node.productId).name), node.x, node.y);
    }

    // A name is drawn only when it fits between its neighbours. This is a
    // data-driven density rule rather than a fixed zoom threshold: short names
    // such as "Vercel" appear while still zoomed out, long ones such as
    // "Google Cloud" only once there is room, and the set grows smoothly as you
    // zoom in instead of switching on at one scale.
    //
    // The horizontal check is against the pitch, and the vertical check is
    // against the row below: the label sits under its node, so it must clear the
    // next row's node as well as the node beside it. Both must hold, or the label
    // would paint across a neighbouring node.
    ctx.font = nameFont;
    const name = getProduct(node.productId).name;
    const labelHeight = 11 * invScale;
    // The label sits below its node, so it must clear the next row's node as
    // well as the node beside it. The margin keeps a visible gap rather than
    // letting the text sit flush against the row below.
    const labelFitsRow = node.radius + 4 + labelHeight + LABEL_CLEARANCE <= NODE_PITCH_H - node.radius;
    if (NODE_PITCH > ctx.measureText(name).width + 8 * invScale && labelFitsRow) {
      // The label sits below the node, on the light cluster fill, so it must be
      // a dark colour. White would be invisible. The highlighted label uses the
      // same accent as the node's fill and ring, so the two read as one unit.
      ctx.fillStyle = isHighlighted ? COLORS.highlight : COLORS.nodeLabel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(name, node.x, node.y + node.radius + 4);
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** Convert a screen point to world coordinates. */
export function screenToWorld(camera: Camera, sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx - camera.x) / camera.scale,
    y: (sy - camera.y) / camera.scale,
  };
}
