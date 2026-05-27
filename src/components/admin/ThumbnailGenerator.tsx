import { useEffect, useRef, useCallback, useState } from "react";
import { Download, Upload, Check, Loader2, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listAllCovers, deriveTagsFromText, type TrackCover } from "@/lib/track-covers";
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

// Per-category palette — all stay inside the Velum green family. `corner` is the
// lit bottom-left wash, `deep` the mid-green, `glow` the bright tone used only for
// the soft aura behind the title, `label` the muted category caption color.
interface ThemeColors { corner: string; deep: string; glow: string; label: string; }
const CATEGORY_THEME: Record<string, ThemeColors> = {
  meditation:   { corner: "#1c4a3a", deep: "#0F2F26", glow: "#2f9e72", label: "#6F8A7E" },
  breathwork:   { corner: "#15494a", deep: "#0c2b2c", glow: "#26a39a", label: "#6A9690" },
  rapid_resets: { corner: "#1d5240", deep: "#103126", glow: "#3ab277", label: "#7CA084" },
  tapping:      { corner: "#3f4a22", deep: "#1d2814", glow: "#8a9a48", label: "#9AA06F" },
  journaling:   { corner: "#1a484c", deep: "#10282c", glow: "#3a8b97", label: "#6F9298" },
  _default:     { corner: "#1a4a3a", deep: "#0F2F26", glow: "#2a8a64", label: "#6F8A7E" },
};
function getTheme(category: string): ThemeColors {
  return CATEGORY_THEME[category] || CATEGORY_THEME._default;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Cached monochrome noise tile reused across every render for film grain.
let noiseTile: HTMLCanvasElement | null = null;
function getNoiseTile(): HTMLCanvasElement {
  if (noiseTile) return noiseTile;
  const size = 180;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const nctx = c.getContext("2d")!;
  const id = nctx.createImageData(size, size);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.random() * 255;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  nctx.putImageData(id, 0, 0);
  noiseTile = c;
  return noiseTile;
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, category: string) {
  const theme = getTheme(category);

  // Base black + lit bottom-left corner wash.
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);
  const cx = W * 0.15, cy = H;
  const r = Math.max(W, H) * 0.9;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, theme.corner);
  grad.addColorStop(0.25, theme.deep);
  grad.addColorStop(0.65, "#111111");
  grad.addColorStop(1, "#111111");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft aura bloom behind the title (additive so it reads as light, not paint).
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const ax = W / 2, ay = H * 0.46, ar = Math.max(W, H) * 0.5;
  const aura = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar);
  aura.addColorStop(0, hexToRgba(theme.glow, 0.26));
  aura.addColorStop(0.5, hexToRgba(theme.glow, 0.07));
  aura.addColorStop(1, hexToRgba(theme.glow, 0));
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Vignette for depth.
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Film grain.
  ctx.save();
  const pattern = ctx.createPattern(getNoiseTile(), "repeat");
  if (pattern) {
    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

// ── Painterly artwork backgrounds ──────────────────────────────────────────
// The painterly emerald+gold covers live in the public `track-covers` bucket and
// are catalogued (with theme tags + mood) in the `track_covers` storehouse table.
// We pick the cover whose tags best match the track's title/category, so the art
// reflects the track's meaning (e.g. "sleep" → moon, "grief" → rain). Ties break
// deterministically on the title hash, so the same track always gets the same art.
let coversPromise: Promise<TrackCover[]> | null = null;
function getCovers(): Promise<TrackCover[]> {
  if (!coversPromise) coversPromise = listAllCovers().catch(() => []);
  return coversPromise;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

async function pickCoverUrl(title: string, category: string): Promise<string | null> {
  const covers = await getCovers();
  if (!covers.length) return null;
  const wanted = new Set(deriveTagsFromText(title, category.replace(/_/g, " ")));
  let best: TrackCover[] = [];
  let bestScore = -1;
  for (const c of covers) {
    let score = 0;
    for (const t of c.tags || []) if (wanted.has(t)) score++;
    if (score > bestScore) { bestScore = score; best = [c]; }
    else if (score === bestScore) best.push(c);
  }
  const pool = bestScore > 0 ? best : covers; // no thematic hit → stable arbitrary pick
  const h = hashString((title || "untitled").toLowerCase().trim());
  return pool[h % pool.length].url;
}

const coverCache = new Map<string, HTMLImageElement | null>();
const coverPromises = new Map<string, Promise<HTMLImageElement | null>>();
function loadCover(url: string): Promise<HTMLImageElement | null> {
  if (coverCache.has(url)) return Promise.resolve(coverCache.get(url)!);
  const existing = coverPromises.get(url);
  if (existing) return existing;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // keeps the canvas exportable (toBlob/toDataURL)
    img.onload = () => { coverCache.set(url, img); resolve(img); };
    img.onerror = () => { coverCache.set(url, null); resolve(null); };
    img.src = url;
  });
  coverPromises.set(url, p);
  return p;
}

// Cover-fit the artwork to fill the whole canvas, centered.
function drawCoverImage(ctx: CanvasRenderingContext2D, W: number, H: number, img: HTMLImageElement) {
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

// Legibility scrim over artwork: a unifying green-black tint, a soft radial
// darkening behind the centered text, and an edge vignette.
function drawArtScrim(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  ctx.fillStyle = "rgba(8,20,14,0.30)";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.46;
  const rad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.52);
  rad.addColorStop(0, "rgba(0,0,0,0.55)");
  rad.addColorStop(0.55, "rgba(0,0,0,0.22)");
  rad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.40)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Paint the chosen artwork (or fall back to the green gradient if it can't load).
// `coverOverride` forces a specific cover (used by the studio's manual picker);
// otherwise the art is auto-matched to the track's meaning.
async function paintBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, title: string, category: string, coverOverride?: string) {
  const url = coverOverride || await pickCoverUrl(title, category);
  const cover = url ? await loadCover(url) : null;
  if (cover) {
    drawCoverImage(ctx, W, H, cover);
    drawArtScrim(ctx, W, H);
  } else {
    drawBackground(ctx, W, H, category);
  }
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

async function drawLibrary(canvas: HTMLCanvasElement, title: string, category: string, logo: HTMLCanvasElement | null, coverOverride?: string) {
  const W = 1600, H = 900;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await paintBackdrop(ctx, W, H, title, category, coverOverride);
  const theme = getTheme(category);
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
  // Soft drop shadow keeps text crisp over any artwork.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 2;
  ctx.font = `600 ${catFontSize}px 'DM Sans', system-ui, sans-serif`;
  ctx.fillStyle = theme.label; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const catY = blockTop + catLineH;
  drawSpacedText(ctx, catLabel, cx - measureSpacedText(ctx, catLabel, catSpacing) / 2, catY, catSpacing);
  drawGoldLine(ctx, cx, catY + 22, W * 0.58);
  const titleStartY = catY + 22 + 28 + fontSize * 0.82;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  ctx.fillStyle = "#F2EFE7";
  lines.forEach((l, i) => ctx.fillText(l, cx, titleStartY + i * lineH));
  const lastY = titleStartY + (lines.length - 1) * lineH;
  drawGoldLine(ctx, cx, lastY + fontSize * 0.22 + 28, W * 0.58);
  ctx.restore();
  if (logo) {
    const logoH = 72, logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, W - 80 - logoW, H - 80 - logoH, logoW, logoH);
  }
}

async function drawPlayer(canvas: HTMLCanvasElement, title: string, category: string, logo: HTMLCanvasElement | null, coverOverride?: string) {
  const S = 800;
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  await paintBackdrop(ctx, S, S, title, category, coverOverride);
  const theme = getTheme(category);
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
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 2;
  ctx.font = `600 ${catFontSize}px 'DM Sans', system-ui, sans-serif`;
  ctx.fillStyle = theme.label; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const catY = blockTop + catLineH;
  drawSpacedText(ctx, catLabel, cx - measureSpacedText(ctx, catLabel, catSpacing) / 2, catY, catSpacing);
  drawGoldLine(ctx, cx, catY + 18, S * 0.60);
  const titleStartY = catY + 18 + 24 + fontSize * 0.82;
  ctx.font = `italic 600 ${fontSize}px 'Cormorant Garamond', Palatino, Georgia, serif`;
  ctx.fillStyle = "#F2EFE7";
  lines.forEach((l, i) => ctx.fillText(l, cx, titleStartY + i * lineH));
  const lastTitleY = titleStartY + (lines.length - 1) * lineH;
  drawGoldLine(ctx, cx, lastTitleY + fontSize * 0.22 + 24, S * 0.60);
  ctx.restore();
  if (logo) {
    const logoH = 56, logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, cx - logoW / 2, S - 72 - logoH, logoW, logoH);
  }
}

export { drawLibrary, drawPlayer, loadLogo, ensureFonts };
export async function uploadBlob_(blob: Blob, folder: string, suffix: string): Promise<string | null> { return uploadBlob(blob, folder, suffix); }

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
  /** Force a specific artwork cover URL instead of auto-matching by title/category. */
  coverUrlOverride?: string;
}

export default function ThumbnailGenerator({ title, category, enabled: externalEnabled, onToggle, onLibraryBlob, onPlayerBlob, onGenerated, showPlayerCanvas = true, autoUpload = false, coverUrlOverride }: ThumbnailGeneratorProps) {
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
  // Local shuffle override — when set, forces a specific (different) cover from the pool.
  // External `coverUrlOverride` prop wins if provided.
  const [localCoverOverride, setLocalCoverOverride] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const effectiveOverride = coverUrlOverride ?? localCoverOverride ?? undefined;

  const redrawAndNotify = useCallback(() => {
    if (!enabled) return;
    setUploaded(false);
    // Debounce: draw (async — artwork may need to load) then emit blobs.
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(async () => {
      if (libraryRef.current) await drawLibrary(libraryRef.current, title, category, logoRef.current, effectiveOverride);
      if (playerRef.current) await drawPlayer(playerRef.current, title, category, logoRef.current, effectiveOverride);
      if (libraryRef.current) libraryRef.current.toBlob(b => onLibraryBlob?.(b), "image/png");
      if (playerRef.current) playerRef.current.toBlob(b => onPlayerBlob?.(b), "image/png");
    }, 400);
  }, [title, category, enabled, onLibraryBlob, onPlayerBlob, effectiveOverride]);

  // Reset the local shuffle whenever the title changes — a fresh title gets its
  // auto-matched art, not the previously-shuffled one from another item.
  useEffect(() => { setLocalCoverOverride(null); }, [title]);

  const handleRegenerate = useCallback(async () => {
    setShuffling(true);
    try {
      const covers = await listAllCovers();
      if (!covers.length) { toast.error("No covers available"); return; }
      // Determine the current cover so we don't re-pick the same one.
      let current = effectiveOverride;
      if (!current) {
        const auto = await pickCoverUrl(title, category);
        current = auto ?? undefined;
      }
      const pool = covers.filter(c => c.url !== current);
      if (!pool.length) { toast.error("Only one cover in the pool"); return; }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setLocalCoverOverride(pick.url);
    } finally {
      setShuffling(false);
    }
  }, [title, category, effectiveOverride]);

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
        <div className="flex items-center gap-3">
          {enabled && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={shuffling}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
              title="Pick a different artwork"
            >
              {shuffling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shuffle className="w-3 h-3" />}
              Regenerate
            </button>
          )}
          <button type="button" onClick={handleToggle} className={`relative w-10 h-5 rounded-full transition-all ${enabled ? "bg-accent" : "bg-card"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground shadow transition-all ${enabled ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
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
