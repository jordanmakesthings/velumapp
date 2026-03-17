import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_CLASSES: Record<string, { title: string; duration: number }> = {
  m1: { title: "The Science of Breath", duration: 2700 },
  m2: { title: "Vagus Nerve Activation", duration: 2280 },
  m3: { title: "Emotional Regulation Deep Dive", duration: 3120 },
  m4: { title: "Somatic Release Techniques", duration: 2400 },
};

export default function MasteryPlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "m1";
  const mc = MOCK_CLASSES[id] || MOCK_CLASSES["m1"];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= mc.duration) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            setCompleted(true);
            return mc.duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, mc.duration]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const progress = (currentTime / mc.duration) * 100;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pct * mc.duration);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6">
          <span className="text-primary-foreground text-3xl">✓</span>
        </motion.div>
        <h2 className="text-display text-2xl mb-2">Class complete</h2>
        <p className="text-ui text-sm mb-8">{mc.title}</p>
        <div className="flex gap-3">
          <button onClick={() => { setCurrentTime(0); setCompleted(false); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform">
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
          <button onClick={() => navigate("/library")}
            className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-surface opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(42,53%,54%,0.08)_0%,_transparent_60%)]" />

      <div className="relative z-10 flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Mastery Class</p>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-64 h-64 rounded-3xl bg-card overflow-hidden mb-10 shadow-2xl flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
        </div>

        <h2 className="text-display text-2xl mb-1 text-center">{mc.title}</h2>
        <p className="text-ui text-sm mb-10">Mastery Class</p>

        <div className="w-full max-w-sm mb-3">
          <div className="h-1.5 bg-surface-light rounded-full cursor-pointer relative" onClick={handleSeek}>
            <div className="absolute inset-y-0 left-0 gold-gradient rounded-full" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-lg" style={{ left: `calc(${progress}% - 7px)` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-ui text-[10px] tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-ui text-[10px] tabular-nums">{formatTime(mc.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={() => setCurrentTime(Math.max(0, currentTime - 15))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center active:scale-95 transition-transform">
            {isPlaying ? <Pause className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 text-primary-foreground ml-1" />}
          </button>
          <button onClick={() => setCurrentTime(Math.min(mc.duration, currentTime + 15))} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
