import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Loader2, Shield, Infinity, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FEATURES = [
  "Full library of meditations, breathwork & EFT sessions",
  "Multi-week deep training programs",
  "New content added regularly",
  "Track your progress and streaks",
  "Priority access to new features",
  "Support the mission of accessible healing",
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-3xl gold-gradient flex items-center justify-center mx-auto mb-6"
          >
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
              Your subscription will cancel at the end of the current billing period. You'll retain full access until then.
            </div>
          ) : isCanceling ? (
            <div className="velum-card-flat p-4 text-sm text-muted-foreground">
              Your subscription is set to cancel at the end of the billing period.
            </div>
          ) : !isLifetime && (
            <div className="mt-4">
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {canceling ? "Canceling..." : "Cancel subscription"}
              </button>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-2 justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
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
      {/* Header */}
      <div className="fixed top-0 inset-x-0 z-50 flex items-center px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 pt-20 pb-12 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6"
            >
              <Crown className="w-7 h-7 text-primary-foreground" />
            </motion.div>
            <h1 className="text-display text-3xl mb-2">Invest in your<br /><span className="text-accent">nervous system</span></h1>
            <p className="text-ui text-sm">Unlock the full library of meditations, breathwork, and EFT tapping practices designed for deep transformation.</p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-2 gap-3 mb-8">
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
              <p className="text-display text-3xl text-accent">$29</p>
              <p className="text-ui text-xs">/month</p>
              <div className="mt-3 px-2 py-1 rounded-md bg-accent/10 inline-block">
                <p className="text-accent text-[10px] font-sans font-medium">7-day free trial</p>
              </div>
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
              <p className="text-display text-3xl text-accent">$299</p>
              <p className="text-ui text-xs">one-time</p>
              <div className="mt-3 px-2 py-1 rounded-md bg-accent/10 inline-block">
                <p className="text-accent text-[10px] font-sans font-medium">Forever access</p>
              </div>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-4 justify-center">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Features */}
          <div className="velum-card p-6 mb-8">
            <p className="text-ui text-xs tracking-wide uppercase mb-4">Everything included</p>
            <div className="flex flex-col gap-3.5">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-foreground text-sm font-sans">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Promo code */}
          <div className="mb-6">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Promo code"
              className="w-full bg-card rounded-xl px-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 text-center tracking-widest"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {selectedPlan === "monthly" ? "Start Free Trial" : "Get Lifetime Access"}
              </>
            )}
          </button>

          <p className="text-center text-muted-foreground text-[10px] font-sans mt-4">
            {selectedPlan === "monthly"
              ? "Free for 7 days, then $29/month. Cancel anytime."
              : "One-time payment of $299. Lifetime access."}
          </p>

          {/* Trust */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Secure payment
            </span>
            <span className="flex items-center gap-1.5">
              <Infinity className="w-3.5 h-3.5" />
              Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
