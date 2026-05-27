import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoCircle from "@/assets/logo-circle.png";

const GOALS = [
  { key: "stress",     label: "Manage stress & anxiety" },
  { key: "emotions",   label: "Master my emotions" },
  { key: "sleep",      label: "Sleep deeper & recover faster" },
  { key: "confidence", label: "Build confidence & self-worth" },
  { key: "habits",     label: "Break self-sabotaging patterns" },
  { key: "self",       label: "Deepen connection to myself" },
  { key: "focus",      label: "More energy & mental clarity" },
  { key: "trauma",     label: "Process and release what I'm carrying" },
];

// Future-pacing — written in PRESENT TENSE so the user reads them as already-true,
// not as goals. The mind responds differently to "I am calm" vs "I want to be calm".
const VISION = [
  { key: "calm",     label: "I'm calm under pressure" },
  { key: "trust",    label: "I trust myself" },
  { key: "sleep",    label: "I sleep deeply" },
  { key: "present",  label: "I'm fully present with the people I love" },
  { key: "free",     label: "I'm no longer running from anything" },
  { key: "safe",     label: "My body finally feels safe" },
  { key: "build",    label: "I'm building what I'm here to build" },
  { key: "want",     label: "I wake up wanting to be me" },
];

// Embodied felt-sense — locks the vision into a single word the body recognizes.
const FEELING = [
  { key: "settled",  label: "Settled" },
  { key: "free",     label: "Free" },
  { key: "powerful", label: "Powerful" },
  { key: "whole",    label: "Whole" },
  { key: "awake",    label: "Awake" },
];

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

// 3 data-collection steps drive the progress bar (goals + vision + feeling).
const DATA_STEPS = 3;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — what brought them here
  const [goals, setGoals] = useState<string[]>([]);

  // Step 1 — future-pace vision
  const [vision, setVision] = useState<string[]>([]);

  // Step 2 — embodied felt-sense
  const [feeling, setFeeling] = useState("");

  // Step 3 — building animation
  const [buildLine, setBuildLine] = useState(0);

  // First name pulled from profile (already captured at signup).
  const firstName = (profile?.full_name || "").trim().split(" ")[0] || "";

  // Building lines reference what they actually said, so the "building" feels personal.
  const buildingLines = useMemo(() => {
    const feelingLabel = FEELING.find(f => f.key === feeling)?.label || "calm";
    const firstVision = VISION.find(v => v.key === vision[0])?.label || "I trust myself";
    const firstGoal = GOALS.find(g => g.key === goals[0])?.label.toLowerCase() || "your goals";
    return [
      `Anchoring "${firstVision}"…`,
      `Mapping your path to feeling ${feelingLabel}…`,
      `Curating sessions for ${firstGoal}…`,
      "Calibrating your daily practice…",
      "Ready.",
    ];
  }, [feeling, vision, goals]);

  // Progress bar fill — only shown on data steps (0-2)
  const progressPercent = Math.min(100, ((step + 1) / DATA_STEPS) * 100);
  const showProgress = step < DATA_STEPS;

  // Step 3 — cycle through building lines, then auto-advance to welcome
  useEffect(() => {
    if (step !== 3) return;
    setBuildLine(0);
    const tick = setInterval(() => setBuildLine(l => Math.min(l + 1, buildingLines.length - 1)), 1100);
    const finish = setTimeout(() => setStep(4), 5800);
    return () => { clearInterval(tick); clearTimeout(finish); };
  }, [step, buildingLines.length]);

  const toggleGoal = (key: string) => setGoals(g => g.includes(key) ? g.filter(k => k !== key) : [...g, key]);
  const toggleVision = (key: string) => setVision(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key]);

  const complete = async () => {
    if (!user || saving) return;
    setSaving(true);
    await supabase.from("profiles").update({
      onboarding_completed: true,
      onboarding_answers: { goals, vision, feeling },
    }).eq("id", user.id);
    await refreshProfile();
    // Freemium model: everyone lands on /home. Conversion happens via soft paywall
    // sheets when they tap a premium feature — not by force at signup.
    navigate("/home");
  };

  const next = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-radial-subtle flex flex-col relative">
      {/* Ambient green glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[8%] left-[-10%] w-[600px] h-[600px] rounded-full"
             style={{ background: "radial-gradient(circle, hsla(156,51%,16%,0.55) 0%, transparent 60%)", filter: "blur(50px)" }} />
        <div className="absolute bottom-[5%] right-[-10%] w-[450px] h-[450px] rounded-full"
             style={{ background: "radial-gradient(circle, hsla(42,53%,32%,0.08) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>

      {/* Thin gold progress bar */}
      {showProgress && (
        <div className="pt-6 pb-2 flex-shrink-0 px-6 max-w-[440px] mx-auto w-full">
          <div className="h-[3px] w-full rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full gold-gradient transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-[440px] mx-auto w-full py-8">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Goals (multi-select). First impression — opens with the logo. */}
          {step === 0 && (
            <motion.div key="goals" {...slide} className="w-full">
              <div className="text-center mb-8">
                <img src={logoCircle} alt="Velum" className="w-20 h-20 object-contain mx-auto mb-5" />
                <h1 className="text-display text-[2.4rem] leading-[1.05] mb-3">What brought<br />you <span className="text-accent italic">here?</span></h1>
                <p className="text-muted-foreground text-sm font-light">
                  Pick all that apply.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {GOALS.map(({ key, label }) => {
                  const selected = goals.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleGoal(key)}
                      className={`velum-card w-full px-5 py-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        selected ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selected ? "border-accent bg-accent" : "border-muted-foreground/30"
                      }`}>
                        {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-foreground text-sm font-sans font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={next}
                disabled={goals.length === 0}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-5"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Future-pace, vision. Present-tense statements lock in identity. */}
          {step === 1 && (
            <motion.div key="vision" {...slide} className="w-full">
              <div className="text-center mb-8">
                <p className="text-eyebrow mb-3">Take a breath</p>
                <h1 className="text-display text-[2rem] leading-[1.1] mb-3">
                  Picture <span className="italic text-accent">6 months from now.</span><br />
                  Which is true about you?
                </h1>
                <p className="text-muted-foreground text-sm font-light">
                  Pick what lands.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {VISION.map(({ key, label }) => {
                  const selected = vision.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleVision(key)}
                      className={`velum-card w-full px-5 py-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.98] ${
                        selected ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selected ? "border-accent bg-accent" : "border-muted-foreground/30"
                      }`}>
                        {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-foreground text-sm font-sans font-medium italic">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={next}
                disabled={vision.length === 0}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-5"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Embodied feeling. Single-select word that anchors the felt sense. */}
          {step === 2 && (
            <motion.div key="feeling" {...slide} className="w-full">
              <div className="text-center mb-10">
                <p className="text-eyebrow mb-3">Now feel it</p>
                <h1 className="text-display text-[2.2rem] leading-[1.05] mb-3">
                  How does <span className="italic text-accent">that version of you</span><br />feel — in one word?
                </h1>
              </div>
              <div className="flex flex-col gap-3">
                {FEELING.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setFeeling(key); next(); }}
                    className={`velum-card w-full py-5 flex items-center justify-center text-center transition-all duration-200 active:scale-[0.98] ${
                      feeling === key ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""
                    }`}
                  >
                    <span className="text-display text-2xl italic">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Building your program. References their actual answers. */}
          {step === 3 && (
            <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" style={{ animationDuration: "1.4s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-accent text-3xl">✦</span>
                </div>
              </div>
              <p className="text-eyebrow mb-3">Building your program</p>
              <div className="h-7">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={buildLine}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-muted-foreground text-sm font-sans"
                  >
                    {buildingLines[buildLine]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — You're in. Welcome them into the app, no paywall push. */}
          {step === 4 && (
            <motion.div key="welcome" {...slide} className="w-full text-center">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(201,168,76,0.25)]">
                <span className="text-primary-foreground text-2xl">✦</span>
              </div>
              <p className="text-eyebrow mb-3">You're in</p>
              <h1 className="text-editorial text-[2.6rem] italic mb-6 font-light leading-[1.05]">
                Welcome{firstName ? `, ${firstName}` : ""}.
              </h1>

              <div className="velum-card-accent p-5 mb-6 text-left">
                <p className="text-eyebrow mb-4 text-center">Your first move</p>
                <p className="text-foreground text-sm font-sans leading-relaxed">
                  Velum's breathwork tool is open to you, free, forever. The fastest way to feel the shift
                  is to sit with it for just five minutes today. Even one session changes the day around it.
                </p>
              </div>

              <button
                onClick={complete}
                disabled={saving}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? "Setting up…" : "Enter Velum →"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
