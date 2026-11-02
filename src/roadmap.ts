/**
 * Project roadmap data.
 *
 * Source of truth: docs/design.md and docs/features.md.  When a phase ships,
 * flip its `status` to `done` and move on.
 */

export type Status = 'done' | 'in-progress' | 'planned';

export interface Milestone {
  id: string;
  title: string;
  detail: string;
  status: Status;
  /** Optional link to the doc that governs this phase. */
  doc?: string;
}

export interface Phase {
  id: string;
  title: string;
  goal: string;
  status: Status;
  milestones: Milestone[];
}

export const PHASES: Phase[] = [
  {
    id: 'p1-map',
    title: 'Phase 1 — Map',
    goal: 'A navigable reference for the platform landscape.',
    status: 'done',
    milestones: [
      {
        id: 'm1-catalog',
        title: 'Product catalog',
        detail:
          '26 categories, 179 products, typed TypeScript, validated against dangling references and duplicate cells.',
        status: 'done',
        doc: 'docs/data-model.md',
      },
      {
        id: 'm1-layout',
        title: 'Hierarchical layout',
        detail:
          'Domain regions → category clusters → product nodes. Layout computed from hierarchy, not a force simulation.',
        status: 'done',
        doc: 'docs/design.md',
      },
      {
        id: 'm1-canvas',
        title: 'Canvas renderer',
        detail:
          'Dpr-aware canvas with d3-zoom, pinch-zoom on mobile, node highlighting, category and domain panels.',
        status: 'done',
      },
      {
        id: 'm1-nav',
        title: 'Navigation',
        detail:
          'Browse sidebar with domain/category tree, search, jump-to-domain, and panel-aware centering.',
        status: 'done',
        doc: 'docs/navigation.md',
      },
      {
        id: 'm1-links',
        title: 'Outbound links',
        detail: 'Per-product documentation and website links in the detail panel.',
        status: 'done',
      },
      {
        id: 'm1-deploy',
        title: 'Vercel deploy',
        detail: 'GitHub CI/CD, production domain platformatlas.vercel.app, build config.',
        status: 'done',
      },
    ],
  },
  {
    id: 'p2-study',
    title: 'Phase 2 — Study Loop',
    goal: 'Spaced repetition over the catalog with a daily review flow.',
    status: 'in-progress',
    milestones: [
      {
        id: 'm2-schema',
        title: 'Study state schema',
        detail:
          'Per-user, per-product, per-core-set rows: status, notes, confidence, sources, last-reviewed, interval, ease.',
        status: 'in-progress',
        doc: 'docs/data-model.md',
      },
      {
        id: 'm2-scheduler',
        title: 'Scheduler',
        detail: 'Deterministic due-date calculation with skip behaviour and interval progression.',
        status: 'in-progress',
        doc: 'docs/scheduler.md',
      },
      {
        id: 'm2-auth',
        title: 'Auth',
        detail:
          'Refresh-cookie auth, httpOnly, session stored server-side. One implicit profile or named accounts.',
        status: 'planned',
      },
      {
        id: 'm2-core-sets',
        title: 'Core sets',
        detail:
          'Multiple core sets per career target. A product can be core for one target and lookup-only for another.',
        status: 'planned',
        doc: 'docs/features.md',
      },
      {
        id: 'm2-today',
        title: 'Today view',
        detail: 'Generated daily list of due items with accept/skip. Streak and due count.',
        status: 'planned',
      },
      {
        id: 'm2-review',
        title: 'Review flow',
        detail: 'Per-product question display, recall scoring, interval update.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'p3-polish',
    title: 'Phase 3 — Polish',
    goal: 'Make the existing surface feel complete and robust.',
    status: 'in-progress',
    milestones: [
      {
        id: 'm3-mobile',
        title: 'Mobile layout',
        detail: 'Drawer sidebar, bottom-sheet panels, pinch-zoom, touch targets ≥ 44 px.',
        status: 'in-progress',
      },
      {
        id: 'm3-import',
        title: 'Import / export',
        detail: 'Study state exported as JSON. Re-import merges by product id.',
        status: 'planned',
        doc: 'docs/features.md',
      },
      {
        id: 'm3-keyboard',
        title: 'Keyboard navigation',
        detail: 'Review flow navigable without a pointer.',
        status: 'planned',
      },
      {
        id: 'm3-coverage',
        title: 'Coverage view',
        detail: 'Mastered / known / learning / unseen per category.',
        status: 'planned',
        doc: 'docs/features.md',
      },
    ],
  },
  {
    id: 'p4-growth',
    title: 'Phase 4 — Growth',
    goal: 'Extend the surface without breaking the core loop.',
    status: 'planned',
    milestones: [
      {
        id: 'm4-brand-icons',
        title: 'Brand icons',
        detail: 'First-letter fallback for all 179 products; brand SVGs where available.',
        status: 'planned',
      },
      {
        id: 'm4-compare',
        title: 'Compare flow',
        detail: 'Side-by-side comparison of two or more products from the detail panel.',
        status: 'planned',
        doc: 'docs/features.md',
      },
      {
        id: 'm4-offline',
        title: 'Offline support',
        detail: 'Service worker cache for the catalog shell; review queue available offline.',
        status: 'planned',
      },
      {
        id: 'm4-sharing',
        title: 'Shareable core sets',
        detail: 'Export a core set as a shareable link or JSON.',
        status: 'planned',
        doc: 'docs/features.md',
      },
    ],
  },
  {
    id: 'p5-intelligence',
    title: 'Phase 5 — Intelligence',
    goal: 'Turn the catalog into a guided learning platform with recommendations and deep-dive guides.',
    status: 'planned',
    milestones: [
      {
        id: 'm5-recommendations',
        title: 'Smart recommendations',
        detail:
          'Rule-based suggestions in the detail panel: "runs on", "runs alongside", and adjacent-category picks, derived from layer edges and category adjacency.',
        status: 'in-progress',
        doc: 'docs/recommendations.md',
      },
      {
        id: 'm5-deep-dives',
        title: 'Product deep-dive guides',
        detail:
          'Per-product pages with certificates, current trends, statistics, and recent blog posts. Content curated manually at first, then sourced from RSS and LLM summaries.',
        status: 'planned',
        doc: 'docs/data-model.md',
      },
      {
        id: 'm5-ai-enhance',
        title: 'LLM-enhanced recommendations',
        detail:
          'Groq-powered natural-language suggestions ("Show me tools for a React + Postgres stack") and auto-generated product summaries.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'p6-ux',
    title: 'Phase 6 — UX Polish',
    goal: 'Make the existing surface feel complete, trustworthy, and easy to use.',
    status: 'done',
    milestones: [
      {
        id: 'm6-onboarding',
        title: 'First-run onboarding',
        detail:
          'Dismissible "New? Start here" tip overlay or tour that explains the map, sidebar, and detail panel. One-time, stored in localStorage.',
        status: 'done',
      },
      {
        id: 'm6-freshness',
        title: 'Content freshness signals',
        detail:
          'Show "Updated <date>" or "Data as of <month>" badges on products and guides so users know when content might be stale.',
        status: 'done',
      },
      {
        id: 'm6-keyboard',
        title: 'Keyboard navigation',
        detail:
          'Review flow and map navigable without a pointer: Escape to close panels, arrow keys to move between nodes, Enter to open detail.',
        status: 'done',
        doc: 'docs/features.md',
      },
      {
        id: 'm6-search',
        title: 'Natural language search',
        detail:
          'Search accepts phrases like "React hosting with Postgres" and filters products by category + layer edge adjacency instead of matching exact text only.',
        status: 'done',
      },
      {
        id: 'm6-dark-mode',
        title: 'Dark mode',
        detail:
          'Toggle between light and dark themes. CSS custom properties on :root and [data-theme="dark"]. Persist choice in localStorage.',
        status: 'done',
      },
      {
        id: 'm6-suggest',
        title: 'Product suggestion form',
        detail:
          'One-field form: "Suggest a product or correction." Submissions go to a GitHub issue or a lightweight backend endpoint.',
        status: 'done',
      },
    ],
  },
];

export function overallStatus(phase: Phase): Status {
  if (phase.status !== 'done') return phase.status;
  if (phase.milestones.every((m) => m.status === 'done')) return 'done';
  return 'in-progress';
}

export function progress(phase: Phase): { done: number; total: number } {
  const done = phase.milestones.filter((m) => m.status === 'done').length;
  return { done, total: phase.milestones.length };
}
