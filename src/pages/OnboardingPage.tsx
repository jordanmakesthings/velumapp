import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Crown, Sparkles, Wind, Heart, BookOpen, BarChart3, Compass, Feather } from "lucide-react";
import logoLotus from "@/assets/logo-lotus.jpg";

const GOAL_OPTIONS = [
  { key: "stress", label: "Stress & anxiety", icon: Wind },
  { key: "emotions", label: "Master my emotions", icon: Heart },
  { key: "sleep", label: "Sleep deeper", icon: Sparkles },
  { key: "focus", label: "More energy & focus", icon: BarChart3 },
  { key: "confidence", label: "Greater confidence & self-esteem", icon: Crown },
  { key: "creativity", label: "Unlock my creativity", icon: Feather },
  { key: "self", label: "Deepen connection to self", icon: Compass },
  { key: "habits", label: "Break bad habits & self-sabotaging patterns", icon: BookOpen },
];

const EXPERIENCE_OPTIONS = [
  { key: "beginner", label: "Complete beginner", description: "New to meditation and breathwork" },
  { key: "some", label: "Some experience", description: "Tried it a few times" },
  { key: "regular", label: "Regular practice", description: "I practice consistently" },
  { key: "advanced", label: "Advanced practitioner", description: "Deep, established practice" },
];

const PREMIUM_FEATURES = [
  "Nervous System Library",
  "Interactive Breathwork",
  "EFT Tapping Sessions",
  "Mastery Classes",
  "Daily Journaling",
  "Progress Tracking",
  "Blueprint — your personalized nervous system map",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [stress, setStress] = useState(5);
  const [emotional, setEmotional] = useState(50);
  const [vision, setVision] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");

  const totalSteps = 7;

  const toggleGoal = (key: string) => {
    setGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return goals.length > 0;
      case 2: return experience !== "";
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleComplete();
  };

  const handleComplete = () => {
    // Save onboarding data (will connect to backend later)
    const onboardingData = {
      name, goals, experience, stress, emotional, vision, selectedPlan,
    };
    console.log("Onboarding complete:", onboardingData);
    navigate("/welcome");
  };

  const handleSkip = () => {
    navigate("/welcome");
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-surface">
        <motion.div
          className="h-full gold-gradient"
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Back button */}
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="fixed top-6 left-4 z-50 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Step 0: Name */}
          {step === 0 && (
            <motion.div key="name" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <img src={logoLotus} alt="Velum" className="w-12 h-12 rounded-xl object-cover mx-auto mb-8" />
              <h1 className="text-display text-3xl mb-2">What should we call you?</h1>
              <p className="text-ui text-sm mb-10">This is the beginning of something meaningful.</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="w-full bg-card rounded-xl px-5 py-4 text-foreground text-lg font-sans text-center placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
                autoFocus
              />
            </motion.div>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <motion.div key="goals" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
              <h1 className="text-display text-3xl mb-2 text-center">Why are you here?</h1>
              <p className="text-ui text-sm mb-8 text-center">Select all that resonate with you.</p>
              <div className="grid grid-cols-1 gap-3">
                {GOAL_OPTIONS.map(({ key, label, icon: Icon }) => {
                  const isSelected = goals.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleGoal(key)}
                      className={`velum-card p-4 flex items-center gap-4 text-left transition-all duration-200 ${
                        isSelected ? "ring-1 ring-accent/50" : ""
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? "gold-gradient" : "bg-surface-light"
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-foreground text-sm font-sans">{label}</span>
                      {isSelected && <Check className="w-4 h-4 text-accent ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <motion.div key="experience" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
              <h1 className="text-display text-3xl mb-2 text-center">Your experience level</h1>
              <p className="text-ui text-sm mb-8 text-center">There is no wrong answer here.</p>
              <div className="flex flex-col gap-3">
                {EXPERIENCE_OPTIONS.map(({ key, label, description }) => (
                  <button
                    key={key}
                    onClick={() => setExperience(key)}
                    className={`velum-card p-5 text-left transition-all duration-200 ${
                      experience === key ? "ring-1 ring-accent/50" : ""
                    }`}
                  >
                    <p className="text-foreground text-sm font-sans font-medium">{label}</p>
                    <p className="text-ui text-xs mt-1">{description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Stress level */}
          {step === 3 && (
            <motion.div key="stress" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">Daily stress level</h1>
              <p className="text-ui text-sm mb-12">How stressed do you feel on a typical day?</p>
              <p className="text-display text-6xl text-accent mb-8">{stress}</p>
              <div className="px-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between mt-3">
                  <span className="text-ui text-xs">Low stress</span>
                  <span className="text-ui text-xs">High stress</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Emotional landscape */}
          {step === 4 && (
            <motion.div key="emotional" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">Emotional landscape</h1>
              <p className="text-ui text-sm mb-12">How does your inner world usually feel?</p>
              <p className="text-display text-2xl text-accent mb-8">
                {emotional < 30 ? "Chaotic" : emotional < 50 ? "Unsettled" : emotional < 70 ? "Balanced" : "Peaceful"}
              </p>
              <div className="px-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={emotional}
                  onChange={(e) => setEmotional(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between mt-3">
                  <span className="text-ui text-xs">Chaotic</span>
                  <span className="text-ui text-xs">Peaceful</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: 30-day vision */}
          {step === 5 && (
            <motion.div key="vision" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">Your 30-day vision</h1>
              <p className="text-ui text-sm mb-8">In one sentence — what would a true mark of success look like for you 30 days from now?</p>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="e.g. I wake up feeling calm and excited about my day..."
                className="w-full bg-card rounded-xl p-5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 resize-none h-32 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
              />
            </motion.div>
          )}

          {/* Step 6: Paywall */}
          {step === 6 && (
            <motion.div key="paywall" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
              <h1 className="text-display text-3xl mb-2 text-center">You're ready.</h1>
              <p className="text-display text-xl text-center mb-8 text-accent">Let's begin.</p>

              {/* Features */}
              <div className="velum-card p-6 mb-6">
                <p className="text-ui text-xs tracking-wide uppercase mb-4">What's included</p>
                <div className="flex flex-col gap-3">
                  {PREMIUM_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="text-foreground text-sm font-sans">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plans */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`velum-card p-5 text-left transition-all relative ${
                    selectedPlan === "monthly" ? "ring-1 ring-accent/50" : ""
                  }`}
                >
                  <span className="absolute -top-2 right-3 text-[9px] px-2 py-0.5 rounded-full gold-gradient text-primary-foreground font-sans font-medium tracking-wide">
                    POPULAR
                  </span>
                  <p className="text-foreground text-sm font-sans font-medium mb-1">Monthly</p>
                  <p className="text-display text-2xl text-accent">$29</p>
                  <p className="text-ui text-xs">/month</p>
                  <p className="text-accent text-[10px] font-sans mt-2">7-day free trial</p>
                </button>

                <button
                  onClick={() => setSelectedPlan("lifetime")}
                  className={`velum-card p-5 text-left transition-all relative ${
                    selectedPlan === "lifetime" ? "ring-1 ring-accent/50" : ""
                  }`}
                >
                  <span className="absolute -top-2 right-3 text-[9px] px-2 py-0.5 rounded-full bg-surface-light text-muted-foreground font-sans font-medium tracking-wide">
                    BEST VALUE
                  </span>
                  <p className="text-foreground text-sm font-sans font-medium mb-1">Lifetime</p>
                  <p className="text-display text-2xl text-accent">$299</p>
                  <p className="text-ui text-xs">one-time</p>
                  <p className="text-accent text-[10px] font-sans mt-2">Forever access</p>
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleComplete}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform mb-4"
              >
                Begin My Journey
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-center text-muted-foreground text-xs font-sans hover:text-foreground transition-colors"
              >
                Continue for free
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA (not on paywall step) */}
      {step < 6 && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
