import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

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
    return <Navigate to="/signup" replace />;
  }

  // If user has active access, let them through to any page
  const hasActiveAccess =
    profile?.subscription_status === "active" ||
    profile?.subscription_plan === "lifetime";

  // If user hasn't completed onboarding and isn't already on onboarding or paymentsuccess, redirect
  if (
    profile &&
    !profile.onboarding_completed &&
    !hasActiveAccess &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/paymentsuccess"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
