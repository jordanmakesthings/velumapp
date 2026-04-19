import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import VelumMark from "@/components/VelumMark";

type Mode = "signup" | "login" | "forgot";

function resolveInitialMode(pathname: string): Mode {
  if (pathname.startsWith("/login") || pathname.startsWith("/signin")) return "login";
  if (pathname.startsWith("/signup")) return "signup";
  try {
    if (localStorage.getItem("velum_has_account") === "1") return "login";
  } catch {}
  return "signup";
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>(() => resolveInitialMode(location.pathname));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("velum_ref", ref.trim());
      setReferrerCode(ref.trim());
    } else {
      const stored = localStorage.getItem("velum_ref");
      if (stored) setReferrerCode(stored);
    }
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) throw error;
        try { localStorage.setItem("velum_has_account", "1"); } catch {}
        navigate("/onboarding");
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        try { localStorage.setItem("velum_has_account", "1"); } catch {}
        navigate("/home");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12">

      {/* Ambient green glow — the mysterious forest-at-night feel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
             style={{ background: "radial-gradient(circle, hsla(156,51%,14%,0.55) 0%, transparent 60%)", filter: "blur(20px)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
             style={{ background: "radial-gradient(circle, hsla(42,53%,35%,0.12) 0%, transparent 60%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* Brand lockup */}
        <div className="flex justify-center mb-10">
          <VelumMark variant="lockup" size="md" />
        </div>

        {/* Referral banner */}
        {mode === "signup" && referrerCode && (
          <div className="flex items-center gap-2 gold-gradient rounded-full px-4 py-2 mb-6 w-fit mx-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
            <span className="text-primary-foreground text-[10px] font-semibold tracking-[2px] uppercase">Invited · Both get 1 free month</span>
          </div>
        )}

        {/* Green card — the container for everything */}
        <div className="velum-card-accent p-8 md:p-10">

          {/* Eyebrow */}
          {mode === "signup" && !referrerCode && (
            <p className="text-eyebrow text-center mb-5">Regulate your body in 60 seconds</p>
          )}

          {/* Headline — Cormorant editorial */}
          <h2 className="text-display text-4xl md:text-[2.6rem] leading-[1.05] text-center mb-3">
            {mode === "signup" && <>Regulate your<br /><span className="italic text-accent">nervous system.</span></>}
            {mode === "login" && <>Welcome<br /><span className="italic text-accent">back.</span></>}
            {mode === "forgot" && <>Reset your<br /><span className="italic text-accent">password.</span></>}
          </h2>

          <p className="text-muted-foreground text-sm font-sans text-center mb-7 max-w-[320px] mx-auto leading-relaxed">
            {mode === "signup" && "Real-time tools to move your body out of survival mode — in under 60 seconds."}
            {mode === "login" && "Return to where you left off."}
            {mode === "forgot" && "We'll send you a reset link."}
          </p>

          {sent ? (
            <div className="text-center py-4">
              <p className="text-accent text-sm font-sans mb-2">Check your inbox.</p>
              <p className="text-muted-foreground text-xs font-sans">We sent a reset link to {email}.</p>
              <button onClick={() => { setMode("login"); setSent(false); }} className="mt-6 text-accent text-xs font-sans underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handle} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
              />
              {mode !== "forgot" && (
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  required
                  minLength={6}
                  className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
                />
              )}

              {error && <p className="text-destructive text-xs font-sans text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_0_30px_rgba(201,168,76,0.25)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {mode === "signup" && "Begin →"}
                    {mode === "login" && "Sign in →"}
                    {mode === "forgot" && "Send reset link"}
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Mode switches — outside the card, quieter */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {mode === "signup" && (
            <p className="text-muted-foreground text-xs font-sans">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-accent hover:underline underline-offset-2">Sign in</button>
            </p>
          )}
          {mode === "login" && (
            <>
              <p className="text-muted-foreground text-xs font-sans">
                No account?{" "}
                <button onClick={() => setMode("signup")} className="text-accent hover:underline underline-offset-2">Start free trial</button>
              </p>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground/60 text-xs font-sans hover:text-muted-foreground">
                Forgot password?
              </button>
            </>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("login")} className="text-accent text-xs font-sans hover:underline underline-offset-2">
              Back to sign in
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
