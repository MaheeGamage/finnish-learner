import { test } from 'node:test';
import assert from 'node:assert/strict';

// config.server.ts resolves its entries eagerly at import (fail-fast at startup), so each test
// needs its own fresh module instance — a cache-busting query string forces re-evaluation
// instead of reusing whatever the first import already resolved.
let n = 0;
const importFresh = () => import(`./config.server.ts?fresh=${n++}`);

test('throws a clear, named error when a required entry is unset', async () => {
  delete process.env.AUTH_GOOGLE_ID;
  process.env.AUTH_GOOGLE_SECRET = 'test-secret';
  await assert.rejects(importFresh(), /Missing required env var: AUTH_GOOGLE_ID/);
  delete process.env.AUTH_GOOGLE_SECRET;
});

test('resolves entries once required vars are set', async () => {
  process.env.AUTH_GOOGLE_ID = 'test-id';
  process.env.AUTH_GOOGLE_SECRET = 'test-secret';
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { config } = await importFresh();
  assert.equal(config.AUTH_GOOGLE_ID, 'test-id');
  assert.equal(config.AUTH_GOOGLE_SECRET, 'test-secret');
  assert.equal(config.VOCAB_SAVING_ENABLED, true);

  delete process.env.AUTH_GOOGLE_ID;
  delete process.env.AUTH_GOOGLE_SECRET;
});

test('VOCAB_SAVING_ENABLED follows NEXT_PUBLIC_VOCAB_SAVING_ENABLED', async () => {
  process.env.AUTH_GOOGLE_ID = 'test-id';
  process.env.AUTH_GOOGLE_SECRET = 'test-secret';
  process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED = 'false';

  const { config } = await importFresh();
  assert.equal(config.VOCAB_SAVING_ENABLED, false);

  delete process.env.AUTH_GOOGLE_ID;
  delete process.env.AUTH_GOOGLE_SECRET;
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
});
