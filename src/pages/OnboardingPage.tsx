import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Crown, Sparkles, Wind, Heart, BookOpen, BarChart3, Compass, Feather, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  { key: "beginner", label: "Complete beginner", description: "These tools are new to me" },
  { key: "some", label: "Some experience", description: "I've dipped in but never gone deep" },
  { key: "regular", label: "Regular practice", description: "I show up, but I know there's more" },
  { key: "advanced", label: "Advanced practitioner", description: "I live this — I'm here to go further" },
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

function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const getInfo = (v: number) => {
    if (v <= 2) return { label: "Very calm" };
    if (v <= 4) return { label: "Mild tension" };
    if (v <= 6) return { label: "Moderate stress" };
    if (v <= 8) return { label: "High stress" };
    return { label: "Overwhelmed" };
  };
  const info = getInfo(value);

  return (
    <div className="w-full text-center">
      <p className="text-display text-6xl text-accent mb-2">{value}</p>
      <p className="text-ui text-xs uppercase tracking-widest mb-8">{info.label}</p>
      <div className="px-4">
        <input
          type="range" min={1} max={10} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground"
        />
        <div className="flex justify-between mt-3">
          <span className="text-ui text-xs">1 · Completely calm</span>
          <span className="text-ui text-xs">10 · Overwhelmed</span>
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
        <div className="bg-accent/60 flex items-center justify-center transition-all" style={{ width: `${value}%` }}>
          {value > 15 && <span className="text-xs font-bold text-background">{value}% positive</span>}
        </div>
        <div className="bg-muted flex-1 flex items-center justify-center">
          {(100 - value) > 15 && <span className="text-xs font-bold text-foreground">{100 - value}% negative</span>}
        </div>
      </div>
      <p className="text-display text-xl text-foreground mb-6">{getLabel(value)}</p>
      <div className="px-4">
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between mt-3">
          <span className="text-ui text-xs">← All negative</span>
          <span className="text-ui text-xs">All positive →</span>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [stress, setStress] = useState(5);
  const [emotional, setEmotional] = useState(50);
  const [vision, setVision] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalSteps = 7;

  // Handle Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      saveOnboardingData(true).then(() => {
        navigate("/welcome");
      });
    }
  }, []);

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

  const saveOnboardingData = async (markComplete = false) => {
    if (!user) return;
    const onboardingAnswers = { goals, experience, stress, emotional, vision };
    const updates: Record<string, unknown> = {
      onboarding_answers: onboardingAnswers,
    };
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
    navigate("/welcome");
  };

  const handleCheckout = async () => {
    if (!session) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      // Save onboarding data before checkout redirect
      await saveOnboardingData(true);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan: selectedPlan,
          returnUrl: `${window.location.origin}/onboarding?success=true`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSkip = async () => {
    await saveOnboardingData(true);
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
              <h1 className="text-display text-3xl mb-2">Before we begin.</h1>
              <p className="text-ui text-sm mb-10">Tell us a little about yourself.</p>
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
              <h1 className="text-display text-3xl mb-2 text-center">Something brought you here.</h1>
              <p className="text-ui text-sm mb-8 text-center">Whatever it is — it was right to listen. Choose everything that resonates.</p>
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
              <button onClick={handleNext} className="w-full text-center text-muted-foreground text-xs font-sans mt-4 hover:text-foreground transition-colors">
                Skip this question
              </button>
            </motion.div>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <motion.div key="experience" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full">
              <h1 className="text-display text-3xl mb-2 text-center">Where are you starting from?</h1>
              <p className="text-ui text-sm mb-8 text-center">There's no right answer. Every path through Velum begins exactly where you are.</p>
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
              <h1 className="text-display text-3xl mb-2">How stressed do you feel on a typical day?</h1>
              <p className="text-ui text-sm mb-12">Be honest with yourself. This is just between you and Velum.</p>
              <StressSlider value={stress} onChange={setStress} />
            </motion.div>
          )}

          {/* Step 4: Emotional landscape */}
          {step === 4 && (
            <motion.div key="emotional" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">How does your inner world usually feel?</h1>
              <p className="text-ui text-sm mb-12">Drag the scale to reflect the balance of your emotional life.</p>
              <EmotionSplit value={emotional} onChange={setEmotional} />
            </motion.div>
          )}

          {/* Step 5: 30-day vision */}
          {step === 5 && (
            <motion.div key="vision" variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full text-center">
              <h1 className="text-display text-3xl mb-2">Your 30-day vision</h1>
              <p className="text-ui text-sm mb-4">In one sentence — what would a true mark of success look like for you 30 days from now?</p>
              <div className="velum-card-flat p-4 mb-4 text-left">
                <p className="text-ui text-xs italic leading-relaxed">
                  "The people who transform their lives aren't the ones who tried the hardest — they're the ones who finally got honest about what they truly wanted."
                </p>
              </div>
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
              <h1 className="text-display text-3xl mb-2 text-center">Final Step.</h1>
              <p className="text-ui text-sm text-center mb-8">Full access to everything in Velum. Free for 7 days.</p>

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

              {/* Features */}
              <div className="velum-card p-6 mb-6">
                <p className="text-ui text-xs tracking-wide uppercase mb-4">Everything Included</p>
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

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform mb-3 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  selectedPlan === "monthly" ? "Start Free Trial" : "Claim Lifetime Access"
                )}
              </button>
              <p className="text-center text-muted-foreground text-[10px] font-sans mb-4">
                {selectedPlan === "monthly"
                  ? "7 days free then $29/mo · Cancel anytime"
                  : "One-time payment of $299. Access forever."}
              </p>

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
            {step === 5 ? "Almost there →" : "Continue"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
