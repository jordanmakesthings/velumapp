import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, Eye, EyeOff, RotateCcw } from "lucide-react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";

// ---------------------------------------------------------------------------
// Speed presets — full left-to-right-to-left cycle in seconds
// ---------------------------------------------------------------------------
const SPEEDS = [
  { label: "Slow", value: 3.0, description: "Deep processing" },
  { label: "Medium", value: 1.8, description: "Balanced" },
  { label: "Fast", value: 0.9, description: "Activation" },
] as const;

const DURATIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "Open", seconds: 0 },
] as const;

const SOUND_TYPES = [
  { label: "Chime",  description: "Descending tone" },
  { label: "Bell",   description: "Soft ring" },
  { label: "Pulse",  description: "Gentle click" },
  { label: "Drum",   description: "Deep tap" },
] as const;

// ---------------------------------------------------------------------------
// Sound preview — plays a single tap centred for audition on config screen
// ---------------------------------------------------------------------------
function previewSound(soundType: number) {
  const ctx = new AudioContext();
  const t = ctx.currentTime;
  const pan = ctx.createStereoPanner();
  pan.pan.setValueAtTime(0, t);
  pan.connect(ctx.destination);

  if (soundType === 0) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, t);
    osc.frequency.exponentialRampToValueAtTime(264, t + 0.12);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.16);
  } else if (soundType === 1) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(840, t + 0.5);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.58);
  } else if (soundType === 2) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.08);
  } else if (soundType === 3) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.12);
  }

  setTimeout(() => ctx.close(), 1000);
}

// ---------------------------------------------------------------------------
// Web Audio engine
// ---------------------------------------------------------------------------
class BilateralAudio {
  private ctx: AudioContext | null = null;
  private bgAudio: HTMLAudioElement | null = null;

  start() {
    // Background track — binaural audio, play straight (no panning)
    this.bgAudio = new Audio("/audio/bilateral-bg.mp3");
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0.35;
    this.bgAudio.play().catch(() => {});

    // AudioContext kept for tap sounds
    this.ctx = new AudioContext();
  }

  setPan(_position: number) {
    // No-op — binaural stereo is encoded in the audio file
  }

  tap(side: "left" | "right", soundType: number = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const panVal = side === "left" ? -0.9 : 0.9;

    const pan = this.ctx.createStereoPanner();
    pan.pan.setValueAtTime(panVal, t);
    pan.connect(this.ctx.destination);

    if (soundType === 0) {
      // Chime — descending sine 528→264
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, t);
      osc.frequency.exponentialRampToValueAtTime(264, t + 0.12);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(pan);
      osc.start(t); osc.stop(t + 0.16);

    } else if (soundType === 1) {
      // Bell — high sine, slow ring decay
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(840, t + 0.5);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain); gain.connect(pan);
      osc.start(t); osc.stop(t + 0.58);

    } else if (soundType === 2) {
      // Pulse — short mid sine click, no pitch drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain); gain.connect(pan);
      osc.start(t); osc.stop(t + 0.08);

    } else if (soundType === 3) {
      // Drum — deep low thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
      gain.gain.setValueAtTime(0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain); gain.connect(pan);
      osc.start(t); osc.stop(t + 0.12);
    }
  }

  stop() {
    this.bgAudio?.pause();
    this.bgAudio = null;
    this.ctx?.close();
    this.ctx = null;
  }

  isRunning() {
    return this.bgAudio !== null && !this.bgAudio.paused;
  }
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------
type Phase = "intake-issue" | "intake-belief" | "intake-intensity" | "disclaimer" | "session" | "done";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.22 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BilateralPage() {
  const navigate = useNavigate();

  // Intake
  const [phase, setPhase] = useState<Phase>("intake-issue");
  const [issue, setIssue] = useState("");
  const [belief, setBelief] = useState("");
  const [intensity, setIntensity] = useState(7);
  const [startIntensity, setStartIntensity] = useState(7);

  // Session config
  const [soundOn, setSoundOn] = useState(true);
  const [showOrb, setShowOrb] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [durationIdx, setDurationIdx] = useState(2);
  const [soundTypeIdx, setSoundTypeIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [orbX, setOrbX] = useState(0);

  const audioRef = useRef<BilateralAudio>(new BilateralAudio());
  const lastEdgeRef = useRef<"left" | "right" | null>(null);

  const speed = SPEEDS[speedIdx];
  const duration = DURATIONS[durationIdx];

  const stop = useCallback(() => {
    setIsRunning(false);
    audioRef.current.stop();
  }, []);

  const startSession = useCallback(() => {
    setElapsed(0);
    lastEdgeRef.current = null;
    if (soundOn) audioRef.current.start();
    setIsRunning(true);
  }, [soundOn]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (duration.seconds > 0 && next >= duration.seconds) stop();
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, duration.seconds, stop]);

  // Animation loop
  useAnimationFrame((time) => {
    if (!isRunning) return;
    const halfCycleMs = (speed.value / 2) * 1000;
    const phase_ = (time % (halfCycleMs * 2)) / (halfCycleMs * 2);
    const pos = Math.sin(phase_ * Math.PI * 2);
    setOrbX(pos);

    if (soundOn && audioRef.current.isRunning()) {
      audioRef.current.setPan(pos);
      if (pos > 0.92 && lastEdgeRef.current !== "right") {
        lastEdgeRef.current = "right";
        audioRef.current.tap("right", soundTypeIdx);
      } else if (pos < -0.92 && lastEdgeRef.current !== "left") {
        lastEdgeRef.current = "left";
        audioRef.current.tap("left", soundTypeIdx);
      }
    }
  });

  useEffect(() => () => audioRef.current.stop(), []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const remaining = duration.seconds > 0 ? Math.max(0, duration.seconds - elapsed) : elapsed;
  const orbPercent = ((orbX + 1) / 2) * 90 + 5;

  // ---------------------------------------------------------------------------
  // Intake — Issue
  // ---------------------------------------------------------------------------
  if (phase === "intake-issue") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="issue" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-8">
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Step 1 of 3</p>
              <h1 className="text-display text-3xl mb-3">What's bothering you?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Be as specific as you can. The more honest, the more effective the session.
              </p>
            </div>

            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. I'm feeling anxious about a conversation with my manager tomorrow. My chest is tight and I can't stop replaying it."
              rows={5}
              autoFocus
              className="flex-1 bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
            />

            <button
              onClick={() => setPhase("intake-belief")}
              disabled={issue.trim().length < 5}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Intake — Belief
  // ---------------------------------------------------------------------------
  if (phase === "intake-belief") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("intake-issue")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="belief" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-8">
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Step 2 of 3</p>
              <h1 className="text-display text-3xl mb-3">What do you believe to be true about this?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                What does this situation make you believe — about yourself, others, or the world?
              </p>
            </div>

            <textarea
              value={belief}
              onChange={(e) => setBelief(e.target.value)}
              placeholder="e.g. I believe I'm not good enough and that I'm going to say something wrong. I feel like people don't respect me."
              rows={5}
              autoFocus
              className="flex-1 bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
            />

            <button
              onClick={() => setPhase("intake-intensity")}
              disabled={belief.trim().length < 3}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Intake — Intensity
  // ---------------------------------------------------------------------------
  if (phase === "intake-intensity") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("intake-belief")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="intensity" {...slide} className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-8">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-6">Step 3 of 3</p>
            <h1 className="text-display text-3xl mb-3 text-center">Rate your intensity right now</h1>
            <p className="text-muted-foreground text-sm mb-10 text-center">
              How distressing does this feel in your body, from 1 (mild) to 10 (overwhelming)?
            </p>

            <p className="text-display text-7xl text-accent mb-2 tabular-nums">{intensity}</p>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-10">
              {intensity <= 3 ? "Mild" : intensity <= 6 ? "Moderate" : intensity <= 8 ? "High" : "Overwhelming"}
            </p>

            <div className="w-full mb-10">
              <input
                type="range" min={1} max={10} value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">1 · Mild</span>
                <span className="text-[10px] text-muted-foreground">10 · Overwhelming</span>
              </div>
            </div>

            <button
              onClick={() => { setStartIntensity(intensity); setPhase("disclaimer"); }}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              Continue
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Disclaimer
  // ---------------------------------------------------------------------------
  if (phase === "disclaimer") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div key="disclaimer" {...slide} className="max-w-sm w-full">
            <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center mb-6">
              <span className="text-xl">⚠️</span>
            </div>
            <h2 className="text-display text-2xl mb-4">Before you begin</h2>
            <div className="space-y-3 mb-8">
              <p className="text-foreground/80 text-sm leading-relaxed">
                Bilateral stimulation is a self-regulation tool. It can support emotional processing and help calm your nervous system.
              </p>
              <p className="text-foreground/80 text-sm leading-relaxed">
                It is <strong>not</strong> a replacement for working with a licensed mental health professional, therapist, or trauma specialist.
              </p>
              <p className="text-foreground/80 text-sm leading-relaxed">
                If you are working through trauma, significant distress, or a mental health condition, please do so with professional support.
              </p>
            </div>

            {/* Config in disclaimer so they can set it before the session starts */}
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Speed</p>
                <div className="flex gap-2">
                  {SPEEDS.map((s, i) => (
                    <button key={s.label} onClick={() => setSpeedIdx(i)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-sans transition-all ${speedIdx === i ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Duration</p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d, i) => (
                    <button key={d.label} onClick={() => setDurationIdx(i)}
                      className={`py-2.5 rounded-xl text-xs font-sans transition-all ${durationIdx === i ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sound</p>
                  <button
                    onClick={() => setSoundOn(!soundOn)}
                    className={`flex items-center gap-1.5 text-xs font-sans px-3 py-1 rounded-full transition-all ${soundOn ? "bg-accent/15 text-accent" : "bg-card text-muted-foreground"}`}
                  >
                    {soundOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    {soundOn ? "On" : "Off"}
                  </button>
                </div>
                <div className={`grid grid-cols-2 gap-2 transition-opacity ${!soundOn ? "opacity-40 pointer-events-none" : ""}`}>
                  {SOUND_TYPES.map((s, i) => (
                    <button key={s.label} onClick={() => { setSoundTypeIdx(i); previewSound(i); }}
                      className={`py-2.5 rounded-xl text-xs font-sans transition-all flex flex-col items-center gap-0.5 ${soundTypeIdx === i ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                      <span>{s.label}</span>
                      <span className={`text-[10px] ${soundTypeIdx === i ? "text-primary-foreground/70" : "text-muted-foreground/50"}`}>{s.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setPhase("session")}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              I understand — begin
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✦</span>
          </div>
          <h2 className="text-display text-2xl mb-2">Session complete</h2>
          <p className="text-muted-foreground text-sm mb-8">Take a breath. Notice what's different.</p>

          <div className="velum-card p-5 mb-8 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Your session</p>
            <p className="text-foreground text-sm mb-1 font-sans font-medium">What you worked on:</p>
            <p className="text-muted-foreground text-sm mb-4 italic">"{issue}"</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-display text-2xl text-accent">{startIntensity}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Before</p>
              </div>
              <div className="flex-1 h-px bg-foreground/10 relative">
                <div className="absolute inset-y-0 left-0 bg-accent/40 rounded-full transition-all" style={{ width: `${Math.max(0, (startIntensity - intensity) / startIntensity * 100)}%` }} />
              </div>
              <div className="text-center">
                <p className="text-display text-2xl text-accent">{intensity}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">After</p>
              </div>
            </div>
            {intensity < startIntensity && (
              <p className="text-accent text-xs text-center mt-3">
                ↓ {startIntensity - intensity} point{startIntensity - intensity !== 1 ? "s" : ""} shift
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="velum-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">How does it feel now?</p>
              <input
                type="range" min={1} max={10} value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">1</span>
                <span className="text-display text-lg text-accent">{intensity}</span>
                <span className="text-[10px] text-muted-foreground">10</span>
              </div>
            </div>

            <button onClick={() => { setPhase("session"); startSession(); }}
              className="w-full py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm flex items-center justify-center gap-2 border border-foreground/10 active:scale-[0.98] transition-transform">
              <RotateCcw className="w-4 h-4" /> Another round
            </button>
            <button onClick={() => navigate("/tools")}
              className="w-full py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform">
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={() => { stop(); setPhase("disclaimer"); }}
          className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Bilateral</p>
        <div className="w-16" />
      </div>

      {/* Landscape hint on mobile — shown only before session starts */}
      {!isRunning && (
        <div className="lg:hidden mx-4 mb-2 px-3 py-2 rounded-xl bg-surface-light flex items-center gap-2">
          <span className="text-sm">📱</span>
          <p className="text-[11px] text-muted-foreground">Turn your phone sideways for the best experience.</p>
        </div>
      )}

      {/* Orb track */}
      <div className="relative flex items-center justify-center flex-1" style={{ minHeight: "35vh" }}>
        <div className="absolute inset-x-[5%] top-1/2 -translate-y-1/2 h-px bg-foreground/8" />
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground/15" />
        <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground/15" />

        {showOrb && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${orbPercent}%` }}
          >
            <div className="absolute top-1/2 left-1/2"
              style={{ transform: "translate(-50%, -50%) scale(2)", width: "3.5rem", height: "3.5rem",
                background: "radial-gradient(circle, hsl(42,53%,54%) 0%, transparent 70%)",
                borderRadius: "50%", filter: "blur(12px)", opacity: 0.6 }} />
            <div className="relative rounded-full gold-gradient shadow-lg" style={{ width: "2.25rem", height: "2.25rem" }} />
          </motion.div>
        )}

        {!showOrb && isRunning && (
          <p className="text-muted-foreground text-sm font-serif italic text-center px-8">
            Let the sound guide you.<br />Follow it with your mind's eye.
          </p>
        )}

        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8">
            <p className="text-muted-foreground text-sm text-center leading-relaxed font-serif italic">
              "{issue.slice(0, 80)}{issue.length > 80 ? "…" : ""}"
            </p>
          </div>
        )}
      </div>

      {/* Timer */}
      {isRunning && (
        <div className="text-center shrink-0 mb-2">
          <p className="text-display text-3xl text-accent tabular-nums">{formatTime(remaining)}</p>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-1">
            {duration.seconds > 0 ? "remaining" : "elapsed"}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="px-6 pb-6 space-y-4 shrink-0">
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSoundOn(!soundOn); if (isRunning) { if (soundOn) audioRef.current.stop(); else audioRef.current.start(); } }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans transition-colors ${soundOn ? "bg-card text-foreground" : "bg-card text-muted-foreground"}`}>
            {soundOn ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4" />}
            {soundOn ? "Sound on" : "Sound off"}
          </button>
          <button
            onClick={() => setShowOrb(!showOrb)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans transition-colors ${showOrb ? "bg-card text-foreground" : "bg-card text-muted-foreground"}`}>
            {showOrb ? <Eye className="w-4 h-4 text-accent" /> : <EyeOff className="w-4 h-4" />}
            {showOrb ? "Visual" : "Eyes closed"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={isRunning ? stop : startSession}
            className={`flex-1 py-4 rounded-2xl font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${isRunning ? "bg-card text-foreground border border-foreground/10" : "gold-gradient text-primary-foreground"}`}>
            {isRunning ? <><Pause className="w-5 h-5" /> Stop</> : <><Play className="w-5 h-5 ml-0.5" /> Begin</>}
          </button>
          {isRunning && (
            <button onClick={() => { stop(); setPhase("done"); }}
              className="px-5 py-4 rounded-2xl bg-card text-foreground font-sans text-sm border border-foreground/10 active:scale-[0.98] transition-transform">
              Finish
            </button>
          )}
        </div>

        {!isRunning && (
          <p className="text-center text-muted-foreground text-[11px] leading-relaxed">
            Use headphones. Follow the light with soft, relaxed eyes.
          </p>
        )}
      </div>
    </div>
  );
}
