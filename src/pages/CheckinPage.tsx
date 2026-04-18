import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Wind, Zap, Hand, Fingerprint, Sparkles } from "lucide-react";
import { saveCheckin } from "@/lib/velumStorage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Phase = "rating" | "sensations" | "recommendation";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const SENSATIONS = [
  "Anxious", "Tense", "Foggy", "Restless",
  "Flat", "Overwhelmed", "Scattered", "Irritable",
  "Wired", "Numb", "Sad", "Tired",
];

interface Recommendation {
  label: string;
  description: string;
  rationale: string;
  path: string;
  icon: typeof Wind;
  gradient: boolean;
}

function getRecommendation(activation: number, sensations: string[]): Recommendation {
  const hasAnxiety = sensations.some((s) => ["Anxious", "Wired", "Restless", "Overwhelmed"].includes(s));
  const hasFlat = sensations.some((s) => ["Flat", "Numb", "Sad", "Tired"].includes(s));
  const hasTension = sensations.some((s) => ["Tense", "Irritable"].includes(s));
  const hasFog = sensations.some((s) => ["Foggy", "Scattered"].includes(s));

  if (activation >= 7) {
    return {
      label: "Bilateral Stimulation",
      description: "Visual + auditory bilateral processing",
      rationale: `Your system is at ${activation}/10 — that's high activation. Bilateral stimulation is one of the most effective tools for rapidly processing and releasing held activation.`,
      path: "/bilateral",
      icon: Zap,
      gradient: false,
    };
  }

  if (activation >= 5 && hasAnxiety) {
    return {
      label: "Guided Tapping",
      description: "EFT tapping script personalised to your issue",
      rationale: `Anxiety at ${activation}/10 responds well to EFT tapping. Describe exactly what you're feeling and get a specific 3-round session.`,
      path: "/tapping",
      icon: Hand,
      gradient: true,
    };
  }

  if (activation >= 5 && hasTension) {
    return {
      label: "Breathwork",
      description: "Physiological sigh or box breathing",
      rationale: `Tension at ${activation}/10 responds immediately to breath regulation. Physiological sigh can collapse stress in under 30 seconds.`,
      path: "/breathe",
      icon: Wind,
      gradient: false,
    };
  }

  if (hasFlat || hasFog || activation <= 3) {
    return {
      label: "Somatic Touch",
      description: "Gentle self-soothing touch sequences",
      rationale: `You're in a low or flat state. Somatic touch signals safety to your nervous system and gradually restores activation without overwhelming it.`,
      path: "/somatic-touch",
      icon: Fingerprint,
      gradient: false,
    };
  }

  // Default mid-range
  return {
    label: "Breathwork",
    description: "Coherence breathing for nervous system reset",
    rationale: `Your nervous system is moderately activated at ${activation}/10. Coherence breathing at a 5:5 ratio can bring it back into balance quickly.`,
    path: "/breathe",
    icon: Wind,
    gradient: false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CheckinPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("rating");
  const [activation, setActivation] = useState(5);
  const [sensations, setSensations] = useState<string[]>([]);
  const [rec, setRec] = useState<Recommendation | null>(null);

  const slide = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

  const activationLabel = activation <= 2 ? "Very calm" : activation <= 4 ? "Low" : activation <= 6 ? "Moderate" : activation <= 8 ? "High" : "Very high";

  const toggleSensation = (s: string) =>
    setSensations((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSensationsContinue = () => {
    const recommendation = getRecommendation(activation, sensations);
    setRec(recommendation);
    saveCheckin({
      date: new Date().toISOString().split("T")[0],
      activation_level: activation,
      sensations,
      tool_recommended: recommendation.path,
    });
    setPhase("recommendation");
  };

  // --- Rating ---
  if (phase === "rating") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-sm mx-auto w-full pb-8">
          <AnimatePresence mode="wait">
            <motion.div key="rating" {...slide} className="w-full text-center">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Daily Check-in</p>
              <h1 className="text-display text-3xl mb-3">How activated is your nervous system?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-12">
                1 is completely at rest. 10 is fight-or-flight.
              </p>

              <div className="mb-4">
                <span className="text-display text-7xl text-accent tabular-nums">{activation}</span>
                <p className="text-muted-foreground text-sm mt-1">{activationLabel}</p>
              </div>

              <input
                type="range" min={1} max={10} value={activation}
                onChange={(e) => setActivation(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer mb-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between mb-12">
                <span className="text-[10px] text-muted-foreground">1 · At rest</span>
                <span className="text-[10px] text-muted-foreground">10 · Fight-or-flight</span>
              </div>

              <button
                onClick={() => setPhase("sensations")}
                className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- Sensations ---
  if (phase === "sensations") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-4">
          <button onClick={() => setPhase("rating")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="flex-1 flex flex-col px-6 max-w-sm mx-auto w-full pb-8 pt-4">
          <AnimatePresence mode="wait">
            <motion.div key="sensations" {...slide} className="w-full flex-1 flex flex-col">
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Step 2 of 2</p>
              <h1 className="text-display text-2xl mb-2">What are you noticing?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Select anything that resonates. You can skip this.
              </p>

              <div className="flex flex-wrap gap-2 mb-auto">
                {SENSATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSensation(s)}
                    className={`px-4 py-2 rounded-full text-sm font-sans transition-all border ${
                      sensations.includes(s)
                        ? "gold-gradient text-primary-foreground border-transparent"
                        : "bg-[hsl(156,52%,14%)] border-accent/22 text-muted-foreground hover:text-foreground hover:border-accent/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="pt-8">
                <button
                  onClick={handleSensationsContinue}
                  className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {sensations.length > 0 ? "See recommendation" : "Skip"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- Recommendation ---
  if (phase === "recommendation" && rec) {
    const Icon = rec.icon;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div key="rec" {...slide} className="max-w-sm w-full">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-6 text-center">
              Recommended for you
            </p>

            <div className="velum-card-accent p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${rec.gradient ? "gold-gradient" : "bg-surface-light"}`}>
                  <Icon className={`w-5 h-5 ${rec.gradient ? "text-primary-foreground" : "text-accent"}`} />
                </div>
                <div>
                  <p className="text-foreground font-sans font-medium text-base">{rec.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{rec.description}</p>
                </div>
              </div>
              <p className="text-foreground/75 text-sm leading-relaxed font-serif italic">
                "{rec.rationale}"
              </p>
            </div>

            <Link
              to={rec.path}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mb-3"
            >
              Start {rec.label} <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => navigate("/tools")}
              className="velum-card-flat w-full py-3 rounded-2xl text-foreground text-sm font-sans active:scale-[0.98] transition-transform"
            >
              See all tools
            </button>

            <button
              onClick={() => navigate("/home")}
              className="w-full py-3 text-muted-foreground text-sm font-sans mt-1"
            >
              Back to home
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
