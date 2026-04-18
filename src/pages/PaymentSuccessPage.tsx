import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VelumMark from "@/components/VelumMark";

const MAX_POLL_MS = 12000;
const POLL_INTERVAL_MS = 1500;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { user, hasAccess, refreshProfile } = useAuth();
  const [message, setMessage] = useState("Confirming your access…");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id).then(() => refreshProfile());

    const tick = async () => {
      if (cancelled) return;
      await refreshProfile();
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

  useEffect(() => {
    if (!hasAccess) return;
    setMessage("You're in. Welcome.");
    const t = setTimeout(() => navigate("/home-setup", { replace: true }), 1200);
    return () => clearTimeout(t);
  }, [hasAccess, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Ambient green glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(156,51%,14%,0.55) 0%, transparent 60%)", filter: "blur(20px)" }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(42,53%,35%,0.12) 0%, transparent 60%)", filter: "blur(40px)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="velum-card-accent p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <VelumMark variant="lotus" size="lg" />
          </div>

          <p className="text-eyebrow mb-3">Welcome</p>
          <h2 className="text-display text-[2rem] leading-[1.1] mb-4">
            You're
            <br />
            <span className="italic text-accent">in.</span>
          </h2>

          <p className="text-muted-foreground text-sm font-sans mb-8 max-w-[320px] mx-auto leading-relaxed">
            {message}
          </p>

          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin"
                style={{ animationDuration: "1.2s" }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate("/home-setup", { replace: true })}
            className="text-muted-foreground/70 text-xs font-sans underline underline-offset-2 hover:text-muted-foreground"
          >
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}
