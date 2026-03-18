import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Loader2, Shield, Infinity, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const isPremium = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
  const isLifetime = profile?.subscription_plan === "lifetime";
  const isCanceling = profile?.subscription_status === "canceling";

  const handleSubscribe = async () => {
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan: selectedPlan,
          promoCode: promoCode || undefined,
          returnUrl: window.location.origin,
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
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setCanceling(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-webhook", {
        body: { action: "cancel" },
      });
      if (error) throw error;
      setCancelSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Could not cancel subscription.");
    } finally {
      setCanceling(false);
    }
  };

  // Already premium view
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
          <h1 className="text-display text-3xl mb-3">You're Premium</h1>
          <p className="text-ui text-sm mb-2">You have full access to everything in Velum.</p>
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
          {/* Logo + Hero */}
          <div className="text-center mb-10">
            <img src={logoCircle} alt="Velum" className="w-[52px] h-[52px] object-contain mx-auto mb-3" />
            <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-6">Velum</p>
            <h1 className="text-display text-4xl italic mb-3">Final Step.</h1>
            <p className="text-muted-foreground text-[15px] font-sans font-light">
              Full access to everything in Velum. Free for 7 days.
            </p>
          </div>

          {/* Monthly Plan */}
          <div className="text-center mb-10">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase mb-3">Most Popular</p>
            <p className="text-display text-6xl text-foreground mb-1">$29 <span className="text-muted-foreground text-xl font-sans font-light">/ month</span></p>
            <p className="text-muted-foreground text-sm font-sans font-light mb-5">Start free for 7 days · Cancel anytime</p>
            <button
              onClick={() => { setSelectedPlan("monthly"); handleSubscribe(); }}
              disabled={loading}
              className="w-full velum-card p-5 flex items-center justify-between text-left border border-accent/30 mb-2"
            >
              <span className="text-foreground text-lg font-sans font-semibold">Start Free Trial</span>
              <span className="text-accent text-xl">→</span>
            </button>
            <p className="text-muted-foreground/50 text-xs font-sans">7 days free then $29/mo · Cancel anytime</p>
          </div>

          <div className="w-full h-px bg-accent/15 mb-10" />

          {/* Lifetime Plan */}
          <div className="text-center mb-10">
            <p className="text-accent text-sm font-sans font-medium mb-2">● Only 16 spots remaining</p>
            <p className="text-display text-6xl text-foreground mb-1">$299 <span className="text-muted-foreground text-xl font-sans font-light">· One time</span></p>
            <p className="text-muted-foreground text-sm font-sans font-light leading-relaxed mb-5">
              Every course. Every tool. Every future update.<br />
              Pay once, never think about it again.
            </p>
            <button
              onClick={() => { setSelectedPlan("lifetime"); handleSubscribe(); }}
              disabled={loading}
              className="w-full velum-card-flat p-5 flex items-center justify-between text-left border border-muted-foreground/20 mb-2"
            >
              <span className="text-foreground text-lg font-sans font-semibold">Claim Founding Member Access</span>
              <span className="text-accent text-xl">→</span>
            </button>
          </div>

          {/* Promo code */}
          <div className="text-center mb-10">
            <button
              onClick={() => {
                const code = prompt("Enter your promo code:");
                if (code) setPromoCode(code.toUpperCase());
              }}
              className="text-accent text-sm font-sans hover:underline underline-offset-2"
            >
              Have a code? Apply it here →
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-6 justify-center">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          <div className="w-full h-px bg-accent/15 mb-8" />

          {/* Everything Included */}
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
