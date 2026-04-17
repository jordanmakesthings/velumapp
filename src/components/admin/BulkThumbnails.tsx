import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, Image as ImageIcon } from "lucide-react";
import { drawLibrary, drawPlayer, loadLogo, ensureFonts, uploadBlob_ } from "@/components/admin/ThumbnailGenerator";

type ContentType = "tracks" | "courses_v2" | "mastery_classes" | "subcategories";

const TYPE_META: Record<ContentType, {
  label: string;
  titleField: string;
  categoryField: string;
  landscapeField: string;
  squareField: string | null;
  uploadFolder: string;
}> = {
  tracks:         { label: "Tracks",          titleField: "title", categoryField: "category",    landscapeField: "thumbnail_url",         squareField: "thumbnail_square_url", uploadFolder: "images" },
  courses_v2:     { label: "Courses",          titleField: "title", categoryField: "course_type", landscapeField: "cover_image_url",       squareField: null,                   uploadFolder: "images" },
  mastery_classes:{ label: "Mastery Classes",  titleField: "title", categoryField: "theme",       landscapeField: "cover_image_url_16_9",  squareField: "player_image_url_1_1", uploadFolder: "images" },
  subcategories:  { label: "Subcategories",    titleField: "name",  categoryField: "category",    landscapeField: "thumbnail_url",         squareField: null,                   uploadFolder: "images" },
};

async function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

export default function BulkThumbnails() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ContentType>("tracks");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const libCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLCanvasElement | null>(null);

  // Load fonts + logo once
  useEffect(() => {
    ensureFonts();
    const load = async () => {
      const [logo] = await Promise.all([
        loadLogo(),
        (document as any).fonts?.load?.(`italic 300 60px 'Cormorant Garamond'`).catch(() => {}),
        (document as any).fonts?.load?.(`400 20px 'DM Sans'`).catch(() => {}),
      ]);
      logoRef.current = logo;
    };
    load();
  }, []);

  const meta = TYPE_META[selectedType];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["bulk-thumbs", selectedType],
    queryFn: async () => {
      const { data } = await supabase.from(selectedType).select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const visibleItems = items.filter((item: any) => {
    if (!onlyMissing) return true;
    const hasLandscape = !!item[meta.landscapeField];
    const hasSquare = meta.squareField ? !!item[meta.squareField] : true;
    return !hasLandscape || !hasSquare;
  });

  const toggleAll = () => {
    if (selected.size === visibleItems.length) setSelected(new Set());
    else setSelected(new Set(visibleItems.map((i: any) => i.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const runBulk = async () => {
    if (selected.size === 0) { toast.error("Select at least one item"); return; }
    if (!libCanvasRef.current || !playerCanvasRef.current) return;
    setRunning(true);
    setProgress(0);
    setCompleted(new Set());
    const targets = items.filter((i: any) => selected.has(i.id));
    let done = 0;

    for (const item of targets) {
      try {
        const title = item[meta.titleField] || "Untitled";
        const category = item[meta.categoryField] || "";

        drawLibrary(libCanvasRef.current!, title, category, logoRef.current);
        const libBlob = await canvasBlob(libCanvasRef.current!);
        if (!libBlob) throw new Error("Landscape render failed");
        const libUrl = await uploadBlob_(libBlob, meta.uploadFolder, "16x9");

        let squareUrl: string | null = null;
        if (meta.squareField) {
          drawPlayer(playerCanvasRef.current!, title, category, logoRef.current);
          const sqBlob = await canvasBlob(playerCanvasRef.current!);
          if (sqBlob) squareUrl = await uploadBlob_(sqBlob, meta.uploadFolder, "1x1");
        }

        const update: Record<string, string> = {};
        if (libUrl) update[meta.landscapeField] = libUrl;
        if (squareUrl && meta.squareField) update[meta.squareField] = squareUrl;

        const { error } = await supabase.from(selectedType).update(update).eq("id", item.id);
        if (error) throw error;

        setCompleted(prev => new Set(prev).add(item.id));
      } catch (err: any) {
        toast.error(`${item[meta.titleField]}: ${err.message}`);
      }
      done++;
      setProgress(done);
    }

    await queryClient.invalidateQueries({ queryKey: ["bulk-thumbs", selectedType] });
    await queryClient.invalidateQueries({ queryKey: ["tracks"] });
    await queryClient.invalidateQueries({ queryKey: ["courses_v2"] });
    await queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    await queryClient.invalidateQueries({ queryKey: ["mastery_classes"] });
    toast.success(`Generated ${done} thumbnail${done === 1 ? "" : "s"}`);
    setRunning(false);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-display text-2xl mb-1">Bulk Thumbnail Generator</h2>
        <p className="text-muted-foreground text-sm font-sans">Auto-brand Velum thumbnails for any content. Skips items that already have both a landscape + square when "Only missing" is on.</p>
      </div>

      {/* Hidden canvases used for rendering */}
      <canvas ref={libCanvasRef} style={{ display: "none" }} />
      <canvas ref={playerCanvasRef} style={{ display: "none" }} />

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_META) as ContentType[]).map(t => (
          <button
            key={t}
            onClick={() => { setSelectedType(t); setSelected(new Set()); setCompleted(new Set()); }}
            className={`px-4 py-2 rounded-xl text-xs font-sans font-medium transition-colors ${
              selectedType === t
                ? "gold-gradient text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-foreground/10"
            }`}
          >
            {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-xs text-muted-foreground font-sans cursor-pointer">
          <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
          Only missing
        </label>
        <button onClick={toggleAll} className="text-xs text-accent hover:underline">
          {selected.size === visibleItems.length && visibleItems.length > 0 ? "Deselect all" : "Select all"}
        </button>
        <span className="text-xs text-muted-foreground">
          {selected.size} of {visibleItems.length} selected
        </span>
        <div className="flex-1" />
        <button
          onClick={runBulk}
          disabled={running || selected.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-semibold disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {running ? `Generating ${progress}/${selected.size}…` : `Generate ${selected.size || ""} Thumbnails`}
        </button>
      </div>

      {/* List */}
      <div className="border border-foreground/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : visibleItems.length === 0 ? (
          <div className="p-12 text-center">
            <Check className="w-8 h-8 mx-auto text-accent mb-2" />
            <p className="text-foreground text-sm font-sans">All {meta.label.toLowerCase()} have thumbnails.</p>
          </div>
        ) : (
          <div className="divide-y divide-foreground/5">
            {visibleItems.map((item: any) => {
              const hasLandscape = !!item[meta.landscapeField];
              const hasSquare = meta.squareField ? !!item[meta.squareField] : true;
              const isComplete = completed.has(item.id);
              return (
                <label key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleOne(item.id)}
                    disabled={running}
                  />
                  <div className="w-12 h-12 rounded bg-background border border-foreground/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item[meta.landscapeField] ? (
                      <img src={item[meta.landscapeField]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-sans truncate">{item[meta.titleField] || "Untitled"}</p>
                    <p className="text-muted-foreground text-xs font-sans">
                      {item[meta.categoryField] || "—"}
                      {" · "}
                      <span className={hasLandscape ? "text-accent/60" : "text-destructive/60"}>
                        {hasLandscape ? "✓ 16:9" : "✗ 16:9"}
                      </span>
                      {meta.squareField && (
                        <>
                          {" · "}
                          <span className={hasSquare ? "text-accent/60" : "text-destructive/60"}>
                            {hasSquare ? "✓ 1:1" : "✗ 1:1"}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {isComplete && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
