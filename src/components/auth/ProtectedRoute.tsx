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

  // Redirect to onboarding if not completed — no payment gate, trial starts at signup
  if (
    profile &&
    !profile.onboarding_completed &&
    location.pathname !== "/onboarding" &&
    location.pathname !== "/paymentsuccess"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
