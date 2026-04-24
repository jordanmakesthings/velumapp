import { Link, useLocation } from "react-router-dom";
import { Sparkles, Compass, Headphones, User } from "lucide-react";

const navItems = [
  { path: "/home",    icon: Sparkles,   label: "Home",     match: ["/home", "/"] },
  { path: "/library", icon: Compass,    label: "Discover", match: ["/library", "/tools", "/courses", "/course", "/subcategory", "/journal", "/breathe", "/bilateral", "/tapping", "/somatic-touch", "/sos"] },
  { path: "/audios",  icon: Headphones, label: "Audios",   match: ["/audios", "/custom-track"] },
  { path: "/profile", icon: User,       label: "Me",       match: ["/profile", "/premium"] },
];

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full py-8 px-5">
      <div className="mb-12 px-2">
        <span
          className="text-accent font-serif text-xl tracking-[0.4em]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          VELUM
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ path, icon: Icon, label, match }) => {
          const isActive = match.some(m => location.pathname.startsWith(m));
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
