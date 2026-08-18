// THE single place a client config value is declared. One entry per value, flat — adding a setting
// means adding one entry here and nothing else: the providers are generic walkers over this table
// and `ClientConfig` is derived from it, so no type, no env read and no storage key is written twice.
//
// What an entry may declare, and why the pairs are mandatory, is in entry.ts. Precedence is fixed by
// the facade (env > localStorage > defaultValue); an entry only opts into the layers it wants.
//
// Flat on purpose: nesting bought grouping-by-owning-module and cost a deep-merge layer, a nested
// partial type and per-group storage plumbing. An entry may still *hold* an object (SRS_TUNING does)
// — it is then stored and validated atomically by its owning module's parser.

import { defineEntry } from './entry.ts';
import type { AnyConfigEntry, ConfigOf } from './entry.ts';
import { parseBooleanEnv } from './booleanEnv.ts';
// Deep path, not the module barrel, for two reasons: `@/modules/vocab-test` re-exports client.ts,
// which reads config back (an import cycle), and the `@/` alias doesn't resolve under Node's test
// runner. The module owns its shape, defaults and validator; this table only says where it lives.
import { DEFAULT_TUNING, parseTuning } from '../modules/vocab-test/settings.ts';
import type { TuningConfig } from '../modules/vocab-test/settings.ts';

export const CLIENT_CONFIG_ENTRIES = {
  /**
   * Deployment kill-switch for writing to the user's sheet. Env-only: env outranks localStorage, so
   * a per-device toggle would silently do nothing on any deployment that sets the variable.
   */
  VOCAB_SAVING_ENABLED: defineEntry<boolean>({
    defaultValue: true,
    envValue: () => process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED,
    parseEnv: (raw) => parseBooleanEnv(raw, true),
  }),

  /** The whole SRS tuning as one atomic value — validated by its owning module (task-011). */
  SRS_TUNING: defineEntry<TuningConfig>({
    defaultValue: DEFAULT_TUNING,
    // Language-neutral: the app is meant to extend beyond Finnish, so `finnish_` is reserved for
    // values that really are about the Finnish language. The pre-existing `finnish_srs_tuning` key
    // is deliberately NOT read — see the task log; a device's saved tuning resets once, to Standard.
    localStorageKey: 'srs_tuning',
    parse: parseTuning,
    userOverride: true,
  }),
};

// --- derived from the table above; nothing below is hand-maintained ---------

/** The resolved config — derived from the table, never hand-written. */
export type ClientConfig = ConfigOf<typeof CLIENT_CONFIG_ENTRIES>;

export type ConfigKey = keyof ClientConfig;

/** What one layer contributes: any subset of the entries. Flat, so a plain `Partial`. */
export type PartialClientConfig = Partial<ClientConfig>;

/** The table as a list, type-erased, for the providers and the facade to walk. */
export const configEntryList = (): [ConfigKey, AnyConfigEntry][] =>
  Object.entries(CLIENT_CONFIG_ENTRIES) as [ConfigKey, AnyConfigEntry][];

/** One entry by key, for lookups from untrusted input (an override naming a key that isn't ours). */
export const configEntry = (key: string): AnyConfigEntry | undefined =>
  (CLIENT_CONFIG_ENTRIES as Record<string, AnyConfigEntry>)[key];
