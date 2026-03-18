import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Image, Loader2 } from "lucide-react";

// Lotus SVG path for bottom corner
const LOTUS_PATH = `M 50 90 C 50 70 30 55 15 60 C 25 45 45 45 50 30 C 55 45 75 45 85 60 C 70 55 50 70 50 90 Z
M 50 30 C 48 20 40 10 30 5 C 42 8 48 18 50 30 Z
M 50 30 C 52 20 60 10 70 5 C 58 8 52 18 50 30 Z`;

interface ThumbnailGeneratorProps {
  title: string;
  category: string;
  onGenerated: (landscapeUrl: string, squareUrl: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "MEDITATION",
  rapid_resets: "RAPID RESETS",
  breathwork: "BREATHWORK",
  tapping: "TAPPING",
  sleep_journeys: "SLEEP JOURNEYS",
  journaling: "JOURNALING",
};

function drawThumbnail(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  title: string,
  category: string
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;

  // Dark forest green gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#0a1f15");
  grad.addColorStop(0.5, "#0F2F26");
  grad.addColorStop(1, "#071a10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Gold horizontal lines
  const goldColor = "rgba(201, 168, 76, 0.15)";
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1;
  const lineSpacing = height / 12;
  for (let i = 1; i < 12; i++) {
    const y = i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Accent gold lines (thicker, fewer)
  ctx.strokeStyle = "rgba(201, 168, 76, 0.25)";
  ctx.lineWidth = 2;
  const accentLines = [height * 0.3, height * 0.7];
  accentLines.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(width * 0.1, y);
    ctx.lineTo(width * 0.9, y);
    ctx.stroke();
  });

  // Category label - uppercase
  const catLabel = CATEGORY_LABELS[category] || category.toUpperCase().replace(/_/g, " ");
  const catFontSize = Math.round(width * 0.022);
  ctx.font = `500 ${catFontSize}px "DM Sans", sans-serif`;
  ctx.fillStyle = "rgba(201, 168, 76, 0.8)";
  ctx.textAlign = "center";
  ctx.letterSpacing = "4px";
  ctx.fillText(catLabel, width / 2, height * 0.38);

  // Session title - Cormorant Garamond italic serif
  const titleFontSize = Math.round(width * 0.045);
  ctx.font = `italic ${titleFontSize}px "Cormorant Garamond", "Georgia", serif`;
  ctx.fillStyle = "#F2EFE7";
  ctx.textAlign = "center";

  // Word wrap title
  const maxWidth = width * 0.7;
  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = titleFontSize * 1.3;
  const startY = height * 0.5 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  // Lotus icon in bottom-right corner
  const lotusSize = Math.round(width * 0.06);
  const lotusX = width - lotusSize * 1.5;
  const lotusY = height - lotusSize * 1.5;
  ctx.save();
  ctx.translate(lotusX, lotusY);
  ctx.scale(lotusSize / 100, lotusSize / 100);
  ctx.fillStyle = "rgba(201, 168, 76, 0.3)";
  const path = new Path2D(LOTUS_PATH);
  ctx.fill(path);
  ctx.restore();

  // Subtle border
  ctx.strokeStyle = "rgba(201, 168, 76, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}

async function uploadCanvas(canvas: HTMLCanvasElement, folder: string): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(null); return; }
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
      const { error } = await supabase.storage.from("track-media").upload(path, blob, { contentType: "image/png" });
      if (error) { toast.error("Upload failed: " + error.message); resolve(null); return; }
      const { data } = supabase.storage.from("track-media").getPublicUrl(path);
      resolve(data.publicUrl);
    }, "image/png", 0.95);
  });
}

export default function ThumbnailGenerator({ title, category, onGenerated }: ThumbnailGeneratorProps) {
  const landscapeRef = useRef<HTMLCanvasElement>(null);
  const squareRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = () => {
    if (!title.trim()) { toast.error("Enter a title first"); return; }
    const lc = landscapeRef.current!;
    const sc = squareRef.current!;
    drawThumbnail(lc, 1456, 816, title, category);
    drawThumbnail(sc, 800, 800, title, category);
    setPreviewing(true);
  };

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error("Enter a title first"); return; }
    setGenerating(true);
    try {
      const lc = landscapeRef.current!;
      const sc = squareRef.current!;
      drawThumbnail(lc, 1456, 816, title, category);
      drawThumbnail(sc, 800, 800, title, category);

      const [landscapeUrl, squareUrl] = await Promise.all([
        uploadCanvas(lc, "thumbnails"),
        uploadCanvas(sc, "thumbnails"),
      ]);

      if (landscapeUrl && squareUrl) {
        onGenerated(landscapeUrl, squareUrl);
        toast.success("Thumbnails generated and uploaded");
      }
    } catch (err: any) {
      toast.error("Generation failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-40"
        >
          <Image className="w-4 h-4" /> Preview Thumbnails
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!title.trim() || generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
          {generating ? "Generating..." : "Generate & Upload"}
        </button>
      </div>

      {previewing && (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Landscape (1456×816)</p>
            <canvas ref={landscapeRef} className="w-full max-w-md rounded-lg border border-foreground/10" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Square (800×800)</p>
            <canvas ref={squareRef} className="w-48 h-48 rounded-lg border border-foreground/10" />
          </div>
        </div>
      )}

      {!previewing && (
        <>
          <canvas ref={landscapeRef} className="hidden" />
          <canvas ref={squareRef} className="hidden" />
        </>
      )}
    </div>
  );
}
