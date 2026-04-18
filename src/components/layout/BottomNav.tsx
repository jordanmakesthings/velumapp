import { Link, useLocation } from "react-router-dom";
import { Sparkles, Compass, User } from "lucide-react";

// Three-tab simplified navigation
// - Today: the anchor (home + session finder)
// - Discover: library, tools, courses, mastery, journal all live here
// - Me: profile + premium + settings
const navItems = [
  { path: "/home",    icon: Sparkles, label: "Today",    match: ["/home", "/"] },
  { path: "/library", icon: Compass,  label: "Discover", match: ["/library", "/tools", "/courses", "/course", "/subcategory", "/journal", "/breathe", "/bilateral", "/tapping", "/somatic-touch", "/sos"] },
  { path: "/profile", icon: User,     label: "Me",       match: ["/profile", "/premium"] },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <>
      {navItems.map(({ path, icon: Icon, label, match }) => {
        const isActive = match.some((m) => location.pathname.startsWith(m));
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
              isActive ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-[10px] font-sans tracking-wide">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
