/**
 * notifications — public API
 * Client-side, non-blocking toast notices. A module-level pub/sub (`notify`) lets any
 * code — including non-React, fire-and-forget calls — raise a toast; `ToastHost`
 * (mounted once in the root layout) renders them. No server involved.
 */

export { notify, dismiss, subscribe } from './toastStore';
export type { Toast, ToastVariant } from './toastStore';
export { default as ToastHost } from './ToastHost';
