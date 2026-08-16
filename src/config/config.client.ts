// Client-safe app config — the single facade between anything that CONSUMES a config value and
// anything that PROVIDES one. This file only wires the layers together; each value is declared once
// in `entries.client.ts` and each source lives in its own file under `providers/`.
//
// Every provider contributes a partial config; `resolveFrom()` picks, per entry, the first layer
// that actually supplied a value. A consumer reads `getClientConfig().SRS_TUNING` and never learns
// whether that came from a constant, an env var, localStorage, or (later) the backend — so moving an
// entry between sources is a change to its declaration and nowhere else.
//
// Precedence: env > localStorage > the entry's `defaultValue`. Env is a *deployment* override, so a
// kill-switch like VOCAB_SAVING_ENABLED has to beat a user preference.
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
import { configEntryList } from './entries.client.ts';
import { envProvider } from './providers/envProvider.ts';
import { localStorageProvider, persistUserOverride } from './providers/localStorageProvider.ts';
import type { ClientConfig, PartialClientConfig } from './entries.client.ts';
import type { ConfigProvider } from './types.ts';

// Re-exported so callers only ever need to know about the facade.
export type { ClientConfig, ConfigKey, PartialClientConfig } from './entries.client.ts';

// Order is precedence: earlier wins.
const providers: ConfigProvider[] = [
  envProvider,
  localStorageProvider,
  // Drop in later, nothing else changes:
  // apiProvider,
];

/**
 * One resolved value per entry: the first provider that contributed one, else the declared default.
 * Flat entries mean no merging — a value is taken from exactly one layer, whole.
 */
function resolveFrom(byProvider: Record<string, PartialClientConfig>): ClientConfig {
  const out: Record<string, unknown> = {};
  for (const [key, entry] of configEntryList()) {
    let value: unknown;
    for (const p of providers) {
      const contributed = (byProvider[p.name] as Record<string, unknown> | undefined)?.[key];
      if (contributed !== undefined) {
        value = contributed;
        break;
      }
    }
    out[key] = value ?? entry.defaultValue;
  }
  return out as ClientConfig;
}

/** The bottom layer: every entry at its declared default, with no provider heard from. */
const CLIENT_CONFIG_DEFAULTS: ClientConfig = resolveFrom({});

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
  config: CLIENT_CONFIG_DEFAULTS,
  status: 'pending',
  byProvider: {},

  init: () => {
    // Compared against null rather than tested for truthiness: a bare `if (initPromise)` reads like
    // a forgotten `await` (every Promise is truthy), which is exactly what S6544 flags.
    if (initPromise !== null) return initPromise;
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
    const byProvider = {
      ...get().byProvider,
      [localStorageProvider.name]: persistUserOverride(partial),
    };
    // Re-resolve from the cached partials — never re-run providers. Once an `api` layer exists, a
    // local preference change must not trigger (and wait on) a network round trip.
    set({ byProvider, config: resolveFrom(byProvider) });
  },
}));

// --- accessors -------------------------------------------------------------

/**
 * React read. `useShallow` compares the selected slice field-by-field, so selecting an entry that
 * holds an object re-renders only when one of its fields changes (a harmless no-op for a primitive).
 */
export const useClientConfig = <T>(selector: (c: ClientConfig) => T): T =>
  useClientConfigStore(useShallow((s) => selector(s.config)));

/**
 * Sync read, for code outside React (services, fetch helpers).
 *
 * Safe because `ConfigGate` resolves config before rendering anything that could call this — so any
 * user-triggered code path runs with `status === 'ready'`. Outside the gated tree (or on the
 * server) it returns the declared defaults.
 */
export const getClientConfig = (): ClientConfig => useClientConfigStore.getState().config;

/**
 * Persists a user override and re-resolves. Only entries declaring `userOverride: true` are
 * writable — anything else is refused and logged. Env-provided entries still outrank it.
 */
export const setUserOverride = (partial: PartialClientConfig): void =>
  useClientConfigStore.getState().setUserOverride(partial);
