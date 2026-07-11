import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { Wind, Flame, Heart, Sparkles, Feather, GraduationCap, ArrowRight, Zap, BookOpen, ClipboardCheck, Play, Timer as TimerIcon, X as XIcon, Film } from "lucide-react";
import { ShareCard } from "@/components/ShareCard";
import { useState, useRef } from "react";
import { getTodayCheckin } from "@/lib/velumStorage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOneSignalInit } from "@/hooks/useOneSignal";
import { format } from "date-fns";
import NervousSystemScore from "@/components/profile/NervousSystemScore";
import { usePaywall } from "@/components/PaywallSheet";
import { Lock } from "lucide-react";
import { MEDITATION_MADE_EASY_COURSE_ID } from "@/lib/constants";
import { currentDripDay } from "@/lib/course-drip";

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


// 7-day "Meditation Made Easy" lead-magnet CTA. Only shown to free-tier users
// who have an enrollment row. Premium users (full library) and admin/legacy
// users (no enrollment) don't see it.
function MeditationMadeEasyCard() {
  const { user, hasAccess } = useAuth();

  const { data: enrollment } = useQuery({
    queryKey: ["mme_enrollment", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("course_enrollments" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", MEDITATION_MADE_EASY_COURSE_ID)
        .maybeSingle();
      return data || null;
    },
    enabled: !!user,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["mme_lessons"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", MEDITATION_MADE_EASY_COURSE_ID)
        .order("day_index", { nullsFirst: false });
      return data || [];
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["mme_progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", MEDITATION_MADE_EASY_COURSE_ID);
      return data || [];
    },
    enabled: !!user,
  });

  // Hide for premium and unenrolled users
  if (hasAccess) return null;
  if (!enrollment) return null;
  if (lessons.length === 0) return null;

  const enrolledAt = new Date((enrollment as any).enrolled_at);
  // 3am-PT-anchored drip day — see src/lib/course-drip.ts. Every user globally
  // gets new content at 3am Pacific, lined up with the email send.
  const daysSinceEnrollment = currentDripDay(enrolledAt);
  const currentDay = Math.min(daysSinceEnrollment, 7);

  const completedIds = new Set(
    (lessonProgress as any[]).filter((p) => p.completed).map((p) => p.lesson_id),
  );
  const allCompleted =
    lessons.length > 0 && (lessons as any[]).every((l) => completedIds.has(l.id));

  if (allCompleted) {
    return (
      <Link
        to="/premium"
        className="velum-card mb-6 block p-5 border border-accent/40 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent"
      >
        <p className="text-eyebrow mb-1.5">You completed Meditation Made Easy</p>
        <p className="text-display text-xl mb-1">Unlock the full Velum library</p>
        <p className="text-muted-foreground text-xs font-sans flex items-center gap-1.5">
          See what's next <ArrowRight className="w-3.5 h-3.5" />
        </p>
      </Link>
    );
  }

  // Find today's lesson — first lesson with day_index === currentDay,
  // falling back to the next uncompleted lesson if day_index is absent.
  const todayLesson =
    (lessons as any[]).find((l) => l.day_index === currentDay) ||
    (lessons as any[]).find((l) => !completedIds.has(l.id)) ||
    (lessons as any[])[0];

  return (
    <Link
      to={`/course-v2?courseId=${MEDITATION_MADE_EASY_COURSE_ID}${todayLesson ? `&lessonId=${todayLesson.id}` : ""}`}
      className="velum-card mb-6 block p-5 border border-accent/40 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent active:scale-[0.99] transition-transform"
    >
      <p className="text-eyebrow mb-1.5">Your 7-day course is here</p>
      <p className="text-display text-xl leading-tight mb-2.5">Meditation Made Easy</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-sans font-medium truncate">
            Day {currentDay} of 7 · {todayLesson?.title || "Today's lesson"}
          </p>
          {todayLesson?.duration_minutes ? (
            <p className="text-muted-foreground text-[11px] font-sans mt-0.5">
              {todayLesson.duration_minutes} min
            </p>
          ) : null}
        </div>
        <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const todayCheckin = getTodayCheckin();
  const { user, profile, hasAccess } = useAuth();
  const { open: openPaywall } = usePaywall();
  const firstName = profile?.full_name?.split(" ")[0];
  // carousel refs removed

  // Initialize OneSignal push notifications
  useOneSignalInit(user?.id);

  // Onboarding redirect is handled by ProtectedRoute

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

  const { data: masteryCount = 0 } = useQuery({
    queryKey: ["mastery_classes", "count"],
    queryFn: async () => {
      const { count } = await supabase.from("mastery_classes").select("*", { count: "exact", head: true });
      return count || 0;
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses_v2", { publishedOnly: true }],
    queryFn: async () => {
      const { data } = await supabase.from("courses_v2").select("*").eq("is_published", true).order("order_index").limit(4);
      return data || [];
    }
  });

  const courseIds = courses.map((c: any) => c.id);
  const { data: courseLessonCounts = {} } = useQuery({
    queryKey: ["lessons", "counts", courseIds],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("id, course_id").in("course_id", courseIds);
      const counts: Record<string, number> = {};
      (data || []).forEach((l: any) => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; });
      return counts;
    },
    enabled: courseIds.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["user_progress", user?.id],
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
  map((c) => ({ ...c, icon: CATEGORY_ICONS[c.key] || Sparkles, count: c.key === "mastery" ? masteryCount : (categoryCounts[c.key] || 0), description: CATEGORY_DESCRIPTIONS[c.key] || "" }));

  const getCategoryLink = (key: string) => {
    if (key === "mastery") return "/library?tab=mastery";
    if (key === "journaling") return "/journal";
    if (key === "breathwork") return "/library?category=breathwork";
    if (key === "meditation") return "/library?category=meditation";
    if (key === "rapid_resets") return "/library?category=rapid_resets";
    if (key === "tapping") return "/library?category=tapping";
    return `/library?category=${key}`;
  };

  // featuredTracks removed — replaced by courses section
  const totalSessions = progress.length;
  const totalMinutes = progress.reduce((sum: number, p: any) => sum + (p.progress_seconds || 0), 0) / 60;

  const stressSessions = useMemo(() => progress.filter((p: any) => p.stress_before != null && p.stress_after != null), [progress]);
  const weeklyReductionPct = useMemo(() => {
    if (stressSessions.length === 0) return null;
    const avgBefore = stressSessions.reduce((s: number, p: any) => s + p.stress_before, 0) / stressSessions.length;
    const avgAfter = stressSessions.reduce((s: number, p: any) => s + p.stress_after, 0) / stressSessions.length;
    if (avgBefore === 0) return null;
    return Math.round(((avgBefore - avgAfter) / avgBefore) * 100);
  }, [stressSessions]);

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

  // ---- Weekly Share Card surface (Sundays) ----
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [showWeeklyBanner, setShowWeeklyBanner] = useState(false);

  const weeklyData = useMemo(() => {
    // Window: last 7 days inclusive of today
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const dayKeys: string[] = [];
    const dotIndexByKey: Record<string, number> = {};
    // Build last 7 days oldest→newest. Map to S M T W T F S using getDay()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dayKeys.push(key);
      dotIndexByKey[key] = d.getDay(); // 0=Sun..6=Sat
    }
    const weekDots: boolean[] = [false, false, false, false, false, false, false];
    let sessionsThisWeek = 0;
    let minutesThisWeek = 0;
    (progress as any[]).forEach((p) => {
      if (dayKeys.includes(p.completed_date)) {
        sessionsThisWeek++;
        minutesThisWeek += Math.round((p.progress_seconds || 0) / 60);
        const idx = dotIndexByKey[p.completed_date];
        if (idx != null) weekDots[idx] = true;
      }
    });
    return {
      sessionsThisWeek,
      minutesThisWeek,
      stressReductionPct: weeklyReductionPct,
      weekDots,
      streak,
    };
  }, [progress, weeklyReductionPct, streak]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    if (now.getDay() !== 0) return; // Sunday only
    // ISO week key: year-week
    const tmp = new Date(now);
    tmp.setHours(0, 0, 0, 0);
    tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
    const yearStart = new Date(tmp.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const key = `velum_last_weekly_card_${user.id}_${tmp.getFullYear()}_W${weekNo}`;
    if (!localStorage.getItem(key)) {
      setShowWeeklyBanner(true);
      // mark on first open or dismiss, not on render — but we need to dismiss the banner once seen
      (window as any).__velumWeeklyKey = key;
    }
  }, [user]);

  const dismissWeeklyBanner = () => {
    const key = (window as any).__velumWeeklyKey;
    if (key) localStorage.setItem(key, "1");
    setShowWeeklyBanner(false);
  };
  const openWeekly = () => {
    setWeeklyOpen(true);
    const key = (window as any).__velumWeeklyKey;
    if (key) localStorage.setItem(key, "1");
    setShowWeeklyBanner(false);
  };

  // carousel removed

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
    <div className="min-h-screen w-full max-w-full bg-radial-subtle overflow-x-hidden">
    <div className="mx-auto w-full max-w-3xl overflow-x-hidden px-4 pt-8 pb-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 min-w-0 w-full max-w-full">
        <h1 className="text-display text-3xl md:text-4xl leading-[1.1] text-foreground mb-5">
          {getGreeting()}{firstName ? <>, <span className="italic text-accent">{firstName}.</span></> : <span className="italic text-accent">.</span>}
        </h1>
        <p className="text-editorial max-w-full break-words text-[17px] leading-snug italic text-foreground/75 mb-2" style={{ overflowWrap: "break-word" }}>
          "{todayQuote.text}"
        </p>
        <p className="text-muted-foreground text-xs font-sans tracking-wide">— {todayQuote.author}</p>
      </div>

      {/* Meditation Made Easy — 7-day free course (free-tier users only) */}
      <MeditationMadeEasyCard />

      {/* Weekly share banner (Sundays only, dismissable) */}
      {showWeeklyBanner && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/35 bg-accent/10 px-4 py-3">
          <button onClick={openWeekly} className="flex-1 text-left">
            <p className="text-eyebrow mb-1">Your week in Velum</p>
            <p className="text-foreground text-sm font-sans">Tap to view your shareable weekly card →</p>
          </button>
          <button
            onClick={dismissWeeklyBanner}
            aria-label="Dismiss"
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-accent"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Trial banner removed (no more trials) */}


{/* Daily check-in card hidden for now */}
      {false && !todayCheckin && (
        <Link to="/checkin" className="velum-card mb-4 w-full p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4.5 h-4.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-sans font-medium">Daily Check-in</p>
            <p className="text-muted-foreground text-[11px]">Rate your nervous system · get a tool recommendation</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </Link>
      )}


      {/* Stats — show aspirational empty state instead of "0 streak" */}
      {totalSessions === 0 ? (
        <div className="mb-10 w-full rounded-2xl border border-accent/15 bg-accent/[0.03] p-5">
          <p className="text-eyebrow mb-2">Your first session</p>
          <p className="text-foreground text-sm font-sans leading-relaxed">
            You haven't started yet. Your nervous system doesn't need 20 minutes — <span className="text-accent font-medium">3 minutes today</span> beats 20 minutes tomorrow that never happens.
          </p>
        </div>
      ) : (
        <div className="mb-10 grid grid-cols-3 gap-2 w-full">
          {[
            { num: streak, label: "day streak", icon: Flame },
            { num: totalSessions, label: "sessions", icon: Sparkles },
            { num: Math.round(totalMinutes), label: "minutes", icon: Wind },
          ].map(({ num, label, icon: Icon }) =>
            <div key={label} className="velum-card-flat flex flex-col items-center justify-center gap-1 px-2 py-4">
              <Icon className="w-3.5 h-3.5 text-accent/60 mb-1" />
              <p className="text-display text-2xl leading-none">{num}</p>
              <span className="text-ui text-[10px] uppercase tracking-widest leading-tight">{label}</span>
            </div>
          )}
          {weeklyReductionPct !== null && (
            <div className="col-span-3 velum-card-flat flex items-center justify-center gap-2 px-3 py-2.5 mt-1 border-accent/25">
              <Heart className="w-3.5 h-3.5 shrink-0 text-accent" />
              <span className="text-ui text-xs"><span className="text-accent font-semibold">{weeklyReductionPct}%</span> average stress reduction this week</span>
            </div>
          )}
        </div>
      )}

      {/* Tools grid — 2×2 */}
      <div className="mb-10 min-w-0 w-full">
        <div className="flex items-center justify-between mb-4">
          <p className="text-eyebrow">The Toolkit</p>
          <span className="text-ui text-[10px] tracking-wider uppercase opacity-60">Interactive</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/breathe", icon: Wind, name: "Breathwork", sub: "8 techniques · voice-guided", primary: true, premium: false },
            { to: "/timer", icon: TimerIcon, name: "Open Meditation", sub: "Set a duration and sit.", primary: true, premium: false },
            { to: "/bilateral", icon: Zap, name: "Bilateral", sub: "Visual + stereo audio", premium: true },
            // Vision Lab — hidden from the public Home grid until launch.
            // Route still exists at /vision for testing via direct URL.
          ].map(({ to, icon: Icon, name, sub, primary, premium }) => {
            const locked = premium && !hasAccess;
            const inner = (
              <>
                {locked && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
                    <Lock className="w-2.5 h-2.5" /> Premium
                  </span>
                )}
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-foreground text-[15px] font-semibold tracking-tight">{name}</p>
                  <p className="text-ui text-[11px] mt-1 tracking-wide">{sub}</p>
                </div>
              </>
            );
            const className = `velum-card relative p-5 flex flex-col justify-between min-h-[140px] group transition-all text-left ${primary ? "border-accent/30 bg-accent/[0.04]" : ""} ${locked ? "opacity-95" : ""}`;
            if (locked) {
              return (
                <button key={to} type="button" onClick={openPaywall} className={className}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={to} to={to} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Find your session — guided finder */}
      <div className="mb-10 min-w-0 w-full">
        <Link to="/finder" className="velum-card flex items-center gap-4 px-5 py-4 group hover:border-accent/30 transition-colors w-full">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-[15px] font-semibold tracking-tight">Find your session</p>
            <p className="text-ui text-[11px] mt-0.5 tracking-wide">Tell us how you feel — we'll match the practice</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Library — single CTA; the new Library page handles browsing */}
      <div className="mb-10 min-w-0 w-full">
        <Link
          to="/library"
          className="velum-card flex items-center gap-4 px-5 py-4 group hover:border-accent/30 transition-colors w-full"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-[15px] font-semibold tracking-tight">Browse the Library</p>
            <p className="text-ui text-[11px] mt-0.5 tracking-wide">Meditations, tapping, quests, mastery & more</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Today's Reflection — kept intentionally neutral (no gold) so the prompt + the user's writing carry the weight, not branding */}
      <div className="mb-10 min-w-0 w-full max-w-full">
        <div className="mb-4 flex flex-wrap gap-6 items-center">
          <p className="text-[10px] font-medium tracking-[0.28em] uppercase text-muted-foreground">Today's Reflection</p>
          <Link to="/journal" className="text-muted-foreground/70 text-[10px] tracking-[0.2em] uppercase hover:text-foreground transition-colors">Past entries →</Link>
        </div>
        <div className="velum-card w-full max-w-full min-w-0 p-6">
          <p className="text-muted-foreground/60 mb-4 text-[10px] font-medium tracking-[0.2em] uppercase tabular-nums">
            {format(new Date(), "EEE · MMMM d")}
          </p>
          <p className="text-editorial text-foreground mb-5 max-w-full break-words text-xl italic leading-snug">"{todayPrompt}"</p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Take a breath, then write freely…"
            className="mb-4 h-28 w-full max-w-full rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-shadow bg-background/80 border border-border text-foreground placeholder:text-muted-foreground/40"
          />

          {user &&
            <div className="flex justify-end">
              <button
                onClick={handleSaveReflection}
                disabled={!reflectionText.trim() || savingReflection}
                className="rounded-full border border-foreground/20 hover:border-foreground/40 px-5 py-2.5 text-xs font-medium tracking-wide text-foreground disabled:opacity-30 disabled:border-border disabled:text-muted-foreground transition-all">
                Save reflection →
              </button>
            </div>
          }
        </div>
      </div>

      {/* Featured Courses — visible to everyone; per-item locks for free users */}
      {courses.length > 0 &&
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-ui text-[11px] tracking-[2.5px] uppercase">Featured Courses</p>
            <Link to="/library?tab=courses" className="text-accent text-xs font-sans">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 2).map((course: any) => {
              const lessonCount = (courseLessonCounts as Record<string, number>)[course.id] || 0;
              const isLocked = !course.is_free && !hasAccess;
              const body = (
                <>
                  <div className="aspect-[16/9] bg-surface-light relative">
                    {(course.cover_image_url || course.thumbnail_url) &&
                    <img src={course.cover_image_url || course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    }
                    {isLocked && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
                        <Lock className="w-2.5 h-2.5" /> $8/mo
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-accent text-[10px] font-sans font-bold tracking-wide uppercase mb-1">
                      {course.category?.replace("_", " ") || "Course"}
                    </p>
                    <p className="text-foreground text-sm font-sans font-medium mb-1">{course.title}</p>
                    <p className="text-ui text-xs line-clamp-2 mb-3">{course.description}</p>
                    <div className="flex items-center gap-4 text-ui text-xs">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lessonCount} lessons</span>
                    </div>
                  </div>
                </>
              );
              if (isLocked) {
                return (
                  <button key={course.id} type="button" onClick={openPaywall} className="velum-card overflow-hidden text-left">{body}</button>
                );
              }
              return (
                <Link key={course.id} to={`/course-v2?courseId=${course.id}`} className="velum-card overflow-hidden">{body}</Link>
              );
            })}
          </div>
        </div>
        }

      {/* Continue Your Journey — per-item lock honors track.is_free */}
      {nextTrack && progress.length > 0 &&
        (() => {
          const lockedNext = !(nextTrack as any).is_free && !hasAccess;
          return (
            <div className="mb-8">
              <p className="text-ui text-[11px] tracking-[2.5px] uppercase mb-4">Continue Your Journey</p>
              <div className="velum-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-display text-xl">{nextTrack.title}</h3>
                  {lockedNext && <Lock className="w-3.5 h-3.5 text-accent" />}
                </div>
                <span className="text-foreground text-xs border border-foreground/20 rounded-full px-3 py-1 font-sans">{nextTrack.duration_minutes} min</span>
                <div className="mt-4">
                  {lockedNext ? (
                    <button type="button" onClick={openPaywall} className="inline-block px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-bold">
                      Unlock to continue →
                    </button>
                  ) : (
                    <Link to={`/player?trackId=${nextTrack.id}`} className="inline-block px-5 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-bold">
                      Continue →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })()
        }

      {/* Nervous System Score — premium only */}
      {hasAccess ? (
        <NervousSystemScore />
      ) : (
        <button
          onClick={openPaywall}
          className="velum-card w-full p-6 text-left flex items-center gap-4 group active:scale-[0.99] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-sans font-medium">Nervous System Score</p>
            <p className="text-muted-foreground text-[11px]">Track stress before/after each session · Premium</p>
          </div>
          <ArrowRight className="w-4 h-4 text-accent shrink-0" />
        </button>
      )}

    </div>
    <ShareCard
      open={weeklyOpen}
      onClose={() => setWeeklyOpen(false)}
      variant="weekly"
      data={weeklyData}
    />
    </div>);

}