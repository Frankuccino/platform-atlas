import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, Fragment } from 'react';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
// Side effect: adds .transition() to selections, which d3-zoom's transform
// transition path needs. d3-zoom already depends on this package.
import 'd3-transition';
import { pointer, select, type Selection } from 'd3-selection';
import { DOMAINS } from './catalog';
import { computeLayout, searchProducts } from './map/layout';
import { renderMap, screenToWorld, type Camera } from './map/render';
import ProductDetail from './ProductDetail';
import CategoryPanel from './CategoryPanel';
import DomainPanel from './DomainPanel';
import DomainNav from './DomainNav';
import RoadmapPage from './RoadmapPage';
import ProductGuidePage from './ProductGuidePage';
import Onboarding, { useOnboarding } from './Onboarding';
import type { DomainLayout, MapLayout } from './map/layout';

const MIN_SCALE = 0.12;
const MAX_SCALE = 4;

/** Space left between a domain's edge and the canvas edge when it is framed. */
const DOMAIN_FIT_PADDING = 40;
/** How long a jump takes to travel and settle, in milliseconds. */
const JUMP_DURATION = 750;

/** How long the "you are here" ring keeps pulsing after a jump. */
const PULSE_DURATION = 2600;
/** Length of one expand-and-fade cycle, so the ring repeats rather than playing once. */
const PULSE_CYCLE = 850;

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
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [pulseStart, setPulseStart] = useState<{ productId: string; startedAt: number } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [view, setView] = useState<'map' | 'roadmap' | 'guide'>('map');
  const [guideProductId, setGuideProductId] = useState<string | null>(null);
  const { visible: onboardingVisible, dismiss: dismissOnboarding } = useOnboarding();
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Theme: persisted in localStorage, applied as data-theme on #root.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('platform-atlas-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('platform-atlas-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/Frankuccino/platform-atlas')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') setStarCount(data.stargazers_count);
      })
      .catch(() => {});
  }, []);

  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');

  const submitSuggestion = () => {
    const text = suggestionText.trim();
    if (!text) return;
    const url = new URL('https://github.com/Frankuccino/platform-atlas/issues/new');
    url.searchParams.set('title', 'Product suggestion or correction');
    url.searchParams.set('body', text);
    window.open(url.toString(), '_blank');
    setSuggestionText('');
    setSuggestionOpen(false);
  };

  const matches = useMemo(() => searchProducts(query), [query]);

  // Measure the container. This is a layout effect so the size is correct before
  // the fit below reads it. Re-runs when the view toggles back to the map so a
  // freshly mounted canvas gets measured even though the container size itself
  // has not changed.
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
  }, [view]);

  // The animation loop needs the current camera and layout without restarting,
  // so the latest values are kept in a ref rather than in the effect's deps.
  const liveRef = useRef({ camera, layout, size, highlighted, pulseStart });
  liveRef.current = { camera, layout, size, highlighted, pulseStart };

  // Dev-only handle for the verification script, so it can locate a node on the
  // canvas without guessing pixel coordinates. Stripped from production builds.
  if (import.meta.env.DEV) {
    (window as unknown as { __atlasLayout?: unknown }).__atlasLayout = layout;
  }

  /**
   * Paint one frame.
   *
   * Extracted from the effect so the pulse loop can call it on every animation
   * frame without re-rendering React. The pulse is derived from its start time
   * rather than stored as a phase, so a frame can never show a stale ring.
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const live = liveRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(live.size.width * dpr);
    canvas.height = Math.round(live.size.height * dpr);
    canvas.style.width = `${live.size.width}px`;
    canvas.style.height = `${live.size.height}px`;

    const scaleForZoomT = Math.min(Math.max(live.camera.scale, MIN_SCALE), MAX_SCALE);
    const zoomT = (scaleForZoomT - MIN_SCALE) / (MAX_SCALE - MIN_SCALE);
    let pulse: { productId: string; phase: number } | null = null;
    if (live.pulseStart) {
      const elapsed = performance.now() - live.pulseStart.startedAt;
      if (elapsed < PULSE_DURATION) {
        pulse = {
          productId: live.pulseStart.productId,
          phase: (elapsed % PULSE_CYCLE) / PULSE_CYCLE,
        };
      }
    }

    // renderMap owns the transform: it clears in device pixels and then applies
    // the camera scaled by the device ratio. Setting a transform here would be
    // overwritten by the first thing it does.
    renderMap(ctx, live.layout, {
      camera: live.camera,
      width: live.size.width,
      height: live.size.height,
      dpr,
      zoomT,
      highlightedProductId: live.highlighted,
      pulse,
      theme,
    });
  }, [theme]);

  // Draw whenever anything that affects the picture changes.
  // Skipped when the canvas is not in the DOM (roadmap view); otherwise the
  // draw loop clears a detached buffer and the map comes back gray.
  useEffect(() => {
    if (!canvasRef.current) return;
    draw();
  }, [draw, camera, layout, size, highlighted, pulseStart, view]);

  // Keep painting while a pulse is running. The loop reads the live ref, so a
  // camera change mid-pulse does not restart it, and it stops itself once the
  // duration has elapsed. Skipped entirely when the canvas is not mounted so it
  // does not redraw a detached buffer.
  useEffect(() => {
    if (!pulseStart || !canvasRef.current) return;

    let raf = 0;
    const tick = () => {
      if (performance.now() - pulseStart.startedAt >= PULSE_DURATION) {
        setPulseStart(null);
        return;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pulseStart, draw]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close in reverse order of opening: guide → detail → category → domain → drawer.
        if (view === 'guide') {
          setGuideProductId(null);
          setView('map');
        } else if (highlighted) {
          setHighlighted(null);
        } else if (selectedCategory) {
          setSelectedCategory(null);
        } else if (selectedDomain) {
          setSelectedDomain(null);
        } else if (navOpen) {
          setNavOpen(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, highlighted, selectedCategory, selectedDomain, navOpen]);

  // Close the mobile drawer when the viewport crosses the breakpoint, so a
  // rotated phone does not leave an open drawer whose styles no longer apply.
  useEffect(() => {
    if (!navOpen) return;
    const onResize = () => {
      if (window.innerWidth > 760) setNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [navOpen]);

  // Fit the whole map once, reading the container's real size straight from the
  // DOM. React's size state is not used here because it is still the 800x600
  // default when this effect runs, and a fit computed from that is too small and
  // then never re-applied. The container is already laid out at this point.
  const hasFittedRef = useRef(false);

  // Re-fit when the canvas comes back after being hidden (e.g. roadmap toggle).
  useEffect(() => {
    if (view !== 'map') return;
    hasFittedRef.current = false;
  }, [view]);

  // Wire up d3-zoom.
  // Runs only when the layout changes (once), but skips if the canvas is not
  // mounted. When the user toggles away from the map and back, a new canvas
  // element is created and the zoom binding must be re-established.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
  }, [layout, view]);

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
        // Selecting a node on the map also pans to it. Reading the detail card
        // while the node sits off in a corner defeats the point of having both,
        // and it keeps map clicks and list clicks behaving the same way.
        focusProduct(best.id);
        return;
      }

      const categoryId = clusterAt(world.x, world.y);
      if (categoryId) {
        setSelectedCategory(categoryId);
        setHighlighted(null);
        setSelectedDomain(null);
        return;
      }

      setSelectedDomain(domainAt(world.x, world.y));
      setHighlighted(null);
      setSelectedCategory(null);
    });

    return () => {
      selection.on('click', null);
    };
  }, [layout, camera, focusProduct, view]);

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
  function focusOn(
    worldX: number,
    worldY: number,
    scale: number,
    rightInset = 0,
    bottomInset = 0,
  ) {
    const live = liveRef.current;
    const clamped = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
    const selection = selectionRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!selection || !behavior) return;

    const freeWidth = live.size.width - rightInset;
    const freeHeight = live.size.height - bottomInset;
    const transform = zoomIdentity
      .translate(freeWidth / 2 - worldX * clamped, freeHeight / 2 - worldY * clamped)
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
    setSelectedDomain(null);
    // Keep the user's zoom and only pan. Forcing a fixed scale discarded whatever
    // level they had chosen, which made the gesture feel like a reset. The pulse
    // is what tells them where the target ended up.
    setPulseStart({ productId, startedAt: performance.now() });
    // The camera move itself happens in the layout effect below, once the panel
    // that opened with this selection has rendered and its insets are known.
  }

  /** Open the full product guide page. */
  function openGuide(productId: string) {
    setGuideProductId(productId);
    setView('guide');
  }

  function backToMap() {
    setGuideProductId(null);
    setView('map');
  }

  /**
   * The insets the open panel forces on the visible area.
   *
   * The panel is a floating card on desktop (right inset) and a bottom sheet on
   * mobile (bottom inset), so a node must centre on the space that is actually
   * visible. Measured from the DOM rather than from a constant, so a restyled
   * panel cannot silently drift the centering again.
   */
  function panelInsets(): { right: number; bottom: number } {
    const wrap = containerRef.current;
    const panel = wrap?.querySelector<HTMLElement>('.detail, .panel') ?? null;
    if (!wrap || !panel) return { right: 0, bottom: 0 };

    const w = wrap.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    // A panel that spans the width is a bottom sheet; otherwise it is a side card.
    if (p.width >= w.width - 1) {
      return { right: 0, bottom: Math.max(0, w.bottom - p.top) };
    }
    return { right: Math.max(0, w.right - p.left), bottom: 0 };
  }

  // Centre on the selected node once its panel has rendered. A layout effect runs
  // after the DOM update but before paint, so the insets are correct on the first
  // frame and the node never appears at the canvas centre before shifting.
  useLayoutEffect(() => {
    if (!highlighted) return;
    const node = layout.nodeById.get(highlighted);
    if (!node) return;
    const { right, bottom } = panelInsets();
    focusOn(node.x, node.y, liveRef.current.camera.scale, right, bottom);
    // focusOn reads the live size from the ref, so it stays correct even though
    // this effect only re-runs when the selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlighted]);

  /**
   * Animate the camera to a transform.
   *
   * This goes through d3-zoom's transition path rather than setting the
   * transform directly. The behaviour owns the transform on the canvas node,
   * and a transition interpolates from the current transform to the target
   * using the same zoom interpolation a wheel zoom uses, so the movement reads
   * as one continuous gesture instead of a snap. A new jump interrupts the one
   * in flight, so clicking another domain mid-flight does not fight it.
   */
  function flyTo(transform: ZoomTransform, durationMs: number) {
    const selection = selectionRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!selection || !behavior) return;

    selection
      .transition()
      .duration(durationMs)
      .call(behavior.transform, transform);
  }

  /**
   * The transform that frames a domain centred, with padding around it.
   *
   * Both axes are considered. Fitting on width alone can leave a tall domain
   * running off the top and bottom, and the result is clamped to the zoom
   * extent so a small domain is not scaled past the maximum.
   */
  function fitDomain(domain: DomainLayout): ZoomTransform {
    const scale = Math.min(
      (size.width - DOMAIN_FIT_PADDING * 2) / domain.width,
      (size.height - DOMAIN_FIT_PADDING * 2) / domain.height,
      MAX_SCALE,
    );
    const clamped = Math.max(scale, MIN_SCALE);
    const cx = domain.x + domain.width / 2;
    const cy = domain.y + domain.height / 2;

    return zoomIdentity
      .translate(size.width / 2 - cx * clamped, size.height / 2 - cy * clamped)
      .scale(clamped);
  }

  function jumpToDomain(domainId: string) {
    setSelectedCategory(null);
    setSelectedDomain(null);
    setHighlighted(null);
    setPulseStart(null);
    const domain = layout.domainById.get(domainId);
    if (!domain) return;
    flyTo(fitDomain(domain), JUMP_DURATION);
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

  /** The domain box containing a world point, or null if it is outside one. */
  function domainAt(x: number, y: number): string | null {
    for (const domain of layout.domains) {
      if (
        x >= domain.x &&
        x <= domain.x + domain.width &&
        y >= domain.y &&
        y <= domain.y + domain.height
      ) {
        return domain.domainId;
      }
    }
    return null;
  }

  function resetView() {
    const margin = 40;
    const scaleX = (size.width - margin * 2) / layout.width;
    const scaleY = (size.height - margin * 2) / layout.height;
    const scale = Math.min(scaleX, scaleY, 1);
    const target = zoomIdentity
      .translate(
        size.width / 2 - (layout.width / 2) * scale,
        size.height / 2 - (layout.height / 2) * scale,
      )
      .scale(scale);
    flyTo(target, JUMP_DURATION);
    setHighlighted(null);
    setPulseStart(null);
  }

  /** Open a category's product list without moving the camera. */
  function selectCategory(categoryId: string) {
    setSelectedCategory(categoryId);
    setSelectedDomain(null);
    setHighlighted(null);
  }

  /** Open a domain's category list without moving the camera. */
  function selectDomain(domainId: string) {
    setSelectedDomain(domainId);
    setSelectedCategory(null);
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

        <div className="spacer" />

        <button
          type="button"
          className={`roadmap-toggle ${view === 'roadmap' ? 'is-active' : ''}`}
          onClick={() => setView((v) => (v === 'roadmap' ? 'map' : 'roadmap'))}
          aria-pressed={view === 'roadmap'}
        >
          Roadmap
        </button>

        <button
          type="button"
          className="suggest-toggle"
          onClick={() => setSuggestionOpen((open) => !open)}
          aria-pressed={suggestionOpen}
        >
          Suggest
        </button>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
              <g stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </g>
            </svg>
          )}
        </button>

        <a
          href="https://github.com/Frankuccino/platform-atlas"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="⭐ Star Platform Atlas on GitHub — it helps the project grow!"
          aria-label="Star Platform Atlas on GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
              fill="currentColor"
            />
          </svg>
          <span className="github-count">{starCount ?? '☆'}</span>
        </a>

        <button
          type="button"
          className="nav-toggle"
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-controls="map-nav"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          Browse
        </button>
      </header>

      <div className="body">
        {view === 'guide' && guideProductId ? (
          <ProductGuidePage productId={guideProductId} onBack={backToMap} />
        ) : view === 'roadmap' ? (
          <RoadmapPage />
        ) : (
          <Fragment>
            {/* Closing the drawer on a selection is what makes room for the panel
                that opened with it. */}
            <button
              type="button"
              className={navOpen ? 'scrim open' : 'scrim'}
              onClick={() => setNavOpen(false)}
              aria-label="Close the browse list"
              tabIndex={navOpen ? 0 : -1}
            />

            <DomainNav
              id="map-nav"
              className={navOpen ? 'sidebar open' : 'sidebar'}
              onJumpDomain={(domainId) => {
                setNavOpen(false);
                jumpToDomain(domainId);
              }}
              onSelectCategory={(categoryId) => {
                setNavOpen(false);
                selectCategory(categoryId);
              }}
              onSelectDomain={(domainId) => {
                setNavOpen(false);
                selectDomain(domainId);
              }}
            />

            <div className="canvas-wrap" ref={containerRef}>
          <canvas ref={canvasRef} />

          {selectedDomain && (
            <DomainPanel
              domainId={selectedDomain}
              onSelect={selectCategory}
              onJump={jumpToDomain}
              onClose={() => setSelectedDomain(null)}
            />
          )}

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
              onOpenGuide={openGuide}
            />
          )}
        </div>
          </Fragment>
        )}
      </div>

      {suggestionOpen && (
        <div className="suggest-backdrop" onClick={() => setSuggestionOpen(false)}>
          <div className="suggest-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Suggest a product or correction</h3>
            <textarea
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="e.g. Add Railway, or fix the Vercel description"
              rows={4}
              autoFocus
            />
            <div className="suggest-actions">
              <button type="button" className="suggest-cancel" onClick={() => setSuggestionOpen(false)}>
                Cancel
              </button>
              <button type="button" className="suggest-submit" onClick={submitSuggestion}>
                Open in GitHub
              </button>
            </div>
          </div>
        </div>
      )}

      {onboardingVisible && (
        <Onboarding onDismiss={dismissOnboarding} />
      )}
    </div>
  );
}
