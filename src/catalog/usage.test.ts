import { describe, expect, it } from 'vitest';
import { LEARNING, PRODUCTS, USAGE, usageFor } from './index';
import { LANGUAGES } from '../syntax/languages';

const productIds = new Set(PRODUCTS.map((p) => p.id));

describe('usage layer', () => {
  it('gives every tracked product a usage entry', () => {
    const missing = Object.keys(LEARNING).filter((id) => !USAGE[id]);
    expect(missing).toEqual([]);
  });

  it('only defines usage entries for real products', () => {
    const unknown = Object.keys(USAGE).filter((id) => !productIds.has(id));
    expect(unknown).toEqual([]);
  });

  it('points every synergy at a real product', () => {
    const dangling = Object.entries(USAGE).flatMap(([id, entry]) =>
      entry.synergies.filter((s) => !productIds.has(s.withId)).map((s) => `${id} -> ${s.withId}`),
    );
    expect(dangling).toEqual([]);
  });

  it('never lists a product as its own synergy', () => {
    const self = Object.entries(USAGE)
      .filter(([id, entry]) => entry.synergies.some((s) => s.withId === id))
      .map(([id]) => id);
    expect(self).toEqual([]);
  });

  it('gives every entry real capabilities and at least two synergies', () => {
    const thin = Object.entries(USAGE)
      .filter(([, entry]) => entry.capabilities.length < 3 || entry.synergies.length < 2)
      .map(([id]) => id);
    expect(thin).toEqual([]);
  });

  it('writes non-empty capability names, details, and synergy notes', () => {
    const blank =
      Object.values(USAGE)
        .flatMap((entry) => entry.capabilities)
        .filter((c) => !c.name.trim() || !c.detail.trim()).length +
      Object.values(USAGE)
        .flatMap((entry) => entry.synergies)
        .filter((s) => !s.note.trim()).length;
    expect(blank).toBe(0);
  });

  it('shows every capability in action with code and an explanation', () => {
    const missing = Object.values(USAGE)
      .flatMap((entry) => entry.capabilities)
      .filter(
        (c) =>
          !c.example.code.trim() ||
          c.example.code.trim().length < 20 ||
          !c.example.explanation.trim(),
      )
      .map((c) => c.name);
    expect(missing).toEqual([]);
  });

  it('shows every synergy as a composed snippet, not just a claim', () => {
    const missing = Object.values(USAGE)
      .flatMap((entry) => entry.synergies)
      .filter(
        (s) =>
          !s.example.code.trim() ||
          s.example.code.trim().length < 20 ||
          !s.example.explanation.trim(),
      )
      .map((s) => s.withId);
    expect(missing).toEqual([]);
  });

  it('only uses language keys the highlighter knows', () => {
    const known = new Set(Object.keys(LANGUAGES));
    const examples = Object.values(USAGE).flatMap((entry) => [
      ...entry.capabilities.map((c) => c.example),
      ...entry.synergies.map((s) => s.example),
    ]);
    const unknown = examples
      .map((example) => example.lang)
      .filter((lang) => lang !== undefined && !known.has(lang.toLowerCase()));
    expect(unknown).toEqual([]);
  });

  it('describes products in their own words rather than boilerplate', () => {
    const names = new Set(
      Object.values(USAGE).flatMap((entry) => entry.capabilities.map((c) => c.name)),
    );
    expect(names.size).toBeGreaterThan(Object.keys(USAGE).length);
  });

  it('returns undefined for an untracked product', () => {
    expect(usageFor('not-a-product')).toBeUndefined();
  });
});
