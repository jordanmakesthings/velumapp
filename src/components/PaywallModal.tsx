import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoLotus from "@/assets/logo-lotus.jpg";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  "Full meditation & breathwork library",
  "Interactive breathwork tool",
  "Courses & MasteryClasses",
  "Progress tracking & journal",
];

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime" | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    if (!session) {
      onClose();
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: selectedPlan, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative velum-card w-full max-w-md mx-4 mb-4 sm:mb-0 p-6 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        {/* Logo + heading */}
        <div className="flex flex-col items-center mb-5">
          <img src={logoLotus} alt="Velum" className="w-10 h-10 rounded-xl object-cover mb-4" />
          <h3 className="text-foreground font-serif text-2xl text-center">Unlock Full Access</h3>
          <p className="text-ui text-xs mt-1">Full access to everything in Velum</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`velum-card-flat p-4 text-left transition-all ${
              selectedPlan === "monthly" ? "ring-1 ring-accent/50" : ""
            }`}
          >
            <p className="text-foreground text-xs font-sans font-medium mb-0.5">Monthly</p>
            <p className="text-display text-2xl text-accent">$29</p>
            <p className="text-ui text-[10px]">/month</p>
          </button>

          <button
            onClick={() => setSelectedPlan("lifetime")}
            className={`velum-card-flat p-4 text-left transition-all ${
              selectedPlan === "lifetime" ? "ring-1 ring-accent/50" : ""
            }`}
          >
            <p className="text-foreground text-xs font-sans font-medium mb-0.5">Lifetime</p>
            <p className="text-display text-2xl text-accent">$299</p>
            <p className="text-ui text-[10px]">one-time</p>
          </button>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-5">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-accent" />
              <span className="text-foreground text-sm font-sans">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {selectedPlan && (
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Begin My Journey
              </>
            )}
          </button>
        )}

        <p className="text-center text-muted-foreground text-[10px] font-sans mt-3">
          {selectedPlan === "lifetime"
            ? "One time payment"
            : "Cancel anytime"}
        </p>

        <button onClick={onClose} className="w-full text-center text-muted-foreground text-xs font-sans mt-3 hover:text-foreground transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}
