import { useEffect, useRef, useCallback, useState } from "react";
import { Download, Upload, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a2873bb8066a6ad6856b40/da248335d_CopyofCopyofLogo.png";

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "Meditation",
  rapid_resets: "Rapid Resets",
  breathwork: "Breathwork",
  tapping: "EFT Tapping",
  journaling: "Journaling",
};

let cachedLogo: HTMLCanvasElement | null = null;
let logoLoadPromise: Promise<HTMLCanvasElement | null> | null = null;

function loadLogo(): Promise<HTMLCanvasElement | null> {
  if (cachedLogo) return Promise.resolve(cachedLogo);
  if (logoLoadPromise) return logoLoadPromise;
  logoLoadPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = img.width;
      off.height = img.height;
      const ctx = off.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, off.width, off.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) d[i + 3] = 0;
      }
      ctx.putImageData(id, 0, 0);
      cachedLogo = off;
      resolve(off);
    };
    img.onerror = () => resolve(null);
    img.src = LOGO_URL;
  });
  return logoLoadPromise;
}

function ensureFonts() {
  if (document.getElementById("velum-gfonts")) return;
  const link = document.createElement("link");
  link.id = "velum-gfonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=DM+Sans:wght@400&display=swap";
  document.head.appendChild(link);
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);
  const cx = W * 0.15, cy = H;
  const r = Math.max(W, H) * 0.9;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, "#1a4a3a");
  grad.addColorStop(0.25, "#0F2F26");
  grad.addColorStop(0.65, "#111111");
  grad.addColorStop(1, "#111111");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGoldLine(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number) {
  const x0 = cx - width / 2, x1 = cx + width / 2;
  const g = ctx.createLinearGradient(x0, y, x1, y);
  g.addColorStop(0, "rgba(201,168,76,0)");
  g.addColorStop(0.2, "#C9A84C");
  g.addColorStop(0.8, "#C9A84C");
  g.addColorStop(1, "rgba(201,168,76,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; } else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let curX = x;
  for (const ch of text) { ctx.fillText(ch, curX, y); curX += ctx.measureText(ch).width + spacing; }
}

function measureSpacedText(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) { w += ctx.measureText(text[i]).width; if (i < text.length - 1) w += spacing; }
  return w;
}

function drawLibrary(canvas: HTMLCanvasElement, title: string, category: string, logo: HTMLCanvasElement | null) {
  const W = 1600, H = 900;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  drawBackground(ctx, W, H);
  const cx = W / 2;
  const catLabel = (CATEGORY_LABELS[category] || category || "Wellness").toUpperCase();
  const catFontSize = 26, catSpacing = catFontSize * 0.28, catLineH = catFontSize * 1.2;
  const maxW = W * 0.72;
  let fontSize = 176;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  let lines = wrapText(ctx, title || "Untitled", maxW);
  while ((lines.length > 2 || ctx.measureText(lines[0] || "").width > maxW) && fontSize > 104) {
    fontSize -= 8;
    ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
    lines = wrapText(ctx, title || "Untitled", maxW);
  }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
  const lineH = fontSize * 1.2;
  const totalBlockH = catLineH + 22 + 1 + 28 + lines.length * lineH + 28 + 1;
  const blockTop = (H - totalBlockH) / 2;
  ctx.font = `600 ${catFontSize}px 'DM Sans', system-ui, sans-serif`;
  ctx.fillStyle = "#6F8A7E"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const catY = blockTop + catLineH;
  drawSpacedText(ctx, catLabel, cx - measureSpacedText(ctx, catLabel, catSpacing) / 2, catY, catSpacing);
  drawGoldLine(ctx, cx, catY + 22, W * 0.58);
  const titleStartY = catY + 22 + 28 + fontSize * 0.82;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  ctx.fillStyle = "#F2EFE7";
  lines.forEach((l, i) => ctx.fillText(l, cx, titleStartY + i * lineH));
  const lastY = titleStartY + (lines.length - 1) * lineH;
  drawGoldLine(ctx, cx, lastY + fontSize * 0.22 + 28, W * 0.58);
  if (logo) {
    const logoH = 72, logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, W - 80 - logoW, H - 80 - logoH, logoW, logoH);
  }
}

function drawPlayer(canvas: HTMLCanvasElement, title: string, category: string, logo: HTMLCanvasElement | null) {
  const S = 800;
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  drawBackground(ctx, S, S);
  const cx = S / 2;
  const catLabel = (CATEGORY_LABELS[category] || category || "Wellness").toUpperCase();
  const catFontSize = 24, catSpacing = catFontSize * 0.28, catLineH = catFontSize * 1.2;
  const maxW = S * 0.78;
  let fontSize = 128;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  let lines = wrapText(ctx, title || "Untitled", maxW);
  while ((lines.length > 2 || ctx.measureText(lines[0] || "").width > maxW) && fontSize > 76) {
    fontSize -= 6;
    ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
    lines = wrapText(ctx, title || "Untitled", maxW);
  }
  if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
  const lineH = fontSize * 1.2;
  const totalBlockH = catLineH + 18 + 1 + 24 + lines.length * lineH + 24 + 1;
  const blockTop = (S - totalBlockH) / 2;
  ctx.font = `600 ${catFontSize}px 'DM Sans', system-ui, sans-serif`;
  ctx.fillStyle = "#6F8A7E"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const catY = blockTop + catLineH;
  drawSpacedText(ctx, catLabel, cx - measureSpacedText(ctx, catLabel, catSpacing) / 2, catY, catSpacing);
  drawGoldLine(ctx, cx, catY + 18, S * 0.60);
  const titleStartY = catY + 18 + 24 + fontSize * 0.82;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  ctx.fillStyle = "#F2EFE7";
  lines.forEach((l, i) => ctx.fillText(l, cx, titleStartY + i * lineH));
  const lastTitleY = titleStartY + (lines.length - 1) * lineH;
  drawGoldLine(ctx, cx, lastTitleY + fontSize * 0.22 + 24, S * 0.60);
  if (logo) {
    const logoH = 56, logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, cx - logoW / 2, S - 72 - logoH, logoW, logoH);
  }
}

async function uploadBlob(blob: Blob, folder: string, suffix: string): Promise<string | null> {
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}_${suffix}.png`;
  const { error } = await supabase.storage.from("track-media").upload(path, blob, { contentType: "image/png" });
  if (error) { toast.error("Thumbnail upload failed: " + error.message); return null; }
  const { data } = supabase.storage.from("track-media").getPublicUrl(path);
  return data.publicUrl;
}

interface ThumbnailGeneratorProps {
  title: string;
  category: string;
  enabled?: boolean;
  onToggle?: () => void;
  onLibraryBlob?: (blob: Blob | null) => void;
  onPlayerBlob?: (blob: Blob | null) => void;
  onGenerated?: (landscapeUrl: string, squareUrl: string) => void;
  showPlayerCanvas?: boolean;
  /** When true, show an "Upload & Apply" button that uploads both thumbnails to storage and calls onGenerated with URLs */
  autoUpload?: boolean;
}

export default function ThumbnailGenerator({ title, category, enabled: externalEnabled, onToggle, onLibraryBlob, onPlayerBlob, onGenerated, showPlayerCanvas = true, autoUpload = false }: ThumbnailGeneratorProps) {
  const [internalEnabled, setInternalEnabled] = useState(false);
  const enabled = externalEnabled !== undefined ? externalEnabled : internalEnabled;
  const handleToggle = onToggle || (() => setInternalEnabled(p => !p));
  const libraryRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoRef = useRef<HTMLCanvasElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const redrawAndNotify = useCallback(() => {
    if (!enabled) return;
    setUploaded(false);
    if (libraryRef.current) drawLibrary(libraryRef.current, title, category, logoRef.current);
    if (playerRef.current) drawPlayer(playerRef.current, title, category, logoRef.current);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      if (libraryRef.current) libraryRef.current.toBlob(b => onLibraryBlob?.(b), "image/png");
      if (playerRef.current) playerRef.current.toBlob(b => onPlayerBlob?.(b), "image/png");
    }, 400);
  }, [title, category, enabled, onLibraryBlob, onPlayerBlob]);

  useEffect(() => {
    if (!enabled) return;
    ensureFonts();
    const init = async () => {
      const [logo] = await Promise.all([loadLogo(), document.fonts.load(`italic 300 60px 'Cormorant Garamond'`).catch(() => {}), document.fonts.load(`400 20px 'DM Sans'`).catch(() => {})]);
      logoRef.current = logo;
      readyRef.current = true;
      redrawAndNotify();
    };
    if (readyRef.current) redrawAndNotify(); else init();
  }, [redrawAndNotify, enabled]);

  const download = (ref: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    if (!ref.current) return;
    const a = document.createElement("a");
    a.href = ref.current.toDataURL("image/png");
    a.download = filename;
    a.click();
  };

  const handleUploadAndApply = async () => {
    if (!libraryRef.current || !onGenerated) return;
    setUploading(true);
    try {
      const getBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
        new Promise(resolve => canvas.toBlob(resolve, "image/png"));

      const [libBlob, playerBlob] = await Promise.all([
        getBlob(libraryRef.current),
        playerRef.current ? getBlob(playerRef.current) : Promise.resolve(null),
      ]);

      if (!libBlob) { toast.error("Failed to generate thumbnail"); return; }

      const [libUrl, playerUrl] = await Promise.all([
        uploadBlob(libBlob, "images", "16x9"),
        playerBlob ? uploadBlob(playerBlob, "images", "1x1") : Promise.resolve(""),
      ]);

      if (libUrl) {
        onGenerated(libUrl, playerUrl || "");
        setUploaded(true);
        toast.success("Thumbnails uploaded and applied");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">
          Thumbnails <span className="normal-case ml-2 opacity-50">Auto-generate on-brand</span>
        </label>
        <button type="button" onClick={handleToggle} className={`relative w-10 h-5 rounded-full transition-all ${enabled ? "bg-accent" : "bg-card"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground shadow transition-all ${enabled ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
      {enabled && (
        <div className="space-y-3">
          <div className="flex gap-5 flex-wrap items-start">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Library (16:9)</span>
              <canvas ref={libraryRef} style={{ width: 256, height: 144, borderRadius: 8, border: "1px solid hsl(var(--foreground)/0.1)", display: "block", background: "#111" }} />
              <button type="button" onClick={() => download(libraryRef, "thumbnail_library.png")} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
            {showPlayerCanvas && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Player (1:1)</span>
                <canvas ref={playerRef} style={{ width: 144, height: 144, borderRadius: 8, border: "1px solid hsl(var(--foreground)/0.1)", display: "block", background: "#111" }} />
                <button type="button" onClick={() => download(playerRef, "thumbnail_player.png")} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            )}
          </div>
          {autoUpload && onGenerated && (
            <button
              type="button"
              onClick={handleUploadAndApply}
              disabled={uploading || !title}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-sans font-medium border border-accent/30 text-accent hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-40"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
              ) : uploaded ? (
                <><Check className="w-3.5 h-3.5" /> Applied</>
              ) : (
                <><Upload className="w-3.5 h-3.5" /> Upload &amp; Apply</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
