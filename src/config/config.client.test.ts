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

const blob = (value: unknown, version: unknown = 1) =>
  JSON.stringify({ version, vocabTest: { srsTuning: value } });

test('defaults resolve when nothing is stored and no env var is set', async () => {
  fakeBrowser();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);
  assert.equal(getClientConfig().vocabStore.savingEnabled, true);
});

test('a stored override beats the default', async () => {
  fakeBrowser({ app_config: blob(PRESETS.rapid) });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, PRESETS.rapid);
});

test('env beats a stored override', async () => {
  fakeBrowser({ app_config: JSON.stringify({ version: 1, vocabStore: { savingEnabled: true } }) });
  process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED = 'false';

  const { getClientConfig } = await resolved();
  assert.equal(getClientConfig().vocabStore.savingEnabled, false);

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
  assert.deepEqual(useClientConfigStore.getState().byProvider.env, {
    vocabStore: { savingEnabled: false },
  });

  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
});

// `savingEnabled` is a deployment flag, not a per-device preference: only groups with a validator
// are read back out of the blob, so writing it by hand does nothing.
test('a stored value for an env-only entry is ignored', async () => {
  fakeBrowser({ app_config: JSON.stringify({ version: 1, vocabStore: { savingEnabled: false } }) });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.equal(getClientConfig().vocabStore.savingEnabled, true);
});

test('an invalid stored group is rejected and the default wins', async () => {
  // A multiplier that isn't a number would otherwise reach the SRS interval maths.
  fakeBrowser({ app_config: blob({ ...PRESETS.rapid, multiplier: { good: 'abc' } }) });
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);
});

test('unparseable stored JSON is ignored', async () => {
  fakeBrowser({ app_config: 'not json{' });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);
});

test('a blob with an unknown version is ignored outright', async () => {
  fakeBrowser({ app_config: blob(PRESETS.rapid, 99) });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);
});

test('legacy finnish_srs_tuning is picked up when the blob lacks that group', async () => {
  fakeBrowser({ finnish_srs_tuning: JSON.stringify(PRESETS.brisk) });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, PRESETS.brisk);
});

test('the blob wins over the legacy key once both exist', async () => {
  fakeBrowser({
    app_config: blob(PRESETS.rapid),
    finnish_srs_tuning: JSON.stringify(PRESETS.brisk),
  });

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, PRESETS.rapid);
});

test('setUserOverride persists a versioned blob and re-resolves', async () => {
  const data = fakeBrowser();

  const { setUserOverride, getClientConfig } = await resolved();
  setUserOverride({ vocabTest: { srsTuning: PRESETS.brisk } });

  assert.deepEqual(getClientConfig().vocabTest.srsTuning, PRESETS.brisk);
  assert.deepEqual(JSON.parse(data.app_config), {
    version: 1,
    vocabTest: { srsTuning: PRESETS.brisk },
  });
});

test('setUserOverride leaves the legacy key in place', async () => {
  const data = fakeBrowser({ finnish_srs_tuning: JSON.stringify(PRESETS.brisk) });

  const { setUserOverride } = await resolved();
  setUserOverride({ vocabTest: { srsTuning: PRESETS.rapid } });

  assert.equal(data.finnish_srs_tuning, JSON.stringify(PRESETS.brisk));
});

// ConfigGate holds rendering on `status`, which is what lets every consumer read synchronously —
// so the pending → ready transition is load-bearing, not incidental.
test('status is pending until init() resolves, and sync reads are defaults until then', async () => {
  fakeBrowser({ app_config: blob(PRESETS.rapid) });

  const { useClientConfigStore, getClientConfig } = await importFresh();
  assert.equal(useClientConfigStore.getState().status, 'pending');
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);

  await useClientConfigStore.getState().init();
  assert.equal(useClientConfigStore.getState().status, 'ready');
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, PRESETS.rapid);
});

test('concurrent init() calls resolve to one run', async () => {
  fakeBrowser({ app_config: blob(PRESETS.rapid) });

  const { useClientConfigStore } = await importFresh();
  const { init } = useClientConfigStore.getState();
  await Promise.all([init(), init(), init()]);
  assert.equal(useClientConfigStore.getState().status, 'ready');
  assert.deepEqual(useClientConfigStore.getState().config.vocabTest.srsTuning, PRESETS.rapid);
});

test('resolves to defaults server-side, where there is no localStorage', async () => {
  serverSide();
  delete process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;

  const { getClientConfig } = await resolved();
  assert.deepEqual(getClientConfig().vocabTest.srsTuning, DEFAULT_TUNING);
  assert.equal(getClientConfig().vocabStore.savingEnabled, true);
});
