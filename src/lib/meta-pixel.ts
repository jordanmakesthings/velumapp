// Thin wrapper around Meta Pixel base script (window.fbq). Base script is
// injected from index.html and exposes the global `fbq` function. This module
// gives typed, no-op-safe access from React code so calls don't throw if the
// pixel isn't loaded (dev / blocked / not yet configured).
//
// Standard Meta events we use:
//   PageView        — fired automatically by base script
//   ViewContent     — landing on /trial-free or /premium
//   Lead            — email captured (signup form submit)
//   CompleteRegistration — account creation completed
//   Purchase        — paid subscription confirmed (with value + currency)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaEvent =
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "Purchase"
  | "AddToCart"
  | "InitiateCheckout";

export function fbqTrack(event: MetaEvent, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return; // pixel not loaded
  try {
    if (data) window.fbq("track", event, data);
    else window.fbq("track", event);
  } catch {
    // never throw from analytics
  }
}
