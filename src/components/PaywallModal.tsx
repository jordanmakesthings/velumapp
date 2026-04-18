import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Loader2, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoLotus from "@/assets/logo-lotus.jpg";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  "Full meditation & breathwork library",
  "EFT tapping, bilateral & somatic tools",
  "All courses & Mastery Classes",
  "Progress tracking & journal",
];

const PLANS = [
  {
    key: "annual" as const,
    label: "Annual",
    badge: "Best value",
    price: "$99",
    sub: "/year",
    note: "~$8/mo · save 57%",
    highlight: true,
  },
  {
    key: "monthly" as const,
    label: "Monthly",
    badge: null,
    price: "$19",
    sub: "/month",
    note: "Cancel anytime",
    highlight: false,
  },
  {
    key: "lifetime" as const,
    label: "Lifetime",
    badge: "Founding",
    price: "$199",
    sub: "one-time",
    note: "Every future update included",
    highlight: false,
  },
];

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual" | "lifetime">("annual");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCheckout = async () => {
    if (!session) { onClose(); navigate("/signup"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          returnUrl: window.location.origin,
          customerEmail: session.user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
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

        <div className="flex flex-col items-center mb-5">
          <img src={logoLotus} alt="Velum" className="w-10 h-10 rounded-xl object-cover mb-4" />
          <h3 className="text-foreground font-serif text-2xl text-center">Unlock Full Access</h3>
          <p className="text-muted-foreground text-xs mt-1 text-center">Your trial has ended — continue your practice.</p>
        </div>

        {/* Plan selector */}
        <div className="flex flex-col gap-2 mb-5">
          {PLANS.map((plan) => (
            <button
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative velum-card p-4 text-left transition-all ${
                selectedPlan === plan.key
                  ? "!border-accent/60 shadow-[0_0_30px_rgba(201,168,76,0.2)]"
                  : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2 left-4 gold-gradient text-primary-foreground text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full tracking-wide">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-sans font-medium">{plan.label}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">{plan.note}</p>
                </div>
                <div className="text-right">
                  <span className="text-display text-xl text-accent">{plan.price}</span>
                  <span className="text-muted-foreground text-xs"> {plan.sub}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-5">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-foreground text-sm font-sans">{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Continue with {PLANS.find(p => p.key === selectedPlan)?.label}</>}
        </button>

        <button onClick={onClose} className="w-full text-center text-muted-foreground text-xs font-sans mt-3 hover:text-foreground transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}
