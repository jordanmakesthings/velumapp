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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  meditation: "Guided & unguided practices for presence and clarity",
  rapid_resets: "Under 10 minutes — instant returns to calm",
  breathwork: "Breath-based techniques to shift your nervous system",
  tapping: "EFT tapping sequences to clear stress",
  journaling: "Guided prompts and reflections",
  mastery: "Immersive audio experiences",
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

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-home"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("order_index").limit(4);
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["userProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("journaling_prompts").select("*").order("order_index").limit(1);
      return data || [];
    },
  });

  // Stats
  const categoryCounts: Record<string, number> = {};
  (tracks as any[]).forEach((t) => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1; });

  const categories = [
    { key: "meditation", label: "Meditation" },
    { key: "rapid_resets", label: "Rapid Resets" },
    { key: "breathwork", label: "Breathwork" },
    { key: "tapping", label: "Tapping" },
    { key: "journaling", label: "Journaling" },
    { key: "mastery", label: "Mastery Classes" },
  ].map(c => ({ ...c, icon: CATEGORY_ICONS[c.key] || Sparkles, count: categoryCounts[c.key] || 0, description: CATEGORY_DESCRIPTIONS[c.key] || "" }));

  const featuredTracks = (tracks as any[]).filter(t => t.is_featured).slice(0, 5);
  const totalSessions = progress.length;
  const totalMinutes = progress.reduce((sum: number, p: any) => sum + (p.progress_seconds || 0), 0) / 60;

  // Streak
  const completedDates = new Set(progress.map((p: any) => p.completed_date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completedDates.has(d.toISOString().split("T")[0])) streak++;
    else if (i > 0) break;
  }

  // Continue journey
  const completedTrackIds = new Set(progress.map((p: any) => p.track_id));
  const isNewUser = progress.length === 0;
  const nextTrack = (tracks as any[]).find(t => !completedTrackIds.has(t.id));
  const nextCourse = nextTrack?.course_id ? courses.find((c: any) => c.id === nextTrack.course_id) : null;
  const quickResetTrack = (tracks as any[]).filter(t => t.category === "breathwork" && t.duration_minutes < 5).sort((a, b) => a.duration_minutes - b.duration_minutes)[0];

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
        {categories.map(({ key, label, icon: Icon, count, description }) => (
          <Link
            key={key}
            to={key === "mastery" ? "/library?tab=mastery" : `/library?category=${key}`}
            className="velum-card p-5 flex flex-col justify-between min-h-[130px] group"
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-5 h-5 text-accent" />
              <span className="text-accent text-[10px] font-sans bg-surface px-2.5 py-0.5 rounded-full">{count} sessions</span>
            </div>
            <div>
              <p className="text-foreground text-sm font-sans font-medium mb-1">{label}</p>
              <p className="text-ui text-[11px] leading-snug">{description}</p>
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

      {/* Continue Your Journey / Start Here */}
      <div className="mb-8">
        <p className="text-ui text-[11px] tracking-[2.5px] uppercase mb-4">
          {isNewUser ? "Start Here" : "Continue Your Journey"}
        </p>
        {isNewUser ? (
          <div className="velum-card p-6">
            <p className="text-accent text-[11px] font-sans font-bold tracking-wide uppercase mb-2">Your Journey Begins</p>
            <h3 className="text-display text-xl mb-3">Welcome to Velum</h3>
            <p className="text-foreground text-sm font-sans leading-relaxed mb-5">Your first step is simple. Explore the library and begin any practice that calls to you.</p>
            <Link to="/library" className="inline-block px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-bold">
              Begin orientation →
            </Link>
          </div>
        ) : nextTrack ? (
          <div className="velum-card p-6">
            {nextCourse && <p className="text-ui text-xs tracking-wide uppercase mb-1">{(nextCourse as any).title}</p>}
            <h3 className="text-display text-xl mb-3">{nextTrack.title}</h3>
            <span className="text-foreground text-xs border border-foreground/20 rounded-full px-3 py-1 font-sans">{nextTrack.duration_minutes} min</span>
            <div className="mt-4">
              <Link to={`/player?trackId=${nextTrack.id}`} className="inline-block px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-bold">
                Continue →
              </Link>
            </div>
          </div>
        ) : null}

        {/* Quick Reset */}
        {quickResetTrack && (
          <div className="velum-card-flat p-4 mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-foreground text-[11px] font-sans font-bold tracking-wide uppercase mb-1">Quick Reset</p>
              <p className="text-display text-base">{quickResetTrack.title}</p>
              <p className="text-ui text-xs mt-0.5">{quickResetTrack.duration_minutes} min · Breathwork</p>
            </div>
            <Link to="/breathe" className="shrink-0 px-4 py-2.5 rounded-lg border border-accent/50 text-accent text-sm font-sans font-bold whitespace-nowrap">
              Breathe now →
            </Link>
          </div>
        )}
      </div>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-ui text-[11px] tracking-[2.5px] uppercase">Featured Courses</p>
            <Link to="/library?tab=courses" className="text-accent text-xs font-sans">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 2).map((course: any) => (
              <Link key={course.id} to={`/course/${course.id}`} className="velum-card overflow-hidden">
                <div className="h-24 bg-surface-light relative">
                  {(course.cover_image_url || course.thumbnail_url) && (
                    <img src={course.cover_image_url || course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-foreground text-sm font-sans font-medium">{course.title}</p>
                  <p className="text-ui text-xs mt-1">{course.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Sessions */}
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
