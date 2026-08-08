import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepMerge } from './deepMerge.ts';

test('deepMerge keeps sibling fields when overriding a nested value', () => {
  const base = { ui: { theme: 'light', pageSize: 20 }, other: { keep: true } };
  const merged = deepMerge(base, { ui: { theme: 'dark' } });
  assert.deepEqual(merged, { ui: { theme: 'dark', pageSize: 20 }, other: { keep: true } });
});

test('deepMerge does not mutate its inputs', () => {
  const base = { ui: { theme: 'light' } };
  deepMerge(base, { ui: { theme: 'dark' } });
  assert.equal(base.ui.theme, 'light');
});

test('deepMerge replaces arrays wholesale instead of merging by index', () => {
  const base = { order: ['google', 'wiktionary'] };
  assert.deepEqual(deepMerge(base, { order: ['wiktionary'] }), { order: ['wiktionary'] });
});

test('deepMerge ignores undefined so a provider omitting a key keeps the layer below', () => {
  const base = { a: 1, nested: { b: 2 } };
  const merged = deepMerge(base, { a: undefined, nested: { b: undefined } });
  assert.deepEqual(merged, { a: 1, nested: { b: 2 } });
});

test('deepMerge lets an explicit null or false override a default', () => {
  const base = { flag: true, value: 'x' as string | null };
  assert.deepEqual(deepMerge(base, { flag: false, value: null }), { flag: false, value: null });
});

test('deepMerge adds keys the base does not have', () => {
  assert.deepEqual(deepMerge({ a: 1 } as Record<string, unknown>, { b: 2 }), { a: 1, b: 2 });
});
