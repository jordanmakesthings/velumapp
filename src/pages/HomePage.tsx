import { Link } from "react-router-dom";
import { Wind, Flame, Heart, Sparkles, Feather, GraduationCap, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionFinderModal } from "@/components/home/SessionFinderModal";
import { useAuth } from "@/contexts/AuthContext";
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

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  meditation: Sparkles,
  rapid_resets: Zap,
  breathwork: Wind,
  tapping: Heart,
  journaling: Feather,
  mastery: GraduationCap,
};

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
  const { user, profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0];

  // Fetch tracks for category counts and featured
  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  // Fetch user progress for stats
  const { data: progress = [] } = useQuery({
    queryKey: ["userProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch today's prompt
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("journaling_prompts").select("*").order("order_index").limit(1);
      return data || [];
    },
  });

  // Category counts from real data
  const categoryCounts: Record<string, number> = {};
  (tracks as any[]).forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categories = [
    { key: "meditation", label: "Meditation" },
    { key: "rapid_resets", label: "Rapid Resets" },
    { key: "breathwork", label: "Breathwork" },
    { key: "tapping", label: "Tapping" },
    { key: "journaling", label: "Journaling" },
  ].map(c => ({ ...c, icon: CATEGORY_ICONS[c.key] || Sparkles, count: categoryCounts[c.key] || 0 }));

  const featuredTracks = (tracks as any[]).filter(t => t.is_featured).slice(0, 5);
  const totalSessions = progress.length;
  const totalMinutes = progress.reduce((sum: number, p: any) => sum + (p.progress_seconds || 0), 0) / 60;

  // Simple streak calc
  const completedDates = new Set(progress.map((p: any) => p.completed_date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (completedDates.has(dateStr)) streak++;
    else if (i > 0) break;
  }

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img src={logoLotus} alt="Velum" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase">VELUM</span>
        </div>
        <h1 className="text-display text-4xl lg:text-5xl leading-tight mb-4">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-ui text-sm italic leading-relaxed opacity-70">"{getTodayQuote()}"</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-8 overflow-x-auto">
        {[
          { label: `${streak} day streak`, icon: Flame },
          { label: `${totalSessions} sessions`, icon: Sparkles },
          { label: `${Math.round(totalMinutes)} mins`, icon: Wind },
        ].map(({ label, icon: Icon }) => (
          <div key={label} className="velum-card-flat flex items-center gap-2 px-4 py-2.5 shrink-0">
            <Icon className="w-3.5 h-3.5 text-accent" />
            <span className="text-ui text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Session Finder */}
      <button onClick={() => setFinderOpen(true)} className="velum-card w-full text-left p-5 mb-8 group">
        <p className="text-ui text-xs tracking-wide mb-1">Not sure where to start?</p>
        <p className="text-foreground font-serif text-lg">
          Use Session Finder
          <ArrowRight className="inline ml-2 w-4 h-4 text-accent group-hover:translate-x-1 transition-transform duration-200" />
        </p>
      </button>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {categories.map(({ key, label, icon: Icon, count }) => (
          <Link key={key} to={`/library?category=${key}`} className="velum-card p-5 flex flex-col gap-3 group">
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
          <div className="absolute top-1/2 right-6 -translate-y-1/2 w-16 h-16 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-40 animate-pulse" />
          <p className="text-ui text-xs tracking-wide mb-2">Interactive Breathwork</p>
          <p className="text-foreground font-serif text-xl mb-4">Real-time nervous system regulation.</p>
          <span className="inline-flex items-center gap-2 text-accent text-sm font-sans font-medium">
            Start breathing <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Daily Reflection */}
      <div className="velum-card p-6 mb-8">
        <p className="text-ui text-xs tracking-wide uppercase mb-3">Daily Reflection</p>
        <p className="text-foreground font-serif text-lg mb-4">
          {prompts[0]?.prompt || "What does your body need from you today?"}
        </p>
        <Link to="/journal" className="inline-block px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
          Write reflection
        </Link>
      </div>

      {/* Featured */}
      {featuredTracks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display text-xl">Featured sessions</h2>
            <Link to="/library" className="text-accent text-xs font-sans tracking-wide">View all →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {featuredTracks.map((track: any) => (
              <Link key={track.id} to={`/player?trackId=${track.id}`} className="velum-card min-w-[200px] overflow-hidden shrink-0">
                <div className="aspect-video bg-surface-light">
                  {track.thumbnail_url && <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-foreground text-sm font-sans">{track.title}</p>
                  <p className="text-ui text-xs mt-1">{track.duration_minutes} min</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <SessionFinderModal open={finderOpen} onClose={() => setFinderOpen(false)} />
    </div>
  );
}
