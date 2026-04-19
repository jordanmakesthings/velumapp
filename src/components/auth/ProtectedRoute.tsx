import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

// Routes an onboarded-but-unpaid user is still allowed to hit.
// Everything else bounces to /premium until they subscribe.
const PAYWALL_WHITELIST = ["/premium", "/paymentsuccess", "/profile"];

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, hasAccess } = useAuth();
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
    return <Navigate to={hasAccount ? "/login" : "/signup"} replace />;
  }

  // Redirect TO onboarding if not completed
  if (
    profile &&
    !profile.onboarding_completed &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/paymentsuccess"
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

  // Hard paywall gate: onboarded but not subscribed → force /premium
  // Whitelist allows /premium itself, /paymentsuccess (post-checkout), /profile (so they can sign out)
  if (
    profile &&
    profile.onboarding_completed &&
    !hasAccess &&
    !PAYWALL_WHITELIST.some(p => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/premium" replace />;
  }

  return <>{children}</>;
}
