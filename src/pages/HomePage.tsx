import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Wind, Flame, Heart, Sparkles, Feather, GraduationCap, ArrowRight, Zap, ChevronLeft, ChevronRight, Clock, BookOpen } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionFinderModal } from "@/components/home/SessionFinderModal";
import { useAuth } from "@/contexts/AuthContext";
import logoLotus from "@/assets/logo-lotus.jpg";
import { format } from "date-fns";

const QUOTES = [
{ text: "The present moment is the only place where life exists.", author: "Eckhart Tolle" },
{ text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Viktor Frankl" },
{ text: "You have power over your mind, not outside events. Realize this and you will find strength.", author: "Marcus Aurelius" },
{ text: "The mind is everything. What you think, you become.", author: "Buddha" },
{ text: "He who is not everyday conquering some fear has not learned the secret of life.", author: "Ralph Waldo Emerson" },
{ text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart" },
{ text: "Lose your mind and come to your senses.", author: "Fritz Perls" },
{ text: "The body keeps the score.", author: "Bessel van der Kolk" },
{ text: "You cannot stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn" },
{ text: "Between what happened and how you responded, lies your entire life.", author: "Epictetus" },
{ text: "The curious paradox is that when I accept myself just as I am, then I can change.", author: "Carl Rogers" },
{ text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
{ text: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
{ text: "Feelings are just visitors. Let them come and go.", author: "Mooji" },
{ text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
{ text: "What you resist, persists.", author: "Carl Jung" },
{ text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
{ text: "Stillness is where creativity and solutions to problems are found.", author: "Eckhart Tolle" },
{ text: "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.", author: "Rumi" },
{ text: "The wound is the place where the Light enters you.", author: "Rumi" },
{ text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi" },
{ text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
{ text: "If you are distressed by anything external, the pain is not due to the thing itself but your estimate of it.", author: "Marcus Aurelius" },
{ text: "He suffers more than necessary, who suffers before it is necessary.", author: "Seneca" },
{ text: "We suffer more in imagination than in reality.", author: "Seneca" },
{ text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
{ text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
{ text: "Man is not worried by real problems so much as by his imagined anxieties about real problems.", author: "Epictetus" },
{ text: "No man ever steps in the same river twice, for it is not the same river and he is not the same man.", author: "Heraclitus" },
{ text: "The soul that sees beauty may sometimes walk alone.", author: "Goethe" }];


const JOURNAL_PROMPTS = [
"What does your body need from you today?",
"What are you holding onto that no longer serves you?",
"Where in your life are you seeking approval instead of alignment?",
"What would you do today if you knew you could not fail?",
"What pattern keeps showing up that you are finally ready to release?",
"What emotion have you been avoiding this week and what is it trying to tell you?",
"Describe a moment this week when you felt most like yourself.",
"What limiting belief is running quietly in the background of your life?",
"What are you grateful for that you rarely acknowledge?",
"What does your inner critic say most often and what would your wisest self say instead?",
"What boundary do you need to set that you have been putting off?",
"Where are you playing small and why?",
"What would your life look like if you fully trusted yourself?",
"What story about yourself are you ready to stop telling?",
"What does success actually feel like in your body — not your head?",
"What conversation have you been avoiding that needs to happen?",
"If your emotions from this past week had a message for you, what would it be?",
"What part of yourself have you been neglecting?",
"What does your ideal nervous system state feel like and when did you last feel it?",
"What are you pretending not to know?",
"Where in your life are you reacting from fear instead of choosing from values?",
"What would you tell your younger self about what you are going through right now?",
"What does your body feel like when you are in alignment versus when you are not?",
"What have you been tolerating that is quietly draining you?",
"What would radical self-honesty look like for you today?",
"What does your resistance to stillness tell you about what you are avoiding?",
"If you could release one fear today, which one would change everything?",
"What does your highest self want you to know right now?",
"Where are you giving your power away and to whom?",
"What would it mean to fully accept yourself exactly as you are today?"];


const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  meditation: Sparkles,
  rapid_resets: Zap,
  breathwork: Wind,
  tapping: Heart,
  journaling: Feather,
  mastery: GraduationCap
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  meditation: "Guided & unguided practices for presence and clarity",
  rapid_resets: "Under 10 minutes — instant returns to calm and regulation",
  breathwork: "Breath-based techniques to shift your nervous system",
  tapping: "EFT tapping sequences to clear stress and limiting beliefs",
  journaling: "Guided prompts and reflections for deeper self-awareness",
  mastery: "Immersive audio experiences designed to shift something in you"
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getDayOfYear() {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
}

export default function HomePage() {
  const [finderOpen, setFinderOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const { user, profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0];
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const dayOfYear = getDayOfYear();
  const todayQuote = QUOTES[dayOfYear % QUOTES.length];
  const todayPrompt = JOURNAL_PROMPTS[dayOfYear % JOURNAL_PROMPTS.length];

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses-home"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("order_index").limit(4);
      return data || [];
    }
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["userProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user
  });

  const categoryCounts: Record<string, number> = {};
  (tracks as any[]).forEach((t) => {categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;});

  // Each category links to its filtered library view — NOT to /breathe or /journal
  const categories = [
  { key: "meditation", label: "Meditation" },
  { key: "rapid_resets", label: "Rapid Resets" },
  { key: "breathwork", label: "Breathwork" },
  { key: "tapping", label: "Tapping" },
  { key: "journaling", label: "Journaling" },
  { key: "mastery", label: "Mastery Classes" }].
  map((c) => ({ ...c, icon: CATEGORY_ICONS[c.key] || Sparkles, count: categoryCounts[c.key] || 0, description: CATEGORY_DESCRIPTIONS[c.key] || "" }));

  const getCategoryLink = (key: string) => {
    if (key === "mastery") return "/library?tab=mastery";
    if (key === "journaling") return "/journal";
    if (key === "breathwork") return "/library?category=breathwork";
    if (key === "meditation") return "/library?category=meditation";
    if (key === "rapid_resets") return "/library?category=rapid_resets";
    if (key === "tapping") return "/library?category=tapping";
    return `/library?category=${key}`;
  };

  const featuredTracks = (tracks as any[]).filter((t) => t.is_featured).slice(0, 5);
  const totalSessions = progress.length;
  const totalMinutes = progress.reduce((sum: number, p: any) => sum + (p.progress_seconds || 0), 0) / 60;

  const completedDates = new Set(progress.map((p: any) => p.completed_date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (completedDates.has(d.toISOString().split("T")[0])) streak++;else
    if (i > 0) break;
  }

  const completedTrackIds = new Set(progress.map((p: any) => p.track_id));
  const nextTrack = (tracks as any[]).find((t) => !completedTrackIds.has(t.id));

  const scrollCarousel = (dir: number) => {
    if (!carouselRef.current) return;
    const newIdx = Math.max(0, Math.min(featuredTracks.length - 1, carouselIdx + dir));
    setCarouselIdx(newIdx);
    const child = carouselRef.current.children[newIdx] as HTMLElement;
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  // Auto-rotate featured carousel every 5 seconds
  useEffect(() => {
    if (featuredTracks.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx(prev => {
        const next = (prev + 1) % featuredTracks.length;
        if (carouselRef.current) {
          const child = carouselRef.current.children[next] as HTMLElement;
          if (child) child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredTracks.length]);

  const handleSaveReflection = async () => {
    if (!user || !reflectionText.trim()) return;
    setSavingReflection(true);
    try {
      await supabase.from("daily_reflections").insert({
        user_id: user.id,
        content: reflectionText.trim(),
        prompt: todayPrompt,
        reflection_date: new Date().toISOString().split("T")[0]
      });
      setReflectionText("");
    } catch {/* silent */}
    setSavingReflection(false);
  };

  return (
    <div className="min-h-screen bg-radial-subtle">
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <img src={logoLotus} alt="Velum" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-accent text-[10px] font-sans font-medium tracking-[4px] uppercase">VELUM</span>
        </div>
        <h1 className="text-display text-4xl lg:text-5xl leading-tight mb-4">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-foreground/70 text-sm italic font-serif leading-relaxed">
          "{todayQuote.text}" — {todayQuote.author}
        </p>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 mb-8 overflow-x-auto">
        {[
          { label: `${streak} day streak`, icon: Flame },
          { label: `${totalSessions} sessions`, icon: Sparkles },
          { label: `${Math.round(totalMinutes)} mins`, icon: Wind }].
          map(({ label, icon: Icon }) =>
          <div key={label} className="velum-card-flat flex items-center gap-2 px-4 py-2.5 shrink-0">
            <Icon className="w-3.5 h-3.5 text-accent" />
            <span className="text-ui text-xs">{label}</span>
          </div>
          )}
      </div>

      {/* Session Finder */}
      <button onClick={() => setFinderOpen(true)} className="velum-card w-full text-left p-5 mb-8 group">
        <p className="text-ui text-xs tracking-wide uppercase mb-1">Quick Start</p>
        <div className="flex items-center justify-between">
          <p className="text-foreground font-serif text-lg">Not sure where to start? Use Session Finder</p>
          <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </button>

      {/* Explore - Category Grid */}
      <div className="mb-8">
        <p className="text-ui text-[11px] tracking-[2.5px] uppercase mb-4">Explore</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(({ key, label, icon: Icon, count, description }) =>
            <Link
              key={key}
              to={getCategoryLink(key)}
              className="velum-card p-5 flex flex-col justify-between min-h-[130px] group bg-secondary">
              
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-5 h-5 text-accent" />
                <span className="text-accent text-[10px] font-sans bg-surface px-2.5 py-0.5 rounded-full">{count} sessions</span>
              </div>
              <div>
                <p className="text-foreground text-sm font-sans font-medium mb-1">{label}</p>
                <p className="text-ui text-[11px] leading-snug">{description}</p>
              </div>
            </Link>
            )}
        </div>
      </div>

      {/* Breathwork CTA - matches user screenshot */}
      <Link to="/breathe" className="block mb-8">
        <div className="velum-card p-6 relative overflow-hidden border border-accent/25">
          {/* Animated orb */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-accent/30" />
              <div className="absolute inset-2 rounded-full border border-accent/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-accent/80 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-accent text-xs font-sans font-bold tracking-wide uppercase mb-1">Interactive Breathwork</p>
          <p className="text-foreground font-serif text-xl mb-1">Real-Time Nervous System Regulation</p>
          <p className="text-ui text-xs mb-4">Guided Breathing Techniques</p>
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-sm font-sans font-medium">
            Start breathing <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Today's Reflection */}
      <div className="mb-8">
        <div className="flex gap-6 mb-4">
          <button className="text-accent text-[11px] tracking-[2.5px] uppercase border-b-2 border-accent pb-1">Today's Reflection</button>
          <Link to="/journal" className="text-muted-foreground text-[11px] tracking-[2.5px] uppercase pb-1 hover:text-foreground transition-colors">Past Entries</Link>
        </div>
        <div className="velum-card p-6">
          <p className="text-accent text-[10px] font-sans font-bold tracking-wide uppercase mb-3">
            {format(new Date(), "EEE, MMMM d").toUpperCase()}
          </p>
          <p className="text-foreground font-serif text-lg italic mb-5">"{todayPrompt}"</p>
          <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Take a breath, then write freely..."
              className="w-full bg-card rounded-xl p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow mb-4" />
            
          {user &&
            <div className="flex justify-end">
              <button
                onClick={handleSaveReflection}
                disabled={!reflectionText.trim() || savingReflection}
                className="px-5 py-2.5 rounded-lg bg-surface-light text-foreground text-sm font-sans font-medium disabled:opacity-30 hover:bg-surface transition-colors">
                
                Save reflection →
              </button>
            </div>
            }
        </div>
      </div>

      {/* Featured Sessions carousel — auto-rotating */}
      {featuredTracks.length > 0 &&
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-ui text-[11px] tracking-[2.5px] uppercase">Featured Sessions</p>
            <div className="flex gap-2">
              <button onClick={() => scrollCarousel(-1)} className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCarousel(1)} className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 justify-end mb-3">
            {featuredTracks.map((_: any, i: number) =>
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? "w-5 bg-accent" : "w-1.5 bg-surface-light"}`} />
            )}
          </div>
          <div ref={carouselRef} className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
            {featuredTracks.map((track: any) =>
            <Link key={track.id} to={`/player?trackId=${track.id}`} className="velum-card min-w-[260px] max-w-[300px] overflow-hidden shrink-0 snap-start">
                <div className="aspect-[16/9] bg-surface-light relative overflow-hidden">
                  {track.thumbnail_url && <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-accent text-[10px] font-sans font-bold tracking-wide uppercase mb-1">
                    {track.category?.replace("_", " ")}
                  </p>
                  <p className="text-foreground text-sm font-sans font-medium">{track.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-ui text-xs"><Clock className="w-3 h-3" /> {track.duration_minutes} min</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-accent/40 text-accent text-[10px] font-sans font-medium">
                      Begin →
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      }

      {/* Featured Courses */}
      {courses.length > 0 &&
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-ui text-[11px] tracking-[2.5px] uppercase">Featured Courses</p>
            <Link to="/library?tab=courses" className="text-accent text-xs font-sans">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 2).map((course: any) => {
              const courseTracks = (tracks as any[]).filter((t) => t.course_id === course.id);
              return (
                <Link key={course.id} to={`/course/${course.id}`} className="velum-card overflow-hidden">
                  <div className="aspect-[16/9] bg-surface-light relative">
                    {(course.cover_image_url || course.thumbnail_url) &&
                    <img src={course.cover_image_url || course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    }
                  </div>
                  <div className="p-4">
                    <p className="text-accent text-[10px] font-sans font-bold tracking-wide uppercase mb-1">
                      {course.category?.replace("_", " ") || "Course"}
                    </p>
                    <p className="text-foreground text-sm font-sans font-medium mb-1">{course.title}</p>
                    <p className="text-ui text-xs line-clamp-2 mb-3">{course.description}</p>
                    <div className="flex items-center gap-4 text-ui text-xs">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {courseTracks.length} sessions</span>
                    </div>
                  </div>
                </Link>);

            })}
          </div>
        </div>
        }

      {/* Continue Your Journey */}
      {nextTrack && progress.length > 0 &&
        <div className="mb-8">
          <p className="text-ui text-[11px] tracking-[2.5px] uppercase mb-4">Continue Your Journey</p>
          <div className="velum-card p-6">
            <h3 className="text-display text-xl mb-3">{nextTrack.title}</h3>
            <span className="text-foreground text-xs border border-foreground/20 rounded-full px-3 py-1 font-sans">{nextTrack.duration_minutes} min</span>
            <div className="mt-4">
              <Link to={`/player?trackId=${nextTrack.id}`} className="inline-block px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-bold">
                Continue →
              </Link>
            </div>
          </div>
        </div>
        }

      <SessionFinderModal open={finderOpen} onClose={() => setFinderOpen(false)} />
    </div>
    </div>);

}