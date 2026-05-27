import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

// Free-tier accessible routes (kept here for reference; gating is now
// page-level via <PremiumGate>, not redirect-level). Auth + onboarding
// checks still live here.
export const FREE_TIER_ROUTES = [
  "/home",
  "/breathe",
  "/finder",
  "/journal",
  "/profile",
  "/premium",
  "/mastery-player", // Happiness class allowed; others gated inside the page
];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Returning users (previously authed on this device / in this PWA) land on /login.
    // Fresh-to-the-funnel visitors land on /signup.
    let hasAccount = false;
    try { hasAccount = localStorage.getItem("velum_has_account") === "1"; } catch {}
    // Preserve the original URL + any query params (esp. email) so the auth
    // page can pre-fill email, and so we can redirect back after login.
    const incomingParams = new URLSearchParams(location.search);
    const next = location.pathname + location.search;
    const passthrough = new URLSearchParams();
    const email = incomingParams.get("email");
    if (email) passthrough.set("email", email);
    passthrough.set("next", next);
    const dest = (hasAccount ? "/login" : "/signup") + "?" + passthrough.toString();
    return <Navigate to={dest} replace />;
  }

  // Redirect TO onboarding if not completed.
  const ONBOARDING_WHITELIST = ["/onboarding", "/paymentsuccess", "/premium", "/profile"];
  if (
    profile &&
    !profile.onboarding_completed &&
    !ONBOARDING_WHITELIST.some(p => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect AWAY from onboarding if already completed
  if (
    profile &&
    profile.onboarding_completed &&
    location.pathname === "/onboarding"
  ) {
    return <Navigate to="/home" replace />;
  }

  // Freemium: NO hard paywall redirect. Premium pages render <PremiumGate>
  // and the global <PaywallSheet> handles upgrade flow.
  return <>{children}</>;
}
