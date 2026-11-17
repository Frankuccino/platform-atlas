import { describe, expect, it } from 'vitest';
import { DOMAINS, PRODUCTS, trackProducts } from './index';
import { WORKFLOW_STAGES, workflowProducts, workflowStageProducts } from './workflow';

const productIds = new Set(PRODUCTS.map((p) => p.id));

describe('AI application workflow', () => {
  it('lays the stages out in pipeline order', () => {
    expect(WORKFLOW_STAGES.map((s) => s.id)).toEqual([
      'ingest',
      'prepare',
      'embed-index',
      'retrieve',
      'generate',
      'evaluate',
      'serve',
      'govern',
    ]);
  });

  it('gives every stage a title, an outcome, and at least one product', () => {
    const thin = WORKFLOW_STAGES.filter(
      (s) => !s.title.trim() || !s.outcome.trim() || s.productIds.length === 0,
    );
    expect(thin).toEqual([]);
  });

  it('only references real products', () => {
    const unknown = WORKFLOW_STAGES.flatMap((s) => s.productIds).filter(
      (id) => !productIds.has(id),
    );
    expect(unknown).toEqual([]);
  });

  it('gives each product exactly one home', () => {
    const seen = new Map<string, number>();
    for (const stage of WORKFLOW_STAGES) {
      for (const id of stage.productIds) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);
    expect(duplicated).toEqual([]);
    expect(seen.size).toBe(WORKFLOW_STAGES.reduce((sum, s) => sum + s.productIds.length, 0));
  });

  it('covers every AI track product exactly once', () => {
    const placed = new Set(workflowProducts().map((p) => p.id));
    const track = trackProducts(PRODUCTS).map((p) => p.id);
    expect(track.filter((id) => !placed.has(id))).toEqual([]);
    expect([...placed].filter((id) => !track.includes(id))).toEqual([]);
  });

  it('keeps every product inside the AI Engineering domain', () => {
    const trackDomain = DOMAINS.find((d) => d.id === 'ai-engineering')!;
    const outside = workflowProducts()
      .filter((p) => !trackDomain.categoryIds.includes(p.categoryId))
      .map((p) => p.id);
    expect(outside).toEqual([]);
  });

  it('returns products in the order the stage lists them', () => {
    const stage = WORKFLOW_STAGES[0];
    expect(workflowStageProducts(stage).map((p) => p.id)).toEqual(stage.productIds);
  });
});
