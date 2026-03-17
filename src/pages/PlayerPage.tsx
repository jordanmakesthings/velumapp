import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, Heart, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_TRACKS: Record<string, { title: string; course: string; duration: number }> = {
  "1": { title: "Morning Calm", course: "Foundations of Calm", duration: 600 },
  "2": { title: "Stress Dissolve", course: "Foundations of Calm", duration: 900 },
  "3": { title: "Deep Presence", course: "Foundations of Calm", duration: 1200 },
  "4": { title: "Anxiety Release", course: "EFT Essentials", duration: 720 },
  "5": { title: "Confidence Boost", course: "EFT Essentials", duration: 900 },
  "6": { title: "Box Breathing Guide", course: "Breathwork Basics", duration: 480 },
  "7": { title: "Energy Activation", course: "Rapid Resets", duration: 300 },
  "8": { title: "2-Minute Reset", course: "Rapid Resets", duration: 120 },
  "9": { title: "Sleep Journey", course: "Sleep Protocol", duration: 1500 },
  "10": { title: "Body Scan Release", course: "EFT Essentials", duration: 1080 },
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function PlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get("trackId") || "1";
  const track = MOCK_TRACKS[trackId] || MOCK_TRACKS["1"];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= track.duration) {
            clearInterval(intervalRef.current);
            setIsPlaying(false);
            setCompleted(true);
            return track.duration;
          }
          return prev + speed;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, track.duration]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = (currentTime / track.duration) * 100;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pct * track.duration);
  };

  const skip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(track.duration, prev + seconds)));
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6"
        >
          <span className="text-primary-foreground text-3xl">✓</span>
        </motion.div>
        <h2 className="text-display text-2xl mb-2">Session complete</h2>
        <p className="text-ui text-sm mb-8">{track.title}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentTime(0); setCompleted(false); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-surface opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(42,53%,54%,0.08)_0%,_transparent_60%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Now Playing</p>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Artwork */}
        <motion.div
          animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-64 h-64 lg:w-72 lg:h-72 rounded-3xl bg-card overflow-hidden mb-10 shadow-2xl"
        >
          <div className="w-full h-full bg-surface-light flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
          </div>
        </motion.div>

        {/* Track info */}
        <h2 className="text-display text-2xl mb-1 text-center">{track.title}</h2>
        <p className="text-ui text-sm mb-10">{track.course}</p>

        {/* Seek bar */}
        <div className="w-full max-w-sm mb-3">
          <div
            className="h-1.5 bg-surface-light rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 gold-gradient rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-lg transition-all duration-100"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-ui text-[10px] tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-ui text-[10px] tabular-nums">{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mb-8">
          <button onClick={() => skip(-15)} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            )}
          </button>
          <button onClick={() => skip(15)} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Speed & Favorite */}
        <div className="flex items-center gap-6">
          <button
            onClick={cycleSpeed}
            className="text-muted-foreground hover:text-foreground text-xs font-sans font-medium px-3 py-1.5 rounded-full bg-card transition-colors"
          >
            {speed}x
          </button>
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isFavorited ? "text-accent fill-accent" : "text-muted-foreground hover:text-foreground"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
