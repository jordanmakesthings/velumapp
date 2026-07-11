import { Link, useNavigate } from "react-router-dom";
import { Wind, Zap, Timer as TimerIcon, Lock, ChevronLeft } from "lucide-react";
import VelumMark from "@/components/VelumMark";
import { useAuth } from "@/contexts/AuthContext";
import { usePaywall } from "@/components/PaywallSheet";

// Free + premium broken out per-item. Free tools open directly. Premium
// tools open the soft paywall sheet for free users; for premium users they
// just navigate.
const TOOLS = [
  {
    path: "/breathe",
    label: "Breathwork",
    tag: "Interactive",
    description: "Real-time guided breathing techniques that shift your nervous system in minutes.",
    detail: "8 techniques · Box, 4-7-8, Coherence, Physiological Sigh +more",
    icon: Wind,
    premium: false,
  },
  {
    path: "/timer",
    label: "Open Meditation",
    tag: "Interactive",
    description: "Set a duration. Pick an ambient soundscape. Sit. A bowl rings at the end.",
    detail: "Custom duration · Rain, Forest, Fire, Waves · Tibetan bowl",
    icon: TimerIcon,
    premium: false,
  },
  {
    path: "/bilateral",
    label: "Bilateral",
    tag: "Somatic",
    description: "Visual and auditory bilateral stimulation for emotional processing and nervous system reset.",
    detail: "Visual orb · Stereo audio · Eyes-closed mode",
    icon: Zap,
    premium: true,
  },
] as const;

export default function ToolsPage() {
  const navigate = useNavigate();
  const { hasAccess } = useAuth();
  const { open: openPaywall } = usePaywall();

  return (
    <div className="px-4 lg:px-8 pt-6 pb-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/home")}
        className="-ml-1 mb-3 inline-flex items-center gap-1 text-muted-foreground/70 hover:text-accent text-xs tracking-wide transition-colors"
        aria-label="Back to home"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Home</span>
      </button>

      <div className="mb-8">
        <div className="mb-5">
          <VelumMark variant="lotus" size="sm" />
        </div>
        <h1 className="text-display text-[2.4rem] leading-[1.05]">Real-time <span className="text-accent italic">tools.</span></h1>
        <p className="text-muted-foreground text-sm font-sans mt-2">Interactive practices for immediate nervous system regulation.</p>
      </div>

      <div className="flex flex-col gap-4">
        {TOOLS.map(({ path, label, tag, description, detail, icon: Icon, premium }) => {
          const locked = premium && !hasAccess;
          const inner = (
            <>
              <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-surface-light relative">
                <Icon className="w-5 h-5 text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-foreground font-sans font-medium text-base">{label}</p>
                  <span className="text-[10px] font-sans font-medium tracking-wide px-2 py-0.5 rounded-full bg-surface-light text-muted-foreground">
                    {tag}
                  </span>
                  {locked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
                      <Lock className="w-2.5 h-2.5" /> Premium
                    </span>
                  )}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-2">{description}</p>
                <p className="text-muted-foreground text-[11px]">{detail}</p>
              </div>

              <div className="shrink-0 self-center text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </>
          );

          const className = `velum-card group p-6 flex gap-5 items-start text-left ${locked ? "opacity-95" : ""}`;

          if (locked) {
            return (
              <button key={path} type="button" onClick={openPaywall} className={className}>
                {inner}
              </button>
            );
          }
          return (
            <Link key={path} to={path} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
