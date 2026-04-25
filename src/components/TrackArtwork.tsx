// Cover art for custom tracks.
// Currently a clean serif-letter monogram — placeholder until fal.ai
// AI-generated covers are wired up. Same component API; swap internals
// later without touching call sites.

interface Props {
  trackId: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "hero";
  rounded?: "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
}

const sizeMap = {
  sm:   { wh: "w-12 h-12",  text: "text-xl" },
  md:   { wh: "w-20 h-20",  text: "text-3xl" },
  lg:   { wh: "w-32 h-32",  text: "text-5xl" },
  hero: { wh: "w-full aspect-square md:aspect-[16/10]", text: "text-7xl md:text-8xl" },
};

const radiusMap = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
} as const;

export function TrackArtwork({ trackId: _trackId, title, size = "md", rounded = "2xl", className = "" }: Props) {
  const cfg = sizeMap[size];
  const letter = (title?.trim()?.[0] || "✦").toUpperCase();

  return (
    <div
      className={`${cfg.wh} ${radiusMap[rounded]} relative overflow-hidden shrink-0 border border-accent/25 flex items-center justify-center bg-[hsl(156,52%,11%)] ${className}`}
      aria-hidden="true"
    >
      {/* Subtle radial highlight */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(circle at 30% 25%, hsl(42 53% 45% / 0.18) 0%, transparent 60%)",
        }}
      />
      <span
        className={`relative font-serif font-light text-accent ${cfg.text} leading-none`}
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {letter}
      </span>
    </div>
  );
}
