import { useEffect, useState } from "react";
import { Sparkles, Check, Wand2 } from "lucide-react";
import ThumbnailGenerator from "@/components/admin/ThumbnailGenerator";
import { listAllCovers, type TrackCover } from "@/lib/track-covers";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "meditation", label: "Meditation" },
  { value: "rapid_resets", label: "Rapid Resets" },
  { value: "breathwork", label: "Breathwork" },
  { value: "tapping", label: "EFT Tapping" },
  { value: "journaling", label: "Journaling" },
];

// A playground for crafting beautiful thumbnails: type a title, pick a category,
// choose the painterly artwork (or let it auto-match by meaning), see it render
// live, and download. Reuses ThumbnailGenerator so the output is identical to
// what the track editors produce.
export default function ThumbnailStudio() {
  const [title, setTitle] = useState("The Why of Meditation");
  const [category, setCategory] = useState("meditation");
  const [covers, setCovers] = useState<TrackCover[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>(""); // "" = auto-match

  useEffect(() => {
    listAllCovers().then(setCovers).catch(() => setCovers([]));
  }, []);

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-display text-foreground">Thumbnail Studio</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Title</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Evening Wind Down" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">Artwork</label>
            <div className="grid grid-cols-4 gap-2">
              {/* Auto tile */}
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                  coverUrl === "" ? "border-accent ring-1 ring-accent" : "border-foreground/10 hover:border-foreground/30"
                }`}
              >
                <Wand2 className="w-4 h-4 text-accent" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Auto</span>
                {coverUrl === "" && <Check className="absolute top-1 right-1 w-3 h-3 text-accent" />}
              </button>

              {covers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCoverUrl(c.url)}
                  title={`${c.name}${c.mood ? ` — ${c.mood}` : ""}`}
                  className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                    coverUrl === c.url ? "border-accent ring-1 ring-accent" : "border-foreground/10 hover:border-foreground/30"
                  }`}
                >
                  <img src={c.url} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                  {coverUrl === c.url && (
                    <span className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-foreground drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-2">
              {coverUrl === "" ? "Auto picks the cover whose theme best matches your title." : "Hand-picked cover."}
            </p>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-foreground/10 bg-card/40 p-5">
          <ThumbnailGenerator
            title={title}
            category={category}
            enabled
            onToggle={() => {}}
            coverUrlOverride={coverUrl || undefined}
          />
        </div>
      </div>
    </div>
  );
}
