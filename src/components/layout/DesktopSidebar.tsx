import { Link, useLocation } from "react-router-dom";
import { Home, Library, Zap, BookOpen, User, Feather } from "lucide-react";
import logoLotus from "@/assets/logo-lotus.jpg";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/library", icon: Library, label: "Library" },
  { path: "/tools", icon: Zap, label: "Tools" },
  { path: "/courses", icon: BookOpen, label: "Courses" },
  { path: "/journal", icon: Feather, label: "Journal" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full py-8 px-5">
      <div className="mb-12 flex items-center gap-3">
        <img src={logoLotus} alt="Velum" className="w-8 h-8 rounded-md object-cover" />
        <span className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase">
          VELUM
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
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
