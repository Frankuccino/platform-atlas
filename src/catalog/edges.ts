import type { LayerEdge } from './types';

/**
 * Category-to-category dependency edges: the products in `from` run on top of
 * the products in `to`.
 *
 * These are the layer lines of the map. They are the highest-value and the most
 * dangerous edges in the whole model, because a wrong one teaches you something
 * false about how the market fits together. They are therefore derived from
 * category adjacency and kept few, rather than enumerated.
 *
 * Everything ultimately runs on cloud infrastructure, so `cloud` is the hub.
 * The interesting structure is the cross-links between the non-foundation
 * categories, which is where the real dependencies live.
 */
export const LAYER_EDGES: LayerEdge[] = [
  // Foundation: everything runs on raw infrastructure.
  { from: 'hosting', to: 'cloud', kind: 'runs-on' },
  { from: 'database', to: 'cloud', kind: 'runs-on' },
  { from: 'warehouse', to: 'cloud', kind: 'runs-on' },
  { from: 'storage', to: 'cloud', kind: 'runs-on' },
  { from: 'devops', to: 'cloud', kind: 'runs-on' },

  // Data: analytics sits on top of the operational database.
  { from: 'warehouse', to: 'database', kind: 'runs-on' },

  // Runtime: messaging and scheduling sit on raw compute.
  { from: 'realtime', to: 'cloud', kind: 'runs-on' },
  { from: 'streaming', to: 'cloud', kind: 'runs-on' },
  { from: 'workflow', to: 'cloud', kind: 'runs-on' },

  // Product: observability and error tracking watch the deployed app.
  { from: 'observability', to: 'hosting', kind: 'runs-on' },
  { from: 'errors', to: 'observability', kind: 'runs-on' },
  { from: 'incident', to: 'observability', kind: 'runs-on' },
  { from: 'search', to: 'database', kind: 'runs-on' },
  { from: 'flags', to: 'hosting', kind: 'runs-on' },

  // Platform services: gateways sit in front of backends.
  { from: 'apimgmt', to: 'hosting', kind: 'runs-on' },
  { from: 'integration', to: 'apimgmt', kind: 'runs-on' },

  // AI: model APIs and vector stores sit on compute.
  { from: 'ai', to: 'cloud', kind: 'runs-on' },

  // Business: backend-as-a-service wraps a database.
  { from: 'backend', to: 'database', kind: 'runs-on' },
];
