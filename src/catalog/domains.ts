import type { Domain } from './types';

/**
 * The six domains the 26 categories are grouped into.
 *
 * This is a presentation concern layered over the catalog. The catalog does not
 * know domains exist, so renaming a category or regrouping here never touches
 * product data. The grouping exists to make a flat list of 26 categories
 * scannable: six lines instead of twenty-six.
 */
export const DOMAINS: Domain[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    categoryIds: ['cloud', 'hosting', 'devops'],
  },
  {
    id: 'data',
    name: 'Data',
    categoryIds: ['database', 'warehouse', 'storage'],
  },
  {
    id: 'runtime',
    name: 'Runtime',
    categoryIds: ['realtime', 'streaming', 'workflow'],
  },
  {
    id: 'product',
    name: 'Product',
    categoryIds: ['observability', 'errors', 'incident', 'auth', 'search', 'flags'],
  },
  {
    id: 'platform-services',
    name: 'Platform Services',
    categoryIds: ['payments', 'fintech', 'comms', 'notify', 'maps', 'integration', 'apimgmt'],
  },
  {
    id: 'ai-business',
    name: 'AI and Business',
    categoryIds: ['ai', 'security', 'backend', 'business'],
  },
];
