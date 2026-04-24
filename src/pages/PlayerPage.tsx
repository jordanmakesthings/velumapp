import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, RotateCcw, Star, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaywallModal } from "@/components/PaywallModal";
import JournalingPlayer from "@/components/player/JournalingPlayer";

const SPEEDS = [0.75, 1, 1.25, 1.5];

const categoryLabels: Record<string, string> = {
  meditation: "Meditation",
  breathwork: "Breathwork",
  eft_tapping: "EFT Tapping",
  tapping: "Tapping",
  rapid_resets: "Rapid Reset",
  journaling: "Journaling",
};

function StressCheckin({ title, subtitle, onSubmit, submitLabel }: {
  title: string;
  subtitle: string;
  onSubmit: (level: number) => void;
  submitLabel: string;
}) {
  const [level, setLevel] = useState(5);
  const getInfo = (v: number) => {
    if (v <= 2) return "Very calm";
    if (v <= 4) return "Mild tension";
    if (v <= 6) return "Moderate stress";
    if (v <= 8) return "High stress";
    return "Overwhelmed";
  };

  return (
    <div className="text-center py-8">
      <h3 className="text-display text-xl mb-1">{title}</h3>
      <p className="text-ui text-sm mb-8">{subtitle}</p>
      <p className="text-display text-6xl text-accent mb-2">{level}</p>
      <p className="text-ui text-xs uppercase tracking-widest mb-8">{getInfo(level)}</p>
      <div className="px-4 mb-8">
        <input
          type="range" min={1} max={10} value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between mt-2">
          <span className="text-ui text-[10px]">1 · Calm</span>
          <span className="text-ui text-[10px]">10 · Overwhelmed</span>
        </div>
      </div>
      <button
        onClick={() => onSubmit(level)}
        className="px-10 py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-95 transition-transform"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default function PlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get("trackId") || "";
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"before" | "playing" | "after" | "done">("before");
  const [stressBefore, setStressBefore] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3200);
  };

  const { data: track, isLoading } = useQuery({
    queryKey: ["track", trackId],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").eq("id", trackId).single();
      return data;
    },
    enabled: !!trackId,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    setIsFavorited(favorites.some((f: any) => f.track_id === trackId));
  }, [favorites, trackId]);

  // Subscription gate: if no access (subscription or trial), show paywall
  useEffect(() => {
    if (track && !hasAccess) {
      setShowPaywall(true);
    }
  }, [track, hasAccess]);

  const toggleFavMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const existing = favorites.find((f: any) => f.track_id === trackId);
      if (existing) {
        await supabase.from("favorites").delete().eq("id", (existing as any).id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, track_id: trackId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
      setIsFavorited(!isFavorited);
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (stressAfter: number) => {
      if (!user || !track) return;
      const { data: existing } = await supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", trackId)
        .maybeSingle();

      if (existing) {
        await supabase.from("user_progress").update({
          completed: true,
          completed_date: new Date().toISOString().split("T")[0],
          progress_seconds: Math.round(duration),
          stress_before: stressBefore,
          stress_after: stressAfter,
        }).eq("id", existing.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: user.id,
          track_id: trackId,
          completed: true,
          completed_date: new Date().toISOString().split("T")[0],
          progress_seconds: Math.round(duration),
          stress_before: stressBefore,
          stress_after: stressAfter,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_progress", user?.id] });
      setStep("done");
    },
    onError: () => {
      setStep("done");
    },
  });

  const handleTimeUpdate = () => {
    if (audioRef.current && !scrubbing) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleEnded = () => {
    setIsPlaying(false);
    setStep("after");
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (step !== "playing") return;
    revealControls();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [step]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayDuration = track?.audio_url ? duration : (track?.duration_minutes || 10) * 60;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * (duration || displayDuration);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStressBefore = (level: number) => {
    setStressBefore(level);
    setStep("playing");
  };

  const handleStressAfter = (level: number) => {
    saveProgressMutation.mutate(level);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-radial-subtle flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-radial-subtle flex flex-col items-center justify-center gap-4">
        <p className="text-ui text-sm">Session not found.</p>
        <Link to="/library" className="text-sm text-accent underline">Back to Library</Link>
      </div>
    );
  }

  // Access gate
  if (!hasAccess) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background flex flex-col">
        <div className="safe-area-pt px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex min-h-10 items-center gap-1 text-sm font-sans text-foreground">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="aspect-square w-full relative overflow-hidden rounded-xl max-w-[16rem]">
            {(track.thumbnail_square_url || track.thumbnail_url) ? (
              <img src={(track as any).thumbnail_square_url ?? track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-light flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
              </div>
            )}
          </div>
          <h2 className="text-display text-2xl mb-1 text-center">{track.title}</h2>
          <p className="text-ui text-sm mb-8">{categoryLabels[track.category] || track.category}</p>
          <button
            onClick={() => navigate("/premium")}
            className="px-8 py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-95 transition-transform"
          >
            Begin My Journey
          </button>
          <p className="text-muted-foreground text-[10px] font-sans mt-3">Subscribe to access all content</p>
        </div>
        <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      </div>
    );
  }

  // Journaling tracks
  if (track.content_type === "journaling" && track.steps) {
    return (
      <JournalingPlayer
        track={track}
        isFavorited={isFavorited}
        onToggleFavorite={() => toggleFavMutation.mutate()}
      />
    );
  }

  // Done state
  if (step === "done") {
    return (
      <div className="min-h-screen bg-radial-subtle flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h2 className="text-display text-2xl mb-2">Session Complete</h2>
        <p className="text-ui text-sm mb-8">
          {stressBefore !== null ? "Your stress shifted during this session. Well done." : "Well done. Your progress has been saved."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentTime(0); setStep("before"); setStressBefore(null); if (audioRef.current) audioRef.current.currentTime = 0; }}
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

  const isImmersive = step === "playing";

  return (
    <div
      className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden"
      onPointerMove={isImmersive ? revealControls : undefined}
      onPointerDown={isImmersive ? revealControls : undefined}
      style={{ background: "#07100c" }}
    >
      {track.audio_url && (
        <audio
          ref={audioRef}
          src={track.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Aurora — three slowly drifting emerald + gold pools */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "90vw", height: "90vw",
            top: "-30%", left: "-25%",
            background: "radial-gradient(circle, hsla(156,55%,22%,0.75) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "80vw", height: "80vw",
            bottom: "-25%", right: "-20%",
            background: "radial-gradient(circle, hsla(168,50%,18%,0.7) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "55vw", height: "55vw",
            top: "20%", right: "-10%",
            background: "radial-gradient(circle, hsla(42,60%,38%,0.14) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Vignette for depth */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      {/* Header */}
      <AnimatePresence>
        {(!isImmersive || controlsVisible) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="safe-area-pt relative z-20 flex items-center justify-between px-5 pt-5"
          >
            <button onClick={() => navigate(-1)} className="flex min-h-10 items-center gap-1.5 text-xs font-sans text-foreground/80 hover:text-foreground transition-colors tracking-wide">
              <ArrowLeft className="w-4 h-4 shrink-0" />
              Back
            </button>
            <p className="text-[10px] font-sans text-accent/90 tracking-[3px] uppercase text-center">
              {categoryLabels[track.category] || track.category}
            </p>
            <button onClick={() => toggleFavMutation.mutate()} className="p-2 shrink-0" aria-label="Toggle favorite">
              <Star className={`w-5 h-5 transition-all ${isFavorited ? "text-accent fill-accent" : "text-muted-foreground hover:text-foreground"}`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10">
        {step === "before" ? (
          <>
            <div className="mb-6 aspect-square w-48 relative overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
              {((track as any).thumbnail_square_url || track.thumbnail_url) ? (
                <img src={(track as any).thumbnail_square_url ?? track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-light flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
                </div>
              )}
            </div>
            <h2 className="text-display italic text-4xl md:text-5xl mb-2 text-center break-words max-w-full leading-[1.05]">{track.title}</h2>
            {track.description && <p className="text-muted-foreground text-sm font-sans mb-6 text-center max-w-md break-words leading-relaxed">{track.description}</p>}
            <StressCheckin
              title="Rate your levels of stress or negative emotions."
              subtitle="Before this session"
              onSubmit={handleStressBefore}
              submitLabel="Begin Session"
            />
          </>
        ) : step === "playing" ? (
          <>
            {/* Breathing orb behind the title */}
            <div className="relative flex flex-col items-center justify-center w-full flex-1">
              <motion.div
                aria-hidden
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: "min(78vw, 480px)",
                  height: "min(78vw, 480px)",
                  background: "radial-gradient(circle, hsla(156,55%,30%,0.55) 0%, hsla(42,60%,45%,0.10) 40%, transparent 72%)",
                  filter: "blur(10px)",
                }}
                animate={
                  isPlaying
                    ? { scale: [0.92, 1.06, 0.92], opacity: [0.75, 1, 0.75] }
                    : { scale: 0.95, opacity: 0.6 }
                }
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Inner ring */}
              <motion.div
                aria-hidden
                className="absolute rounded-full border border-accent/20 pointer-events-none"
                style={{ width: "min(52vw, 320px)", height: "min(52vw, 320px)" }}
                animate={
                  isPlaying
                    ? { scale: [1, 1.04, 1], opacity: [0.35, 0.7, 0.35] }
                    : { scale: 1, opacity: 0.3 }
                }
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Title */}
              <div className="relative z-10 text-center px-4 max-w-lg">
                <p className="text-[10px] font-sans text-accent/70 tracking-[4px] uppercase mb-5">
                  Now playing
                </p>
                <h1 className="text-display italic text-5xl md:text-6xl leading-[1.02] text-foreground mb-4 break-words">
                  {track.title}
                </h1>
                <p className="text-xs font-sans text-muted-foreground/70 tracking-[2px] uppercase">
                  {track.duration_minutes} minutes · {categoryLabels[track.category] || track.category}
                </p>
              </div>
            </div>

            {/* Controls — fade after 3s inactivity */}
            <AnimatePresence>
              {controlsVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-20 w-full max-w-sm flex flex-col items-center"
                >
                  {/* Scrubber */}
                  <div className="w-full mb-5">
                    {(() => {
                      const max = duration || displayDuration || 1;
                      const display = scrubbing ? scrubValue : currentTime;
                      const pct = max > 0 ? (display / max) * 100 : 0;
                      return (
                        <>
                          <input
                            type="range"
                            min={0}
                            max={max}
                            step={0.1}
                            value={display}
                            onPointerDown={() => { setScrubbing(true); setScrubValue(currentTime); revealControls(); }}
                            onInput={e => setScrubValue(Number((e.target as HTMLInputElement).value))}
                            onChange={e => { if (scrubbing) setScrubValue(Number(e.target.value)); }}
                            onPointerUp={e => {
                              const v = Number((e.target as HTMLInputElement).value);
                              if (audioRef.current) audioRef.current.currentTime = v;
                              setCurrentTime(v);
                              setScrubbing(false);
                              revealControls();
                            }}
                            onPointerCancel={() => setScrubbing(false)}
                            className="velum-audio-slider w-full cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${pct}%, hsl(var(--foreground) / 0.12) ${pct}%, hsl(var(--foreground) / 0.12) 100%)`,
                            }}
                          />
                          <div className="flex justify-between mt-2.5 px-0.5">
                            <span className="text-accent/80 text-[11px] font-sans tabular-nums tracking-wider">{formatTime(display)}</span>
                            <span className="text-muted-foreground/60 text-[11px] font-sans tabular-nums tracking-wider">{formatTime(duration || displayDuration)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Playback controls */}
                  <div className="mb-5 flex items-center gap-10">
                    <button onClick={() => { skip(-15); revealControls(); }} className="text-muted-foreground/80 hover:text-foreground transition-colors p-2" aria-label="Back 15 seconds">
                      <SkipBack className="w-6 h-6" />
                    </button>
                    <motion.button
                      onClick={() => { togglePlay(); revealControls(); }}
                      whileTap={{ scale: 0.92 }}
                      className="relative flex h-20 w-20 items-center justify-center rounded-full gold-gradient shadow-[0_0_40px_rgba(201,168,76,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(201,168,76,0.55)]"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 ml-1 text-primary-foreground" />}
                    </motion.button>
                    <button onClick={() => { skip(15); revealControls(); }} className="text-muted-foreground/80 hover:text-foreground transition-colors p-2" aria-label="Forward 15 seconds">
                      <SkipForward className="w-6 h-6" />
                    </button>
                  </div>

                  <button
                    onClick={() => { cycleSpeed(); revealControls(); }}
                    className="rounded-full bg-black/30 border border-accent/15 px-4 py-1.5 text-[11px] font-sans font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors tracking-wider"
                  >
                    {speed}x speed
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : step === "after" ? (
          <StressCheckin
            title="Rate your levels of stress or negative emotions."
            subtitle="After this session"
            onSubmit={handleStressAfter}
            submitLabel="Complete Session"
          />
        ) : null}
      </div>
    </div>
  );
}
