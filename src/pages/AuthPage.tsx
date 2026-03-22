import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import logoLotus from "@/assets/logo-lotus.jpg";

type Mode = "login" | "signup" | "magic-link" | "forgot-password";

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/home");
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) throw error;
        setMessage("Check your email for a confirmation link.");
      } else if (mode === "magic-link") {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMessage("Check your email for a sign-in link.");
      } else if (mode === "forgot-password") {
        const { default: supabase } = await import("@/integrations/supabase/client").then((m) => ({ default: m.supabase }));
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setMessage("Check your email for a password reset link.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src={logoLotus} alt="Velum" className="w-12 h-12 rounded-xl object-cover mx-auto mb-4" />
          <h1 className="text-display text-3xl mb-1">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "magic-link" && "Sign in with email"}
            {mode === "forgot-password" && "Reset password"}
          </h1>
          <p className="text-ui text-sm text-accent">
            {mode === "login" && "Return to your practice."}
            {mode === "signup" && "Begin your journey."}
            {mode === "magic-link" && "We'll send you a link."}
            {mode === "forgot-password" && "We'll send you a reset link."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" &&
          <>
              <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}

              className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 text-accent" placeholder="Full Name" />
              <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}

              className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 text-accent"
              style={{ fontSize: "16px" }} placeholder="Phone number" />
            </>
          }

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30" />

          {(mode === "login" || mode === "signup") &&
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30" />
          }

          {mode === "login" &&
          <button
            type="button"
            onClick={() => setMode("forgot-password")}
            className="text-right text-accent text-xs font-sans -mt-2">
              Forgot password?
            </button>
          }

          {error &&
          <p className="text-destructive text-xs font-sans text-center">{error}</p>
          }
          {message &&
          <p className="text-accent text-xs font-sans text-center">{message}</p>
          }

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ?
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> :
            <>
                {mode === "login" && "Sign in"}
                {mode === "signup" && "Create account"}
                {mode === "magic-link" && <><Mail className="w-4 h-4" /> Send magic link</>}
                {mode === "forgot-password" && "Send reset link"}
              </>
            }
          </button>
        </form>

        {/* Social divider */}
        {(mode === "login" || mode === "signup") &&
        <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-muted-foreground/20" />
              <span className="text-muted-foreground text-xs font-sans">or continue with</span>
              <div className="flex-1 h-px bg-muted-foreground/20" />
            </div>

            <div className="flex gap-3">
              <button
              type="button"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin
                });
                if (error) setError(error.message || "Google sign-in failed");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans hover:ring-1 hover:ring-accent/30 transition-all">
              
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Google
              </button>

              <button
              type="button"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin
                });
                if (error) setError(error.message || "Apple sign-in failed");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans hover:ring-1 hover:ring-accent/30 transition-all">
              
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                Apple
              </button>
            </div>
          </>
        }

        {/* Alternative modes */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {mode !== "magic-link" && mode !== "forgot-password" &&
          <button
            onClick={() => setMode("magic-link")}
            className="text-muted-foreground text-xs font-sans hover:text-foreground transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Sign in with magic link
            </button>
          }

          {mode === "login" &&
          <p className="text-muted-foreground text-xs font-sans">
              No account?{" "}
              <button onClick={() => setMode("signup")} className="text-accent hover:underline">
                Sign up
              </button>
            </p>
          }

          {mode === "signup" &&
          <p className="text-muted-foreground text-xs font-sans">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-accent hover:underline">
                Sign in
              </button>
            </p>
          }

          {(mode === "magic-link" || mode === "forgot-password") &&
          <button
            onClick={() => setMode("login")}
            className="text-accent text-xs font-sans hover:underline">
              Back to sign in
            </button>
          }
        </div>
      </div>

      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-[0.05]" />
      </div>
    </div>);

}