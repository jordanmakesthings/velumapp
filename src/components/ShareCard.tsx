import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, X } from "lucide-react";
import { format } from "date-fns";

export type ShareCardVariant = "session" | "weekly";

export interface ShareCardData {
  minutes?: number;
  title?: string;
  streak?: number;
  // weekly only
  sessionsThisWeek?: number;
  minutesThisWeek?: number;
  stressReductionPct?: number | null;
  dominantPractice?: string;
  weekDots?: boolean[];
}

interface ShareCardProps {
  open: boolean;
  onClose: () => void;
  variant: ShareCardVariant;
  data: ShareCardData;
}

type Format = "story" | "square";

// Renders the card content used in both preview and the hidden 1080-wide render targets.
function CardBody({ variant, data, format: fmt }: { variant: ShareCardVariant; data: ShareCardData; format: Format }) {
  const isStory = fmt === "story";
  const heroSize = isStory ? "text-[8rem]" : "text-[5rem]";
  const wrapperPad = isStory ? "p-16" : "p-12";
  const today = new Date();

  if (variant === "weekly") {
    const dots = data.weekDots && data.weekDots.length === 7 ? data.weekDots : [false, false, false, false, false, false, false];
    const heroNum = data.stressReductionPct ?? data.minutesThisWeek ?? 0;
    const heroLabel = data.stressReductionPct != null ? "% calmer" : "min this week";
    const streak = data.streak ?? 0;
    const sessions = data.sessionsThisWeek ?? 0;
    const minsWk = data.minutesThisWeek ?? 0;
    const tagline =
      streak >= 7
        ? "A full week of showing up."
        : sessions >= 5
        ? "Consistency unlocks transformation."
        : "The work is the reward.";

    return (
      <div
        className={`relative w-full h-full ${wrapperPad} flex flex-col justify-between text-foreground overflow-hidden`}
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(156, 52%, 22%) 0%, hsl(156, 52%, 10%) 80%), hsl(156, 52%, 8%)",
        }}
      >
        {/* gold dust overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 85% 20%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 10% 65%, #C9A84C 1px, transparent 1.5px)",
            backgroundSize: "120px 120px, 180px 180px, 140px 140px, 200px 200px, 160px 160px",
          }}
        />

        {/* Top wordmark */}
        <div className="relative flex items-center justify-center gap-3">
          <span className="text-[#C9A84C] text-2xl">✦</span>
          <span
            className="text-[#E6C875] tracking-[0.45em] text-sm"
            style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', serif)" }}
          >
            VELUM · WEEK OF {format(today, "MMM d").toUpperCase()}
          </span>
        </div>

        {/* Hero */}
        <div className="relative flex flex-col items-center text-center">
          <p
            className={`${isStory ? "text-[7rem]" : "text-[4.5rem]"} font-light leading-[0.95] text-foreground`}
            style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
          >
            {heroNum}
            {data.stressReductionPct != null && (
              <span className="text-[#C9A84C]">%</span>
            )}
          </p>
          <p className="mt-3 text-[#C9A84C]/80 text-base tracking-[0.25em] uppercase">
            {data.stressReductionPct != null ? "calmer this week" : heroLabel}
          </p>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 gap-4 text-center">
          {[
            { num: sessions, label: "sessions" },
            { num: minsWk, label: "minutes" },
            { num: streak, label: "day streak" },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="text-3xl font-light text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {s.num}
              </p>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#E6C875]/70 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="relative flex justify-between items-center px-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  dots[i] ? "bg-[#C9A84C]" : "border border-[#C9A84C]/40"
                }`}
              />
              <span className="text-[10px] tracking-[0.2em] text-[#E6C875]/60">{d}</span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="relative text-center">
          <p
            className="italic text-foreground/85 text-xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            "{tagline}"
          </p>
        </div>

        {/* Footer — single gold sparkle, brand mark only */}
        <div className="relative text-center">
          <span className="text-[#C9A84C] text-xl">✦</span>
        </div>
      </div>
    );
  }

  // session variant
  const streak = data.streak ?? 0;
  const title = data.title || "Open Meditation";
  const minutes = data.minutes ?? 0;

  return (
    <div
      className={`relative w-full h-full ${wrapperPad} flex flex-col justify-between text-foreground overflow-hidden`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, hsl(156, 52%, 22%) 0%, hsl(156, 52%, 10%) 80%), hsl(156, 52%, 8%)",
      }}
    >
      {/* gold dust overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 40% 80%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 85% 20%, #C9A84C 1px, transparent 1.5px), radial-gradient(circle at 10% 65%, #C9A84C 1px, transparent 1.5px)",
          backgroundSize: "120px 120px, 180px 180px, 140px 140px, 200px 200px, 160px 160px",
        }}
      />

      {/* Top wordmark */}
      <div className="relative flex items-center justify-center gap-3">
        <span className="text-[#C9A84C] text-2xl">✦</span>
        <span
          className="text-[#E6C875] tracking-[0.5em] text-sm"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          VELUM
        </span>
      </div>

      {/* Hero */}
      <div className="relative flex flex-col items-center text-center">
        <p
          className={`${heroSize} font-light leading-[0.9] text-foreground`}
          style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.03em" }}
        >
          {minutes}
          <span className="text-[#C9A84C]"> min</span>
        </p>
        <p
          className="mt-6 text-[#E6C875]/85 italic text-2xl max-w-[80%]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </p>
      </div>

      {/* Streak + date */}
      <div className="relative flex flex-col items-center gap-3">
        {streak > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/10 px-5 py-2 text-[#E6C875] tracking-[0.25em] text-xs uppercase">
            Day {streak} streak
          </span>
        )}
        <p className="text-foreground/60 text-xs tracking-[0.2em] uppercase">
          {format(today, "MMM d, yyyy")}
        </p>
      </div>

      {/* Footer — single gold sparkle, brand mark only */}
      <div className="relative text-center">
        <span className="text-[#C9A84C] text-xl">✦</span>
      </div>
    </div>
  );
}

export function ShareCard({ open, onClose, variant, data }: ShareCardProps) {
  const [fmt, setFmt] = useState<Format>("story");
  const [busy, setBusy] = useState<null | "share" | "save">(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const squareRef = useRef<HTMLDivElement | null>(null);

  // reset format on open
  useEffect(() => {
    if (open) setFmt("story");
  }, [open]);

  const dims = useMemo(
    () => (fmt === "story" ? { w: 1080, h: 1920 } : { w: 1080, h: 1080 }),
    [fmt]
  );

  // Preview is the rendered card at a scaled-down size so user sees what they're sharing.
  const previewMaxH = 520;
  const previewScale = previewMaxH / dims.h;
  const previewW = dims.w * previewScale;
  const previewH = dims.h * previewScale;

  const generatePng = async (): Promise<string | null> => {
    const node = fmt === "story" ? storyRef.current : squareRef.current;
    if (!node) return null;
    try {
      const url = await toPng(node, {
        pixelRatio: 1, // node already at 1080-wide native dimensions
        cacheBust: true,
        width: dims.w,
        height: dims.h,
      });
      return url;
    } catch (e) {
      console.error("ShareCard PNG generation failed", e);
      return null;
    }
  };

  const handleShare = async () => {
    setBusy("share");
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const filename = `velum-${variant}-${Date.now()}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      const nav: any = navigator;
      if (nav.share && nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: "Velum" });
        } catch {
          /* user cancelled */
        }
      } else {
        // fallback: download
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        a.click();
      }
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    setBusy("save");
    try {
      const dataUrl = await generatePng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `velum-${variant}-${Date.now()}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl velum-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-foreground/80 hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Format toggle */}
        <div className="mb-4 flex justify-center gap-2">
          {(["story", "square"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFmt(f)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-sans tracking-wide uppercase transition-all ${
                fmt === f
                  ? "gold-gradient text-primary-foreground"
                  : "border border-accent/30 text-muted-foreground hover:text-accent"
              }`}
            >
              {f === "story" ? "Story 9:16" : "Square 1:1"}
            </button>
          ))}
        </div>

        {/* Scaled preview wrapper */}
        <div className="flex justify-center mb-5">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
            style={{ width: previewW, height: previewH }}
          >
            <div
              style={{
                width: dims.w,
                height: dims.h,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <CardBody variant={variant} data={data} format={fmt} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleShare}
            disabled={busy !== null}
            className="w-full rounded-xl gold-gradient text-primary-foreground py-3 text-sm font-sans font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            {busy === "share" ? "Preparing…" : "Share"}
          </button>
          <button
            onClick={handleSave}
            disabled={busy !== null}
            className="w-full rounded-xl velum-card-flat text-foreground py-3 text-sm font-sans flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {busy === "save" ? "Rendering…" : "Save image"}
          </button>
          <button
            onClick={onClose}
            className="w-full text-muted-foreground py-2 text-xs tracking-wide"
          >
            Done
          </button>
        </div>
      </div>

      {/* Hidden full-resolution render targets — positioned off-screen so html-to-image can capture */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <div ref={storyRef} style={{ width: 1080, height: 1920 }}>
          <CardBody variant={variant} data={data} format="story" />
        </div>
        <div ref={squareRef} style={{ width: 1080, height: 1080 }}>
          <CardBody variant={variant} data={data} format="square" />
        </div>
      </div>
    </div>
  );
}

export default ShareCard;
