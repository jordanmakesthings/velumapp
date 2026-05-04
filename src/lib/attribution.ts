// Attribution capture: stores UTM params + referrer + landing page on first
// arrival, persists in localStorage, and exposes them for write to profile
// at signup time. Designed to survive across page navigations within the
// same session — first-touch attribution wins.

const STORAGE_KEY = "velum_attribution_v1";

export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_page: string | null;
}

const EMPTY: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer: null,
  landing_page: null,
};

function clean(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, 200);
}

// Pull UTMs from current URL + referrer + landing path. Called on every page
// load — but only writes to localStorage if nothing's there yet (first-touch).
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      // First-touch already captured. Don't overwrite.
      // Exception: if existing has no utm_source but the current URL does, upgrade it.
      const parsed = JSON.parse(existing) as Attribution;
      const params = new URLSearchParams(window.location.search);
      if (!parsed.utm_source && params.get("utm_source")) {
        const upgraded: Attribution = {
          ...parsed,
          utm_source: clean(params.get("utm_source")),
          utm_medium: clean(params.get("utm_medium")),
          utm_campaign: clean(params.get("utm_campaign")),
          utm_content: clean(params.get("utm_content")),
          utm_term: clean(params.get("utm_term")),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const attr: Attribution = {
      utm_source: clean(params.get("utm_source")),
      utm_medium: clean(params.get("utm_medium")),
      utm_campaign: clean(params.get("utm_campaign")),
      utm_content: clean(params.get("utm_content")),
      utm_term: clean(params.get("utm_term")),
      referrer: clean(document.referrer),
      landing_page: clean(window.location.pathname + window.location.search),
    };

    const hasAnything = Object.values(attr).some((v) => v !== null);
    if (hasAnything) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
    }
  } catch {
    // Never throw from analytics
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Attribution) };
  } catch {
    return EMPTY;
  }
}

export function clearAttribution(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
