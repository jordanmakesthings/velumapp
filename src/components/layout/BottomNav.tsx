import { Link, useLocation } from "react-router-dom";
import { Sparkles, Compass, Wind, User } from "lucide-react";

const navItems = [
  { path: "/home",    icon: Sparkles,   label: "Home",     match: ["/home", "/"] },
  { path: "/library", icon: Compass,    label: "Library",  match: ["/library", "/courses", "/course", "/subcategory", "/journal"] },
  { path: "/tools",   icon: Wind,       label: "Tools",    match: ["/tools", "/breathe", "/bilateral", "/timer"] },
  { path: "/profile", icon: User,       label: "Me",       match: ["/profile", "/premium"] },
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
