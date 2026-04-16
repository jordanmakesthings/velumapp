import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoCircle from "@/assets/logo-circle.png";

const GOAL_OPTIONS = [
  { key: "stress", label: "Stress & anxiety", icon: "◌" },
  { key: "emotions", label: "Master my emotions", icon: "✦" },
  { key: "sleep", label: "Sleep deeper", icon: "◎" },
  { key: "focus", label: "More energy & focus", icon: "◇" },
  { key: "confidence", label: "Greater confidence & self-esteem", icon: "≡" },
  { key: "creativity", label: "Unlock my creativity", icon: "✎" },
  { key: "self", label: "Deepen connection to self", icon: "◌" },
  { key: "habits", label: "Break bad habits & self-sabotaging patterns", icon: "✦" },
];

const EXPERIENCE_OPTIONS = [
  { key: "beginner", label: "Complete beginner", description: "These tools are new to me" },
  { key: "some", label: "Some experience", description: "I've dipped in but never gone deep" },
  { key: "regular", label: "Regular practice", description: "I show up, but I know there's more" },
  { key: "advanced", label: "Advanced practitioner", description: "I live this — I'm here to go further" },
];

const INCLUDED_FEATURES = [
  { title: "Nervous System Library", desc: "A storehouse of meditation, breathwork and journaling practices to pull you from survival to creation. From 10-minute Rapid Resets to extended journeys designed to peel back the invisible layers that have held you back from the life you know you're capable of living." },
  { title: "Interactive Breathwork", desc: "A custom guided breathwork tool for real-time regulation and a nervous system reset. Rapid state changes in under 10 minutes." },
  { title: "Courses", desc: "Entry-level courses including Meditation Made Easy and EFT Essentials to advanced journeys designed to rewrite reality and unlock unseen levels of potential and emotional mastery." },
  { title: "MasteryClasses", desc: "Updated monthly. Interactive mini-courses designed to be digested and implemented in one shot. Information to build new neural networks, guided interactive journaling to retain the information and generate ideas, action prompts to build the bridge from the invisible to the visible." },
  { title: "Velum Journal", desc: "A door to the subconscious that fits in your pocket. Includes a new Daily Reflection every morning, guided journaling practices based in NLP and CBT to uncover and rewire limiting beliefs or process heavy emotions, and the ability to save and revisit entries to reflect on growth and progress." },
];

function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getLabel = (v: number) => {
    if (v <= 2) return "Very calm";
    if (v <= 4) return "Mild tension";
    if (v <= 6) return "Moderate stress";
    if (v <= 8) return "High stress";
    return "Overwhelmed";
  };
  return (
    <div className="w-full text-center">
      <div className="mb-8">
        <span className="text-display text-7xl text-accent">{value}</span>
        <span className="text-muted-foreground/40 text-3xl font-sans">/10</span>
      </div>
      <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase mb-8">{getLabel(value)}</p>
      <div className="px-2">
        <input
          type="range" min={1} max={10} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent"
        />
        <div className="flex justify-between mt-3">
          <span className="text-muted-foreground text-xs font-sans">1 · Completely calm</span>
          <span className="text-accent text-xs font-sans">10 · Overwhelmed</span>
        </div>
      </div>
    </div>
  );
}

function EmotionSplit({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getLabel = (v: number) => {
    if (v >= 80) return "Mostly positive";
    if (v >= 60) return "More positive than not";
    if (v >= 45) return "About even";
    if (v >= 25) return "More negative than not";
    return "Mostly negative";
  };
  return (
    <div className="w-full text-center">
      <div className="rounded-xl overflow-hidden h-12 flex mb-4">
        <div className="flex items-center justify-center transition-all" style={{ width: `${value}%`, background: "hsl(100, 40%, 55%)" }}>
          {value > 15 && <span className="text-xs font-bold text-background">{value}% positive</span>}
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ background: "hsl(10, 40%, 50%)" }}>
          {(100 - value) > 15 && <span className="text-xs font-bold text-foreground">{100 - value}% negative</span>}
        </div>
      </div>
      <p className="text-display text-2xl text-foreground mb-6">{getLabel(value)}</p>
      <div className="px-2">
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent"
        />
        <div className="flex justify-between mt-3">
          <span className="text-muted-foreground text-xs font-sans">← All negative</span>
          <span className="text-muted-foreground text-xs font-sans">All positive →</span>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-[3px] w-10 rounded-full transition-colors duration-300 ${
          i <= current ? "bg-accent" : i === current + 1 ? "bg-muted-foreground/30" : "bg-muted-foreground/15"
        }`} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [stress, setStress] = useState(5);
  const [emotional, setEmotional] = useState(50);
  const [vision, setVision] = useState("");

  const totalSteps = 6;

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const toggleGoal = (key: string) => {
    setGoals((prev) => prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return goals.length > 0;
      case 2: return experience !== "";
      default: return true;
    }
  };

  const saveOnboardingData = async (markComplete = false) => {
    if (!user) return;
    const onboardingAnswers = { goals, experience, stress, emotional, vision };
    const updates: Record<string, unknown> = { onboarding_answers: onboardingAnswers };
    if (name.trim()) updates.full_name = name.trim();
    if (markComplete) updates.onboarding_completed = true;
    await supabase.from("profiles").update(updates).eq("id", user.id);
    await refreshProfile();
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = async () => {
    await saveOnboardingData(true);
    navigate("/home-setup");
  };


  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 py-16 max-w-[440px] mx-auto w-full">
        {/* Logo */}
        <img src={logoCircle} alt="Velum" className="w-[48px] h-[48px] object-contain mb-3" />
        <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-5">Velum</p>

        <ProgressBar current={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          {/* Step 0: Name + Email */}
          {step === 0 && (
            <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">Before we begin.</h1>
              <p className="text-muted-foreground text-sm font-sans font-light mb-10">Tell us a little about yourself.</p>
              <div className="text-left mb-5">
                <p className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase mb-2">Your Name</p>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-transparent border border-muted-foreground/25 rounded-xl px-5 py-4 text-foreground text-base font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/40 transition-colors"
                  autoFocus />
              </div>
              <div className="text-left mb-6">
                <p className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase mb-2">Your Email</p>
                <input type="email" value={email} readOnly
                  placeholder="you@example.com"
                  className="w-full bg-transparent border border-muted-foreground/25 rounded-xl px-5 py-4 text-foreground/50 text-base font-sans placeholder:text-muted-foreground/40 focus:outline-none" />
              </div>
              <p className="text-accent text-sm font-sans text-center">
                <button onClick={() => navigate("/signup")} className="hover:underline underline-offset-2">
                  Have an account? Log in here →
                </button>
              </p>
            </motion.div>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full overflow-y-auto max-h-[calc(100vh-280px)]">
              <h1 className="text-display text-3xl mb-2 text-center">Something brought you here.</h1>
              <p className="text-muted-foreground text-sm font-sans font-light mb-8 text-center">
                Whatever it is — it was right to listen. Choose everything that resonates.
              </p>
              <div className="flex flex-col gap-3 pb-4">
                {GOAL_OPTIONS.map(({ key, label, icon }) => {
                  const isSelected = goals.includes(key);
                  return (
                    <button key={key} onClick={() => toggleGoal(key)}
                      className={`w-full border rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all duration-200 ${
                        isSelected ? "border-accent/40 bg-surface-light/30" : "border-muted-foreground/20"
                      }`}>
                      <span className={`text-lg ${isSelected ? "text-accent" : "text-muted-foreground/50"}`}>{icon}</span>
                      <span className="text-foreground text-sm font-sans font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <motion.div key="experience" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
              <h1 className="text-display text-3xl mb-2 text-center">Where are you starting from?</h1>
              <p className="text-muted-foreground text-sm font-sans font-light mb-8 text-center">
                There's no right answer. Every path through Velum begins exactly where you are.
              </p>
              <div className="flex flex-col gap-3">
                {EXPERIENCE_OPTIONS.map(({ key, label, description }) => (
                  <button key={key} onClick={() => setExperience(key)}
                    className={`w-full border rounded-xl px-5 py-5 flex items-center justify-between text-left transition-all duration-200 ${
                      experience === key ? "border-accent/40 bg-surface-light/30" : "border-muted-foreground/20"
                    }`}>
                    <div>
                      <p className="text-foreground text-sm font-sans font-bold">{label}</p>
                      <p className="text-muted-foreground text-xs font-sans mt-1">{description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ml-4 ${
                      experience === key ? "border-accent bg-accent" : "border-muted-foreground/30"
                    }`} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Stress */}
          {step === 3 && (
            <motion.div key="stress" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">How stressed do you feel on a typical day?</h1>
              <p className="text-muted-foreground text-sm font-sans font-light mb-12">
                Be honest with yourself. This is just between you and Velum.
              </p>
              <StressSlider value={stress} onChange={setStress} />
            </motion.div>
          )}

          {/* Step 4: Emotional */}
          {step === 4 && (
            <motion.div key="emotional" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">How does your inner world usually feel?</h1>
              <p className="text-muted-foreground text-sm font-sans font-light mb-12">
                Drag the scale to reflect the balance of your emotional life.
              </p>
              <EmotionSplit value={emotional} onChange={setEmotional} />
            </motion.div>
          )}

          {/* Step 5: Trial welcome */}
          {step === 5 && (
            <motion.div key="trial" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-display text-4xl italic mb-3">You're in.</h1>
              <p className="text-muted-foreground text-[15px] font-sans font-light mb-8">
                Your 7-day free trial starts now.<br />
                No credit card required.
              </p>
              <div className="flex flex-col gap-3 mb-8 text-left">
                {INCLUDED_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-accent text-base mt-0.5 shrink-0">✓</span>
                    <p className="text-foreground text-sm font-sans font-medium">{f.title}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleComplete}
                className="w-full py-5 rounded-xl gold-gradient text-primary-foreground font-sans font-bold text-base active:scale-[0.98] transition-transform"
              >
                Start Exploring →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA (not on paywall) */}
      {step < 5 && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full max-w-[440px] mx-auto flex items-center justify-center gap-2 py-5 rounded-xl gold-gradient text-primary-foreground font-sans font-bold text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
          >
            {step === 4 ? "Almost there →" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}
