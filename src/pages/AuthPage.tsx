import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import logoCircle from "@/assets/logo-circle.png";

type Mode = "signup" | "login" | "forgot";

const VALUE_PROPS = [
  "EFT tapping, personalised by AI",
  "Breathwork, bilateral & somatic tools",
  "Courses, Mastery Classes & guided journal",
  "7 days free · No credit card required",
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
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
        if (!termsAccepted) { setError("Please accept the terms to continue."); setLoading(false); return; }
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        navigate("/onboarding");
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">

      {/* Left — brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-[420px] flex-shrink-0 border-r border-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(155,52%,10%)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative">
          <img src={logoCircle} alt="Velum" className="w-10 h-10 object-contain mb-10" />
          <p className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase mb-6">Velum</p>
          <h2 className="text-display text-4xl leading-tight mb-6">
            Regulate.<br />
            <span className="italic text-accent">Rewire.</span><br />
            Rise.
          </h2>
          <p className="text-muted-foreground text-sm font-sans leading-relaxed max-w-[280px]">
            Real-time tools to move your nervous system out of survival mode — and into the version of you that's actually possible.
          </p>
        </div>
        <div className="relative flex flex-col gap-3">
          {VALUE_PROPS.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-accent text-xs">✓</span>
              <span className="text-muted-foreground text-xs font-sans">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-screen lg:min-h-0">

        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <img src={logoCircle} alt="Velum" className="w-10 h-10 object-contain mx-auto mb-3" />
          <p className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase">Velum</p>
        </div>

        <div className="w-full max-w-sm">

          {/* Referral banner — takes priority over trial badge */}
          {mode === "signup" && referrerCode && (
            <div className="flex items-center gap-2 gold-gradient rounded-full px-4 py-2 mb-4 w-fit mx-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              <span className="text-primary-foreground text-[10px] font-sans font-semibold tracking-[2px] uppercase">You were invited · Both get 1 free month</span>
            </div>
          )}

          {/* Trial badge — signup only */}
          {mode === "signup" && !referrerCode && (
            <div className="flex items-center gap-2 bg-accent/8 border border-accent/20 rounded-full px-4 py-2 mb-8 w-fit mx-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase">7 days free · No credit card</span>
            </div>
          )}

          <h1 className="text-display text-3xl mb-2 text-center">
            {mode === "signup" && "Begin your practice."}
            {mode === "login" && "Welcome back."}
            {mode === "forgot" && "Reset your password."}
          </h1>
          <p className="text-muted-foreground text-sm font-sans text-center mb-8">
            {mode === "signup" && "Create your account. It takes 30 seconds."}
            {mode === "login" && "Return to where you left off."}
            {mode === "forgot" && "We'll send you a reset link."}
          </p>

          {sent ? (
            <div className="text-center py-8">
              <p className="text-accent text-sm font-sans mb-2">Check your inbox.</p>
              <p className="text-muted-foreground text-xs font-sans">We sent a reset link to {email}.</p>
              <button onClick={() => { setMode("login"); setSent(false); }} className="mt-6 text-accent text-xs font-sans underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handle} className="flex flex-col gap-3">
              {mode === "signup" && (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  required
                  className="w-full bg-card border border-foreground/10 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/40"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-card border border-foreground/10 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/40"
              />
              {mode !== "forgot" && (
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  required
                  minLength={6}
                  className="w-full bg-card border border-foreground/10 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40 transition-colors placeholder:text-muted-foreground/40"
                />
              )}

              {/* T&C — signup only */}
              {mode === "signup" && (
                <button
                  type="button"
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className="flex items-start gap-3 text-left mt-1"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-all flex items-center justify-center ${
                    termsAccepted ? "border-accent bg-accent" : "border-muted-foreground/30"
                  }`}>
                    {termsAccepted && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#0d0d0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs font-sans leading-relaxed">
                    I understand Velum is for educational and wellness purposes only — not a substitute for professional mental health treatment.
                  </p>
                </button>
              )}

              {error && <p className="text-destructive text-xs font-sans text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {mode === "signup" && "Start Free Trial →"}
                    {mode === "login" && "Sign in →"}
                    {mode === "forgot" && "Send reset link"}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode switches */}
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

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(155,52%,10%)_0%,transparent_65%)] opacity-40" />
      </div>
    </div>
  );
}
