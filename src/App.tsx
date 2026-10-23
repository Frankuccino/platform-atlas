import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { pointer, select, type Selection } from 'd3-selection';
import { DOMAINS } from './catalog';
import { computeLayout, searchProducts } from './map/layout';
import { renderMap, screenToWorld, type Camera } from './map/render';
import ProductDetail from './ProductDetail';
import CategoryPanel from './CategoryPanel';
import DomainNav from './DomainNav';
import type { MapLayout } from './map/layout';

const MIN_SCALE = 0.12;
const MAX_SCALE = 4;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const selectionRef = useRef<Selection<HTMLCanvasElement, unknown, null, undefined> | null>(null);

  const layout: MapLayout = useMemo(() => computeLayout(), []);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  const matches = useMemo(() => searchProducts(query), [query]);

  // Measure the container. This is a layout effect so the size is correct before
  // the fit below reads it.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () =>
      setSize({ width: container.clientWidth, height: container.clientHeight });

    measure();

    const observer = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    observer?.observe(container);

    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Draw whenever anything that affects the picture changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const scaleForZoomT = Math.min(Math.max(camera.scale, MIN_SCALE), MAX_SCALE);
    const zoomT = (scaleForZoomT - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderMap(ctx, layout, {
      camera,
      width: size.width,
      height: size.height,
      zoomT,
      highlightedProductId: highlighted,
    });
  }, [camera, layout, size, highlighted]);

  // Fit the whole map once, reading the container's real size straight from the
  // DOM. React's size state is not used here because it is still the 800x600
  // default when this effect runs, and a fit computed from that is too small and
  // then never re-applied. The container is already laid out at this point.
  const hasFittedRef = useRef(false);

  // Wire up d3-zoom.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return;

    const behavior = d3zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        setCamera({ x, y, scale: k });
      });

    zoomBehaviorRef.current = behavior;
    const selection = select(canvas);
    selectionRef.current = selection;
    selection.call(behavior);
    selection.on('dblclick.zoom', null);

    // Apply the initial fit through the behaviour, so d3's own transform agrees
    // with the camera state from the first frame. Setting state alone would leave
    // d3 at its 1:1 default, and the first wheel zoom would jump there.
    if (!hasFittedRef.current && container) {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 10 && height > 10) {
        hasFittedRef.current = true;
        const margin = 40;
        const scale = Math.min(
          (width - margin * 2) / layout.width,
          (height - margin * 2) / layout.height,
          1,
        );
        selection.call(
          behavior.transform,
          zoomIdentity
            .translate((width - layout.width * scale) / 2, (height - layout.height * scale) / 2)
            .scale(scale),
        );
      }
    }

    return () => {
      selection.on('.zoom', null);
    };
  }, [layout]);

  // Click to select. Nodes win over the cluster they sit in, because a node is
  // the more specific target. Clicking a category block that contains no node
  // opens that category's product list. Clicking empty space clears both.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selection = select(canvas);
    selection.on('click', (event) => {
      const [sx, sy] = pointer(event, canvas);
      const world = screenToWorld(camera, sx, sy);

      let best: { id: string; distance: number } | null = null;
      for (const node of layout.nodes) {
        const distance = Math.hypot(node.x - world.x, node.y - world.y);
        // Hit radius grows as you zoom out, so nodes stay clickable when the
        // whole map is fitted.
        const hitRadius = Math.max(node.radius, 6 / camera.scale);
        if (distance <= hitRadius && (!best || distance < best.distance)) {
          best = { id: node.productId, distance };
        }
      }

      if (best) {
        setHighlighted(best.id);
        setSelectedCategory(null);
        return;
      }

      setSelectedCategory(clusterAt(world.x, world.y));
      setHighlighted(null);
    });

    return () => {
      selection.on('click', null);
    };
  }, [layout, camera]);

  /**
   * Centre the camera on a world point at a given scale.
   *
   * This goes through the d3-zoom behaviour rather than setting React state
   * directly. d3-zoom keeps its own transform on the canvas node, and the next
   * wheel event computes its new transform from that. Setting state alone left
   * the behaviour's transform stale, so the first zoom after a jump snapped back
   * to wherever the camera had been before. Driving the behaviour updates both,
   * and it emits the zoom event that updates the state.
   */
  function focusOn(worldX: number, worldY: number, scale: number) {
    const clamped = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
    const selection = selectionRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!selection || !behavior) return;

    const transform = zoomIdentity
      .translate(size.width / 2 - worldX * clamped, size.height / 2 - worldY * clamped)
      .scale(clamped);

    selection.call(behavior.transform, transform);
  }

  function focusProduct(productId: string) {
    const node = layout.nodeById.get(productId);
    if (!node) return;
    setHighlighted(productId);
    // The category panel and the detail panel occupy the same corner, so opening
    // one must close the other or they overlap.
    setSelectedCategory(null);
    focusOn(node.x, node.y, 1.6);
  }

  function jumpToDomain(domainId: string) {
    setSelectedCategory(null);
    setHighlighted(null);
    const domain = layout.domainById.get(domainId);
    if (!domain) return;
    focusOn(
      domain.x + domain.width / 2,
      domain.y + domain.height / 2,
      Math.max(size.width / (domain.width + 80), MIN_SCALE),
    );
  }

  /** The category block containing a world point, or null if it is empty space. */
  function clusterAt(x: number, y: number): string | null {
    for (const domain of layout.domains) {
      for (const cluster of domain.clusters) {
        if (
          x >= cluster.x &&
          x <= cluster.x + cluster.width &&
          y >= cluster.y &&
          y <= cluster.y + cluster.height
        ) {
          return cluster.categoryId;
        }
      }
    }
    return null;
  }

  function resetView() {
    const margin = 40;
    const scaleX = (size.width - margin * 2) / layout.width;
    const scaleY = (size.height - margin * 2) / layout.height;
    const scale = Math.min(scaleX, scaleY, 1);
    focusOn(layout.width / 2, layout.height / 2, scale);
    setHighlighted(null);
  }

  /** Open a category's product list without moving the camera. */
  function selectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setHighlighted(null);
  }

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <h1>Platform Atlas</h1>
          <span className="count">
            {layout.nodes.length} products in {DOMAINS.length} domains
          </span>
        </div>

        <div className="tools">
          <input
            className="search"
            type="search"
            placeholder="Search a product, category, or what it does"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search the map"
          />

          {matches.length > 0 && (
            <ul className="results" role="listbox">
              {matches.slice(0, 8).map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => focusProduct(id)} role="option">
                    {id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="jumps" aria-label="Jump to a domain">
          {DOMAINS.map((domain) => (
            <button key={domain.id} type="button" onClick={() => jumpToDomain(domain.id)}>
              {domain.name}
            </button>
          ))}
          <button type="button" className="reset" onClick={resetView}>
            Reset
          </button>
        </nav>
      </header>

      <div className="body">
        <DomainNav onJumpDomain={jumpToDomain} onSelectCategory={selectCategory} />

        <div className="canvas-wrap" ref={containerRef}>
          <canvas ref={canvasRef} />

          {selectedCategory && (
            <CategoryPanel
              categoryId={selectedCategory}
              onSelect={focusProduct}
              onJump={jumpToDomain}
              onClose={() => setSelectedCategory(null)}
            />
          )}

          {highlighted && (
            <ProductDetail
              productId={highlighted}
              onSelect={focusProduct}
              onClose={() => setHighlighted(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
