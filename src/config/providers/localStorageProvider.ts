// localStorage config source — this device's user overrides. Owns both directions: reading stored
// values into a partial, and writing an override back.
//
// One key per entry, named by the entry itself. No shared blob, so there is no blob version to
// migrate and no way for one bad value to take its neighbours down with it: a key that fails to
// parse is dropped on its own and that entry falls back to the layer below.
//
// Generic over the declaration table — it knows about no setting in particular.

import { configEntry, configEntryList } from '../entries.client.ts';
import type { PartialClientConfig } from '../entries.client.ts';
import type { ConfigProvider } from '../types.ts';

/** Reads one entry's key. Returns undefined for absent, unreadable, unparseable or invalid values. */
function readEntry(storageKey: string, parse: (raw: unknown) => unknown): unknown {
  let raw: string | null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {
    return undefined; // storage disabled (private mode, blocked cookies)
  }
  if (raw === null) return undefined;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return undefined; // hand-edited garbage
  }
  // Untrusted: validated by the owning module before it can reach e.g. the SRS interval maths.
  return parse(json) ?? undefined;
}

/** Everything this device has stored, validated. The single reader for this layer. */
function loadLocal(): PartialClientConfig {
  if (typeof window === 'undefined') return {};
  const out: Record<string, unknown> = {};
  for (const [key, entry] of configEntryList()) {
    if (!entry.localStorageKey || !entry.parse) continue;
    const value = readEntry(entry.localStorageKey, entry.parse);
    if (value !== undefined) out[key] = value;
  }
  return out as PartialClientConfig;
}

export const localStorageProvider: ConfigProvider = {
  name: 'localStorage',
  load: loadLocal,
};

/**
 * Writes each entry in the override to its own key, then re-reads the whole layer so the caller's
 * cached copy is exactly what a fresh load would produce — which also means a value that somehow
 * fails its own validator on the way back out can't linger in memory.
 */
export function persistUserOverride(partial: PartialClientConfig): PartialClientConfig {
  if (typeof window === 'undefined') return {};
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    const entry = configEntry(key);
    if (!entry?.localStorageKey || !entry.userOverride) {
      // Not a per-device setting (env-only, or read-only here). Refused loudly rather than written
      // to a key nothing reads, which would look like it worked.
      console.error(`Config "${key}" is not user-writable; override ignored.`);
      continue;
    }
    try {
      localStorage.setItem(entry.localStorageKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving config "${key}":`, error);
    }
  }
  return loadLocal();
}
