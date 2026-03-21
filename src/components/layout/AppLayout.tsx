import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

const HIDDEN_NAV_PATHS = ["/onboarding", "/premium", "/welcome", "/player", "/mastery-player", "/auth", "/signup", "/reset-password", "/course-v2", "/home-setup"];

export function AppLayout() {
  const location = useLocation();
  const hideNav = HIDDEN_NAV_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-radial-subtle flex">
      {!hideNav && (
        <aside className="hidden lg:flex flex-col w-[220px] fixed inset-y-0 left-0 border-r border-accent/10 bg-background z-40">
          <DesktopSidebar />
        </aside>
      )}

      <main className={`min-w-0 w-full max-w-full flex-1 overflow-x-hidden ${!hideNav ? "lg:ml-[220px]" : ""} ${!hideNav ? "pb-[88px] lg:pb-0" : ""}`}>
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-[72px] max-w-full overflow-hidden backdrop-blur-xl bg-background/80 border-t border-accent/10 flex items-center justify-around px-4 safe-area-pb">
          <BottomNav />
        </nav>
      )}
    </div>
  );
}
