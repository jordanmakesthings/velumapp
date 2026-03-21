import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .then(() => refreshProfile());

    const timer = setTimeout(() => {
      navigate("/home", { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, navigate, refreshProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#111111" }}>
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic",
          color: "#F2EFE7",
          fontSize: "2.25rem",
          textAlign: "center",
        }}
      >
        You're in. Welcome to Velum.
      </h1>
    </div>
  );
}
