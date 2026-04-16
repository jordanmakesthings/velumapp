import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Phase = "intro" | "sigh" | "grounding" | "breathing" | "done";

// ---------------------------------------------------------------------------
// Grounding prompts (5-4-3-2-1)
// ---------------------------------------------------------------------------
const GROUNDING_STEPS = [
  { count: 5, sense: "see", prompt: "Look around. Name 5 things you can see right now.", color: "text-blue-400" },
  { count: 4, sense: "feel", prompt: "Feel your body. Name 4 things you can physically touch or feel.", color: "text-green-400" },
  { count: 3, sense: "hear", prompt: "Listen. Name 3 sounds you can hear right now.", color: "text-yellow-400" },
  { count: 2, sense: "smell", prompt: "Breathe in. Name 2 things you can smell, or 2 you remember.", color: "text-orange-400" },
  { count: 1, sense: "taste", prompt: "Notice your mouth. Name 1 thing you can taste.", color: "text-accent" },
];

// ---------------------------------------------------------------------------
// Physiological Sigh component (double inhale → long exhale)
// ---------------------------------------------------------------------------
type SighPhase = "inhale1" | "inhale2" | "exhale" | "rest";

const SIGH_SEQUENCE: { phase: SighPhase; label: string; duration: number }[] = [
  { phase: "inhale1", label: "Inhale through nose", duration: 1800 },
  { phase: "inhale2", label: "Sniff again — fill completely", duration: 1500 },
  { phase: "exhale",  label: "Long exhale through mouth", duration: 5000 },
  { phase: "rest",    label: "Rest", duration: 500 },
];

const TOTAL_SIGHS = 5;

function SighBreather({ onComplete }: { onComplete: () => void }) {
  const [sighs, setSighs] = useState(0);
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (sighs >= TOTAL_SIGHS) { onComplete(); return; }
    const current = SIGH_SEQUENCE[step];
    timerRef.current = setTimeout(() => {
      const next = (step + 1) % SIGH_SEQUENCE.length;
      if (next === 0) setSighs((s) => s + 1);
      setStep(next);
    }, current.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, sighs, onComplete]);

  const current = SIGH_SEQUENCE[step];
  const isExhale = current.phase === "exhale";
  const isRest = current.phase === "rest";

  return (
    <div className="flex flex-col items-center">
      {/* Animated orb */}
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          animate={{
            scale: isExhale ? 0.6 : isRest ? 0.55 : [0.6, 1.0][current.phase === "inhale2" ? 1 : 1],
            opacity: isRest ? 0.4 : 1,
          }}
          transition={{ duration: current.duration / 1000, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full gold-gradient opacity-80 blur-sm absolute"
        />
        <motion.div
          animate={{ scale: isExhale ? 0.7 : isRest ? 0.65 : 1.0 }}
          transition={{ duration: current.duration / 1000, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full gold-gradient relative z-10"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={`${sighs}-${step}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-foreground font-serif text-xl mb-2 text-center"
        >
          {current.label}
        </motion.p>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {Array.from({ length: TOTAL_SIGHS }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i < sighs ? "bg-accent" : i === sighs ? "bg-accent/50" : "bg-foreground/15"}`}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-xs mt-2 tabular-nums">{sighs + 1} of {TOTAL_SIGHS}</p>

      <button
        onClick={onComplete}
        className="mt-8 text-muted-foreground text-xs underline underline-offset-2"
      >
        Skip
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extended exhale breathing (4s in / 6s out)
// ---------------------------------------------------------------------------
type BreathPhase = "inhale" | "exhale";
const BREATH_CYCLES = 8;

function AnchorBreather({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [cycle, setCycle] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cycle >= BREATH_CYCLES) { onComplete(); return; }
    const dur = phase === "inhale" ? 4000 : 6000;
    timerRef.current = setTimeout(() => {
      if (phase === "exhale") setCycle((c) => c + 1);
      setPhase(phase === "inhale" ? "exhale" : "inhale");
    }, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, cycle, onComplete]);

  const isInhale = phase === "inhale";
  const pct = (cycle / BREATH_CYCLES) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          animate={{ scale: isInhale ? 1.25 : 0.75, opacity: isInhale ? 0.9 : 0.5 }}
          transition={{ duration: isInhale ? 4 : 6, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full border border-accent/30 absolute"
        />
        <motion.div
          animate={{ scale: isInhale ? 1.1 : 0.65 }}
          transition={{ duration: isInhale ? 4 : 6, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full gold-gradient relative z-10"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-center mb-6"
        >
          <p className="text-foreground font-serif text-2xl mb-1">
            {isInhale ? "Breathe in" : "Breathe out"}
          </p>
          <p className="text-muted-foreground text-sm">
            {isInhale ? "4 seconds through the nose" : "6 seconds through the mouth"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-surface-light rounded-full overflow-hidden mb-3">
        <div className="h-full gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">{cycle + 1} of {BREATH_CYCLES}</p>

      <button onClick={onComplete} className="mt-8 text-muted-foreground text-xs underline underline-offset-2">
        Skip
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SOS Page
// ---------------------------------------------------------------------------
export default function SOSPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("intro");
  const [groundingStep, setGroundingStep] = useState(0);

  const slide = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  // --- Intro ---
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-20 h-20 rounded-full bg-red-950/50 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🌊</span>
            </div>
            <h1 className="text-display text-3xl mb-3">Right Now</h1>
            <p className="text-foreground/80 text-base font-serif leading-relaxed mb-4">
              You're in it. That's okay.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-10">
              This is a 3-step protocol designed to rapidly bring your nervous system out of a threat response.
              It takes about 3 minutes.
            </p>

            <div className="space-y-3 mb-10 text-left">
              {[
                { n: "01", label: "Physiological Sigh", desc: "Rapidly lowers CO₂ and stress hormones" },
                { n: "02", label: "Sensory Grounding", desc: "Orients your brain back to the present" },
                { n: "03", label: "Anchor Breathing", desc: "Activates the parasympathetic brake" },
              ].map(({ n, label, desc }) => (
                <div key={n} className="flex items-start gap-4 p-4 rounded-xl bg-card">
                  <span className="text-accent text-xs font-sans font-medium tracking-widest mt-0.5">{n}</span>
                  <div>
                    <p className="text-foreground text-sm font-sans font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("sigh")}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Begin <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Physiological Sigh ---
  if (phase === "sigh") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => setPhase("intro")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Step 1 of 3 · Physiological Sigh</p>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key="sigh" {...slide} className="w-full flex flex-col items-center">
              <p className="text-muted-foreground text-sm text-center leading-relaxed mb-10">
                Double-inhale through your nose, then one long exhale through your mouth.
                This is the fastest known way to lower stress hormones.
              </p>
              <SighBreather onComplete={() => { setGroundingStep(0); setPhase("grounding"); }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- 5-4-3-2-1 Grounding ---
  if (phase === "grounding") {
    const step = GROUNDING_STEPS[groundingStep];
    const isLast = groundingStep >= GROUNDING_STEPS.length - 1;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => setPhase("sigh")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Step 2 of 3 · Grounding</p>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={groundingStep} {...slide} className="w-full flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mb-6">
                <span className={`text-5xl font-display ${step.color}`}>{step.count}</span>
              </div>

              <p className="text-muted-foreground text-[11px] uppercase tracking-widest mb-4">
                {step.count} thing{step.count !== 1 ? "s" : ""} you can {step.sense}
              </p>

              <p className="text-foreground font-serif text-xl leading-relaxed mb-12 px-4">
                {step.prompt}
              </p>

              {/* Step dots */}
              <div className="flex gap-2 mb-10">
                {GROUNDING_STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < groundingStep ? "bg-accent" : i === groundingStep ? "bg-accent/70" : "bg-foreground/15"}`} />
                ))}
              </div>

              <button
                onClick={() => {
                  if (!isLast) setGroundingStep(groundingStep + 1);
                  else setPhase("breathing");
                }}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {isLast ? "Continue" : "Done"} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- Anchor Breathing ---
  if (phase === "breathing") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => setPhase("grounding")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Step 3 of 3 · Anchor Breathing</p>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key="breathing" {...slide} className="w-full flex flex-col items-center">
              <p className="text-muted-foreground text-sm text-center leading-relaxed mb-10">
                Extended exhale breathing activates the vagus nerve. Make the exhale longer than the inhale.
              </p>
              <AnchorBreather onComplete={() => setPhase("done")} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- Done ---
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-accent" strokeWidth={1.5} />
        </div>
        <h2 className="text-display text-3xl mb-3">You made it through.</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
          Your nervous system just completed a full down-regulation cycle. Take a moment to notice the difference.
        </p>
        <p className="text-foreground/60 text-sm font-serif italic mb-10">
          "Between stimulus and response there is a space. In that space is your power." — Viktor Frankl
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase("intro")}
            className="w-full py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
          >
            Run again
          </button>
          <button
            onClick={() => navigate("/tools")}
            className="w-full py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform"
          >
            Explore more tools
          </button>
          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 text-muted-foreground text-sm font-sans"
          >
            Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
