import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Check, Mail } from "lucide-react";
import VelumMark from "@/components/VelumMark";
import { useAuth } from "@/contexts/AuthContext";

// Post-Stripe-payment landing page. The user has just paid (or upgraded an
// existing account via a Stripe Payment Link). We don't want to make them
// remember a password to access what they just bought, so we auto-send a
// magic-link login email to whatever email Stripe captured at checkout.
//
// Stripe Payment Link should redirect here with: /welcome-back?email={X}
// (Stripe's prefilled_email or session-customer-email pattern.) If no email
// is in the URL, we fall back to a manual email input.

export default function WelcomeBackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signInWithMagicLink, session } = useAuth();
  const [email, setEmail] = useState(params.get("email")?.trim() || "");
  const [phase, setPhase] = useState<"sending" | "sent" | "needs_email" | "error">(
    params.get("email") ? "sending" : "needs_email"
  );
  const [error, setError] = useState("");

  // If they're already logged in (e.g. came back to this page mid-session),
  // just send them straight to /home — no need for magic link.
  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  // Auto-send magic link on mount if we have an email from the URL.
  useEffect(() => {
    if (phase !== "sending" || !email) return;
    (async () => {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setError(error.message || "Couldn't send the login link. Try again?");
        setPhase("error");
      } else {
        setPhase("sent");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setPhase("sending");
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setError(error.message || "Couldn't send. Try again?");
      setPhase("error");
    } else {
      setPhase("sent");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#F2EFE7] flex flex-col">
      <header className="px-6 py-5 flex items-center gap-3">
        <VelumMark className="w-8 h-8 text-[#C9A84C]" />
        <span className="font-serif tracking-[0.4em] text-sm text-[#F2EFE7]/80">V E L U M</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">
            Welcome to Velum forever
          </p>

          {phase === "sending" && (
            <>
              <h1 className="font-serif text-3xl md:text-4xl mb-4 leading-tight">
                Sending your one-tap login…
              </h1>
              <p className="text-sm text-[#c8c4bb] mb-10 font-sans">
                Hang tight — this takes a couple seconds.
              </p>
              <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C] mx-auto" />
            </>
          )}

          {phase === "sent" && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/40 flex items-center justify-center mx-auto mb-6">
                <Check className="w-6 h-6 text-[#C9A84C]" strokeWidth={2.5} />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl mb-4 leading-tight">
                Check your email.
              </h1>
              <p className="text-sm text-[#c8c4bb] leading-relaxed mb-3 font-sans">
                We just sent a one-tap login link to:
              </p>
              <p className="font-sans font-medium text-[#F2EFE7] mb-8">{email}</p>
              <p className="text-[13px] text-[#9aaea3] leading-relaxed mb-8 font-sans">
                Click the link in the email and you'll be inside Velum — no
                password needed. Your purchase is already attached to this email.
              </p>
              <p className="text-[12px] text-[#7a8a82] font-sans">
                Don't see it? Check spam, or wait 60 seconds and refresh your inbox.
              </p>
            </>
          )}

          {phase === "needs_email" && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/40 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl mb-3 leading-tight">
                Welcome back.
              </h1>
              <p className="text-sm text-[#c8c4bb] leading-relaxed mb-8 font-sans">
                Enter the email you used at checkout — we'll send you a one-tap
                login link. No password needed.
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoFocus
                  autoComplete="email"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans"
                />
                {error && <p className="text-sm text-[#c97c5c]">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-[#C9A84C] text-[#0d0d0d] rounded py-4 font-sans font-semibold tracking-[0.18em] uppercase text-xs hover:opacity-90 active:scale-[0.99] transition-all"
                >
                  Send my login link
                </button>
              </form>
            </>
          )}

          {phase === "error" && (
            <>
              <h1 className="font-serif text-3xl md:text-4xl mb-4 leading-tight">
                Something went wrong.
              </h1>
              <p className="text-sm text-[#c97c5c] mb-6 font-sans">{error}</p>
              <button
                onClick={() => setPhase("needs_email")}
                className="bg-[#C9A84C] text-[#0d0d0d] rounded px-6 py-3 font-sans font-semibold tracking-[0.18em] uppercase text-xs"
              >
                Try again
              </button>
            </>
          )}

          <p className="text-[11px] text-[#7a8a82] mt-12 leading-relaxed font-sans">
            Trouble logging in? Email jordan@govelum.com and I'll set you up manually.
          </p>
        </div>
      </main>
    </div>
  );
}
