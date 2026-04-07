import { Link, useLocation } from "react-router-dom";
import { Home, Library, Zap, BookOpen, User } from "lucide-react";

const TOOLS_PATHS = ["/tools", "/breathe", "/bilateral", "/tapping", "/somatic-touch"];

const navItems = [
  { path: "/home", icon: Home, label: "Home", match: ["/home", "/"] },
  { path: "/library", icon: Library, label: "Library", match: ["/library", "/subcategory"] },
  { path: "/tools", icon: Zap, label: "Tools", match: TOOLS_PATHS },
  { path: "/courses", icon: BookOpen, label: "Courses", match: ["/courses", "/course"] },
  { path: "/profile", icon: User, label: "Profile", match: ["/profile"] },
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
