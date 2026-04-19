import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type VerifyType = "recovery" | "signup" | "invite" | "magiclink" | "email_change" | "email";

const DESTINATION: Record<string, string> = {
  recovery: "/reset-password",
  signup: "/home",
  invite: "/home",
  magiclink: "/home",
  email_change: "/profile",
  email: "/home",
};

export default function AuthConfirmPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = (params.get("type") as VerifyType) || "magiclink";
    const redirectTo = params.get("redirect_to");

    if (!tokenHash) {
      setError("Missing or invalid link.");
      return;
    }

    (async () => {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) {
        setError(error.message);
        return;
      }
      navigate(redirectTo || DESTINATION[type] || "/home", { replace: true });
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        {error ? (
          <>
            <h1 className="text-display text-2xl mb-2">Link issue</h1>
            <p className="text-ui text-sm mb-6 text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="py-3 px-6 rounded-xl gold-gradient text-primary-foreground font-sans text-sm"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="text-display text-2xl mb-2">Confirming…</h1>
            <p className="text-ui text-sm text-muted-foreground">One moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
