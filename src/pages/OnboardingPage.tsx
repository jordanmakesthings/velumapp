import { useEffect, useState } from "react";
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

const EXPERIENCE = [
  { key: "new",      label: "New to this",         sub: "These tools are unfamiliar to me" },
  { key: "some",     label: "Some experience",     sub: "I've explored but never gone deep" },
  { key: "regular",  label: "Regular practice",    sub: "I show up — but I know there's more" },
  { key: "advanced", label: "Deep practitioner",   sub: "I live this. I'm here to go further." },
];

const BUILDING_LINES = [
  "Analyzing your goals…",
  "Mapping your nervous system signature…",
  "Curating your first sessions…",
  "Calibrating your daily practice…",
  "Ready.",
];

const OUTCOME_BULLETS = [
  "Reclaim agency over your thinking",
  "Snap yourself out of fight-or-flight at will",
  "Wake up with the inner peace you know you're capable of",
  "Fall asleep embodying a deep sense of safety",
  "Have the tools to break through the beliefs keeping you anchored to the past",
];

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

// 3 data-collection steps drive the progress bar: 0 → 33%, 2 → 100%
const DATA_STEPS = 3;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 1 — multi-select
  const [goals, setGoals] = useState<string[]>([]);

  // Step 2
  const [experience, setExperience] = useState("");

  // Step 3 — building animation
  const [buildLine, setBuildLine] = useState(0);

  // Progress bar fill — only shown on data steps (0-2)
  const progressPercent = Math.min(100, ((step + 1) / DATA_STEPS) * 100);
  const showProgress = step < DATA_STEPS;

  // Step 0 validity
  const detailsValid = firstName.trim().length >= 1 && lastName.trim().length >= 1 && phone.trim().length >= 7;

  // Step 3 — cycle through building lines, then auto-advance
  useEffect(() => {
    if (step !== 3) return;
    setBuildLine(0);
    const tick = setInterval(() => setBuildLine(l => Math.min(l + 1, BUILDING_LINES.length - 1)), 1000);
    const finish = setTimeout(() => setStep(4), 5000);
    return () => { clearInterval(tick); clearTimeout(finish); };
  }, [step]);

  const toggleGoal = (key: string) => setGoals(g => g.includes(key) ? g.filter(k => k !== key) : [...g, key]);

  const complete = async () => {
    if (!user || saving) return;
    setSaving(true);
    await supabase.from("profiles").update({
      onboarding_completed: true,
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      phone: phone.trim(),
      onboarding_answers: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        goals,
        experience,
      },
    }).eq("id", user.id);
    await refreshProfile();
    navigate("/premium");
  };

  const next = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
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

          {/* STEP 0 — Your details */}
          {step === 0 && (
            <motion.div key="details" {...slide} className="w-full">
              <div className="text-center mb-8">
                <img src={logoCircle} alt="Velum" className="w-16 h-16 object-contain mx-auto mb-4" />
                <h1 className="text-display text-[2.4rem] leading-[1.05] mb-3">Let's get<br />you <span className="text-accent italic">set up.</span></h1>
                <p className="text-muted-foreground text-sm font-light">
                  Your details stay yours. We use phone for important account messages only.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="velum-card w-1/2 px-4 py-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50"
                    autoComplete="given-name"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="velum-card w-1/2 px-4 py-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50"
                    autoComplete="family-name"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone (+1 555 123 4567)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="velum-card w-full px-4 py-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50"
                  autoComplete="tel"
                />
                <button
                  onClick={next}
                  disabled={!detailsValid}
                  className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 mt-2"
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Goals (multi-select) */}
          {step === 1 && (
            <motion.div key="goals" {...slide} className="w-full">
              <div className="text-center mb-8">
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

          {/* STEP 2 — Experience */}
          {step === 2 && (
            <motion.div key="exp" {...slide} className="w-full">
              <div className="text-center mb-8">
                <h1 className="text-display text-[2.1rem] leading-[1.1] mb-3">Rate your <span className="text-accent italic">experience</span><br />with meditation &amp; nervous system work.</h1>
              </div>
              <div className="flex flex-col gap-3">
                {EXPERIENCE.map(({ key, label, sub }) => (
                  <button
                    key={key}
                    onClick={() => { setExperience(key); next(); }}
                    className={`velum-card w-full px-5 py-5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] ${
                      experience === key ? "!border-accent/50 shadow-[0_0_24px_rgba(201,168,76,0.15)]" : ""
                    }`}
                  >
                    <div>
                      <p className="text-foreground text-sm font-sans font-semibold">{label}</p>
                      <p className="text-muted-foreground text-xs font-sans mt-0.5">{sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-4 transition-all ${
                      experience === key ? "border-accent bg-accent" : "border-muted-foreground/25"
                    }`} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Building your program (5s) */}
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
              <div className="h-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={buildLine}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-muted-foreground text-sm font-sans"
                  >
                    {BUILDING_LINES[buildLine]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Almost there */}
          {step === 4 && (
            <motion.div key="almost" {...slide} className="w-full text-center">
              <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(201,168,76,0.25)]">
                <span className="text-primary-foreground text-2xl">✦</span>
              </div>
              <p className="text-eyebrow mb-3">Almost there</p>
              <h1 className="text-editorial text-[2.6rem] italic mb-6 font-light leading-[1.05]">
                Imagine 7 days<br />from now{firstName ? `, ${firstName}` : ""}.
              </h1>

              <div className="velum-card-accent p-5 mb-6 text-left">
                <p className="text-eyebrow mb-4 text-center">Where you…</p>
                <div className="flex flex-col gap-3">
                  {OUTCOME_BULLETS.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-accent text-sm mt-0.5 flex-shrink-0">—</span>
                      <p className="text-foreground text-sm font-sans leading-snug">{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={complete}
                disabled={saving}
                className="w-full py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? "Setting up…" : "Choose your plan →"}
              </button>

              <p className="mt-4 text-muted-foreground/70 text-[11px]">
                Monthly · Annual (7-day trial) · Lifetime
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
