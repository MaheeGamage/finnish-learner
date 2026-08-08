// Client-safe app config — the single facade between anything that CONSUMES a config value and
// anything that PROVIDES one.
//
// Each provider supplies a partial config; `resolve()` deep-merges them by precedence into one
// object. A consumer reads `getClientConfig().vocabTest.srsTuning` and never learns whether that
// came from a constant, an env var, localStorage, or (later) the backend — so moving an entry
// between sources is a change here and nowhere else.
//
// Precedence: env > localStorage > DEFAULTS. Env is a *deployment* override, so a kill-switch like
// `savingEnabled` has to beat a user preference.
//
// Async by construction: resolution awaits every provider, so adding a `/api/config` provider later
// needs no call-site change. `ConfigGate` runs that resolution once at the root and holds rendering
// until it finishes, which is what lets every consumer read config synchronously — via
// `useClientConfig` in components, `getClientConfig()` elsewhere — with no ready-check of its own.
//
// Worth re-deciding when an async provider actually lands: gating the tree on a *network* fetch
// means a slow or failing /api/config shows a blank app, where letting values swap in would degrade
// gracefully instead.

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { deepMerge, isPlainObject, type DeepPartial } from './deepMerge.ts';
import { parseBooleanEnv } from './booleanEnv.ts';
// Deep path on purpose, twice over: `@/modules/vocab-test` re-exports client.ts, which imports
// this file back (an import cycle), and the `@/` alias doesn't resolve under Node's test runner.
// The module owns its own validator and default; this file only wires them to a source.
import { DEFAULT_TUNING, parseTuning, parseTuningJson } from '../modules/vocab-test/settings.ts';
import type { TuningConfig } from '../modules/vocab-test/settings.ts';

// --- shape -----------------------------------------------------------------
// Grouped by the module that owns the entry, two levels deep.

export interface ClientConfig {
  vocabTest: {
    srsTuning: TuningConfig;
  };
  vocabStore: {
    savingEnabled: boolean;
  };
}

export type PartialClientConfig = DeepPartial<ClientConfig>;

const DEFAULTS: ClientConfig = {
  vocabTest: { srsTuning: DEFAULT_TUNING },
  vocabStore: { savingEnabled: true },
};

// --- storage ---------------------------------------------------------------
// User overrides live in one versioned blob. The key is deliberately language-neutral: this is
// app-wide config, not Finnish-specific.

const STORAGE_KEY = 'app_config';
const STORAGE_VERSION = 1;

// Pre-blob location of the SRS tuning (task-011). Read as a fallback and left in place — deleting
// it gains nothing and would lose the user's tuning if this change ever needs reverting.
const LEGACY_SRS_TUNING_KEY = 'finnish_srs_tuning';

function readBlob(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    // A version we don't know is ignored outright rather than merged — a shape from a future
    // release could otherwise land in places that expect today's types.
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Stored values are untrusted (hand-editable, or written by an older release), so every group runs
// through its owning module's validator. An invalid group is dropped and the default wins, rather
// than reaching e.g. the SRS interval maths as NaN.
function validateStored(blob: Record<string, unknown> | null): PartialClientConfig {
  if (!blob) return {};
  const out: PartialClientConfig = {};
  const vocabTest = isPlainObject(blob.vocabTest) ? blob.vocabTest : null;
  const srsTuning = vocabTest ? parseTuning(vocabTest.srsTuning) : null;
  if (srsTuning) out.vocabTest = { srsTuning };
  return out;
}

function readLegacySrsTuning(): TuningConfig | null {
  try {
    return parseTuningJson(localStorage.getItem(LEGACY_SRS_TUNING_KEY));
  } catch {
    return null;
  }
}

// Everything this device has stored, validated. The single reader for the localStorage layer —
// used both by the provider and after a write, so the legacy fallback can't be lost by overriding
// some unrelated group.
function loadLocal(): PartialClientConfig {
  if (typeof window === 'undefined') return {};
  const stored = validateStored(readBlob());
  if (!stored.vocabTest) {
    const legacy = readLegacySrsTuning();
    if (legacy) return { ...stored, vocabTest: { srsTuning: legacy } };
  }
  return stored;
}

// Merges the override into the stored blob and persists it, then re-reads so the store's cached
// localStorage layer reflects exactly what a fresh load would produce.
function persist(partial: PartialClientConfig): PartialClientConfig {
  if (typeof window === 'undefined') return {};
  const current = readBlob() ?? {};
  const next = deepMerge(current, { ...partial, version: STORAGE_VERSION });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error('Error saving app config:', error);
  }
  return loadLocal();
}

// --- providers -------------------------------------------------------------
// Order is precedence: earlier wins. `load` may be sync or async.

interface ConfigProvider {
  name: string;
  load: () => PartialClientConfig | Promise<PartialClientConfig>;
}

const providers: ConfigProvider[] = [
  {
    name: 'env',
    load: () => {
      // Literal `process.env.NEXT_PUBLIC_*` member expression — Next.js inlines these at build
      // time by matching the exact text, so this can't become a dynamic lookup.
      const raw = process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
      // Contribute ONLY when the variable is actually set. Returning a fallback here instead would
      // outrank localStorage on every read and permanently mask any user override.
      if (raw === undefined || raw === '') return {};
      return { vocabStore: { savingEnabled: parseBooleanEnv(raw, true) } };
    },
  },
  { name: 'localStorage', load: loadLocal },
  // Drop in later, nothing else changes:
  // { name: 'api', load: async () => { … fetch('/api/config') … } },
];

function resolveFrom(byProvider: Record<string, PartialClientConfig>): ClientConfig {
  // Fold from the LOWEST precedence upward so the first provider in the list is applied last.
  return [...providers]
    .reverse()
    .reduce<ClientConfig>((acc, p) => deepMerge(acc, byProvider[p.name] ?? {}), DEFAULTS);
}

// --- store -----------------------------------------------------------------

interface ConfigState {
  config: ClientConfig;
  status: 'pending' | 'ready';
  /** Each provider's last loaded partial, so a user override can re-resolve without re-loading. */
  byProvider: Record<string, PartialClientConfig>;
  init: () => Promise<void>;
  setUserOverride: (partial: PartialClientConfig) => void;
}

// Module-level so concurrent callers share one run and later callers are a no-op.
let initPromise: Promise<void> | null = null;

export const useClientConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULTS,
  status: 'pending',
  byProvider: {},

  init: () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const loaded = await Promise.all(
        providers.map(async (p) => {
          try {
            return [p.name, await p.load()] as const;
          } catch (error) {
            // A failed layer falls through to the ones below it — config always resolves.
            console.error(`Config provider "${p.name}" failed to load:`, error);
            return [p.name, {} as PartialClientConfig] as const;
          }
        }),
      );
      const byProvider = Object.fromEntries(loaded);
      set({ byProvider, config: resolveFrom(byProvider), status: 'ready' });
    })();
    return initPromise;
  },

  setUserOverride: (partial) => {
    const byProvider = { ...get().byProvider, localStorage: persist(partial) };
    // Re-resolve from the cached partials — never re-run providers. Once an `api` layer exists, a
    // local preference change must not trigger (and wait on) a network round trip.
    set({ byProvider, config: resolveFrom(byProvider) });
  },
}));

// --- accessors -------------------------------------------------------------

/**
 * React read. `useShallow` compares the selected slice field-by-field, so selecting a whole group
 * re-renders only when one of its fields changes (and is a harmless no-op for a primitive).
 */
export const useClientConfig = <T>(selector: (c: ClientConfig) => T): T =>
  useClientConfigStore(useShallow((s) => selector(s.config)));

/**
 * Sync read, for code outside React (services, fetch helpers).
 *
 * Safe because `ConfigGate` resolves config before rendering anything that could call this — so any
 * user-triggered code path runs with `status === 'ready'`. Outside the gated tree (or on the
 * server) it returns DEFAULTS.
 */
export const getClientConfig = (): ClientConfig => useClientConfigStore.getState().config;

/** Persists a user override and re-resolves. Env-provided entries still outrank it. */
export const setUserOverride = (partial: PartialClientConfig): void =>
  useClientConfigStore.getState().setUserOverride(partial);
