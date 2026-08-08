'use client';

import { useEffect, type ReactNode } from 'react';
import { useClientConfigStore } from './config.client.ts';

/**
 * Resolves the client config once, and holds its children back until it's done.
 *
 * That wait is what makes every consumer simple: inside this gate config is always resolved, so
 * components read it with `useClientConfig` and plain functions with `getClientConfig()` — nobody
 * needs an async read or a "is it ready yet" branch.
 *
 * Two consequences worth knowing:
 *  - `init()` runs in an effect, so on the server `status` is 'pending' and the *fallback* is what
 *    gets server-rendered — this trades SSR'd content for a brief placeholder. Cheap today, since
 *    both providers are synchronous and the wait is a single render.
 *  - Add an async (`/api/config`) provider and this gate starts blocking the whole app on a network
 *    request. Revisit it then: letting defaults render and swapping values in degrades better.
 *
 * Mounted around page content only, not the whole layout, so the chrome (TopBar) still paints
 * immediately.
 */
export default function ConfigGate({ children }: { children: ReactNode }) {
  const status = useClientConfigStore((s) => s.status);

  useEffect(() => {
    void useClientConfigStore.getState().init();
  }, []);

  // Deliberately blank rather than a spinner: the wait is one render on a local read, and a
  // flashing "Loading…" would be more jarring than nothing. Keeps layout height stable.
  if (status === 'pending') return <div className="min-h-screen" aria-busy="true" />;

  return <>{children}</>;
}
