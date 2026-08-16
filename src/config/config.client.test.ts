import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TUNING, PRESETS } from '../modules/vocab-test/settings.ts';

// The store caches its resolved config and guards `init()` against re-running, so each scenario
// needs a fresh module instance — same cache-busting trick as config.server.test.ts.
let n = 0;
const importFresh = () => import(`./config.client.ts?fresh=${n++}`);

// Most tests want the post-`init()` state, which is what `ConfigGate` guarantees before any
// consumer renders.
async function resolved() {
  const mod = await importFresh();
  await mod.useClientConfigStore.getState().init();
  return mod;
}

// Node has no localStorage (and no `window`, which is what the source guards on), so fake both.
// Returns the backing record so a test can inspect what was actually written.
function fakeBrowser(initial: Record<string, string> = {}): Record<string, string> {
  const data: Record<string, string> = { ...initial };
  const g = globalThis as Record<string, unknown>;
  g.window = g.window ?? {};
  g.localStorage = {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
    clear: () => {
      for (const k of Object.keys(data)) delete data[k];
    },
    key: (i: number) => Object.keys(data)[i] ?? null,
    get length() {
      return Object.keys(data).length;
    },
  };
  return data;
}

function serverSide(): void {
  const g = globalThis as Record<string, unknown>;
  delete g.window;
  delete g.localStorage;
}

// The keys the entries declare. Spelled out rather than imported, so a rename has to be deliberate:
// SRS_TUNING's key is a storage contract with every device that already has a value under it.
const SRS_TUNING_KEY = 'srs_tuning';

test('every entry resolves to its declared default when nothing is stored and no env var is set', async () => {
  fakeBrowser();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, true);
});

test('a stored value beats the default', async () => {
  fakeBrowser({ [SRS_TUNING_KEY]: JSON.stringify(PRESETS.rapid) });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, PRESETS.rapid);
});

test('env beats the default', async () => {
  fakeBrowser();
  process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED = 'false';

  const { getClientConfig } = await resolved();
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, false);

  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
});

// The env layer outranks localStorage, so it must stay silent unless the variable is really set.
// If it contributed `parseBooleanEnv(undefined, fallback)` instead, that fallback would outrank
// every lower layer and permanently mask any user override of an env-backed entry.
test('the env provider contributes nothing when its variable is unset', async () => {
  fakeBrowser();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { useClientConfigStore } = await resolved();
  assert.deepEqual(useClientConfigStore.getState().byProvider.env, {});
});

test('the env provider contributes the parsed value when its variable is set', async () => {
  fakeBrowser();
  process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED = 'false';

  const { useClientConfigStore } = await resolved();
  assert.deepEqual(useClientConfigStore.getState().byProvider.env, { VOCAB_SAVING_ENABLED: false });

  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
});

// VOCAB_SAVING_ENABLED declares no `localStorageKey`: it's a deployment flag, not a per-device
// preference, so hand-writing one does nothing however the key is spelled.
test('an env-only entry is never read from localStorage', async () => {
  fakeBrowser({ VOCAB_SAVING_ENABLED: 'false', vocabSavingEnabled: 'false' });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, true);
});

test('an invalid stored value is rejected and the default wins', async () => {
  // A multiplier that isn't a number would otherwise reach the SRS interval maths.
  fakeBrowser({
    [SRS_TUNING_KEY]: JSON.stringify({ ...PRESETS.rapid, multiplier: { good: 'abc' } }),
  });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
});

test('unparseable stored JSON is ignored', async () => {
  fakeBrowser({ [SRS_TUNING_KEY]: 'not json{' });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
});

// Per-entry keys, chosen over one shared blob: a corrupt value costs only its own entry, and there
// is no blob version to migrate. This pins the isolation.
test('one unparseable key does not disturb another entry', async () => {
  fakeBrowser({ [SRS_TUNING_KEY]: '{{{', unrelated_key: 'garbage' });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, true);
});

// Decided with the human (2026-08-16): no migration off the pre-blob key. Every device's saved
// tuning resets once, to Standard. Pinned as a test so the reset is a recorded choice, not a
// regression someone "fixes" by accident.
test('the pre-existing finnish_srs_tuning key is deliberately not read', async () => {
  fakeBrowser({ finnish_srs_tuning: JSON.stringify(PRESETS.brisk) });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
});

test('setUserOverride writes the entry to its own key and re-resolves', async () => {
  const data = fakeBrowser();

  const { setUserOverride, getClientConfig } = await resolved();
  setUserOverride({ SRS_TUNING: PRESETS.brisk });

  assert.deepEqual(getClientConfig().SRS_TUNING, PRESETS.brisk);
  assert.deepEqual(JSON.parse(data[SRS_TUNING_KEY]), PRESETS.brisk);
  // The raw value, with no wrapper: the key holds exactly what the entry's `parse` reads back.
  assert.deepEqual(Object.keys(data), [SRS_TUNING_KEY]);
});

// `userOverride` is the write permission. VOCAB_SAVING_ENABLED doesn't have it, so an override must
// be refused outright rather than written to a key nothing reads — which would look like it worked.
test('setUserOverride refuses an entry that is not user-writable', async () => {
  const data = fakeBrowser();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { setUserOverride, getClientConfig } = await resolved();
  setUserOverride({ VOCAB_SAVING_ENABLED: false });

  assert.deepEqual(data, {});
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, true);
});

test('a user override cannot beat an env-provided value', async () => {
  fakeBrowser();
  process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED = 'false';

  const { setUserOverride, getClientConfig } = await resolved();
  setUserOverride({ VOCAB_SAVING_ENABLED: true });
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, false);

  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
});

test('an override leaves other keys in storage untouched', async () => {
  const data = fakeBrowser({ finnish_reader_position: '42' });

  const { setUserOverride } = await resolved();
  setUserOverride({ SRS_TUNING: PRESETS.rapid });

  assert.equal(data.finnish_reader_position, '42');
});

// ConfigGate holds rendering on `status`, which is what lets every consumer read synchronously —
// so the pending → ready transition is load-bearing, not incidental.
test('status is pending until init() resolves, and sync reads are defaults until then', async () => {
  fakeBrowser({ [SRS_TUNING_KEY]: JSON.stringify(PRESETS.rapid) });

  const { useClientConfigStore, getClientConfig } = await importFresh();
  assert.equal(useClientConfigStore.getState().status, 'pending');
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);

  await useClientConfigStore.getState().init();
  assert.equal(useClientConfigStore.getState().status, 'ready');
  assert.deepEqual(getClientConfig().SRS_TUNING, PRESETS.rapid);
});

test('concurrent init() calls resolve to one run', async () => {
  fakeBrowser({ [SRS_TUNING_KEY]: JSON.stringify(PRESETS.rapid) });

  const { useClientConfigStore } = await importFresh();
  const { init } = useClientConfigStore.getState();
  await Promise.all([init(), init(), init()]);
  assert.equal(useClientConfigStore.getState().status, 'ready');
  assert.deepEqual(useClientConfigStore.getState().config.SRS_TUNING, PRESETS.rapid);
});

test('resolves to defaults server-side, where there is no localStorage', async () => {
  serverSide();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().SRS_TUNING, DEFAULT_TUNING);
  assert.equal(getClientConfig().VOCAB_SAVING_ENABLED, true);
});
