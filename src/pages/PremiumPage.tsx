import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";

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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const [promoCode, setPromoCode] = useState("");

  const handleSubscribe = () => {
    // Will connect to Stripe via edge function
    console.log("Subscribe:", selectedPlan, promoCode);
  };

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
            <h1 className="text-display text-3xl mb-2">Unlock Full Access</h1>
            <p className="text-ui text-sm">Everything you need to regulate your nervous system.</p>
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
            className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {selectedPlan === "monthly" ? "Start Free Trial" : "Get Lifetime Access"}
          </button>

          <p className="text-center text-muted-foreground text-[10px] font-sans mt-4">
            {selectedPlan === "monthly"
              ? "7-day free trial, then $29/month. Cancel anytime."
              : "One-time payment of $299. Lifetime access."}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
