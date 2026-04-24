import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoCircle from "@/assets/logo-circle.png";

const INCLUDED_FEATURES = [
  {
    title: "Nervous System Library",
    desc: "A storehouse of meditation, breathwork and journaling practices to pull you from survival to creation. From 10-minute Rapid Resets to extended journeys designed to peel back the invisible layers that have held you back from the life you know you're capable of living.",
  },
  {
    title: "Interactive Breathwork",
    desc: "A custom guided breathwork tool for real-time regulation and a nervous system reset. Rapid state changes in under 10 minutes.",
  },
  {
    title: "Courses",
    desc: "Entry-level courses including Meditation Made Easy and EFT Essentials to advanced journeys designed to rewrite reality and unlock unseen levels of potential and emotional mastery.",
  },
  {
    title: "MasteryClasses",
    desc: "Updated monthly. Interactive mini-courses designed to be digested and implemented in one shot. Information to build new neural networks, guided interactive journaling to retain the information and generate ideas, action prompts to build the bridge from the invisible to the visible.",
  },
  {
    title: "Velum Journal",
    desc: "A door to the subconscious that fits in your pocket. Includes a new Daily Reflection every morning, guided journaling practices based in NLP and CBT to uncover and rewire limiting beliefs or process heavy emotions, and the ability to save and revisit entries to reflect on growth and progress.",
  },
];

export default function PremiumPage() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState<"monthly" | "annual" | "lifetime" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [foundingLeft, setFoundingLeft] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("founding_lifetime_remaining");
      if (typeof data === "number") setFoundingLeft(data);
    })();
  }, []);

  const isPremium = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
  const isLifetime = profile?.subscription_plan === "lifetime";
  const isCanceling = profile?.subscription_status === "canceling";
  const isFounding = foundingLeft !== null && foundingLeft > 0;

  const handleSubscribe = async (plan: "monthly" | "annual" | "lifetime") => {
    if (!session) { navigate("/signup"); return; }
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan,
          returnUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setCanceling(true);
    setError(null);
    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
      setCancelSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Could not cancel subscription.");
    } finally {
      setCanceling(false);
    }
  };

  // Already subscribed view
  if (isPremium) {
    return (
      <div className="min-h-screen bg-radial-subtle flex flex-col relative">

        <div className="fixed top-0 inset-x-0 z-50 flex items-center px-4 py-4">
          <button onClick={() => navigate("/home")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-lg mx-auto text-center w-full">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={logoCircle}
            alt="Velum"
            className="w-24 h-24 object-contain mx-auto mb-6"
          />
          <p className="text-eyebrow mb-3">You're in</p>
          <h1 className="text-editorial text-[2.8rem] italic mb-4 font-light leading-[1.05]">
            Welcome{profile?.onboarding_answers && (profile.onboarding_answers as any).first_name ? `, ${(profile.onboarding_answers as any).first_name}` : ""}.
          </h1>
          <p className="text-muted-foreground text-[15px] font-light mb-8 max-w-[320px]">
            Full access unlocked. Time to practice.
          </p>

          <button
            onClick={() => navigate("/home")}
            className="w-full max-w-[320px] py-5 rounded-full gold-gradient text-primary-foreground font-bold text-base tracking-wide active:scale-[0.98] transition-transform mb-6"
          >
            Enter Velum →
          </button>

          {profile?.subscription_plan && (
            <p className="text-muted-foreground/60 text-[11px] mb-4 capitalize">
              {profile.subscription_plan} · {profile.subscription_status}
            </p>
          )}

          {cancelSuccess ? (
            <div className="velum-card p-4 text-sm text-muted-foreground max-w-[320px]">
              Your subscription will cancel at the end of the current billing period.
            </div>
          ) : isCanceling ? (
            <div className="velum-card-flat p-4 text-sm text-muted-foreground max-w-[320px]">
              Your subscription is set to cancel at the end of the billing period.
            </div>
          ) : !isLifetime && (
            <>
              <button onClick={handleCancel} disabled={canceling}
                className="text-[11px] text-muted-foreground/60 underline underline-offset-2 hover:text-foreground transition-colors">
                {canceling ? "Canceling…" : "Cancel subscription"}
              </button>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-2 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />{error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-subtle relative">

      <div className="px-6 pt-12 pb-12 max-w-lg mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <img src={logoCircle} alt="Velum" className="w-20 h-20 object-contain mx-auto mb-2" />
            <h1 className="text-display text-[2.4rem] leading-[1.05] font-light mb-3 mt-0">Invest in your<br />nervous system.</h1>
            <p className="text-muted-foreground text-[15px] font-sans font-light">Full access to everything in Velum.</p>
          </div>

          {/* Plans */}
          <div className="flex flex-col gap-3 mb-8">

            {/* LIFETIME */}
            <div className="relative">
              {isFounding && (
                <span className="absolute -top-2.5 left-4 gold-gradient text-primary-foreground text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full tracking-wide z-10">
                  14 remaining
                </span>
              )}
              <button
                onClick={() => handleSubscribe("lifetime")}
                disabled={loading !== null}
                className="velum-card-accent w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
              >
                <div>
                  <p className="text-foreground font-sans font-medium">Lifetime</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Pay once · Every future feature included</p>
                </div>
                <div className="text-right">
                  <p className="text-accent text-2xl font-serif">$199</p>
                  <p className="text-muted-foreground text-xs">one-time</p>
                </div>
              </button>
            </div>

            {/* ANNUAL — 7-day trial */}
            <div className="relative">
              <span className="absolute -top-2.5 left-4 bg-foreground/10 text-foreground text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full tracking-wide z-10 border border-foreground/15">
                7-day free trial
              </span>
              <button
                onClick={() => handleSubscribe("annual")}
                disabled={loading !== null}
                className="velum-card w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
              >
                <div>
                  <p className="text-foreground font-sans font-medium">Annual</p>
                  <p className="text-muted-foreground text-xs mt-0.5">~$8/mo · save 57% vs monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-accent text-2xl font-serif">$99</p>
                  <p className="text-muted-foreground text-xs">/year</p>
                </div>
              </button>
            </div>

            {/* MONTHLY — no trial */}
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
              className="velum-card w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
            >
              <div>
                <p className="text-foreground font-sans font-medium">Monthly</p>
                <p className="text-muted-foreground text-xs mt-0.5">Charged today · Cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-accent text-2xl font-serif">$19</p>
                <p className="text-muted-foreground text-xs">/month</p>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center mb-6">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-6 justify-center">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          <div className="w-full h-px bg-accent/15 mb-8" />

          <div className="mb-10">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase text-center mb-8">
              Everything Included
            </p>
            <div className="flex flex-col">
              {INCLUDED_FEATURES.map((feature, i) => (
                <div key={i} className={`py-6 ${i < INCLUDED_FEATURES.length - 1 ? "border-b border-accent/10" : ""}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-accent text-lg mt-0.5">✓</span>
                    <h3 className="text-foreground text-xl font-serif font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm font-sans font-light leading-relaxed pl-8">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
