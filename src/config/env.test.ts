import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireEnv, optionalEnv } from './env.ts';

test('requireEnv returns the value when set', () => {
  process.env.__TEST_REQUIRED__ = 'value';
  assert.equal(requireEnv('__TEST_REQUIRED__'), 'value');
  delete process.env.__TEST_REQUIRED__;
});

test('requireEnv throws a named error when unset', () => {
  delete process.env.__TEST_REQUIRED__;
  assert.throws(() => requireEnv('__TEST_REQUIRED__'), /Missing required env var: __TEST_REQUIRED__/);
});

test('optionalEnv returns the value when set', () => {
  process.env.__TEST_OPTIONAL__ = 'value';
  assert.equal(optionalEnv('__TEST_OPTIONAL__', 'fallback'), 'value');
  delete process.env.__TEST_OPTIONAL__;
});

test('optionalEnv returns the fallback when unset', () => {
  delete process.env.__TEST_OPTIONAL__;
  assert.equal(optionalEnv('__TEST_OPTIONAL__', 'fallback'), 'fallback');
});
