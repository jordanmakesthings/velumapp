// Thin wrapper around the Reddit Pixel base script. Base script is injected
// from index.html and exposes a global `rdt(...)` function. This module gives
// us typed, no-op-safe access from React code.
//
// Events:
//   PageVisit   — fired automatically by the base script on every load
//   ViewContent — landing page deep-engagement (we don't fire this yet)
//   Lead        — fire when an email is captured (lead magnet form, etc.)
//   SignUp      — fire when account creation completes
//   Purchase    — fire when paid subscription confirmed; pass { value, currency }

declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void;
  }
}

type RedditEvent = "Lead" | "SignUp" | "Purchase" | "ViewContent" | "AddToCart" | "Custom";

interface PurchaseData {
  value: number;
  currency: string;
  conversionId?: string;
}

interface LeadData {
  email?: string;
  conversionId?: string;
}

export function rdtTrack(event: "Lead", data?: LeadData): void;
export function rdtTrack(event: "SignUp", data?: { conversionId?: string }): void;
export function rdtTrack(event: "Purchase", data: PurchaseData): void;
export function rdtTrack(event: RedditEvent, data?: Record<string, unknown>): void;
export function rdtTrack(event: RedditEvent, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (typeof window.rdt !== "function") return; // pixel not loaded (dev / blocked)
  try {
    if (data) window.rdt("track", event, data);
    else window.rdt("track", event);
  } catch {
    // never throw from analytics
  }
}
