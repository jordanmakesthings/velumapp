import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { SessionFinderFAB } from "./SessionFinderFAB";
import { SessionFinderProvider, useSessionFinder } from "@/contexts/SessionFinderContext";
import { SessionFinderModal } from "@/components/home/SessionFinderModal";
import TermsGateModal from "@/components/TermsGateModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const HIDDEN_NAV_PATHS = ["/onboarding", "/premium", "/welcome", "/player", "/mastery-player", "/auth", "/signup", "/reset-password", "/course-v2", "/home-setup"];

// Pages where the FAB should stay hidden (anywhere you're already in a session, or paywall/onboarding)
const HIDDEN_FAB_PATHS = [...HIDDEN_NAV_PATHS, "/breathe", "/bilateral", "/tapping", "/somatic-touch", "/sos", "/checkin"];

// Where to block the T&C gate from appearing. It should fire only once inside the authenticated experience.
const GATE_BLOCK_PATHS = ["/onboarding", "/auth", "/signup", "/reset-password", "/welcome", "/home-setup"];

function AppLayoutInner() {
  const location = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  const hideNav = HIDDEN_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const hideFab = HIDDEN_FAB_PATHS.some(p => location.pathname.startsWith(p));
  const { open, setOpen } = useSessionFinder();

  // Show the T&C gate once, after onboarding is complete, anywhere in the authed app.
  const showGate = !!user
    && !!profile?.onboarding_completed
    && !profile?.terms_accepted_at
    && !GATE_BLOCK_PATHS.some(p => location.pathname.startsWith(p));

  const acceptTerms = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("id", user.id);
    await refreshProfile();
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-radial-subtle flex">
      {!hideNav && (
        <aside className="hidden lg:flex flex-col w-[220px] fixed inset-y-0 left-0 border-r border-accent/10 bg-background z-40">
          <DesktopSidebar />
        </aside>
      )}

      <main className={`min-w-0 w-full max-w-full flex-1 overflow-x-hidden ${!hideNav ? "lg:ml-[220px]" : ""} ${!hideNav ? "pb-[96px] lg:pb-0" : ""}`}>
        <Outlet />
      </main>

      {/* Session Finder FAB hidden — Custom Track tile is the new Today anchor */}
      {false && !hideFab && <SessionFinderFAB />}
      <SessionFinderModal open={open} onClose={() => setOpen(false)} />

      {showGate && <TermsGateModal onAccept={acceptTerms} />}

      {!hideNav && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-[80px] max-w-full overflow-hidden backdrop-blur-xl bg-background/80 border-t border-accent/10 flex items-center justify-around px-6 pb-2 safe-area-pb">
          <BottomNav />
        </nav>
      )}
    </div>
  );
}

export function AppLayout() {
  return (
    <SessionFinderProvider>
      <AppLayoutInner />
    </SessionFinderProvider>
  );
}
