// What a config entry IS — the contract every declaration is written against, and the machinery
// that derives types from a table of them. Deliberately generic: this file knows about no setting,
// no env var and no storage key, so the declaration table beside it stays purely declarative (and a
// server-side table could reuse this unchanged).
//
// An entry declares its `defaultValue` plus the sources it opts into. Each source is paired with its
// parser by the type, so a source without validation is a compile error and no untrusted value can
// reach the app unparsed.

/** Deployment layer. Either both fields or neither — a raw env string is never used unparsed. */
type EnvSource<T> =
  | {
      /**
       * A getter, NOT a key string: Next.js inlines `process.env.NEXT_PUBLIC_X` at build time by
       * matching that exact text, so a dynamic lookup by name would be `undefined` in the browser.
       */
      envValue: () => string | undefined;
      /** `null` = the deployment set something invalid; the layer below wins. */
      parseEnv: (raw: string) => T | null;
    }
  | { envValue?: never; parseEnv?: never };

/** This-device layer. Its own localStorage key — no shared blob, so entries can't affect each other. */
type StoredSource<T> =
  | {
      localStorageKey: string;
      /** Stored values are untrusted (hand-editable, or written by an older release). `null` = drop. */
      parse: (raw: unknown) => T | null;
      /** May `setUserOverride` write it? `false` = read-only on this device (a migrated legacy value). */
      userOverride: boolean;
    }
  | { localStorageKey?: never; parse?: never; userOverride?: never };

export type ConfigEntry<T> = { defaultValue: T } & EnvSource<T> & StoredSource<T>;

/**
 * Declares one entry. Always call it with an explicit type argument — under a bare
 * `ConfigEntry<unknown>` constraint a mismatched `parse` (the wrong module's validator) would
 * type-check fine; `defineEntry<TuningConfig>` makes it an error.
 */
export const defineEntry = <T>(entry: ConfigEntry<T>): ConfigEntry<T> => entry;

/**
 * Type-erased view of an entry, for the generic walkers that route values between a source and the
 * resolved config and never inspect one. Keeping the erasure here means no provider casts anything.
 */
export interface AnyConfigEntry {
  defaultValue: unknown;
  envValue?: () => string | undefined;
  parseEnv?: (raw: string) => unknown;
  localStorageKey?: string;
  parse?: (raw: unknown) => unknown;
  userOverride?: boolean;
}

/** The resolved config type for a table: each entry replaced by the type of the value it holds. */
export type ConfigOf<Table> = {
  [K in keyof Table]: Table[K] extends { defaultValue: infer T } ? T : never;
};
