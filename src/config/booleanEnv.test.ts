import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBooleanEnv } from './booleanEnv.ts';

test('parseBooleanEnv returns the fallback when unset', () => {
  assert.equal(parseBooleanEnv(undefined, true), true);
  assert.equal(parseBooleanEnv(undefined, false), false);
});

test('parseBooleanEnv treats known false-ish strings as false', () => {
  for (const v of ['0', 'false', 'no', 'off', 'FALSE', ' Off ']) {
    assert.equal(parseBooleanEnv(v, true), false, `expected "${v}" to parse as false`);
  }
});

test('parseBooleanEnv treats anything else as true', () => {
  for (const v of ['1', 'true', 'yes', 'on', 'anything']) {
    assert.equal(parseBooleanEnv(v, false), true, `expected "${v}" to parse as true`);
  }
});
