import { Sparkles } from "lucide-react";
import { useSessionFinder } from "@/contexts/SessionFinderContext";

/**
 * Persistent floating action button — always available to open the Session Finder.
 * Gold glow, bottom-right, hovers above bottom nav on mobile.
 */
export function SessionFinderFAB() {
  const { setOpen } = useSessionFinder();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Find my session"
      className="fixed z-40 bottom-[96px] right-5 lg:bottom-8 lg:right-8 w-[60px] h-[60px] rounded-full gold-gradient flex items-center justify-center active:scale-95 transition-transform"
      style={{ boxShadow: "0 0 40px rgba(201,168,76,0.4), 0 0 0 1px rgba(201,168,76,0.6)" }}
    >
      <Sparkles className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent/40 animate-ping" />
    </button>
  );
}
