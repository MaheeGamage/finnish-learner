// The contract a config source implements. Kept out of config.client.ts to avoid a cycle: the
// providers need this type, and the facade imports the providers.
//
// The config *shape* is not here — it's derived from the declaration table in entries.client.ts.

import type { PartialClientConfig } from './entries.client.ts';

/**
 * A config source. Its position in the facade's providers list is its precedence (earlier wins),
 * and `load` may be sync or async — which is what keeps a future `/api/config` layer a drop-in.
 *
 * A provider is generic over the entry table: it walks the entries, picks out the ones declaring
 * its kind of source, and contributes only those. Adding an entry never means editing a provider.
 */
export interface ConfigProvider {
  name: string;
  load: () => PartialClientConfig | Promise<PartialClientConfig>;
}
