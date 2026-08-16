// Environment-variable config source — deployment overrides, highest precedence.
//
// This is the layer a deployer controls, so it outranks a user's stored preference: a kill-switch
// set on the deployment must not be re-enabled from a browser.
//
// Generic over the declaration table: it contributes every entry that declares an `envValue` getter,
// and knows about no variable in particular.

import { configEntryList } from '../entries.client.ts';
import type { PartialClientConfig } from '../entries.client.ts';
import type { ConfigProvider } from '../types.ts';

export const envProvider: ConfigProvider = {
  name: 'env',
  load: () => {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of configEntryList()) {
      if (!entry.envValue || !entry.parseEnv) continue;
      const raw = entry.envValue();
      // Contribute ONLY when the variable is actually set. Contributing a fallback here would put
      // this layer's own default above localStorage on every read, and so permanently mask any user
      // override of an env-backed entry.
      if (raw === undefined || raw === '') continue;
      const value = entry.parseEnv(raw);
      if (value === null || value === undefined) {
        // A deployment set something invalid: fall through to the layers below rather than crash.
        console.error(`Invalid value for config "${key}" in the environment; ignored.`);
        continue;
      }
      out[key] = value;
    }
    return out as PartialClientConfig;
  },
};
