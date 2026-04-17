import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoCircle from "@/assets/logo-circle.png";

const GOALS = [
  { key: "stress",     label: "Manage stress & anxiety",               icon: "◌" },
  { key: "emotions",   label: "Master my emotions",                     icon: "✦" },
  { key: "sleep",      label: "Sleep deeper & recover faster",          icon: "◎" },
  { key: "confidence", label: "Build confidence & self-worth",          icon: "≡" },
  { key: "habits",     label: "Break self-sabotaging patterns",         icon: "✦" },
  { key: "self",       label: "Deepen connection to myself",            icon: "◌" },
  { key: "focus",      label: "More energy & mental clarity",           icon: "◇" },
  { key: "trauma",     label: "Process and release what I'm carrying",  icon: "✎" },
];

const EXPERIENCE = [
  { key: "new",      label: "New to this",         sub: "These tools are unfamiliar to me" },
  { key: "some",     label: "Some experience",      sub: "I've explored but never gone deep" },
  { key: "regular",  label: "Regular practice",     sub: "I show up — but I know there's more" },
  { key: "advanced", label: "Deep practitioner",    sub: "I live this. I'm here to go further." },
];

const WHAT_YOU_GET = [
  { icon: "✦", label: "AI-personalised EFT tapping sessions" },
  { icon: "◎", label: "Breathwork, bilateral & somatic tools" },
  { icon: "≡", label: "Courses, Mastery Classes & daily journal" },
  { icon: "◌", label: "SOS Reset — regulation in minutes" },
];

const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);

  const complete = async () => {
    if (!user || saving) return;
    setSaving(true);
    await supabase.from("profiles").update({
      onboarding_completed: true,
      onboarding_answers: { goal, experience },
      terms_accepted_at: new Date().toISOString(),
    }).eq("id", user.id);
    await refreshProfile();
    navigate("/home");
  };

  const next = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-8 pb-2 flex-shrink-0">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${
            i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-foreground/10"
          }`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-[440px] mx-auto w-full py-8">
        <AnimatePresence mode="wait">

          {/* STEP 0 — Goal */}
          {step === 0 && (
            <motion.div key="goal" {...slide} className="w-full">
              <div className="text-center mb-8">
                <img src={logoCircle} alt="Velum" className="w-10 h-10 object-contain mx-auto mb-5" />
                <h1 className="text-display text-3xl mb-2">What brought<br />you here?</h1>
                <p className="text-muted-foreground text-sm font-sans font-light">
                  Pick the one that matters most right now.
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {GOALS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => { setGoal(key); next(); }}
                    className={`w-full border rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all duration-200 active:scale-[0.98] ${
                      goal === key
                        ? "border-accent/40 bg-surface-light/30"
                        : "border-foreground/10 hover:border-foreground/20"
                    }`}
                  >
                    <span className="text-accent text-base w-4 flex-shrink-0">{icon}</span>
                    <span className="text-foreground text-sm font-sans font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Experience */}
          {step === 1 && (
            <motion.div key="exp" {...slide} className="w-full">
              <div className="text-center mb-8">
                <h1 className="text-display text-3xl mb-2">Where are you<br />starting from?</h1>
                <p className="text-muted-foreground text-sm font-sans font-light">
                  There's no right answer. Every path through Velum begins exactly where you are.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {EXPERIENCE.map(({ key, label, sub }) => (
                  <button
                    key={key}
                    onClick={() => { setExperience(key); next(); }}
                    className={`w-full border rounded-xl px-5 py-5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] ${
                      experience === key
                        ? "border-accent/40 bg-surface-light/30"
                        : "border-foreground/10 hover:border-foreground/20"
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

          {/* STEP 2 — You're in */}
          {step === 2 && (
            <motion.div key="welcome" {...slide} className="w-full text-center">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6">
                <span className="text-primary-foreground text-2xl">✦</span>
              </div>
              <p className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase mb-3">
                7 days free
              </p>
              <h1 className="text-display text-4xl italic mb-3">You're in.</h1>
              <p className="text-muted-foreground text-[15px] font-sans font-light leading-relaxed mb-8 max-w-[300px] mx-auto">
                Your trial starts now. No credit card needed — ever, until you choose to upgrade.
              </p>

              <div className="flex flex-col gap-3 mb-10 text-left">
                {WHAT_YOU_GET.map(({ icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-accent text-base w-5 flex-shrink-0">{icon}</span>
                    <p className="text-foreground text-sm font-sans font-medium">{label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={complete}
                disabled={saving}
                className="w-full py-5 rounded-xl gold-gradient text-primary-foreground font-sans font-bold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? "Setting up…" : "Start Exploring →"}
              </button>

              <p className="mt-4 text-muted-foreground text-[11px] font-sans">
                After 7 days, keep 1 free tapping session daily. Upgrade anytime from $12/mo.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,hsl(155,52%,10%)_0%,transparent_65%)] opacity-30" />
      </div>
    </div>
  );
}
