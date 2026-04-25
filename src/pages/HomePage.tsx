import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { Wind, Flame, Heart, Sparkles, Feather, GraduationCap, ArrowRight, Zap, BookOpen, ClipboardCheck, Clock, Hand, Fingerprint, Play, Pause, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getTodayCheckin } from "@/lib/velumStorage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessionFinder } from "@/contexts/SessionFinderContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOneSignalInit } from "@/hooks/useOneSignal";
import { format } from "date-fns";
import NervousSystemScore from "@/components/profile/NervousSystemScore";

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

const HOME_BACKING_URL = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/backing-tracks/Binaural%20Loop%201.wav";

// Defensive wrapper — if anything inside CustomTrackHomeTile throws, the rest of Home still renders
class TileErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error("CustomTrackHomeTile crashed:", err);
  }
  render() {
    if (this.state.hasError) {
      // Fallback links to /audios (the library) — NOT /custom-track (which is the create flow).
      // From /audios the user can play any existing track or create a new one.
      return (
        <Link to="/audios" className="velum-card mb-4 w-full p-5 flex items-center gap-4 border border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-foreground text-sm font-sans font-medium">My Audio Library</p>
            <p className="text-muted-foreground text-[11px]">Open your custom tracks</p>
          </div>
          <ArrowRight className="w-4 h-4 text-accent shrink-0" />
        </Link>
      );
    }
    return this.props.children;
  }
}

function CustomTrackHomeTile() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [listens, setListens] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [bgVol] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_bg_vol") || "0.14");
    return isNaN(v) ? 0.14 : v;
  });

  // Audio refs
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);
  const recordedRef = useRef<Set<string>>(new Set());

  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [voiceRate] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_voice_rate") || "0.95");
    return isNaN(v) ? 0.95 : v;
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("custom_tracks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data || []) as any[];
      setTracks(list);
      if (list.length > 0) {
        const urls: Record<string, string> = {};
        for (const t of list) {
          if (!t.audio_url) continue;
          const { data: s } = await supabase.storage
            .from("custom-tracks")
            .createSignedUrl(t.audio_url, 3600);
          if (s?.signedUrl) urls[t.id] = s.signedUrl;
        }
        setSignedUrls(urls);
        const ids = list.map((t) => t.id);
        const { data: ls } = await supabase
          .from("custom_track_listens" as any)
          .select("track_id, listened_date")
          .in("track_id", ids);
        const m: Record<string, Set<string>> = {};
        (ls || []).forEach((l: any) => {
          if (!m[l.track_id]) m[l.track_id] = new Set();
          m[l.track_id].add(l.listened_date);
        });
        setListens(m);
      }
      setLoading(false);
    })();
  }, [user]);

  // Lazy-load backing buffer
  const ensureBacking = async () => {
    if (bufferRef.current) return;
    if (loadingRef.current) return loadingRef.current;
    loadingRef.current = (async () => {
      try {
        const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = bgVol;
        gain.connect(ctx.destination);
        gainRef.current = gain;
        const res = await fetch(HOME_BACKING_URL);
        const arr = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        bufferRef.current = buf;
      } catch {}
    })();
    return loadingRef.current;
  };
  const startBacking = async () => {
    await ensureBacking();
    const ctx = audioCtxRef.current; const buf = bufferRef.current; const gain = gainRef.current;
    if (!ctx || !buf || !gain) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (sourceRef.current) return;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = buf.duration; src.connect(gain); src.start();
    sourceRef.current = src;
  };
  const stopBacking = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
  };
  useEffect(() => () => { stopBacking(); audioCtxRef.current?.close().catch(() => {}); }, []);

  // Switch tracks: stop current playback
  const switchTo = (newIdx: number) => {
    if (voiceRef.current) {
      voiceRef.current.pause();
      voiceRef.current.currentTime = 0;
    }
    stopBacking();
    setPlaying(false);
    setCurTime(0);
    setDur(0);
    setIdx(newIdx);
  };

  if (loading) return null;

  // No tracks yet — promo state
  if (tracks.length === 0) {
    return (
      <Link
        to="/custom-track"
        className="velum-card mb-6 w-full p-7 block border border-accent/45 bg-gradient-to-br from-accent/15 via-accent/8 to-transparent shadow-xl shadow-accent/10 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-eyebrow text-accent">Built for you · Included</p>
          </div>
          <p className="text-foreground text-[1.7rem] md:text-[2rem] font-serif font-light leading-[1.15] mb-3 max-w-[440px]">
            10 minutes a day for 21 days, written for the exact thing keeping you stuck.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-[440px]">
            A short conversation. A custom rewiring audio in your chosen voice. Listen daily — your nervous system rewires itself.
          </p>
          <span className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-5 py-2.5 text-xs font-semibold tracking-wide">
            Begin your track <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    );
  }

  const t = tracks[idx];
  const created = new Date(t.created_at); created.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  const dayInProgram = Math.min(21, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1);
  const todayKey = new Date().toISOString().slice(0, 10);
  const trackListens = listens[t.id] || new Set();

  const togglePlay = async () => {
    const v = voiceRef.current;
    if (!v) return;
    if (v.paused) {
      v.playbackRate = voiceRate;
      await v.play();
      await startBacking();
      setPlaying(true);
    } else {
      v.pause();
      stopBacking();
      setPlaying(false);
    }
  };

  const onTimeUpdate = async (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const ct = e.currentTarget.currentTime;
    setCurTime(ct);
    const todayK = t.id + ":" + new Date().toISOString().slice(0, 10);
    if (ct >= 30 && !recordedRef.current.has(todayK)) {
      recordedRef.current.add(todayK);
      await supabase.rpc("record_track_listen" as any, { p_track_id: t.id, p_seconds: Math.round(ct) });
      setListens((prev) => {
        const cp = { ...prev };
        const set = new Set(cp[t.id] || []);
        set.add(new Date().toISOString().slice(0, 10));
        cp[t.id] = set;
        return cp;
      });
    }
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="velum-card-accent mb-6 w-full p-6 relative overflow-hidden">
      {/* Top eyebrow + carousel */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <p className="text-eyebrow text-accent">
            {trackListens.has(todayKey) ? `✓ Done · Day ${dayInProgram} of 21` : `Today · Day ${dayInProgram} of 21`}
          </p>
        </div>
        {tracks.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => switchTo((idx - 1 + tracks.length) % tracks.length)}
              className="w-7 h-7 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/10"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-muted-foreground text-[10px] font-sans tracking-wider min-w-[28px] text-center">
              {idx + 1}/{tracks.length}
            </span>
            <button
              onClick={() => switchTo((idx + 1) % tracks.length)}
              className="w-7 h-7 rounded-full border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/10"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-foreground font-serif text-2xl md:text-3xl font-normal leading-tight mb-5">{t.title}</p>

      <div className="relative">
        {/* Inline player */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center shrink-0 shadow-lg shadow-accent/30 active:scale-95 transition-transform"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="w-6 h-6 text-primary-foreground" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: dur > 0 ? `${(curTime / dur) * 100}%` : "0%" }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] tracking-wider text-muted-foreground font-sans">
              <span>{fmtTime(curTime)}</span>
              <span>{dur > 0 ? fmtTime(dur) : (t.duration_sec ? fmtTime(t.duration_sec) : "—")}</span>
            </div>
          </div>
        </div>

        {/* 21-day checkmark progress */}
        <div className="flex gap-1.5 justify-between">
          {Array.from({ length: 21 }).map((_, i) => {
            const dayDate = new Date(created);
            dayDate.setDate(created.getDate() + i);
            const dayKey = dayDate.toISOString().slice(0, 10);
            const listened = trackListens.has(dayKey);
            const isPast = dayDate < today;
            const isToday = dayKey === todayKey;
            return (
              <div
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                  listened
                    ? "bg-accent text-primary-foreground"
                    : isToday
                      ? "border-2 border-accent/70 bg-accent/10 ring-2 ring-accent/30 animate-pulse"
                      : isPast
                        ? "border border-destructive/30"
                        : "border border-foreground/15"
                }`}
                title={`Day ${i + 1}${listened ? " · listened" : isToday ? " · today" : isPast ? " · missed" : ""}`}
              >
                {listened && <Check className="w-3 h-3" strokeWidth={3} />}
              </div>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-accent/10">
          <Link to="/audios" className="text-muted-foreground text-[11px] hover:text-accent transition-colors flex items-center gap-1">
            View Audio Library
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link to="/custom-track" className="text-accent text-[11px] hover:underline">
            + New track
          </Link>
        </div>

        {/* Hidden audio element driving playback */}
        {signedUrls[t.id] && (
          <audio
            ref={voiceRef}
            src={signedUrls[t.id]}
            preload="metadata"
            onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
            onTimeUpdate={onTimeUpdate}
            onEnded={() => { setPlaying(false); stopBacking(); }}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { setOpen: setFinderOpen } = useSessionFinder();
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const todayCheckin = getTodayCheckin();
  const { user, profile, isInTrial, trialDaysLeft, hasAccess } = useAuth();
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

      {/* HERO — Custom Track is the anchor of Today (wrapped so any crash falls back gracefully) */}
      <TileErrorBoundary>
        <CustomTrackHomeTile />
      </TileErrorBoundary>

      {/* Trial countdown banner */}
      {isInTrial && (
        <Link to="/premium" className={`velum-card mb-4 w-full p-4 flex items-center gap-4 ${trialDaysLeft <= 2 ? "border border-accent/40" : ""}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${trialDaysLeft <= 2 ? "gold-gradient" : "bg-surface-light"}`}>
            <Clock className={`w-4 h-4 ${trialDaysLeft <= 2 ? "text-primary-foreground" : "text-accent"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-sans font-medium">
              {trialDaysLeft <= 0 ? "Your trial ends today" : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left in your trial`}
            </p>
            <p className="text-muted-foreground text-[11px]">Annual plan · $99/yr · save 57% →</p>
          </div>
        </Link>
      )}


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
          <p className="text-eyebrow">Real-time tools</p>
          <span className="text-ui text-[10px] tracking-wider uppercase opacity-60">Interactive</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/breathe", icon: Wind, name: "Breathwork", sub: "6 techniques · live pacing", primary: true },
            { to: "/bilateral", icon: Zap, name: "Bilateral", sub: "Visual + stereo audio" },
            { to: "/tapping", icon: Heart, name: "Tapping", sub: "EFT · Guided sequences" },
            { to: "/somatic-touch", icon: Fingerprint, name: "Somatic", sub: "Grounding sequences" },
          ].map(({ to, icon: Icon, name, sub, primary }) => (
            <Link
              key={to}
              to={to}
              className={`velum-card p-5 flex flex-col justify-between min-h-[140px] group transition-all ${primary ? "border-accent/30 bg-accent/[0.04]" : ""}`}
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-foreground text-[15px] font-semibold tracking-tight">{name}</p>
                <p className="text-ui text-[11px] mt-1 tracking-wide">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Library quick links */}
      <div className="mb-10 min-w-0 w-full">
        <p className="text-eyebrow mb-4">The Library</p>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Meditation", count: categoryCounts["meditation"] || 0, to: "/library?category=meditation" },
            { label: "Rapid Resets", count: categoryCounts["rapid_resets"] || 0, to: "/library?category=rapid_resets" },
            { label: "Mastery Classes", count: masteryCount, to: "/library?tab=mastery" },
            { label: "Courses", count: courses.length, to: "/courses" },
          ].map(({ label, count, to }) => (
            <Link key={to} to={to} className="velum-card-flat flex items-center justify-between px-4 py-3.5 group hover:border-accent/25 transition-colors">
              <p className="text-foreground text-sm font-medium">{label}</p>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground/70 text-xs tabular-nums">{count}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Reflection */}
      <div className="mb-10 min-w-0 w-full max-w-full">
        <div className="mb-4 flex flex-wrap gap-6 items-center">
          <p className="text-eyebrow">Today's Reflection</p>
          <Link to="/journal" className="text-muted-foreground/70 text-[10px] tracking-[0.2em] uppercase hover:text-accent transition-colors">Past entries →</Link>
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
            className="mb-4 h-28 w-full max-w-full rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow bg-background/80 border border-border text-foreground placeholder:text-muted-foreground/40"
          />

          {user &&
            <div className="flex justify-end">
              <button
                onClick={handleSaveReflection}
                disabled={!reflectionText.trim() || savingReflection}
                className="rounded-full border border-accent/30 hover:border-accent px-5 py-2.5 text-xs font-medium tracking-wide text-accent disabled:opacity-30 disabled:border-border disabled:text-muted-foreground transition-all">
                Save reflection →
              </button>
            </div>
          }
        </div>
      </div>

      {/* Featured Courses */}
      {courses.length > 0 &&
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-ui text-[11px] tracking-[2.5px] uppercase">Featured Courses</p>
            <Link to="/library?tab=courses" className="text-accent text-xs font-sans">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 2).map((course: any) => {
              const lessonCount = (courseLessonCounts as Record<string, number>)[course.id] || 0;
              return (
                <Link key={course.id} to={`/course-v2?courseId=${course.id}`} className="velum-card overflow-hidden">
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
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lessonCount} lessons</span>
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

      {/* Nervous System Score */}
      <NervousSystemScore />

    </div>
    </div>);

}