import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoCircle from "@/assets/logo-circle.png";

const GOAL_OPTIONS = [
{ key: "stress", label: "Stress & anxiety", icon: "◌" },
{ key: "emotions", label: "Master my emotions", icon: "✦" },
{ key: "sleep", label: "Sleep deeper", icon: "◎" },
{ key: "focus", label: "More energy & focus", icon: "◇" },
{ key: "confidence", label: "Greater confidence & self-esteem", icon: "≡" },
{ key: "creativity", label: "Unlock my creativity", icon: "✎" },
{ key: "self", label: "Deepen connection to self", icon: "◌" },
{ key: "habits", label: "Break bad habits & self-sabotaging patterns", icon: "✦" }];


const EXPERIENCE_OPTIONS = [
{ key: "beginner", label: "Complete beginner", description: "These tools are new to me" },
{ key: "some", label: "Some experience", description: "I've dipped in but never gone deep" },
{ key: "regular", label: "Regular practice", description: "I show up, but I know there's more" },
{ key: "advanced", label: "Advanced practitioner", description: "I live this — I'm here to go further" }];


const INCLUDED_FEATURES = [
{ title: "Nervous System Library", desc: "A storehouse of meditation, breathwork and journaling practices to pull you from survival to creation. From 10-minute Rapid Resets to extended journeys designed to peel back the invisible layers that have held you back from the life you know you're capable of living." },
{ title: "Interactive Breathwork", desc: "A custom guided breathwork tool for real-time regulation and a nervous system reset. Rapid state changes in under 10 minutes." },
{ title: "Courses", desc: "Entry-level courses including Meditation Made Easy and EFT Essentials to advanced journeys designed to rewrite reality and unlock unseen levels of potential and emotional mastery." },
{ title: "MasteryClasses", desc: "Updated monthly. Interactive mini-courses designed to be digested and implemented in one shot. Information to build new neural networks, guided interactive journaling to retain the information and generate ideas, action prompts to build the bridge from the invisible to the visible." },
{ title: "Velum Journal", desc: "A door to the subconscious that fits in your pocket. Includes a new Daily Reflection every morning, guided journaling practices based in NLP and CBT to uncover and rewire limiting beliefs or process heavy emotions, and the ability to save and revisit entries to reflect on growth and progress." }];


function StressSlider({ value, onChange }: {value: number;onChange: (v: number) => void;}) {
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
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent" />
        
        <div className="flex justify-between mt-3">
          <span className="text-muted-foreground text-xs font-sans">1 · Completely calm</span>
          <span className="text-accent text-xs font-sans">10 · Overwhelmed</span>
        </div>
      </div>
    </div>);

}

function EmotionSplit({ value, onChange }: {value: number;onChange: (v: number) => void;}) {
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
          {100 - value > 15 && <span className="text-xs font-bold text-foreground">{100 - value}% negative</span>}
        </div>
      </div>
      <p className="text-display text-2xl text-foreground mb-6">{getLabel(value)}</p>
      <div className="px-2">
        <input
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent" />
        
        <div className="flex justify-between mt-3">
          <span className="text-muted-foreground text-xs font-sans">← All negative</span>
          <span className="text-muted-foreground text-xs font-sans">All positive →</span>
        </div>
      </div>
    </div>);

}

function ProgressBar({ current, total }: {current: number;total: number;}) {
  return (
    <div className="flex gap-1.5 justify-center mb-10">
      {Array.from({ length: total }).map((_, i) =>
      <div key={i} className={`h-[3px] w-10 rounded-full transition-colors duration-300 ${
      i <= current ? "bg-accent" : i === current + 1 ? "bg-muted-foreground/30" : "bg-muted-foreground/15"}`
      } />
      )}
    </div>);

}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [stress, setStress] = useState(5);
  const [emotional, setEmotional] = useState(50);
  const [vision, setVision] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const totalSteps = 7;

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      saveOnboardingData(true).then(() => navigate("/payment-success"));
    }
  }, []);

  const toggleGoal = (key: string) => {
    setGoals((prev) => prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]);
  };

  const canProceed = () => {
    switch (step) {
      case 0:return name.trim().length > 0;
      case 1:return goals.length > 0;
      case 2:return experience !== "";
      default:return true;
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
    if (step < totalSteps - 1) setStep(step + 1);else
    handleComplete();
  };

  const handleComplete = async () => {
    await saveOnboardingData(true);
    navigate("/welcome");
  };

  const handleCheckout = async (plan: "monthly" | "lifetime") => {
    if (!session) {navigate("/auth");return;}
    setSelectedPlan(plan);
    setCheckoutLoading(true);
    try {
      await saveOnboardingData(true);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan, returnUrl: `${window.location.origin}/payment-success` }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;else
      throw new Error("No checkout URL returned");
    } catch (err: any) {
      console.error("Checkout error:", err);
      if (err?.message?.includes("Unauthorized") || err?.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/auth");
        return;
      }
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
    exit: { opacity: 0, x: -40 }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 py-16 max-w-[440px] mx-auto w-full">
        {/* Logo */}
        <img src={logoCircle} alt="Velum" className="w-[48px] h-[48px] object-contain mb-3" />
        <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-5">Velum</p>

        <ProgressBar current={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          <motion.div key={`step-${step}`} variants={slideVariants} initial="enter" animate="center" exit="exit" className={`w-full ${step === 0 || step === 3 || step === 4 || step === 5 ? "text-center" : ""}`}>
            {step === 0 && (
              <>
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
                  <button onClick={() => navigate("/auth")} className="hover:underline underline-offset-2">
                    Have an account? Log in here →
                  </button>
                </p>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-display text-3xl mb-2 text-center">Something brought you here.</h1>
                <p className="text-muted-foreground text-sm font-sans font-light mb-8 text-center">
                  Whatever it is — it was right to listen. Choose everything that resonates.
                </p>
                <div className="flex flex-col gap-3">
                  {GOAL_OPTIONS.map(({ key, label, icon }) => {
                    const isSelected = goals.includes(key);
                    return (
                      <button key={key} onClick={() => toggleGoal(key)}
                        className={`w-full border rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all duration-200 ${
                          isSelected ? "border-accent/40 bg-surface-light/30" : "border-muted-foreground/20"}`}>
                        <span className={`text-lg ${isSelected ? "text-accent" : "text-accent/40"}`}>{icon}</span>
                        <span className="text-foreground text-sm font-sans font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-display text-3xl mb-2 text-center">Where are you starting from?</h1>
                <p className="text-muted-foreground text-sm font-sans font-light mb-8 text-center">
                  There's no right answer. Every path through Velum begins exactly where you are.
                </p>
                <div className="flex flex-col gap-3">
                  {EXPERIENCE_OPTIONS.map(({ key, label, description }) =>
                    <button key={key} onClick={() => setExperience(key)}
                      className={`w-full border rounded-xl px-5 py-5 flex items-center justify-between text-left transition-all duration-200 ${
                        experience === key ? "border-accent/40 bg-surface-light/30" : "border-muted-foreground/20"}`}>
                      <div>
                        <p className="text-foreground text-sm font-sans font-bold">{label}</p>
                        <p className="text-muted-foreground text-xs font-sans mt-1">{description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ml-4 ${
                        experience === key ? "border-accent bg-accent" : "border-muted-foreground/30"}`} />
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-display text-3xl mb-2">How stressed do you feel on a typical day?</h1>
                <p className="text-muted-foreground text-sm font-sans font-light mb-12">
                  Be honest with yourself. This is just between you and Velum.
                </p>
                <StressSlider value={stress} onChange={setStress} />
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-display text-3xl mb-2">How does your inner world usually feel?</h1>
                <p className="text-muted-foreground text-sm font-sans font-light mb-12">
                  Drag the scale to reflect the balance of your emotional life.
                </p>
                <EmotionSplit value={emotional} onChange={setEmotional} />
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="text-display text-3xl mb-2">
                  In one sentence — what would a true mark of success look like for you 30 days from now?
                </h1>
                <p className="text-muted-foreground text-sm font-sans font-light mb-6">
                  There's no wrong answer. This is just for you.
                </p>
                <div className="border border-muted-foreground/20 rounded-xl p-5 mb-4 text-left">
                  <p className="text-muted-foreground text-sm font-sans italic leading-relaxed">
                    "The people who transform their lives aren't the ones who tried the hardest — they're the ones who finally got honest about what they truly wanted."
                  </p>
                </div>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="e.g. I wake up feeling calm and excited about my day..."
                  className="w-full bg-transparent border border-muted-foreground/20 rounded-xl p-5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 resize-none h-32 focus:outline-none focus:border-accent/40 transition-colors" />
              </>
            )}

            {step === 6 && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-display text-4xl italic mb-2">Invest in Your Nervous System.</h1>
                  <p className="text-muted-foreground text-[15px] font-sans font-light">
                    Full access to everything in Velum.
                  </p>
                </div>

                <div className="text-center mb-8">
                  <p className="text-display mb-1 text-accent text-5xl">$29 / month</p>
                  <p className="text-muted-foreground text-sm font-sans font-light mb-4">Cancel anytime</p>
                  <button onClick={() => handleCheckout("monthly")} disabled={checkoutLoading}
                    className="w-full border border-accent/30 rounded-xl p-5 flex items-center justify-between text-left mb-1">
                    <span className="text-foreground text-lg font-sans font-semibold">Start Free Trial</span>
                    <span className="text-accent text-xl">→</span>
                  </button>
                  <p className="text-muted-foreground/40 text-xs font-sans">​</p>
                </div>

                <div className="w-full h-px bg-accent/15 mb-8" />

                <div className="text-center mb-8">
                  <p className="text-display mb-1 text-accent text-4xl">US$299</p>
                  <p className="text-muted-foreground text-sm font-sans font-light leading-relaxed mb-4">Lifetime Access</p>
                  <button onClick={() => handleCheckout("lifetime")} disabled={checkoutLoading}
                    className="w-full border border-muted-foreground/20 rounded-xl p-5 flex items-center justify-between text-left mb-1">
                    <span className="text-foreground text-lg font-sans font-semibold">Begin My Journey</span>
                    <span className="text-accent text-xl">→</span>
                  </button>
                  <p className="text-muted-foreground/40 text-xs font-sans">One time payment</p>
                </div>

                <p className="text-accent text-sm font-sans text-center mb-6">​</p>

                <div className="w-full h-px bg-accent/15 mb-6" />

                <p className="text-accent font-sans tracking-[2.5px] uppercase text-center mb-6 font-bold text-lg">
                  Everything Included
                </p>
                <div className="flex flex-col">
                  {INCLUDED_FEATURES.map((f, i) =>
                    <div key={i} className={`py-5 ${i < INCLUDED_FEATURES.length - 1 ? "border-b border-accent/10" : ""}`}>
                      <div className="flex items-start gap-3 mb-1.5">
                        <span className="text-accent text-lg mt-0.5">✓</span>
                        <h3 className="text-foreground text-lg font-serif font-bold">{f.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm font-sans font-light leading-relaxed pl-8">{f.desc}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button onClick={handleSkip}
                    className="w-full text-center text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    Continue without subscribing
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA (not on paywall) */}
      {step < 6 &&
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full max-w-[440px] mx-auto flex items-center justify-center gap-2 py-5 rounded-xl gold-gradient text-primary-foreground font-sans font-bold text-base disabled:opacity-30 active:scale-[0.98] transition-transform">
          
            {step === 5 ? "Almost there →" : "Continue →"}
          </button>
        </div>
      }
    </div>);

}