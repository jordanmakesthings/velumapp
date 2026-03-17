import { Link } from "react-router-dom";
import { Wind, Flame, Heart, Sparkles, Feather, GraduationCap, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import { SessionFinderModal } from "@/components/home/SessionFinderModal";
import logoLotus from "@/assets/logo-lotus.jpg";

const QUOTES = [
  "The present moment is the only place where life exists.",
  "Your nervous system is the gateway to everything you want.",
  "Regulation is not a destination — it's a practice.",
  "Stillness is not empty. It is full of answers.",
  "The breath is always available. So is the way back to yourself.",
  "Between stimulus and response, there is a space. In that space is your freedom.",
  "Your body keeps the score. Let it also keep the healing.",
  "Peace is not the absence of chaos. It is presence within it.",
  "The quieter you become, the more you can hear.",
  "Return to center. Everything begins there.",
];

const categories = [
  { key: "meditation", label: "Meditation", icon: Sparkles, count: 12 },
  { key: "rapid_resets", label: "Rapid Resets", icon: Zap, count: 6 },
  { key: "breathwork", label: "Breathwork", icon: Wind, count: 8 },
  { key: "tapping", label: "Tapping", icon: Heart, count: 10 },
  { key: "journaling", label: "Journaling", icon: Feather, count: 5 },
  { key: "mastery", label: "Mastery Classes", icon: GraduationCap, count: 4 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getTodayQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function HomePage() {
  const [finderOpen, setFinderOpen] = useState(false);

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img src={logoLotus} alt="Velum" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase">
            VELUM
          </span>
        </div>
        <h1 className="text-display text-4xl lg:text-5xl leading-tight mb-4">
          {getGreeting()}.
        </h1>
        <p className="text-ui text-sm italic leading-relaxed opacity-70">
          "{getTodayQuote()}"
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-8 overflow-x-auto">
        {[
          { label: "0 day streak", icon: Flame },
          { label: "0 sessions", icon: Sparkles },
          { label: "0 mins", icon: Wind },
        ].map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="velum-card-flat flex items-center gap-2 px-4 py-2.5 shrink-0"
          >
            <Icon className="w-3.5 h-3.5 text-accent" />
            <span className="text-ui text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Session Finder */}
      <button
        onClick={() => setFinderOpen(true)}
        className="velum-card w-full text-left p-5 mb-8 group"
      >
        <p className="text-ui text-xs tracking-wide mb-1">Not sure where to start?</p>
        <p className="text-foreground font-serif text-lg">
          Use Session Finder
          <ArrowRight className="inline ml-2 w-4 h-4 text-accent group-hover:translate-x-1 transition-transform duration-200" />
        </p>
      </button>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {categories.map(({ key, label, icon: Icon, count }) => (
          <Link
            key={key}
            to={`/library?category=${key}`}
            className="velum-card p-5 flex flex-col gap-3 group"
          >
            <Icon className="w-5 h-5 text-accent" />
            <div>
              <p className="text-foreground text-sm font-sans font-medium">{label}</p>
              <p className="text-ui text-xs">{count} sessions</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Breathe CTA */}
      <Link to="/breathe" className="block mb-8">
        <div className="velum-card p-6 relative overflow-hidden border border-accent/25">
          {/* Orb glow */}
          <div className="absolute top-1/2 right-6 -translate-y-1/2 w-16 h-16 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-40 animate-pulse" />
          <p className="text-ui text-xs tracking-wide mb-2">Interactive Breathwork</p>
          <p className="text-foreground font-serif text-xl mb-4">
            Real-time nervous system regulation.
          </p>
          <span className="inline-flex items-center gap-2 text-accent text-sm font-sans font-medium">
            Start breathing <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Daily Reflection */}
      <div className="velum-card p-6 mb-8">
        <p className="text-ui text-xs tracking-wide uppercase mb-3">Daily Reflection</p>
        <p className="text-foreground font-serif text-lg mb-4">
          What does your body need from you today?
        </p>
        <textarea
          placeholder="Write your reflection..."
          className="w-full bg-secondary rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none h-24 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
        />
        <button className="mt-3 px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
          Save reflection
        </button>
      </div>

      {/* Featured */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-xl">Featured sessions</h2>
          <Link to="/library" className="text-accent text-xs font-sans tracking-wide">
            View all →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {["Morning Calm", "Stress Reset", "Deep Sleep"].map((title) => (
            <div key={title} className="velum-card min-w-[200px] overflow-hidden shrink-0">
              <div className="aspect-video bg-surface-light" />
              <div className="p-4">
                <p className="text-foreground text-sm font-sans">{title}</p>
                <p className="text-ui text-xs mt-1">10 min · Meditation</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SessionFinderModal open={finderOpen} onClose={() => setFinderOpen(false)} />
    </div>
  );
}
