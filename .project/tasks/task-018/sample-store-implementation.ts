// ============================================================================
// client-config.ts — layered config store, async-ready, nested config.
//
// Providers each supply a partial config. init() merges them by precedence
// (array order, first defined value wins) into one final object. Consumers read
// from the store and never know which provider a value came from.
//
// `config` starts as DEFAULTS, then init() overwrites it with the fully
// resolved values (including any async/API layer). No seed() step.
// ============================================================================

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// 1. Config shape — now with NESTED levels. --------------------------------
//    `rating` groups per-button settings two levels deep, `ui` is a flat
//    top-level group. Mix as deep as you like.
export interface AppConfig {
  ui: {
    theme: 'light' | 'dark';
    pageSize: number;
  };
  rating: {
    again: { multiplier: number; initialValue: number };
    good: { multiplier: number; initialValue: number };
  };
}

// DeepPartial so a provider can supply just `{ ui: { theme: 'dark' } }`
// without having to fill in every nested field.
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
type PartialConfig = DeepPartial<AppConfig>;

const DEFAULTS: AppConfig = {
  ui: { theme: 'light', pageSize: 20 },
  rating: {
    again: { multiplier: 0, initialValue: 1 },
    good: { multiplier: 2.5, initialValue: 1 },
  },
};

// 2. Providers. Order = precedence (earliest wins). Sync or async. ---------
const providers: { name: string; load: () => PartialConfig | Promise<PartialConfig> }[] = [
  {
    name: 'localStorage',
    load: () => {
      if (typeof window === 'undefined') return {};
      try {
        return JSON.parse(localStorage.getItem('app-config') ?? '{}');
      } catch {
        return {};
      }
    },
  },
  // Drop in later, nothing else changes:
  // {
  //   name: 'api',
  //   load: async () => {
  //     try {
  //       const r = await fetch('/api/config');
  //       return r.ok ? await r.json() : {};
  //     } catch {
  //       return {};
  //     }
  //   },
  // },
  {
    name: 'default',
    load: () => DEFAULTS,
  },
];

// 3. Deep merge: later objects fill gaps the earlier ones left. Because
//    providers are listed highest-precedence FIRST, we fold from the LAST
//    (default) upward so earlier providers overwrite later ones. ----------
function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const key in override) {
    const o = override[key as keyof typeof override];
    const b = (base as any)[key];
    out[key] =
      o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object'
        ? deepMerge(b, o as any)
        : o;
  }
  return out;
}

function resolve(loaded: PartialConfig[]): AppConfig {
  // Start from DEFAULTS, apply providers from lowest precedence to highest so
  // the highest-precedence (first in the array) is applied last and wins.
  return [...loaded].reverse().reduce<AppConfig>(
    (acc, partial) => deepMerge(acc, partial),
    DEFAULTS
  );
}

// 4. Store -----------------------------------------------------------------
interface State {
  config: AppConfig;
  status: 'seeded' | 'ready';
  init: () => Promise<void>;
  setUserOverride: (partial: PartialConfig) => void;
}

export const useAppConfigStore = create<State>((set) => ({
  config: DEFAULTS,
  status: 'seeded',

  init: async () => {
    const loaded = await Promise.all(providers.map((p) => p.load()));
    set({ config: resolve(loaded), status: 'ready' });
  },

  setUserOverride: (partial) => {
    const current = JSON.parse(localStorage.getItem('app-config') ?? '{}');
    localStorage.setItem('app-config', JSON.stringify(deepMerge(current, partial)));
    useAppConfigStore.getState().init();
  },
}));

// 5. Accessors -------------------------------------------------------------
export const useConfig = <T>(selector: (c: AppConfig) => T): T =>
  useAppConfigStore(useShallow((s) => selector(s.config)));

export const getConfig = (): AppConfig => useAppConfigStore.getState().config;

// ---------------------------------------------------------------------------
// Accessing nested config
// ---------------------------------------------------------------------------
//
//   // One deep primitive — re-renders only when THIS value changes:
//   const goodMult = useConfig((c) => c.rating.good.multiplier);
//
//   // A whole nested group — useShallow compares its fields, so it re-renders
//   // only when good.multiplier OR good.initialValue changes:
//   const good = useConfig((c) => c.rating.good);   // { multiplier, initialValue }
//
//   // A flat top-level group:
//   const { theme, pageSize } = useConfig((c) => c.ui);
//
//   // Plain service — reach as deep as you want, no hook:
//   function nextInterval() {
//     const { multiplier, initialValue } = getConfig().rating.good;
//     return initialValue * multiplier;
//   }
//
//   // Settings page — override just one deep field; deepMerge keeps the rest:
//   useAppConfigStore.getState().setUserOverride({
//     rating: { good: { multiplier: 3.0 } },
//   });