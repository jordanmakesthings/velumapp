import { Link } from "react-router-dom";
import { Wind, Zap, Hand, Fingerprint } from "lucide-react";
import VelumMark from "@/components/VelumMark";

const TOOLS = [
  {
    path: "/breathe",
    label: "Breathwork",
    tag: "Interactive",
    description: "Real-time guided breathing techniques that shift your nervous system in minutes.",
    detail: "6 techniques · Box, 4-7-8, Coherence, Physiological Sigh +more",
    icon: Wind,
    gradient: false,
  },
  {
    path: "/bilateral",
    label: "Bilateral",
    tag: "Somatic",
    description: "Visual and auditory bilateral stimulation for emotional processing and nervous system reset.",
    detail: "Visual orb · Stereo audio · Eyes-closed mode",
    icon: Zap,
    gradient: false,
  },
  {
    path: "/tapping",
    label: "Guided Tapping",
    tag: "Personalised",
    description: "Describe what you're feeling. Get a personalised EFT tapping script in seconds.",
    detail: "3-round script · Specific to your situation · Guided step-by-step",
    icon: Hand,
    gradient: false,
  },
  {
    path: "/somatic-touch",
    label: "Somatic Touch",
    tag: "Somatic",
    description: "Guided touch sequences that signal safety to your nervous system and release held activation.",
    detail: "4 sequences · Breathing guide · Before & after check-in",
    icon: Fingerprint,
    gradient: false,
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="mb-5">
          <VelumMark variant="lotus" size="sm" />
        </div>
        <h1 className="text-display text-[2.4rem] leading-[1.05]">Real-time <span className="text-accent italic">tools.</span></h1>
        <p className="text-muted-foreground text-sm font-sans mt-2">Interactive practices for immediate nervous system regulation.</p>
      </div>

      <div className="flex flex-col gap-4">
        {TOOLS.map(({ path, label, tag, description, detail, icon: Icon, gradient }) => (
          <Link key={path} to={path} className="velum-card group p-6 flex gap-5 items-start">
            {/* Icon */}
            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${gradient ? "gold-gradient" : "bg-surface-light"}`}>
              <Icon className={`w-5 h-5 ${gradient ? "text-primary-foreground" : "text-accent"}`} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-foreground font-sans font-medium text-base">{label}</p>
                <span className={`text-[10px] font-sans font-medium tracking-wide px-2 py-0.5 rounded-full ${gradient ? "bg-accent/20 text-accent" : "bg-surface-light text-muted-foreground"}`}>
                  {tag}
                </span>
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-2">{description}</p>
              <p className="text-muted-foreground text-[11px]">{detail}</p>
            </div>

            {/* Arrow */}
            <div className="shrink-0 self-center text-muted-foreground group-hover:text-accent transition-colors group-hover:translate-x-0.5 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
