import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-radial-subtle flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground text-2xl">✓</span>
          </div>
          <h1 className="text-display text-2xl mb-2">Password updated</h1>
          <p className="text-ui text-sm">Redirecting you now...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-subtle flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-display text-3xl mb-2 text-center">Set new password</h1>
        <p className="text-ui text-sm mb-8 text-center">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
            minLength={6}
            className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          {error && <p className="text-destructive text-xs font-sans text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
