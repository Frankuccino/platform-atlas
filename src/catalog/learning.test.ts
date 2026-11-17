import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  DOMAINS,
  LEARNING,
  PRODUCTS,
  TRACK_CATEGORY_PHASE,
  TRACK_PHASES,
  trackProducts,
} from './index';

const trackDomain = DOMAINS.find((d) => d.id === 'ai-engineering')!;

describe('AI Engineering learning track', () => {
  it('gives every product in the track a learning entry', () => {
    const missing = trackProducts(PRODUCTS)
      .map((p) => p.id)
      .filter((id) => !LEARNING[id]);
    expect(missing).toEqual([]);
  });

  it('only defines learning entries for real products', () => {
    const ids = new Set(PRODUCTS.map((p) => p.id));
    const unknown = Object.keys(LEARNING).filter((id) => !ids.has(id));
    expect(unknown).toEqual([]);
  });

  it('points every learning entry at a real track category', () => {
    const trackCats = new Set(trackDomain.categoryIds);
    const bad = Object.values(LEARNING)
      .filter((e) => !trackCats.has(e.track))
      .map((e) => e.track);
    expect(bad).toEqual([]);
  });

  it('assigns a phase to every track category', () => {
    const unassigned = trackDomain.categoryIds.filter(
      (id) => TRACK_CATEGORY_PHASE[id] === undefined,
    );
    expect(unassigned).toEqual([]);
  });

  it('sorts the track by phase then order', () => {
    const ordered = trackProducts(PRODUCTS);
    const keys = ordered.map((p) => {
      const e = LEARNING[p.id];
      return e.phase * 1000 + e.order;
    });
    expect([...keys].sort((a, b) => a - b)).toEqual(keys);
  });

  it('keeps phase numbers contiguous from 1', () => {
    expect(TRACK_PHASES.map((p) => p.phase)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('references only existing categories from phases', () => {
    const catIds = new Set(CATEGORIES.map((c) => c.id));
    const bad = TRACK_PHASES.flatMap((p) => p.categoryIds).filter((id) => !catIds.has(id));
    expect(bad).toEqual([]);
  });

  it('covers every track product with syntax, terms, and a drill', () => {
    const thin = Object.values(LEARNING)
      .filter(
        (e) => e.syntax.length === 0 || e.terminology.length === 0 || e.exercises.length === 0,
      )
      .map((e) => e.track);
    expect(thin).toEqual([]);
  });

  it('maps every entry from a legacy technology a transitioning engineer knows', () => {
    const bare = Object.values(LEARNING)
      .filter((e) => e.comparisons.length === 0)
      .map((e) => e.track);
    expect(bare).toEqual([]);
  });

  it('writes comparisons with a legacy, a modern tool, and a note', () => {
    const malformed = Object.values(LEARNING)
      .flatMap((e) => e.comparisons)
      .filter((c) => !c.legacy || !c.modern || !c.note).length;
    expect(malformed).toBe(0);
  });
});
