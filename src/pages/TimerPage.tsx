import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShareCard } from "@/components/ShareCard";

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

type Ambient = "none" | "rain" | "forest" | "fire" | "waves";

const AMBIENT_OPTIONS: { key: Ambient; label: string }[] = [
  { key: "none", label: "None" },
  { key: "rain", label: "Rain" },
  { key: "forest", label: "Forest" },
  { key: "fire", label: "Fire" },
  { key: "waves", label: "Waves" },
];

const BOWL_URL = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/bowl.mp3";
const AMBIENT_URLS: Record<Ambient, string | null> = {
  none: null,
  rain: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-rain.mp3",
  forest: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-forest.mp3",
  fire: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-fire.mp3",
  waves: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-waves.mp3",
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function TimerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [minutes, setMinutes] = useState(10);
  const [ambient, setAmbient] = useState<Ambient>("none");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds
  const [elapsed, setElapsed] = useState(0); // seconds
  const [showShare, setShowShare] = useState(false);
  const [streak, setStreak] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const bowlBufferRef = useRef<AudioBuffer | null>(null);
  const ambientElRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastBellMarkerRef = useRef<number>(0); // seconds elapsed at last interval bell
  const completedRef = useRef(false);
  // Tracks whether ambient is currently playing — separate from `running` so it
  // can outlive the session (per request: ding goes off, sounds keep playing).
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Lazy ensure AudioContext + try load bowl buffer
  const ensureAudio = async () => {
    if (!audioCtxRef.current) {
      const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (!bowlBufferRef.current) {
      try {
        const res = await fetch(BOWL_URL);
        if (res.ok) {
          const arr = await res.arrayBuffer();
          bowlBufferRef.current = await audioCtxRef.current.decodeAudioData(arr);
        }
      } catch {
        /* fall back to synth */
      }
    }
  };

  // Play one bowl chime — sampled if available, sine fallback otherwise.
  const playBowl = async () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (bowlBufferRef.current) {
      const src = ctx.createBufferSource();
      src.buffer = bowlBufferRef.current;
      const gain = ctx.createGain();
      gain.gain.value = 0.6;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      return;
    }
    // sine-wave fallback: 440Hz, 800ms decay envelope
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  };

  const playTripleBell = async () => {
    await playBowl();
    setTimeout(() => playBowl(), 1100);
    setTimeout(() => playBowl(), 2200);
  };

  // Streak computation (matches HomePage logic)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("completed_date")
        .eq("user_id", user.id)
        .eq("completed", true);
      const dates = new Set((progress || []).map((p: any) => p.completed_date));
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (dates.has(key)) s++;
        else if (i > 0) break;
      }
      setStreak(s);
    })();
  }, [user]);

  // Start ambient stream (silent no-op on 404 / unsupported). Swaps cleanly if
  // another ambient is already playing — used for both preview-on-tap and full play.
  const startAmbient = (kind: Ambient) => {
    const url = AMBIENT_URLS[kind];
    // 'none' means: stop whatever's playing.
    if (!url) { stopAmbient(); return; }
    // Stop the previous one before swapping.
    if (ambientElRef.current) {
      try { ambientElRef.current.pause(); ambientElRef.current.src = ""; } catch {}
      ambientElRef.current = null;
    }
    try {
      const el = new Audio(url);
      el.loop = true;
      el.volume = 0.35;
      el.crossOrigin = "anonymous";
      el.play().catch(() => {
        /* silent fallback */
      });
      ambientElRef.current = el;
      setAmbientPlaying(true);
    } catch {
      /* silent */
    }
  };
  const stopAmbient = () => {
    if (ambientElRef.current) {
      try {
        ambientElRef.current.pause();
        ambientElRef.current.src = "";
      } catch {}
      ambientElRef.current = null;
    }
    setAmbientPlaying(false);
  };

  const recordSession = async (completedInFull: boolean) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      await (supabase.from as any)("timer_sessions").insert({
        user_id: user.id,
        duration_minutes: minutes,
        ambient_sound: ambient,
        completed_in_full: completedInFull,
      });
      // Also write a user_progress row so the streak/totals reflect the timer session.
      await (supabase.from as any)("user_progress").insert({
        user_id: user.id,
        track_id: null,
        completed: true,
        completed_date: today,
        progress_seconds: Math.round(elapsed),
      });
    } catch {
      /* non-fatal */
    }
  };

  const finishSession = async (completedInFull: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    // NOTE: ambient intentionally keeps playing past the closing bell.
    // The user can stop it from the floating bar that appears on the setup screen.
    await playTripleBell();
    await recordSession(completedInFull);

    // Bump local streak (best-effort; will rehydrate on next mount)
    setStreak((s) => s + 1);

    setRunning(false);
    setPaused(false);
    setShowShare(true);
  };

  // Tick loop
  useEffect(() => {
    if (!running || paused) return;
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        setElapsed((e) => e + 1);
        // Interval bell every 5 min (but not at exact start or end)
        const elapsedNow = minutes * 60 - next;
        if (
          elapsedNow > 0 &&
          elapsedNow % 300 === 0 &&
          elapsedNow !== lastBellMarkerRef.current &&
          next > 0
        ) {
          lastBellMarkerRef.current = elapsedNow;
          playBowl();
        }
        if (next <= 0) {
          finishSession(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, minutes]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopAmbient();
      if (tickRef.current) window.clearInterval(tickRef.current);
      audioCtxRef.current?.close().catch(() => {});
    },
    []
  );

  const handleBegin = async () => {
    completedRef.current = false;
    setElapsed(0);
    setRemaining(minutes * 60);
    lastBellMarkerRef.current = 0;
    await ensureAudio();
    await playBowl();
    startAmbient(ambient);
    setRunning(true);
    setPaused(false);
  };

  const handlePauseToggle = () => {
    setPaused((p) => {
      const next = !p;
      if (next) {
        // pausing
        ambientElRef.current?.pause();
      } else {
        ambientElRef.current?.play().catch(() => {});
      }
      return next;
    });
  };

  const handleEndEarly = async () => {
    if (elapsed >= 60) {
      await finishSession(false);
    } else {
      // Cancel without recording
      stopAmbient();
      if (tickRef.current) window.clearInterval(tickRef.current);
      setRunning(false);
      setPaused(false);
      setRemaining(0);
      setElapsed(0);
    }
  };

  const handleShareClose = () => {
    setShowShare(false);
  };

  const breathingTransition = useMemo(
    () => ({ duration: 8, repeat: Infinity, ease: "easeInOut" as const }),
    []
  );

  return (
    <div className="min-h-screen bg-radial-subtle" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto w-full max-w-2xl px-5 pt-8 pb-12">
        {/* Top bar */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            to="/home"
            aria-label="Back"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-accent/10 border border-accent/20 text-accent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <p className="text-eyebrow">Open Meditation</p>
        </div>

        {!running ? (
          <div>
            <h1 className="text-display text-3xl md:text-4xl leading-tight mb-8">
              Enter the <span className="italic text-accent">stillness</span>.
            </h1>

            {/* Duration pills */}
            <div className="mb-8">
              <p className="text-eyebrow mb-3">Duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => {
                  const selected = d === minutes;
                  return (
                    <button
                      key={d}
                      onClick={() => setMinutes(d)}
                      className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${
                        selected
                          ? "gold-gradient text-primary-foreground font-semibold"
                          : "border border-accent/25 text-foreground hover:border-accent/50"
                      }`}
                    >
                      {d} min
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ambient sound pills — tap to preview, tap again to set selection */}
            <div className="mb-10">
              <p className="text-eyebrow mb-3">Ambient sound</p>
              <div className="flex flex-wrap gap-2">
                {AMBIENT_OPTIONS.map((opt) => {
                  const selected = opt.key === ambient;
                  return (
                    <button
                      key={opt.key}
                      onClick={async () => {
                        setAmbient(opt.key);
                        // Preview immediately on tap. AudioContext may need a gesture
                        // resume for iOS; ensureAudio handles that.
                        await ensureAudio();
                        startAmbient(opt.key);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${
                        selected
                          ? "gold-gradient text-primary-foreground font-semibold"
                          : "border border-accent/25 text-foreground hover:border-accent/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floating "Sounds still playing" bar — only shown if user previewed
                or just finished a session and ambient is still going. */}
            {ambientPlaying && (
              <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] px-4 py-3">
                <p className="text-ui text-xs">Sounds are playing</p>
                <button
                  onClick={stopAmbient}
                  className="text-accent text-xs font-sans font-semibold hover:underline underline-offset-4"
                >
                  Stop
                </button>
              </div>
            )}

            {/* Begin */}
            <button
              onClick={handleBegin}
              className="w-full rounded-2xl gold-gradient text-primary-foreground py-5 text-base font-sans font-bold tracking-wide active:scale-[0.99] transition-transform"
            >
              Begin →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center pt-6">
            {/* Breathing circle */}
            <div className="relative flex items-center justify-center w-full" style={{ height: 340 }}>
              <motion.div
                animate={paused ? { scale: 1 } : { scale: [1, 1.25, 1] }}
                transition={paused ? { duration: 0.3 } : breathingTransition}
                className="absolute rounded-full"
                style={{
                  width: 260,
                  height: 260,
                  background:
                    "radial-gradient(circle at 50% 50%, hsla(42, 53%, 54%, 0.18) 0%, hsla(156, 52%, 22%, 0.4) 60%, transparent 80%)",
                  border: "1px solid hsla(42, 53%, 54%, 0.35)",
                }}
              />
              <motion.div
                animate={paused ? { scale: 1 } : { scale: [1, 1.18, 1] }}
                transition={paused ? { duration: 0.3 } : breathingTransition}
                className="absolute rounded-full"
                style={{
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle at 50% 50%, hsla(42, 53%, 54%, 0.25) 0%, transparent 75%)",
                  border: "1px solid hsla(42, 53%, 54%, 0.5)",
                }}
              />
              <div
                className="relative text-foreground text-display"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "4rem",
                  fontWeight: 300,
                  letterSpacing: "-0.02em",
                }}
              >
                {fmt(remaining)}
              </div>
            </div>

            {paused && (
              <p className="text-ui text-xs tracking-[0.3em] uppercase mt-6">
                Paused
              </p>
            )}

            <div className="mt-10 flex flex-col items-center gap-4">
              <button
                onClick={handlePauseToggle}
                className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-2.5 text-foreground text-sm font-sans active:scale-95 transition-transform"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={handleEndEarly}
                className="text-muted-foreground text-xs tracking-wide hover:text-accent transition-colors"
              >
                End early
              </button>
            </div>
          </div>
        )}
      </div>

      <ShareCard
        open={showShare}
        onClose={handleShareClose}
        variant="session"
        data={{
          minutes: Math.max(1, Math.round(elapsed / 60)),
          title: "Open Meditation",
          streak,
        }}
      />
    </div>
  );
}
