import { Link, useLocation } from "react-router-dom";
import { Home, Library, Wind, BookOpen, User } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/library", icon: Library, label: "Library" },
  { path: "/breathe", icon: Wind, label: "Breathe" },
  { path: "/courses", icon: BookOpen, label: "Courses" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <>
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
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
