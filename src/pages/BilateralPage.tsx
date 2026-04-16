import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, Pause, Volume2, VolumeX, Eye, EyeOff, Wind, Shuffle, Flame, Rewind, Users, Layers, Brain, HeartCrack } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";
import { logSession } from "@/lib/velumStorage";

// ---------------------------------------------------------------------------
// Speed presets
// ---------------------------------------------------------------------------
const SPEEDS = [
  { label: "Slow",   value: 3.0, description: "Deep processing" },
  { label: "Medium", value: 1.8, description: "Balanced" },
  { label: "Fast",   value: 0.9, description: "Activation" },
] as const;

const DURATIONS = [
  { label: "1 min",  seconds: 60 },
  { label: "2 min",  seconds: 120 },
  { label: "3 min",  seconds: 180 },
  { label: "5 min",  seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "Open",   seconds: 0 },
] as const;

const SOUND_TYPES = [
  { label: "Chime",  description: "Descending tone" },
  { label: "Bell",   description: "Soft ring" },
  { label: "Pulse",  description: "Gentle click" },
  { label: "Drum",   description: "Deep tap" },
] as const;

// ---------------------------------------------------------------------------
// Sound preview
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
    this.bgAudio = new Audio("/audio/bilateral-bg.mp3");
    this.bgAudio.loop = true;
    this.bgAudio.volume = 0.35;
    this.bgAudio.play().catch(() => {});
    this.ctx = new AudioContext();
  }

  setPan(_position: number) {}

  tap(side: "left" | "right", soundType: number = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const panVal = side === "left" ? -0.9 : 0.9;
    const pan = this.ctx.createStereoPanner();
    pan.pan.setValueAtTime(panVal, t);
    pan.connect(this.ctx.destination);

    if (soundType === 0) {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(528, t);
      osc.frequency.exponentialRampToValueAtTime(264, t + 0.12);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.16);
    } else if (soundType === 1) {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(840, t + 0.5);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.58);
    } else if (soundType === 2) {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, t);
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.08);
    } else if (soundType === 3) {
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
      gain.gain.setValueAtTime(0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain); gain.connect(pan); osc.start(t); osc.stop(t + 0.12);
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
// Categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { label: "Anxiety",              icon: Wind,       placeholder: "e.g. I can't stop worrying about tomorrow. My chest is tight and my mind keeps racing through worst-case scenarios." },
  { label: "Scattered focus",      icon: Shuffle,    placeholder: "e.g. I can't settle on anything. I keep switching between tasks, feel restless, and my thoughts won't slow down." },
  { label: "Cravings",             icon: Flame,      placeholder: "e.g. I have a strong urge right now. I feel it in my chest and stomach and I can't shake it." },
  { label: "A difficult memory",   icon: Rewind,     placeholder: "e.g. I keep replaying a moment from [when]. When I think about it, my stomach drops and I feel [emotion]." },
  { label: "Relationship tension", icon: Users,      placeholder: "e.g. I'm carrying tension from [person or situation]. I feel it in my shoulders and jaw and I can't let it go." },
  { label: "Overwhelm",            icon: Layers,     placeholder: "e.g. There's too much happening and I can't settle. I feel pressure in my chest and I don't know where to start." },
  { label: "Limiting belief",      icon: Brain,      placeholder: "e.g. I keep running into this belief that I'm not good enough. I feel it as tightness in my chest." },
  { label: "Grief / loss",         icon: HeartCrack, placeholder: "e.g. I'm carrying grief about [person/situation]. I feel heaviness in my chest and a sadness I can't shake." },
];

// ---------------------------------------------------------------------------
// NC / PC suggestions per category
// ---------------------------------------------------------------------------
const NC_SUGGESTIONS: Record<string, string[]> = {
  "Anxiety":              ["I am not safe.", "I am out of control.", "Something bad will happen.", "I cannot trust myself."],
  "Scattered focus":      ["I am not enough.", "I am failing.", "I cannot focus.", "I cannot handle this."],
  "Cravings":             ["I am weak.", "I have no control.", "I don't deserve better.", "I cannot stop."],
  "A difficult memory":   ["It was my fault.", "I am powerless.", "I am not good enough.", "I should have known."],
  "Relationship tension": ["I am not lovable.", "I am alone.", "I don't matter.", "I cannot trust."],
  "Overwhelm":            ["I cannot cope.", "I am not enough.", "I am failing.", "It is too much."],
  "Limiting belief":      ["I am not good enough.", "I don't deserve this.", "I always fail.", "I am not worthy."],
  "Grief / loss":         ["I am alone.", "I am powerless.", "It is my fault.", "I cannot get through this."],
};

const PC_SUGGESTIONS: Record<string, string[]> = {
  "Anxiety":              ["I am safe now.", "I can handle this.", "I trust myself.", "I am in control of what matters."],
  "Scattered focus":      ["I am enough.", "I can settle and focus.", "I am capable.", "I can handle this."],
  "Cravings":             ["I have strength within me.", "I can choose differently.", "I deserve better.", "I am in control."],
  "A difficult memory":   ["I did the best I could.", "I have power now.", "I am enough.", "I can learn and grow."],
  "Relationship tension": ["I am worthy of love.", "I am supported.", "I matter.", "I can trust again."],
  "Overwhelm":            ["I can handle what's here.", "I am enough.", "I can take one step.", "I am capable."],
  "Limiting belief":      ["I am enough.", "I deserve good things.", "I am capable.", "I am worthy."],
  "Grief / loss":         ["I am not alone.", "I have strength within me.", "I can heal.", "I am supported."],
};

const BODY_CHIPS = ["Head / Neck", "Jaw / Throat", "Chest", "Heart", "Stomach", "Gut", "Shoulders / Back", "Arms / Hands", "Legs / Feet", "Whole body"];

// ---------------------------------------------------------------------------
// Phase type
// ---------------------------------------------------------------------------
type Phase =
  | "what"       // category selection
  | "describe"   // situation description
  | "belief"     // negative cognition ("I am...")
  | "pc"         // positive cognition
  | "rate"       // SUDS 0–10 + body location
  | "setup"      // config + begin
  | "process"    // bilateral session (NC focus)
  | "notice"     // blank-slate drop-in after process
  | "charge"     // SUDS recheck
  | "install"    // bilateral session (PC focus)
  | "voc"        // validity of cognition 1–7
  | "body-close" // post-session body scan + container
  | "done";

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
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>("what");

  // Assessment
  const [category, setCategory] = useState("");
  const [target, setTarget]     = useState("");   // situation description
  const [nc, setNc]             = useState("");   // negative cognition
  const [pc, setPc]             = useState("");   // positive cognition

  // Measurement
  const [suds, setSuds]               = useState(5);
  const [startSuds, setStartSuds]     = useState(5);
  const [sudsHistory, setSudsHistory] = useState<number[]>([]);
  const [voc, setVoc]                 = useState(4);   // 1–7
  const [bodyLocations, setBodyLocations] = useState<string[]>([]);

  // Session tracking
  const [roundCount, setRoundCount] = useState(0);

  // Notice
  const [showNoticeNote, setShowNoticeNote] = useState(false);
  const [noticeNote, setNoticeNote]         = useState("");

  // Body close
  const [bodyScanNote, setBodyScanNote]   = useState("");
  const [showContainer, setShowContainer] = useState(false);

  // Session config
  const [soundOn, setSoundOn]         = useState(true);
  const [showOrb, setShowOrb]         = useState(true);
  const [speedIdx, setSpeedIdx]       = useState(1);
  const [durationIdx, setDurationIdx] = useState(2);
  const [soundTypeIdx, setSoundTypeIdx] = useState(0);
  const [hapticOn, setHapticOn]       = useState(true);

  const canHaptic = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed]     = useState(0);
  const [orbX, setOrbX]           = useState(0);

  const audioRef       = useRef<BilateralAudio>(new BilateralAudio());
  const lastEdgeRef    = useRef<"left" | "right" | null>(null);
  const sessionModeRef = useRef<"process" | "install">("process");

  const speed    = SPEEDS[speedIdx];
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
    setRoundCount((c) => c + 1);
  }, [soundOn]);

  // Timer — routes to notice (process) or voc (install) on expiry
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (duration.seconds > 0 && next >= duration.seconds) {
          stop();
          setPhase(sessionModeRef.current === "install" ? "voc" : "notice");
        }
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
        if (hapticOn && canHaptic) navigator.vibrate(45);
      } else if (pos < -0.92 && lastEdgeRef.current !== "left") {
        lastEdgeRef.current = "left";
        audioRef.current.tap("left", soundTypeIdx);
        if (hapticOn && canHaptic) navigator.vibrate(45);
      }
    }
  });

  useEffect(() => () => audioRef.current.stop(), []);

  // Save to Supabase on done
  useEffect(() => {
    if (phase !== "done" || !user) return;
    supabase.from("bilateral_sessions").insert({
      user_id: user.id,
      issue: target,
      belief: nc,
      positive_cognition: pc || null,
      body_locations: bodyLocations.length > 0 ? bodyLocations : null,
      suds_start: startSuds,
      suds_history: sudsHistory.length > 0 ? sudsHistory : null,
      resistance_final: voc !== 4 ? voc : null,
      rounds: roundCount,
      future_scenario: null,
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const remaining  = duration.seconds > 0 ? Math.max(0, duration.seconds - elapsed) : elapsed;
  const orbPercent = ((orbX + 1) / 2) * 90 + 5;

  // =========================================================================
  // WHAT — category selection
  // =========================================================================
  if (phase === "what") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="what" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-10">
              <h1 className="text-display text-3xl mb-3">What are you bringing today?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose what feels closest. You'll describe it specifically in the next step.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const selected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => { setCategory(cat.label); setPhase("describe"); }}
                    className={`relative p-5 rounded-2xl text-left transition-all active:scale-[0.97] flex flex-col gap-3 border ${
                      selected
                        ? "gold-gradient text-primary-foreground border-transparent"
                        : "bg-card text-foreground border-foreground/5 hover:border-accent/20"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected ? "bg-white/15" : "bg-surface-light"}`}>
                      <Icon className={`w-4 h-4 ${selected ? "text-primary-foreground" : "text-accent"}`} strokeWidth={1.5} />
                    </div>
                    <span className="font-sans text-sm font-medium leading-snug">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // DESCRIBE — situation
  // =========================================================================
  if (phase === "describe") {
    const cat = CATEGORIES.find((c) => c.label === category);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("what")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="describe" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-6">
              <div className="inline-flex mb-4">
                <span className="px-3 py-1.5 rounded-full bg-surface-light text-accent text-xs font-sans font-medium">{category}</span>
              </div>
              <h1 className="text-display text-3xl mb-3">Get specific.</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Describe exactly what you're bringing — what's happening, what you feel, where you feel it. The more precise, the faster this works.
              </p>
            </div>

            <textarea
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={cat?.placeholder ?? "Describe the situation, the feeling, and where it lives in your body."}
              rows={6}
              autoFocus
              className="bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
            />

            <button
              onClick={() => setPhase("belief")}
              disabled={target.trim().length < 5}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // BELIEF — negative cognition
  // =========================================================================
  if (phase === "belief") {
    const suggestions = NC_SUGGESTIONS[category] ?? [];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("describe")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="belief" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-6">
              <h1 className="text-display text-3xl mb-3">What does this say about you?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                When you bring this to mind, what do you believe about yourself? Usually starts with "I am…" or "I…"
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Common patterns</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNc(s)}
                      className={`px-3.5 py-2 rounded-full text-sm font-sans transition-all border ${
                        nc === s
                          ? "bg-accent/15 text-accent border-accent/40"
                          : "bg-card text-muted-foreground border-foreground/10 hover:border-accent/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text"
              value={nc}
              onChange={(e) => setNc(e.target.value)}
              placeholder="Or write your own — e.g. I am not enough."
              autoFocus
              className="bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
            />

            <button
              onClick={() => setPhase("pc")}
              disabled={nc.trim().length < 3}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // PC — positive cognition
  // =========================================================================
  if (phase === "pc") {
    const suggestions = PC_SUGGESTIONS[category] ?? [];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("belief")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="pc" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-5">
              <h1 className="text-display text-3xl mb-3">What would you rather believe?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Instead of <span className="text-foreground italic">"{nc}"</span> — what would you prefer to know to be true about yourself?
              </p>
            </div>

            {suggestions.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPc(s)}
                      className={`px-3.5 py-2 rounded-full text-sm font-sans transition-all border ${
                        pc === s
                          ? "bg-accent/15 text-accent border-accent/40"
                          : "bg-card text-muted-foreground border-foreground/10 hover:border-accent/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text"
              value={pc}
              onChange={(e) => setPc(e.target.value)}
              placeholder="e.g. I am enough. I am safe. I can handle this."
              autoFocus
              className="bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
            />

            <button
              onClick={() => setPhase("rate")}
              disabled={pc.trim().length < 3}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // RATE — SUDS 0–10 + body location
  // =========================================================================
  if (phase === "rate") {
    const sudLabel = suds === 0 ? "Clear" : suds <= 2 ? "Very low" : suds <= 4 ? "Mild" : suds <= 6 ? "Moderate" : suds <= 8 ? "High" : "Overwhelming";
    const toggleBody = (loc: string) => setBodyLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("pc")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="rate" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="velum-card p-4 mb-6">
              <p className="text-foreground font-serif text-sm italic leading-relaxed">"{nc}"</p>
            </div>

            <h1 className="text-display text-3xl mb-3">How charged does this feel?</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Bring it to mind right now. Rate the distress from 0 (nothing) to 10 (overwhelming).
            </p>

            <div className="text-center mb-6">
              <p className="text-display text-7xl text-accent mb-1 tabular-nums">{suds}</p>
              <p className="text-muted-foreground text-xs uppercase tracking-widest">{sudLabel}</p>
            </div>

            <div className="mb-10">
              <input
                type="range" min={0} max={10} value={suds}
                onChange={(e) => setSuds(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">0 · Clear</span>
                <span className="text-[10px] text-muted-foreground">10 · Overwhelming</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Where do you feel it?</p>
              <div className="flex flex-wrap gap-2">
                {BODY_CHIPS.map((loc) => (
                  <button key={loc} onClick={() => toggleBody(loc)}
                    className={`px-4 py-2.5 rounded-full text-sm font-sans transition-all ${bodyLocations.includes(loc) ? "bg-accent/20 text-accent border border-accent/40" : "bg-card text-muted-foreground border border-foreground/10"}`}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setStartSuds(suds); setSudsHistory([]); setPhase("setup"); }}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              Continue →
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // SETUP — config + begin
  // =========================================================================
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-4">
          <button onClick={() => setPhase("rate")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="setup" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            {/* What you're working with */}
            <div className="velum-card p-4 mb-6 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Working on</p>
                <p className="text-foreground font-serif text-sm italic leading-relaxed">"{nc}"</p>
              </div>
              <div className="h-px bg-foreground/8" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Moving toward</p>
                <p className="text-accent font-serif text-sm italic leading-relaxed">"{pc}"</p>
              </div>
            </div>

            {/* Config */}
            <div className="space-y-4 mb-6">
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

            <p className="text-muted-foreground/60 text-xs leading-relaxed mb-6 text-center">
              This tool supports self-regulation. It is not a replacement for working with a licensed therapist. If you are processing trauma, do so with professional support.
            </p>

            <button
              onClick={() => {
                sessionModeRef.current = "process";
                setPhase("process");
                startSession();
              }}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 ml-0.5" /> Begin
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // NOTICE — blank-slate drop-in after processing
  // =========================================================================
  if (phase === "notice") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
          <h2 className="text-display text-3xl mb-10 text-center">What do you notice?</h2>

          <div className="space-y-3">
            <button
              onClick={() => {
                setShowNoticeNote(false);
                setNoticeNote("");
                setPhase("process");
                startSession();
              }}
              className="w-full py-4 rounded-2xl bg-card text-foreground font-sans text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
            >
              Keep going
            </button>

            <button
              onClick={() => setShowNoticeNote((v) => !v)}
              className={`w-full py-4 rounded-2xl text-sm font-sans border transition-all active:scale-[0.98] ${showNoticeNote ? "bg-card text-foreground border-accent/30" : "bg-card text-muted-foreground border-foreground/10"}`}
            >
              Something new came up
            </button>

            {showNoticeNote && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="velum-card p-4 space-y-3">
                <textarea
                  value={noticeNote}
                  onChange={(e) => setNoticeNote(e.target.value)}
                  placeholder="Note it briefly — then go with that."
                  rows={2}
                  autoFocus
                  className="w-full bg-background rounded-xl px-4 py-3 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={() => { setPhase("process"); startSession(); }}
                  className="w-full py-3 rounded-xl bg-surface-light text-foreground font-sans text-sm active:scale-[0.98] transition-transform"
                >
                  Go with that →
                </button>
              </motion.div>
            )}

            <button
              onClick={() => { setSuds(5); setPhase("charge"); }}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              Check in →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // CHARGE — SUDS recheck
  // =========================================================================
  if (phase === "charge") {
    const sudLabel = suds === 0 ? "Clear" : suds <= 1 ? "Essentially clear" : suds <= 3 ? "Very low" : suds <= 5 ? "Moderate" : suds <= 7 ? "High" : "Very high";
    const isClear      = suds <= 1;
    const isClose      = suds >= 2 && suds <= 3;
    const stillActive  = suds >= 4;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-4 text-center">Check in</p>

          <div className="velum-card p-4 mb-6 text-center">
            <p className="text-foreground font-serif text-sm italic leading-relaxed">"{nc}"</p>
          </div>

          <h2 className="text-display text-2xl mb-2 text-center">When you bring this to mind now —</h2>
          <h2 className="text-display text-2xl mb-6 text-center">how charged does it feel?</h2>

          <p className="text-display text-7xl text-accent mb-1 text-center tabular-nums">{suds}</p>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-6 text-center">{sudLabel}</p>

          <input
            type="range" min={0} max={10} value={suds}
            onChange={(e) => setSuds(Number(e.target.value))}
            className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between mb-8">
            <span className="text-[10px] text-muted-foreground">0 · Clear</span>
            <span className="text-[10px] text-muted-foreground">10 · Overwhelming</span>
          </div>

          {isClear && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center border border-accent/20">
                <p className="text-foreground text-sm font-sans">
                  {suds === 0 ? "Clear." : "Essentially clear."}{" "}
                  <span className="text-accent">Ready to install the new belief.</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSudsHistory((h) => [...h, suds]);
                  sessionModeRef.current = "install";
                  setPhase("install");
                  startSession();
                }}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
              >
                Install new belief →
              </button>
            </div>
          )}

          {isClose && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center border border-accent/20">
                <p className="text-foreground text-sm font-sans">
                  At {suds} — very close. One more round could bring it all the way down.
                </p>
              </div>
              <button
                onClick={() => {
                  setSudsHistory((h) => [...h, suds]);
                  sessionModeRef.current = "install";
                  setPhase("install");
                  startSession();
                }}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
              >
                Move to installation →
              </button>
              <button
                onClick={() => { setSudsHistory((h) => [...h, suds]); setPhase("process"); startSession(); }}
                className="w-full py-4 rounded-2xl bg-card text-foreground font-sans font-medium text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
              >
                One more round
              </button>
            </div>
          )}

          {stillActive && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center">
                <p className="text-foreground text-sm font-sans">
                  Still at {suds} — {suds >= 7 ? "there's significant charge here." : "still some activation."} Keep processing until this drops below 2.
                </p>
              </div>
              <button
                onClick={() => { setSudsHistory((h) => [...h, suds]); setPhase("process"); startSession(); }}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
              >
                Continue processing →
              </button>
              <button
                onClick={() => {
                  setSudsHistory((h) => [...h, suds]);
                  sessionModeRef.current = "install";
                  setPhase("install");
                  startSession();
                }}
                className="w-full py-4 rounded-2xl bg-card text-foreground font-sans font-medium text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
              >
                Move to installation anyway
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // VOC — validity of cognition (1–7)
  // =========================================================================
  if (phase === "voc") {
    const vocLabel   = voc <= 1 ? "Feels completely false" : voc <= 2 ? "Mostly doesn't feel true" : voc <= 3 ? "Uncertain" : voc <= 4 ? "Starting to feel true" : voc <= 5 ? "Mostly true" : voc <= 6 ? "Very true" : "Completely true";
    const isInstalled = voc >= 7;
    const isClose     = voc >= 5 && voc < 7;
    const needsWork   = voc < 5;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full">
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-4 text-center">VOC</p>

          <div className="velum-card p-4 mb-6 text-center">
            <p className="text-foreground font-serif text-base leading-relaxed italic">"{pc}"</p>
          </div>

          <h2 className="text-display text-2xl mb-6 text-center">How true does this feel right now?</h2>

          <p className="text-display text-7xl text-accent mb-1 text-center tabular-nums">{voc}</p>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-6 text-center">{vocLabel}</p>

          <input
            type="range" min={1} max={7} value={voc}
            onChange={(e) => setVoc(Number(e.target.value))}
            className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between mb-8">
            <span className="text-[10px] text-muted-foreground">1 · Not at all true</span>
            <span className="text-[10px] text-muted-foreground">7 · Completely true</span>
          </div>

          {isInstalled && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center border border-accent/20">
                <p className="text-foreground text-sm font-sans">Fully installed. <span className="text-accent">Let's close with a body scan.</span></p>
              </div>
              <button onClick={() => setPhase("body-close")}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform">
                Body scan →
              </button>
            </div>
          )}

          {isClose && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center border border-accent/20">
                <p className="text-foreground text-sm font-sans">At {voc} — almost there. One more round could bring it all the way in.</p>
              </div>
              <button
                onClick={() => { sessionModeRef.current = "install"; setPhase("install"); startSession(); }}
                className="w-full py-4 rounded-2xl bg-card text-foreground font-sans font-medium text-sm border border-foreground/10 active:scale-[0.98] transition-transform">
                One more round
              </button>
              <button onClick={() => setPhase("body-close")}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform">
                Move on →
              </button>
            </div>
          )}

          {needsWork && (
            <div className="space-y-3">
              <div className="velum-card p-4 text-center">
                <p className="text-foreground text-sm font-sans">At {voc} — still some resistance. Keep installing. Target is 7.</p>
              </div>
              <button
                onClick={() => { sessionModeRef.current = "install"; setPhase("install"); startSession(); }}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform">
                Keep installing →
              </button>
              <button onClick={() => setPhase("body-close")}
                className="w-full py-4 rounded-2xl bg-card text-foreground font-sans font-medium text-sm border border-foreground/10 active:scale-[0.98] transition-transform">
                Move on
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // BODY-CLOSE — post-session body scan + container
  // =========================================================================
  if (phase === "body-close") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("voc")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="body-close" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            {!showContainer ? (
              <>
                <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Body scan</p>
                <h1 className="text-display text-3xl mb-4">Hold this in mind.</h1>

                <div className="velum-card p-4 mb-5">
                  <p className="text-accent font-serif text-sm italic leading-relaxed">"{pc}"</p>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Scan from the top of your head to the soles of your feet. Notice anything — tension, warmth, lightness, nothing at all. Whatever is there is fine.
                </p>

                <textarea
                  value={bodyScanNote}
                  onChange={(e) => setBodyScanNote(e.target.value)}
                  placeholder="What do you notice?  (optional)"
                  rows={3}
                  className="bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
                />

                <div className="space-y-3">
                  <button
                    onClick={() => setPhase("done")}
                    className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
                  >
                    Body feels clear — complete
                  </button>
                  <button
                    onClick={() => setShowContainer(true)}
                    className="w-full py-4 rounded-2xl bg-card text-foreground font-sans font-medium text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
                  >
                    Something still needs attention
                  </button>
                </div>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
                <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Container</p>
                <h1 className="text-display text-3xl mb-6">Put it away for now.</h1>

                <div className="velum-card p-5 mb-6 space-y-4">
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    Imagine a container — a vault, a chest, whatever feels right. Strong enough to hold anything.
                  </p>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    Place anything unresolved inside it. You can return to it whenever you're ready.
                  </p>
                  <p className="text-foreground/80 text-sm leading-relaxed">
                    Close it. Notice that it's held.
                  </p>
                </div>

                <button
                  onClick={() => setPhase("done")}
                  className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
                >
                  Done
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // DONE
  // =========================================================================
  if (phase === "done") {
    const finalSuds = sudsHistory.length > 0 ? sudsHistory[sudsHistory.length - 1] : startSuds;
    const shift     = startSuds - finalSuds;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✦</span>
          </div>
          <h2 className="text-display text-2xl mb-2">Session complete.</h2>
          <p className="text-muted-foreground text-sm mb-8">Take a breath. Notice what's different.</p>

          {pc && (
            <div className="velum-card p-4 mb-5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">New belief</p>
              <p className="text-foreground font-serif text-base leading-relaxed italic">"{pc}"</p>
            </div>
          )}

          <div className="velum-card p-5 mb-6 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Your session</p>

            {sudsHistory.length > 0 ? (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Charge over time</p>
                <div className="flex items-end gap-1.5 mb-2">
                  {[startSuds, ...sudsHistory].map((val, i, arr) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-1">
                      <span className="text-[10px] text-accent tabular-nums">{val}</span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${(val / 10) * 48}px`,
                          background: i === arr.length - 1
                            ? "hsl(var(--accent) / 0.8)"
                            : `hsl(var(--accent) / ${0.2 + (i / arr.length) * 0.3})`
                        }}
                      />
                      <span className="text-[9px] text-muted-foreground">{i === 0 ? "Start" : `R${i}`}</span>
                    </div>
                  ))}
                </div>
                {shift > 0 && (
                  <p className="text-accent text-xs text-center mt-2">
                    ↓ {shift} point{shift !== 1 ? "s" : ""} · {sudsHistory.length} round{sudsHistory.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 justify-center">
                <div className="text-center">
                  <p className="text-display text-2xl text-accent">{startSuds}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Before</p>
                </div>
                <div className="flex-1 h-px bg-foreground/10" />
                <div className="text-center">
                  <p className="text-display text-2xl text-accent">{finalSuds}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">After</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              logSession({ tool: "bilateral", suds_before: startSuds, suds_after: finalSuds, category, issue: target });
              navigate("/tools");
            }}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // SESSION — bilateral orb (process or install)
  // =========================================================================
  const isInstallMode  = sessionModeRef.current === "install";
  const sessionTarget  = isInstallMode ? pc : nc;
  const sessionLabel   = isInstallMode ? "Hold this belief" : "Bring this to mind";

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => { stop(); setPhase(isInstallMode ? "charge" : "setup"); }}
          className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">
          {isInstallMode ? "Install" : "Process"}
        </p>
        {roundCount > 0
          ? <p className="text-muted-foreground text-xs font-sans w-16 text-right">Round {roundCount}</p>
          : <div className="w-16" />
        }
      </div>

      {/* Landscape hint */}
      {!isRunning && (
        <div className="lg:hidden mx-4 mb-2 px-3 py-2 rounded-xl bg-surface-light flex items-center gap-2">
          <span className="text-sm">📱</span>
          <p className="text-[11px] text-muted-foreground">Turn your phone sideways for the best experience.</p>
        </div>
      )}

      {/* Target display */}
      <div className="px-6 pt-2 pb-4 shrink-0 max-w-2xl mx-auto w-full text-center">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">{sessionLabel}</p>
              <p className="text-foreground font-serif text-2xl leading-relaxed">
                "{sessionTarget.slice(0, 120)}{sessionTarget.length > 120 ? "…" : ""}"
              </p>
            </motion.div>
          ) : (
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-foreground/70 font-serif text-lg leading-relaxed">
                "{sessionTarget.slice(0, 120)}{sessionTarget.length > 120 ? "…" : ""}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Orb track */}
      <div className="relative flex items-center justify-center flex-1" style={{ minHeight: "25vh" }}>
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
          {canHaptic && (
            <button
              onClick={() => setHapticOn(!hapticOn)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans transition-colors ${hapticOn ? "bg-card text-foreground" : "bg-card text-muted-foreground"}`}>
              <span className="text-sm">{hapticOn ? "📳" : "🔕"}</span>
              {hapticOn ? "Haptic" : "No haptic"}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={isRunning ? stop : startSession}
            className={`flex-1 py-4 rounded-2xl font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${isRunning ? "bg-card text-foreground border border-foreground/10" : "gold-gradient text-primary-foreground"}`}>
            {isRunning ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5 ml-0.5" /> Begin</>}
          </button>
          {isRunning && (
            <button
              onClick={() => { stop(); setPhase(isInstallMode ? "voc" : "notice"); }}
              className="px-5 py-4 rounded-2xl bg-card text-foreground font-sans text-sm border border-foreground/10 active:scale-[0.98] transition-transform">
              Finish
            </button>
          )}
        </div>

        {!isRunning && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {SPEEDS.map((s, i) => (
                <button key={s.label} onClick={() => setSpeedIdx(i)}
                  className={`flex-1 py-2 rounded-xl text-xs font-sans transition-colors ${speedIdx === i ? "bg-card text-foreground border border-accent/30" : "bg-surface-light text-muted-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {DURATIONS.map((d, i) => (
                <button key={d.label} onClick={() => setDurationIdx(i)}
                  className={`flex-1 py-2 rounded-xl text-xs font-sans transition-colors ${durationIdx === i ? "bg-card text-foreground border border-accent/30" : "bg-surface-light text-muted-foreground"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-center text-muted-foreground text-[11px] leading-relaxed pt-1">
              Use headphones. Follow the light with soft, relaxed eyes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
