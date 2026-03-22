import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import velumLogo from "@/assets/velum-logo-full.jpg";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .then(() => refreshProfile())
      .then(() => setReady(true));
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      navigate("/home-setup", { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [ready, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <img src={velumLogo} alt="Velum" className="w-28 h-28 rounded-2xl object-cover mb-8" />
      <h1 className="text-display text-4xl italic text-foreground text-center mb-10">
        You're in. Welcome to Velum.
      </h1>
      <button
        onClick={() => navigate("/home-setup", { replace: true })}
        className="w-full max-w-[360px] h-14 rounded-full gold-gradient text-primary-foreground text-[15px] font-sans font-bold tracking-wide active:scale-[0.98] transition-transform"
      >
        Continue →
      </button>
    </div>
  );
}
