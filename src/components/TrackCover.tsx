// Generative cover for a custom track:
// - Hash trackId → pick from the curated cover pool (deterministic per track)
// - Render the chosen image with a Cormorant serif title overlaid
// - Falls back to a clean dark-green panel if the image fails to load

interface Props {
  trackId: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "hero";
  rounded?: "lg" | "xl" | "2xl" | "3xl" | "full";
  showTitle?: boolean;     // hero usually true; thumbnails usually false
  className?: string;
}

const COVER_BASE = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/track-covers";

// Match the slugs uploaded by scripts/generate-covers.ts.
// Add/remove slugs here if you change the pool.
const COVER_SLUGS = [
  "01-doorway", "02-water", "03-candle", "04-forest", "05-horizon",
  "06-cloth", "07-sky", "08-stone", "09-flame", "10-mist",
  "11-leaves", "12-cosmic", "13-window", "14-path", "15-feather",
  "16-mountains", "17-orb", "18-rain", "19-cave", "20-moon",
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

export function coverUrlFor(trackId: string): string {
  const slug = COVER_SLUGS[hash(trackId) % COVER_SLUGS.length];
  return `${COVER_BASE}/${slug}.jpg`;
}

const sizeMap = {
  sm:   { wh: "w-14 h-14",  title: "text-xs" },
  md:   { wh: "w-20 h-20",  title: "text-sm" },
  lg:   { wh: "w-32 h-32",  title: "text-base" },
  hero: { wh: "w-full aspect-[16/10] md:aspect-[16/9]", title: "text-2xl md:text-3xl" },
};

const radiusMap = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
} as const;

export function TrackCover({ trackId, title, size = "md", rounded = "2xl", showTitle = false, className = "" }: Props) {
  const cfg = sizeMap[size];
  const url = coverUrlFor(trackId);

  return (
    <div
      className={`${cfg.wh} ${radiusMap[rounded]} relative overflow-hidden shrink-0 border border-accent/25 bg-[hsl(156,52%,9%)] ${className}`}
      aria-hidden="true"
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      {showTitle && title && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
            <p
              className={`text-foreground font-serif font-normal leading-tight drop-shadow-2xl ${cfg.title}`}
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {title}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
