import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Step 0 — what brought them here ────────────────────────────────────────
const GOALS = [
  { key: "emotions",   label: "Learn to master my emotions" },
  { key: "future",     label: "Train my brain to create my desired future" },
  { key: "selfworth",  label: "Experience deeper levels of self-connection, confidence & self-worth" },
  { key: "sleep",      label: "Deeper sleep and increased energy" },
  { key: "patterns",   label: "Break self-sabotaging patterns" },
  { key: "wealth",     label: "Create more financial wealth and prosperity" },
  { key: "meditation", label: "Build a daily meditation practice" },
  { key: "practice",   label: "Build a daily practice — meditation, breathwork, journaling — to rewire my brain" },
];

// ── Step 1 — experience level ──────────────────────────────────────────────
const EXPERIENCE = [
  { key: "new",      label: "New to this",       sub: "These tools are unfamiliar to me" },
  { key: "some",     label: "Some experience",   sub: "I've explored but never gone deep" },
  { key: "regular",  label: "Regular practice",  sub: "I show up — but I know there's more" },
  { key: "advanced", label: "Deep practitioner", sub: "I live this. I'm here to go further." },
];

// ── Step 2 — modality history (what's already been part of their path) ─────
const TRIED = [
  { key: "apps",       label: "Meditation apps (Calm, Headspace, Insight Timer)" },
  { key: "therapy",    label: "Therapy or counseling" },
  { key: "breathwork", label: "Breathwork (Wim Hof, Holotropic)" },
  { key: "yoga",       label: "Yoga or Yoga Nidra" },
  { key: "medicine",   label: "Plant medicine" },
  { key: "books",      label: "Books, podcasts, courses" },
  { key: "coaches",    label: "Coaches or mentors" },
  { key: "nothing",    label: "Nothing yet — this is my first real try" },
];

// ── Step 4 — future-pacing vision (PRESENT TENSE, that's the whole point) ──
const VISION = [
  { key: "calm",    label: "I'm calm under pressure" },
  { key: "trust",   label: "I trust myself" },
  { key: "sleep",   label: "I sleep deeply" },
  { key: "present", label: "I'm fully present with the people I love" },
  { key: "free",    label: "I'm no longer running from anything" },
  { key: "safe",    label: "My body finally feels safe" },
  { key: "build",   label: "I'm building what I'm here to build" },
  { key: "want",    label: "I wake up wanting to be me" },
];

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

// 5 data-collection / teaching screens drive the progress bar.
// Steps 5 (building) and 6 (welcome) are off-progress reveal moments.
const DATA_STEPS = 5;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Answers
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [tried, setTried] = useState<string[]>([]);
  const [vision, setVision] = useState<string[]>([]);

  // Step 5 — building animation
  const [buildLine, setBuildLine] = useState(0);

  // First name pulled from profile (already captured at signup).
  const firstName = (profile?.full_name || "").trim().split(" ")[0] || "";

  // Building lines reference their actual answers so the wait feels earned.
  const buildingLines = useMemo(() => {
    const firstVision = VISION.find(v => v.key === vision[0])?.label || "I trust myself";
    const firstGoal = GOALS.find(g => g.key === goals[0])?.label || "your goals";
    return [
      `Anchoring "${firstVision}"…`,
      `Aligning with "${firstGoal}"…`,
      "Calibrating your daily practice…",
      "Mapping your first protocol…",
      "Ready.",
    ];
  }, [vision, goals]);

  const progressPercent = Math.min(100, ((step + 1) / DATA_STEPS) * 100);
  const showProgress = step < DATA_STEPS;

  // Step 5 — cycle through building lines, then auto-advance to welcome
  useEffect(() => {
    if (step !== 5) return;
    setBuildLine(0);
    const tick = setInterval(() => setBuildLine(l => Math.min(l + 1, buildingLines.length - 1)), 1100);
    const finish = setTimeout(() => setStep(6), 6000);
    return () => { clearInterval(tick); clearTimeout(finish); };
  }, [step, buildingLines.length]);

  const toggleGoal = (key: string) => setGoals(g => g.includes(key) ? g.filter(k => k !== key) : [...g, key]);
  const toggleTried = (key: string) => setTried(t => t.includes(key) ? t.filter(k => k !== key) : [...t, key]);
  const toggleVision = (key: string) => setVision(v => v.includes(key) ? v.filter(k => k !== key) : [...v, key]);

  const complete = async () => {
    if (!user || saving) return;
    setSaving(true);
    await supabase.from("profiles").update({
      onboarding_completed: true,
      onboarding_answers: { goals, experience, tried, vision },
    }).eq("id", user.id);
    await refreshProfile();
    // Freemium: everyone lands on /home. No forced paywall after signup.
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

      {/* Thin gold progress bar — pinned near the top of the screen */}
      {showProgress && (
        <div className="pt-10 px-6 max-w-[440px] mx-auto w-full">
          <div className="h-[3px] w-full rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full gold-gradient transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Content sits just below the progress bar, no big centered gap */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 max-w-[440px] mx-auto w-full pt-8 pb-10">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Goals */}
          {step === 0 && (
            <motion.div key="goals" {...slide} className="w-full">
              <div className="text-center mb-6">
                <h1 className="text-display text-[2.4rem] leading-[1.05] mb-3">What brought<br />you <span className="text-accent italic">here?</span></h1>
                <p className="text-muted-foreground text-sm font-light">
                  Pick all that apply.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {GOALS.map(({ key, label }) => {
                  const selected = goals.includes(key);
                  return (
                    <button key={key} onClick={() => toggleGoal(key)}
                      className={`velum-card w-full px-5 py-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.98] ${selected ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""}`}>
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? "border-accent bg-accent" : "border-muted-foreground/30"}`}>
                        {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-foreground text-sm font-sans font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={next} disabled={goals.length === 0}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-5">
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 1 — Experience level */}
          {step === 1 && (
            <motion.div key="experience" {...slide} className="w-full">
              <div className="text-center mb-8">
                <h1 className="text-display text-[1.9rem] leading-[1.1] mb-3">
                  How much <span className="italic text-accent">experience</span> do you have<br />
                  with meditation, breathwork &amp; nervous system tools?
                </h1>
              </div>
              <div className="flex flex-col gap-3">
                {EXPERIENCE.map(({ key, label, sub }) => (
                  <button key={key} onClick={() => { setExperience(key); next(); }}
                    className={`velum-card w-full px-5 py-5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] ${experience === key ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""}`}>
                    <div>
                      <p className="text-foreground text-sm font-sans font-semibold">{label}</p>
                      <p className="text-muted-foreground text-xs font-sans mt-0.5">{sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-4 transition-all ${experience === key ? "border-accent bg-accent" : "border-muted-foreground/25"}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — What have you already tried? */}
          {step === 2 && (
            <motion.div key="tried" {...slide} className="w-full">
              <div className="text-center mb-8">
                <h1 className="text-display text-[2.2rem] leading-[1.05] mb-3">
                  What have you <span className="italic text-accent">already tried?</span>
                </h1>
                <p className="text-muted-foreground text-sm font-light">
                  Pick anything that's been part of your path.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {TRIED.map(({ key, label }) => {
                  const selected = tried.includes(key);
                  return (
                    <button key={key} onClick={() => toggleTried(key)}
                      className={`velum-card w-full px-5 py-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.98] ${selected ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""}`}>
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? "border-accent bg-accent" : "border-muted-foreground/30"}`}>
                        {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-foreground text-sm font-sans">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={next} disabled={tried.length === 0}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-5">
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 3 — Educational beat. A single paragraph that names what Velum actually is. */}
          {step === 3 && (
            <motion.div key="education" {...slide} className="w-full text-center">
              <p className="text-foreground text-[17px] font-sans leading-[1.7] mb-10 max-w-[400px] mx-auto">
                Unlike generic meditation apps, Velum is a <span className="italic text-accent">transformational platform</span> designed to create rapid and lasting changes by working at the deepest levels of your <span className="italic text-accent">nervous system</span>, your <span className="italic text-accent">subconscious mind</span>, and your <span className="italic text-accent">identity</span>.
              </p>
              <button onClick={next}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform">
                Show me →
              </button>
            </motion.div>
          )}

          {/* STEP 4 — Future-pace vision (present-tense identity priming) */}
          {step === 4 && (
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
                    <button key={key} onClick={() => toggleVision(key)}
                      className={`velum-card w-full px-5 py-4 flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.98] ${selected ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""}`}>
                      <div className={`w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? "border-accent bg-accent" : "border-muted-foreground/30"}`}>
                        {selected && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                      </div>
                      <span className="text-foreground text-sm font-sans font-medium italic">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={next} disabled={vision.length === 0}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-5">
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 5 — Building your program (references their answers) */}
          {step === 5 && (
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
                  <motion.p key={buildLine}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-muted-foreground text-sm font-sans">
                    {buildingLines[buildLine]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 6 — Welcome. Ties to today's "I made breathwork free" email. */}
          {step === 6 && (
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
                  is to sit with it for five minutes today. Even one session changes the day around it.
                </p>
              </div>

              <button onClick={complete} disabled={saving}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50">
                {saving ? "Setting up…" : "Enter Velum →"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
