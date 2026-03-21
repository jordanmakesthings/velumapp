import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoCircle from "@/assets/logo-circle.png";

export default function OnboardingPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: "monthly" | "lifetime") => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan,
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
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[400px] w-full text-center"
      >
        <img src={logoCircle} alt="Velum" className="w-[52px] h-[52px] object-contain mx-auto mb-3" />
        <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-6">Velum</p>

        <h1 className="text-display text-4xl italic mb-3">Welcome to Velum.</h1>
        <p className="text-muted-foreground text-[15px] font-sans font-light mb-10">
          Full access to everything in Velum.
        </p>

        {/* Monthly Plan */}
        <div className="text-center mb-8">
          <p className="text-display text-5xl text-foreground mb-1">
            $29 <span className="text-muted-foreground text-xl font-sans font-light">/ month</span>
          </p>
          <p className="text-muted-foreground text-sm font-sans font-light mb-4">7-day free trial · Cancel anytime</p>
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={loading}
            className="w-full velum-card p-5 flex items-center justify-between text-left border border-accent/30"
          >
            <span className="text-foreground text-lg font-sans font-semibold">Start Free Trial</span>
            {loading ? (
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            ) : (
              <span className="text-accent text-xl">→</span>
            )}
          </button>
        </div>

        <div className="w-full h-px bg-accent/15 mb-8" />

        {/* Lifetime Plan */}
        <div className="text-center mb-8">
          <p className="text-display text-5xl text-foreground mb-1">
            $299 <span className="text-muted-foreground text-xl font-sans font-light">· One time</span>
          </p>
          <p className="text-muted-foreground text-sm font-sans font-light mb-4">
            Pay once, never think about it again.
          </p>
          <button
            onClick={() => handleCheckout("lifetime")}
            disabled={loading}
            className="w-full velum-card-flat p-5 flex items-center justify-between text-left border border-muted-foreground/20"
          >
            <span className="text-foreground text-lg font-sans font-semibold">Get Lifetime Access</span>
            {loading ? (
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            ) : (
              <span className="text-accent text-xl">→</span>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-6 justify-center">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}
      </motion.div>
    </div>
  );
}
