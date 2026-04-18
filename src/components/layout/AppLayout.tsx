import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { SessionFinderFAB } from "./SessionFinderFAB";
import { SessionFinderProvider, useSessionFinder } from "@/contexts/SessionFinderContext";
import { SessionFinderModal } from "@/components/home/SessionFinderModal";

const HIDDEN_NAV_PATHS = ["/onboarding", "/premium", "/welcome", "/player", "/mastery-player", "/auth", "/signup", "/reset-password", "/course-v2", "/home-setup"];

// Pages where the FAB should stay hidden (anywhere you're already in a session, or paywall/onboarding)
const HIDDEN_FAB_PATHS = [...HIDDEN_NAV_PATHS, "/breathe", "/bilateral", "/tapping", "/somatic-touch", "/sos", "/checkin"];

function AppLayoutInner() {
  const location = useLocation();
  const hideNav = HIDDEN_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const hideFab = HIDDEN_FAB_PATHS.some(p => location.pathname.startsWith(p));
  const { open, setOpen } = useSessionFinder();

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

      {!hideFab && <SessionFinderFAB />}
      <SessionFinderModal open={open} onClose={() => setOpen(false)} />

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
