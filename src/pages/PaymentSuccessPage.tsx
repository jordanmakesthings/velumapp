import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import velumLogo from "@/assets/velum-logo-full.jpg";

const MAX_POLL_MS = 12000;
const POLL_INTERVAL_MS = 1500;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { user, hasAccess, refreshProfile } = useAuth();
  const [message, setMessage] = useState("Confirming your access…");

  // Poll the profile until the Stripe webhook flips subscription_status → active,
  // so the user never lands on /home with a stale profile and gets re-paywalled.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const started = Date.now();

    // Mark onboarding complete defensively (idempotent).
    supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id).then(() => refreshProfile());

    const tick = async () => {
      if (cancelled) return;
      await refreshProfile();
      // refreshProfile updates profile in context — check hasAccess via next effect
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    const timeout = setTimeout(() => {
      if (cancelled) return;
      clearInterval(interval);
      setMessage("Taking longer than expected. Continuing anyway.");
      setTimeout(() => navigate("/home-setup", { replace: true }), 1200);
    }, MAX_POLL_MS);

    return () => { cancelled = true; clearInterval(interval); clearTimeout(timeout); };
  }, [user?.id]);

  // When hasAccess flips true, proceed.
  useEffect(() => {
    if (!hasAccess) return;
    setMessage("You're in. Welcome.");
    const t = setTimeout(() => navigate("/home-setup", { replace: true }), 1200);
    return () => clearTimeout(t);
  }, [hasAccess, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative">
      {/* Ambient green glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full"
             style={{ background: "radial-gradient(circle, hsla(156,51%,16%,0.5) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>

      <img src={velumLogo} alt="Velum" className="w-24 h-24 rounded-2xl object-cover mb-8" />

      <h1 className="text-display text-4xl italic text-foreground text-center mb-4">
        You're in.
      </h1>
      <p className="text-muted-foreground text-sm mb-10">{message}</p>

      <div className="w-8 h-8 relative">
        <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" style={{ animationDuration: "1.2s" }} />
      </div>

      <button
        onClick={() => navigate("/home-setup", { replace: true })}
        className="mt-10 text-xs text-muted-foreground/70 underline underline-offset-4 hover:text-foreground transition-colors"
      >
        Skip →
      </button>
    </div>
  );
}
