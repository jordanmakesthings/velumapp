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
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 inset-x-0 z-50 flex items-center px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-20 pb-12 max-w-lg mx-auto text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center mx-auto mb-6">
            <Crown className="w-9 h-9 text-primary-foreground" />
          </motion.div>
          <h1 className="text-display text-3xl mb-3">You Have Full Access</h1>
          <p className="text-ui text-sm mb-2">You have access to everything in Velum.</p>
          {profile?.subscription_plan && (
            <p className="text-ui text-xs mb-6 capitalize">
              Plan: {profile.subscription_plan} · Status: {profile.subscription_status}
            </p>
          )}
          {cancelSuccess ? (
            <div className="velum-card p-4 text-sm text-muted-foreground">
              Your subscription will cancel at the end of the current billing period.
            </div>
          ) : isCanceling ? (
            <div className="velum-card-flat p-4 text-sm text-muted-foreground">
              Your subscription is set to cancel at the end of the billing period.
            </div>
          ) : !isLifetime && (
            <div className="mt-4">
              <button onClick={handleCancel} disabled={canceling}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                {canceling ? "Canceling..." : "Cancel subscription"}
              </button>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-2 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />{error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pt-12 pb-12 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <img src={logoCircle} alt="Velum" className="w-[52px] h-[52px] object-contain mx-auto mb-3" />
            <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-6">Velum</p>
            <h1 className="text-display text-4xl italic mb-3">Invest in Your Nervous System.</h1>
            <p className="text-muted-foreground text-[15px] font-sans font-light">Full access to everything in Velum.</p>
          </div>

          {/* Plans */}
          <div className="flex flex-col gap-3 mb-8">

            {/* LIFETIME — FOUNDING */}
            <div className="relative">
              {isFounding && (
                <span className="absolute -top-2.5 left-4 gold-gradient text-primary-foreground text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full tracking-wide z-10">
                  Founding — {foundingLeft} left
                </span>
              )}
              <button
                onClick={() => handleSubscribe("lifetime")}
                disabled={loading !== null}
                className="w-full p-5 rounded-xl text-left transition-all border border-accent bg-accent/8 hover:border-accent flex items-center justify-between disabled:opacity-70"
              >
                <div>
                  <p className="text-foreground font-sans font-medium">Lifetime</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {isFounding ? "Pay once · Every future feature included" : "Pay once · Every future feature included"}
                  </p>
                </div>
                <div className="text-right">
                  {isFounding ? (
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-muted-foreground text-sm line-through">$299</span>
                      <span className="text-accent text-2xl font-serif">$199</span>
                    </div>
                  ) : (
                    <p className="text-accent text-2xl font-serif">$299</p>
                  )}
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
                className="w-full p-5 rounded-xl text-left transition-all border border-foreground/15 bg-card hover:border-foreground/25 flex items-center justify-between disabled:opacity-70"
              >
                <div>
                  <p className="text-foreground font-sans font-medium">Annual</p>
                  <p className="text-muted-foreground text-xs mt-0.5">~$12/mo · save 57% vs monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-accent text-2xl font-serif">$149</p>
                  <p className="text-muted-foreground text-xs">/year</p>
                </div>
              </button>
            </div>

            {/* MONTHLY — no trial */}
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
              className="w-full p-5 rounded-xl text-left transition-all border border-foreground/10 bg-card hover:border-foreground/20 flex items-center justify-between disabled:opacity-70"
            >
              <div>
                <p className="text-foreground font-sans font-medium">Monthly</p>
                <p className="text-muted-foreground text-xs mt-0.5">Charged today · Cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-accent text-2xl font-serif">$29</p>
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
