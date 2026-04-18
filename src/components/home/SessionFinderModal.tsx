import { useState } from "react";
import { ChevronLeft, X, ArrowRight, Wind, Zap, Hand, Fingerprint, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
const GOING_ON = [
  { key: "spiral",           label: "Stuck in a thought spiral",       sub: "Can't seem to get out of my head" },
  { key: "anxious_specific", label: "Anxious about something specific", sub: "I know what it is" },
  { key: "anxious_unknown",  label: "Anxious and I don't know why",     sub: "Something feels off" },
  { key: "triggered",        label: "Triggered or activated",           sub: "Unsafe, reactive, on edge" },
  { key: "tired_wired",      label: "Tired but wired",                  sub: "Exhausted but can't switch off" },
  { key: "low_energy",       label: "Low energy or flat",               sub: "Disconnected, unmotivated" },
  { key: "old_patterns",     label: "Defaulting to old patterns",       sub: "Autopilot, self-sabotage" },
  { key: "blocked",          label: "Blocked or stuck",                 sub: "Know what I want, can't move toward it" },
  { key: "cant_sleep",       label: "Can't sleep",                      sub: "Awake and mind won't stop" },
  { key: "just_reset",       label: "Just need a reset",                sub: "No specific reason, something feels off" },
];

const WALK_AWAY = [
  { key: "calm",         label: "Calm and regulated",        sub: "Nervous system back to baseline" },
  { key: "confidence",   label: "Confidence and certainty",  sub: "Feel solid in myself again" },
  { key: "trust",        label: "Trust and peace",           sub: "Let go before I have the answer" },
  { key: "clarity",      label: "Clarity and direction",     sub: "Know what to do next" },
  { key: "break_spiral", label: "Break the spiral",          sub: "Make it feel less heavy" },
  { key: "empowered",    label: "Empowered and ready to move", sub: "Action energy" },
  { key: "sleep",        label: "Ready for sleep",           sub: "Wind down and let go" },
  { key: "uplift",       label: "A quick lift",              sub: "Positive emotion, shift the state fast" },
];

const TIME_OPTIONS = [
  { key: "5",    label: "5 min",   sub: "Quick reset" },
  { key: "10",   label: "10 min",  sub: "Short session" },
  { key: "20",   label: "20 min",  sub: "Deep practice" },
  { key: "open", label: "Open",    sub: "No rush" },
];

// ---------------------------------------------------------------------------
// Recommendation logic
// ---------------------------------------------------------------------------
type ToolKey = "breathwork" | "bilateral" | "tapping" | "somatic" | "meditation" | "library";

interface Recommendation {
  tool: ToolKey;
  path: string;
  icon: typeof Wind;
  headline: string;
  reason: string;
  ctaLabel: string;
  secondaryPath?: string;
  secondaryLabel?: string;
}

function getRecommendation(
  activation: number,
  goingOn: string[],
  walkAway: string,
): Recommendation {
  const has = (k: string) => goingOn.includes(k);

  // Sleep / can't sleep
  if (walkAway === "sleep" || has("cant_sleep")) {
    return {
      tool: "breathwork", path: "/breathe", icon: Wind,
      headline: "Breathwork will shut your nervous system down gently.",
      reason: "Sleep onset requires a long, slow exhale that activates the parasympathetic response. The 4-7-8 and NSDR patterns are built for exactly this — choose one and let it carry you.",
      ctaLabel: "Open Breathwork",
    };
  }

  // Thought spiral → bilateral
  if (walkAway === "break_spiral" || has("spiral")) {
    return {
      tool: "bilateral", path: "/bilateral", icon: Zap,
      headline: "Bilateral stimulation will break the loop without you thinking your way out.",
      reason: "Thought spirals are processed through bilateral movement — your brain can't sustain the activation loop while doing this work. You don't need to know what's wrong. Just start.",
      ctaLabel: "Start Bilateral",
    };
  }

  // Specific anxiety / old patterns / blocked / confidence → tapping
  if (has("anxious_specific") || has("old_patterns") || has("blocked") || walkAway === "confidence" || walkAway === "empowered") {
    return {
      tool: "tapping", path: "/tapping", icon: Hand,
      headline: "Guided tapping is the fastest way to collapse a specific belief or fear.",
      reason: "Tapping while focusing on what you're feeling sends a safety signal directly to the amygdala — the brain's fear center. Name what's going on and let the protocol do the rest.",
      ctaLabel: "Start Guided Tapping",
    };
  }

  // Trust / peace / clarity → meditation
  if (walkAway === "trust" || walkAway === "clarity") {
    return {
      tool: "meditation", path: "/library?category=meditation", icon: Sparkles,
      headline: "A guided meditation will bring you back to what you already know.",
      reason: "When you're searching for certainty that isn't available yet, the only path is inward. The answers you need aren't outside of you — they never were.",
      ctaLabel: "Browse Meditations",
    };
  }

  // High activation or needs to downregulate → breathwork
  if (activation >= 7 || has("triggered") || has("tired_wired") || walkAway === "calm") {
    return {
      tool: "breathwork", path: "/breathe", icon: Wind,
      headline: "Your nervous system is activated. Breathwork is the fastest way to regulate.",
      reason: "At this level of activation, cognitive tools won't land. Your body needs to complete the stress response first. Breathwork does that in under 5 minutes — then everything else becomes possible.",
      ctaLabel: "Open Breathwork",
      secondaryPath: "/somatic-touch",
      secondaryLabel: "Or try Somatic Touch",
    };
  }

  // Low energy / need a lift → energizing breathwork
  if (has("low_energy") || walkAway === "uplift") {
    return {
      tool: "breathwork", path: "/breathe", icon: Wind,
      headline: "An energizing breath pattern will shift your state in minutes.",
      reason: "Short, sharp inhales activate the sympathetic nervous system just enough to create a real energy shift. Pick the energizing pattern and go.",
      ctaLabel: "Open Breathwork",
    };
  }

  // Triggered / just need reset → somatic touch
  if (has("triggered") || has("just_reset")) {
    return {
      tool: "somatic", path: "/somatic-touch", icon: Fingerprint,
      headline: "Somatic touch will signal safety to your nervous system.",
      reason: "When words aren't working and you can't name what's happening, your body responds to physical input. These sequences send a direct 'you are safe' signal.",
      ctaLabel: "Start Somatic Touch",
    };
  }

  // Default → bilateral
  return {
    tool: "bilateral", path: "/bilateral", icon: Zap,
    headline: "Bilateral stimulation is your all-purpose reset.",
    reason: "When you're not sure what's happening, bilateral work processes whatever is present — without needing to name it or think it through. Set the time, close your eyes, let it work.",
    ctaLabel: "Start Bilateral",
  };
}

// ---------------------------------------------------------------------------
// Slide variants
// ---------------------------------------------------------------------------
const slide = {
  enter: { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: -32, transition: { duration: 0.16 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

export function SessionFinderModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [activation, setActivation] = useState(5);
  const [goingOn, setGoingOn] = useState<string[]>([]);
  const [walkAway, setWalkAway] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setActivation(5);
    setGoingOn([]);
    setWalkAway(null);
    setTime(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleGoingOn = (key: string) => {
    setGoingOn(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const activationLabel = activation <= 2 ? "Barely noticeable"
    : activation <= 4 ? "Mild"
    : activation <= 6 ? "Moderate"
    : activation <= 8 ? "High"
    : "Overwhelming";

  const rec = step === TOTAL_STEPS ? getRecommendation(activation, goingOn, walkAway ?? "") : null;

  const canProceed = () => {
    if (step === 1) return goingOn.length > 0;
    if (step === 2) return walkAway !== null;
    if (step === 3) return time !== null;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const handleLaunch = () => {
    if (!rec) return;
    handleClose();
    navigate(rec.path);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 border-b border-accent/10 shrink-0">
            <button
              onClick={step > 0 && step < TOTAL_STEPS ? () => setStep(s => s - 1) : handleClose}
              className="flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors min-h-10 px-1"
            >
              {step > 0 && step < TOTAL_STEPS ? <><ChevronLeft className="w-4 h-4" /> Back</> : <X className="w-4 h-4" />}
            </button>

            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">
              Session Finder
            </p>

            <button onClick={handleClose} className="min-h-10 px-1">
              {step > 0 && step < TOTAL_STEPS && <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
            </button>
          </div>

          {/* Progress bar */}
          {step < TOTAL_STEPS && (
            <div className="flex gap-1 px-4 pt-3 shrink-0">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${i <= step - 1 ? "bg-accent" : i === step ? "bg-accent/40" : "bg-accent/10"}`} />
              ))}
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-8 max-w-lg mx-auto w-full">
              <AnimatePresence mode="wait">

                {/* Step 0 — Activation */}
                {step === 0 && (
                  <motion.div key="s0" variants={slide} initial="enter" animate="center" exit="exit">
                    <h2 className="text-display text-3xl mb-2">How activated is your nervous system right now?</h2>
                    <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
                      Think about your body — not your thoughts. How much charge is running through you right now?
                    </p>
                    <p className="text-display text-8xl text-accent text-center mb-1 tabular-nums">{activation}</p>
                    <p className="text-muted-foreground text-xs uppercase tracking-widest text-center mb-10">{activationLabel}</p>
                    <input
                      type="range" min={1} max={10} value={activation}
                      onChange={e => setActivation(Number(e.target.value))}
                      className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between mb-10">
                      <span className="text-[10px] text-muted-foreground">1 · Completely calm</span>
                      <span className="text-[10px] text-muted-foreground">10 · Overwhelming</span>
                    </div>
                    <button onClick={handleNext} className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform">
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Step 1 — What's going on */}
                {step === 1 && (
                  <motion.div key="s1" variants={slide} initial="enter" animate="center" exit="exit">
                    <h2 className="text-display text-3xl mb-2">What's going on?</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">Select all that apply.</p>
                    <div className="flex flex-col gap-2 mb-8">
                      {GOING_ON.map(({ key, label, sub }) => (
                        <button
                          key={key}
                          onClick={() => toggleGoingOn(key)}
                          className={`velum-card w-full p-4 text-left transition-all ${
                            goingOn.includes(key)
                              ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.18)]"
                              : ""
                          }`}
                        >
                          <p className={`text-sm font-sans font-medium ${goingOn.includes(key) ? "text-foreground" : "text-foreground/80"}`}>{label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      {goingOn.length > 0 ? `Continue` : "Continue"}
                    </button>
                  </motion.div>
                )}

                {/* Step 2 — Walk away with */}
                {step === 2 && (
                  <motion.div key="s2" variants={slide} initial="enter" animate="center" exit="exit">
                    <h2 className="text-display text-3xl mb-2">What do you want to walk away with?</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">Pick the one that matters most right now.</p>
                    <div className="flex flex-col gap-2 mb-8">
                      {WALK_AWAY.map(({ key, label, sub }) => (
                        <button
                          key={key}
                          onClick={() => { setWalkAway(key); }}
                          className={`velum-card w-full p-4 text-left transition-all ${
                            walkAway === key
                              ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.18)]"
                              : ""
                          }`}
                        >
                          <p className={`text-sm font-sans font-medium ${walkAway === key ? "text-foreground" : "text-foreground/80"}`}>{label}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Step 3 — Time */}
                {step === 3 && (
                  <motion.div key="s3" variants={slide} initial="enter" animate="center" exit="exit">
                    <h2 className="text-display text-3xl mb-2">How much time do you have right now?</h2>
                    <p className="text-muted-foreground text-sm mb-8 leading-relaxed">Be honest — a 5-minute session that happens beats a 20-minute one that doesn't.</p>
                    <div className="flex flex-col gap-3 mb-8">
                      {TIME_OPTIONS.map(({ key, label, sub }) => (
                        <button
                          key={key}
                          onClick={() => { setTime(key); }}
                          className={`velum-card w-full p-4 text-left transition-all flex items-center justify-between ${
                            time === key
                              ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.18)]"
                              : ""
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-sans font-medium ${time === key ? "text-foreground" : "text-foreground/80"}`}>{label}</p>
                            <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
                          </div>
                          {time === key && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      Show me what to do
                    </button>
                  </motion.div>
                )}

                {/* Step 4 — Recommendation */}
                {step === TOTAL_STEPS && rec && (
                  <motion.div key="rec" variants={slide} initial="enter" animate="center" exit="exit">
                    <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-6">Your recommendation</p>

                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                      <rec.icon className="w-6 h-6 text-accent" />
                    </div>

                    <h2 className="text-display text-2xl mb-5 leading-snug">{rec.headline}</h2>

                    <div className="velum-card p-5 mb-8">
                      <p className="text-foreground/80 text-sm font-sans leading-relaxed">{rec.reason}</p>
                    </div>

                    <button
                      onClick={handleLaunch}
                      className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mb-3"
                    >
                      {rec.ctaLabel} <ArrowRight className="w-4 h-4" />
                    </button>

                    {rec.secondaryPath && rec.secondaryLabel && (
                      <button
                        onClick={() => { handleClose(); navigate(rec.secondaryPath!); }}
                        className="w-full py-3 text-muted-foreground text-sm font-sans text-center hover:text-foreground transition-colors"
                      >
                        {rec.secondaryLabel}
                      </button>
                    )}

                    <button
                      onClick={reset}
                      className="w-full py-3 text-muted-foreground text-xs font-sans text-center hover:text-foreground transition-colors mt-2"
                    >
                      Start over
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
