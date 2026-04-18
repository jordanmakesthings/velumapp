import { Link, useLocation } from "react-router-dom";
import { Sparkles, Compass, User } from "lucide-react";
import velumLotus from "@/assets/brand/velum-lotus.png";

const navItems = [
  { path: "/home",    icon: Sparkles, label: "Today" },
  { path: "/library", icon: Compass,  label: "Discover" },
  { path: "/profile", icon: User,     label: "Me" },
];

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full py-8 px-5">
      <div className="mb-12 flex items-center gap-3">
        <img src={velumLotus} alt="Velum" className="w-9 h-9 object-contain" draggable={false} />
        <span className="text-accent text-[11px] font-sans font-medium tracking-[5px] uppercase">
          Velum
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
            || (path === "/library" && (location.pathname.startsWith("/library") || location.pathname.startsWith("/tools") || location.pathname.startsWith("/courses") || location.pathname.startsWith("/journal") || location.pathname.startsWith("/breathe") || location.pathname.startsWith("/bilateral") || location.pathname.startsWith("/tapping") || location.pathname.startsWith("/somatic-touch")))
            || (path === "/profile" && location.pathname.startsWith("/premium"));
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-sans tracking-wide ${
                isActive
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
