import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import VelumMark from "@/components/VelumMark";

// Words that cycle through the signup hero ("the ultimate tool for your X").
// Each one is a layer Velum actually addresses — keeps the promise honest.
const ROTATING_WORDS = ["mind", "body", "nervous system"];

function RotatingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setIdx(i => (i + 1) % ROTATING_WORDS.length), 2500);
    return () => clearInterval(tick);
  }, []);
  return (
    <span className="inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={ROTATING_WORDS[idx]}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="italic text-accent inline-block"
        >
          {ROTATING_WORDS[idx]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
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
    const prefill = params.get("email");
    if (prefill) setEmail(prefill.trim());
  }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        // Validate required signup fields (passwordless flow — we generate
        // the password silently below).
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        if (phone.trim().length < 7) {
          setError("Phone number is required so we can support you if anything breaks.");
          setLoading(false);
          return;
        }
        try {
          const { rdtTrack } = await import("@/lib/reddit-pixel");
          rdtTrack("Lead", { email });
        } catch {}
        try {
          const { fbqTrack } = await import("@/lib/meta-pixel");
          fbqTrack("Lead");
        } catch {}
        // Auto-generate a strong password — user never sees it. They can set
        // one later via "Forgot password" if they want one. Future logins
        // typically happen via magic link (TODO: add magic link to /login).
        const autoPassword = crypto.randomUUID() + "Aa1!";
        const { error } = await signUp(email, autoPassword, fullName.trim(), phone.trim());
        if (error) throw error;
        try { localStorage.setItem("velum_has_account", "1"); } catch {}
        // If they came from a lead-magnet OTO with ?plan= preselected, jump
        // straight to /premium with the plan param so it auto-triggers checkout.
        // Otherwise honor ?next= (set by ProtectedRoute redirect), else onboarding.
        const params = new URLSearchParams(window.location.search);
        const planParam = params.get("plan");
        const nextParam = params.get("next");
        if (planParam && ["monthly","annual","lifetime"].includes(planParam)) {
          navigate(`/premium?plan=${planParam}`);
        } else if (nextParam && nextParam.startsWith("/")) {
          navigate(nextParam);
        } else {
          navigate("/onboarding");
        }
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        try { localStorage.setItem("velum_has_account", "1"); } catch {}
        // Honor ?next= so users redirected from /premium (or any protected
        // route) land where they were originally trying to go after login.
        const nextParam = new URLSearchParams(window.location.search).get("next");
        navigate(nextParam && nextParam.startsWith("/") ? nextParam : "/home");
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

        {/* Brand lockup — tight to the card */}
        <div className="flex justify-center mb-5">
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

          {/* Headline — Cormorant editorial */}
          <h2 className="text-display text-4xl md:text-[2.6rem] leading-[1.05] text-center mb-7">
            {mode === "signup" && <>The ultimate tool<br />for your<br /><RotatingWord /></>}
            {mode === "login" && <>Welcome<br /><span className="italic text-accent">back.</span></>}
            {mode === "forgot" && <>Reset your<br /><span className="italic text-accent">password.</span></>}
          </h2>

          {/* Subheader — only for login/forgot. Signup headline stands on its own. */}
          {mode !== "signup" && (
            <p className="text-foreground/85 text-[15px] font-sans text-center mb-7 max-w-[340px] mx-auto leading-relaxed">
              {mode === "login" && "Return to where you left off."}
              {mode === "forgot" && "We'll send you a reset link."}
            </p>
          )}

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
              {/* SIGNUP: 3 fields only — full name, email, phone. Passwordless. */}
              {mode === "signup" && (
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Full name"
                  required
                  autoComplete="name"
                  className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
              />
              {mode === "signup" && (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                  autoComplete="tel"
                  className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
                />
              )}
              {/* LOGIN / FORGOT: keep password field for existing users.
                  New signups never see this — they're passwordless. */}
              {mode === "login" && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 pr-12 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/60 hover:text-accent transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {error && <p className="text-destructive text-xs font-sans text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-[0_0_30px_rgba(201,168,76,0.25)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    {mode === "signup" && "Create Free Account →"}
                    {mode === "login" && "Sign in →"}
                    {mode === "forgot" && "Send reset link"}
                  </>
                )}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-accent/90 text-sm font-sans hover:text-accent self-center mt-3 underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

        </div>

        {/* Mode switches — outside the card, quieter */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {mode === "signup" && (
            <p className="text-foreground/70 text-sm font-sans">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-accent hover:underline underline-offset-2">Sign in</button>
            </p>
          )}
          {mode === "login" && (
            <p className="text-foreground/70 text-sm font-sans">
              No account?{" "}
              <button onClick={() => setMode("signup")} className="text-accent hover:underline underline-offset-2">Create Free Account</button>
            </p>
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
