// Client-side toast store. A tiny module-level pub/sub so that non-React code
// (e.g. the fire-and-forget `saveVocab`) can raise a notice without a hook.
// No server involved — `ToastHost` subscribes and renders in the browser.

export type ToastVariant = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface NotifyInput {
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms (default 5000). */
  ttl?: number;
  /**
   * Coalescing key. Repeated notifies with the same key inside `coalesceMs` are
   * dropped, so a burst of failures (e.g. one per word) shows a single toast.
   */
  dedupeKey?: string;
  /** Window for `dedupeKey` coalescing (default 5000ms). */
  coalesceMs?: number;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const lastShownAt = new Map<string, number>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function notify(input: NotifyInput): void {
  const { message, variant = 'info', ttl = 5000, dedupeKey, coalesceMs = 5000 } = input;

  if (dedupeKey) {
    const now = Date.now();
    const last = lastShownAt.get(dedupeKey) ?? 0;
    if (now - last < coalesceMs) return; // coalesced — skip this one
    lastShownAt.set(dedupeKey, now);
  }

  const toast: Toast = { id: nextId++, message, variant };
  toasts = [...toasts, toast];
  emit();

  if (ttl > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => dismiss(toast.id), ttl);
  }
}
