import { Link, useLocation } from "react-router-dom";
import { Home, Library, Wind, BookOpen, User, Feather } from "lucide-react";
import logoLotus from "@/assets/logo-lotus.jpg";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/library", icon: Library, label: "Library" },
  { path: "/breathe", icon: Wind, label: "Breathe" },
  { path: "/courses", icon: BookOpen, label: "Courses" },
  { path: "/journal", icon: Feather, label: "Journal" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full py-8 px-5">
      <div className="mb-12">
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
