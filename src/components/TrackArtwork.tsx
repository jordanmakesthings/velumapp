// Generative cover art for custom tracks.
// Deterministic from the track id — same track always renders the same orb.
// Constrained to Velum's palette: deep green base + 2 brand-adjacent
// hue blobs (gold, sage, blue-green, rose-gold, plum, amber, ocean).
// No assets, no API calls — runs in CSS.

interface Props {
  trackId: string;
  size?: "sm" | "md" | "lg" | "hero";
  rounded?: "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
}

// Brand-anchored palette pairs (always paired so the result feels intentional)
const PALETTES: Array<[string, string]> = [
  ["42 53% 55%", "156 51% 22%"],   // gold + emerald
  ["156 51% 30%", "42 53% 50%"],   // sage + gold
  ["170 45% 28%", "42 53% 50%"],   // teal + gold
  ["28 60% 50%",  "156 51% 18%"],  // amber + dark forest
  ["340 35% 45%", "42 53% 50%"],   // dusty rose + gold
  ["260 28% 38%", "42 53% 50%"],   // plum + gold
  ["200 40% 35%", "156 51% 22%"],  // ocean + emerald
  ["50 50% 55%",  "156 51% 22%"],  // honey + emerald
  ["12 50% 45%",  "42 53% 50%"],   // ember + gold
  ["180 35% 30%", "42 53% 50%"],   // cyan-teal + gold
];

// FNV-1a 32-bit hash — fast + good distribution
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

const sizeMap = {
  sm:   { wh: "w-12 h-12",  blur: 14 },
  md:   { wh: "w-20 h-20",  blur: 22 },
  lg:   { wh: "w-32 h-32",  blur: 28 },
  hero: { wh: "w-full aspect-square md:aspect-[16/10]", blur: 60 },
};

export function TrackArtwork({ trackId, size = "md", rounded = "2xl", className = "" }: Props) {
  const h = hash(trackId);
  const palette = PALETTES[h % PALETTES.length];
  const [hueA, hueB] = palette;

  // Two blob positions, derived from the hash — gives each track a unique "shape"
  const ax = (h >> 4) % 70 + 10;            // 10–80%
  const ay = (h >> 10) % 70 + 10;
  const bx = (h >> 16) % 70 + 10;
  const by = (h >> 22) % 70 + 10;
  const rotation = (h >> 28) * 11;          // crude rotation seed

  const cfg = sizeMap[size];

  const radiusMap = {
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  } as const;

  return (
    <div
      className={`${cfg.wh} ${radiusMap[rounded]} relative overflow-hidden shrink-0 border border-accent/20 ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at ${ax}% ${ay}%, hsla(${hueA}, 0.85) 0%, transparent 55%),
          radial-gradient(ellipse at ${bx}% ${by}%, hsla(${hueB}, 0.7) 0%, transparent 60%),
          linear-gradient(135deg, hsl(156, 52%, 9%), hsl(156, 52%, 6%))
        `,
        filter: `blur(0px)`,
      }}
      aria-hidden="true"
    >
      {/* Inner glow + texture */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-50"
        style={{
          background: `radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 60%)`,
        }}
      />
      {/* Subtle film grain via SVG noise */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] mix-blend-overlay pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <filter id={`noise-${trackId.slice(0, 8)}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={h % 1000} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${trackId.slice(0, 8)})`} />
      </svg>
      {/* Corner accent — gold spark */}
      <div
        className="absolute w-[40%] h-[40%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsla(42, 53%, 55%, 0.3) 0%, transparent 70%)`,
          top: `${(rotation % 60) - 20}%`,
          right: `${(rotation % 50) - 15}%`,
          filter: `blur(${cfg.blur}px)`,
        }}
      />
    </div>
  );
}
