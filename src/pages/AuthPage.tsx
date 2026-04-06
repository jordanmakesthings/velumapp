import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
              style={{ fontSize: "16px" }} placeholder="Phone Number" />
            </>
          }

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 text-accent" />

          {(mode === "login" || mode === "signup") &&
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-card rounded-xl px-4 py-3.5 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 text-accent" />
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