import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Play,
  ChevronLeft,
  Lock,
  Check,
  X as XIcon,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePaywall } from "@/components/PaywallSheet";
import { TrackCover, coverUrlFor } from "@/components/TrackCover";

/* -------------------------------------------------------------------------- */
/*  Shortcut pill definitions                                                 */
/*  Match against the `tags` jsonb array on `tracks` (lowercased fuzzy        */
/*  contains). Multiple synonyms per pill so it works even when tag           */
/*  vocabularies drift.                                                       */
/* -------------------------------------------------------------------------- */
const SHORTCUTS: { key: string; label: string; match: string[] }[] = [
  { key: "anxiety",     label: "Anxiety",     match: ["anxiety", "anxious", "calm", "state:stuck"] },
  { key: "sleep",       label: "Sleep",       match: ["sleep", "rest", "wind down", "wind-down"] },
  { key: "morning",     label: "Morning",     match: ["morning", "energize", "energy", "goal:energize"] },
  { key: "stress",      label: "Stress",      match: ["stress", "overwhelm", "regulate", "reset"] },
  { key: "confidence",  label: "Confidence",  match: ["confidence", "goal:confidence", "self-worth"] },
  { key: "money",       label: "Money",       match: ["money", "abundance", "scarcity", "wealth"] },
  { key: "focus",       label: "Focus",       match: ["focus", "concentration", "clarity", "productivity"] },
  { key: "letting_go",  label: "Letting Go",  match: ["letting go", "release", "surrender", "process", "goal:process"] },
];

/* -------------------------------------------------------------------------- */
/*  Category card definitions                                                 */
/* -------------------------------------------------------------------------- */
type CategoryKey =
  | "meditation"
  | "tapping"
  | "breathwork"
  | "rapid_resets"
  | "journaling"
  | "quests"
  | "mastery"
  | "custom";

const CATEGORY_CARDS: { key: CategoryKey; label: string; coverSlug: string }[] = [
  { key: "meditation",   label: "Meditations",     coverSlug: "12-cosmic" },
  { key: "tapping",      label: "Tapping (EFT)",   coverSlug: "09-flame" },
  { key: "breathwork",   label: "Breathwork",      coverSlug: "07-sky" },
  { key: "rapid_resets", label: "Rapid Resets",    coverSlug: "18-rain" },
  { key: "journaling",   label: "Journaling",      coverSlug: "15-feather" },
  { key: "quests",       label: "Quests",          coverSlug: "14-path" },
  { key: "mastery",      label: "Mastery Classes", coverSlug: "16-mountains" },
  { key: "custom",       label: "Custom Hypnosis", coverSlug: "20-moon" },
];

const COVER_BASE =
  "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/track-covers";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function tagsFor(track: any): string[] {
  const t = track?.tags;
  if (!t) return [];
  if (Array.isArray(t)) return t.map((s) => String(s).toLowerCase());
  return [];
}

function goalsFor(track: any): string[] {
  const g = track?.goals;
  if (!g) return [];
  if (Array.isArray(g)) return g.map((s) => String(s).toLowerCase());
  return [];
}

function trackMatchesShortcut(track: any, shortcutKey: string): boolean {
  const sc = SHORTCUTS.find((s) => s.key === shortcutKey);
  if (!sc) return false;
  const haystack = [
    ...tagsFor(track),
    ...goalsFor(track),
    String(track.category || "").toLowerCase(),
    String(track.title || "").toLowerCase(),
    String(track.description || "").toLowerCase(),
  ].join(" ");
  return sc.match.some((needle) => haystack.includes(needle.toLowerCase()));
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function LibraryPage() {
  const { user, hasAccess, profile } = useAuth();
  const { open: openPaywall } = usePaywall();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category") as CategoryKey | null;

  const [shortcut, setShortcut] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  /* ----------------------------- Data ----------------------------- */
  const { data: tracks = [] } = useQuery({
    queryKey: ["library:tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["library:courses_v2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses_v2")
        .select("*")
        .eq("is_published", true)
        .order("order_index");
      return data || [];
    },
  });

  const { data: masteryClasses = [] } = useQuery({
    queryKey: ["library:mastery_classes"],
    queryFn: async () => {
      const { data } = await supabase.from("mastery_classes").select("*").order("order_index");
      return data || [];
    },
  });

  // Catalog-wide play counts. Aggregate in memory — table is small enough for v1.
  const { data: playCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["library:play_counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("track_id")
        .limit(5000);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        if (!r.track_id) return;
        counts[r.track_id] = (counts[r.track_id] || 0) + 1;
      });
      return counts;
    },
  });

  /* ---------------------- Derived collections --------------------- */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (tracks as any[]).forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [tracks]);

  const popularTracks = useMemo(() => {
    const sorted = [...(tracks as any[])].sort((a, b) => {
      const ca = playCounts[a.id] || 0;
      const cb = playCounts[b.id] || 0;
      return cb - ca;
    });
    // Only keep tracks with at least 1 play — hide section entirely if none
    return sorted.filter((t) => (playCounts[t.id] || 0) > 0).slice(0, 6);
  }, [tracks, playCounts]);

  const recommendedTracks = useMemo(() => {
    const userGoals: string[] = Array.isArray(profile?.onboarding_answers?.goals)
      ? profile!.onboarding_answers!.goals.map((g: any) => String(g).toLowerCase())
      : [];

    if (userGoals.length === 0) {
      // cold-start: latest 6 tracks
      return [...(tracks as any[])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6);
    }

    const scored = (tracks as any[]).map((t) => {
      const ttags = tagsFor(t);
      const tgoals = goalsFor(t);
      const cat = String(t.category || "").toLowerCase();
      let score = 0;
      for (const g of userGoals) {
        if (tgoals.includes(g)) score += 3;
        if (ttags.some((tag) => tag.includes(g))) score += 2;
        if (cat.includes(g)) score += 1;
      }
      return { t, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const ranked = scored.filter((s) => s.score > 0).map((s) => s.t);
    if (ranked.length >= 6) return ranked.slice(0, 6);
    // top-up with latest tracks
    const need = 6 - ranked.length;
    const haveIds = new Set(ranked.map((t) => t.id));
    const fillers = [...(tracks as any[])]
      .filter((t) => !haveIds.has(t.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, need);
    return [...ranked, ...fillers];
  }, [tracks, profile]);

  /* --------------------------- Filtering -------------------------- */
  const tracksForCategory = (cat: CategoryKey): any[] => {
    if (cat === "quests" || cat === "mastery" || cat === "custom") return [];
    return (tracks as any[]).filter((t) => t.category === cat);
  };

  const filteredCategoryTracks = useMemo(() => {
    if (!categoryParam) return [];
    let list = tracksForCategory(categoryParam);
    if (shortcut) list = list.filter((t) => trackMatchesShortcut(t, shortcut));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [categoryParam, tracks, shortcut, search]);

  // Filter that applies to the main carousels/landing
  const shortcutFilter = (list: any[]) => {
    if (!shortcut) return list;
    return list.filter((t) => trackMatchesShortcut(t, shortcut));
  };
  const searchFilter = (list: any[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q),
    );
  };

  /* ----------------------------- UI ------------------------------- */
  const goToCategory = (key: CategoryKey) => {
    if (key === "custom") {
      navigate("/custom-track");
      return;
    }
    if (key === "quests") {
      setSearchParams({ category: "quests" });
      return;
    }
    if (key === "mastery") {
      setSearchParams({ category: "mastery" });
      return;
    }
    setSearchParams({ category: key });
  };

  const clearCategory = () => {
    setSearchParams({});
    setSearch("");
  };

  /* -------------------- Track/Course renderers -------------------- */
  const TrackCard = ({ track, big = false }: { track: any; big?: boolean }) => {
    const isLocked = !track.is_free && !hasAccess;
    const body = (
      <div
        className={`relative overflow-hidden rounded-2xl border border-accent/20 bg-[hsl(156,52%,9%)] ${
          big ? "w-[260px] shrink-0" : "w-full"
        }`}
      >
        <div className={big ? "aspect-[4/5]" : "aspect-square"}>
          <TrackCover
            trackId={track.id}
            title={track.title}
            size="hero"
            rounded="lg"
            showTitle
            className="!rounded-none !border-0 !w-full !h-full !aspect-auto"
          />
        </div>
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className="inline-flex items-center rounded-full bg-black/40 backdrop-blur border border-white/10 px-2 py-0.5 text-[9px] font-sans font-semibold text-foreground/85 tracking-wide uppercase">
            {String(track.category || "").replace("_", " ")}
          </span>
          {isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full gold-gradient flex items-center justify-center shadow-lg">
          <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
        </div>
        {track.duration_minutes ? (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center rounded-full bg-black/40 backdrop-blur border border-white/10 px-2 py-0.5 text-[10px] font-sans font-medium text-foreground/85">
              {track.duration_minutes} min
            </span>
          </div>
        ) : null}
      </div>
    );

    if (isLocked) {
      return (
        <button type="button" onClick={openPaywall} className="text-left">
          {body}
        </button>
      );
    }
    return (
      <Link to={`/player?trackId=${track.id}`} className="block">
        {body}
      </Link>
    );
  };

  const TrackRow = ({ track }: { track: any }) => {
    const isLocked = !track.is_free && !hasAccess;
    const body = (
      <div className="velum-card flex items-center gap-3 p-3 w-full">
        <TrackCover trackId={track.id} title={track.title} size="md" rounded="xl" />
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-sans font-medium leading-tight truncate">
            {track.title}
          </p>
          {track.description && (
            <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2 leading-snug">
              {track.description}
            </p>
          )}
          <p className="text-ui text-[10px] mt-1">{track.duration_minutes} min</p>
        </div>
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/30 px-2 py-1 text-[10px] font-sans font-semibold text-accent shrink-0">
            <Lock className="w-2.5 h-2.5" /> Premium
          </span>
        ) : (
          <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        )}
      </div>
    );
    if (isLocked) {
      return (
        <button type="button" onClick={openPaywall} className="text-left w-full">
          {body}
        </button>
      );
    }
    return (
      <Link to={`/player?trackId=${track.id}`} className="block w-full">
        {body}
      </Link>
    );
  };

  const CourseCard = ({ course, big = false }: { course: any; big?: boolean }) => {
    const isLocked = !course.is_free && !hasAccess;
    const body = (
      <div
        className={`relative overflow-hidden rounded-2xl border border-accent/20 bg-[hsl(156,52%,9%)] ${
          big ? "w-[260px] shrink-0" : "w-full"
        }`}
      >
        <div className={big ? "aspect-[4/5]" : "aspect-square"}>
          {course.cover_image_url ? (
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,_hsl(var(--card)),_hsl(var(--background)))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent mb-1">Quest</p>
            <p
              className="text-foreground font-serif text-lg leading-tight drop-shadow-2xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {course.title}
            </p>
          </div>
        </div>
        {isLocked && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
            <Lock className="w-2.5 h-2.5" /> Premium
          </span>
        )}
      </div>
    );
    if (isLocked) {
      return (
        <button type="button" onClick={openPaywall} className="text-left">
          {body}
        </button>
      );
    }
    return (
      <Link to={`/course-v2?courseId=${course.id}`} className="block">
        {body}
      </Link>
    );
  };

  const MasteryCard = ({ mc, big = false }: { mc: any; big?: boolean }) => {
    const isLocked = !mc.is_free && !hasAccess;
    const cover = mc.cover_image_url_16_9 || mc.thumbnail_url || mc.cover_image_url;
    const body = (
      <div
        className={`relative overflow-hidden rounded-2xl border border-accent/20 bg-[hsl(156,52%,9%)] ${
          big ? "w-[260px] shrink-0" : "w-full"
        }`}
      >
        <div className={big ? "aspect-[4/5]" : "aspect-square"}>
          {cover ? (
            <img src={cover} alt={mc.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,_hsl(var(--card)),_hsl(var(--background)))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent mb-1">Mastery Class</p>
            <p
              className="text-foreground font-serif text-lg leading-tight drop-shadow-2xl"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {mc.title}
            </p>
          </div>
        </div>
        {isLocked && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur-sm border border-accent/30 px-2 py-0.5 text-[9px] font-sans font-semibold text-accent tracking-wide">
            <Lock className="w-2.5 h-2.5" /> Premium
          </span>
        )}
      </div>
    );
    if (isLocked) {
      return (
        <button type="button" onClick={openPaywall} className="text-left">
          {body}
        </button>
      );
    }
    return (
      <Link to={`/mastery-player?id=${mc.id}`} className="block">
        {body}
      </Link>
    );
  };

  /* ----------------------------- Header --------------------------- */
  const Header = (
    <div
      className="flex items-center justify-between mb-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        onClick={() => navigate("/home")}
        className="-ml-1 inline-flex items-center gap-1 text-muted-foreground/80 hover:text-accent text-xs tracking-wide transition-colors"
        aria-label="Back to home"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Home</span>
      </button>
      <button
        onClick={() => setSearchOpen((v) => !v)}
        className="w-9 h-9 rounded-full border border-accent/20 flex items-center justify-center text-foreground/80 hover:text-accent hover:border-accent/40 transition-colors"
        aria-label={searchOpen ? "Close search" : "Open search"}
      >
        {searchOpen ? <XIcon className="w-4 h-4" /> : <Search className="w-4 h-4" />}
      </button>
    </div>
  );

  /* ------------------ Filtered category view (?category=) ----------- */
  if (categoryParam) {
    const isQuests = categoryParam === "quests";
    const isMastery = categoryParam === "mastery";
    const cat = CATEGORY_CARDS.find((c) => c.key === categoryParam);

    return (
      <div className="min-h-screen w-full bg-radial-subtle overflow-x-hidden">
        <div className="mx-auto w-full max-w-3xl px-4 lg:px-8 pt-6 pb-12">
          {Header}

          <button
            onClick={clearCategory}
            className="mb-4 inline-flex items-center gap-1 text-foreground/80 hover:text-accent text-xs tracking-wide transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>

          <h1
            className="text-display text-[2.4rem] leading-[1.05] mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {cat?.label || categoryParam}
          </h1>
          <p className="text-muted-foreground text-sm font-sans mb-6">
            {isQuests
              ? `${courses.length} quests`
              : isMastery
              ? `${masteryClasses.length} mastery classes`
              : `${filteredCategoryTracks.length} sessions`}
          </p>

          {searchOpen && (
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-[hsl(156,52%,14%)] border border-accent/22 rounded-xl pl-11 pr-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/45 transition-colors"
              />
            </div>
          )}

          {isQuests ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-2 text-center py-12">
                  No quests yet.
                </p>
              ) : (
                courses.map((c: any) => <CourseCard key={c.id} course={c} />)
              )}
            </div>
          ) : isMastery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masteryClasses.length === 0 ? (
                <p className="text-muted-foreground text-sm col-span-2 text-center py-12">
                  No mastery classes yet.
                </p>
              ) : (
                masteryClasses.map((mc: any) => <MasteryCard key={mc.id} mc={mc} />)
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredCategoryTracks.length === 0 ? (
                <div className="velum-card p-10 text-center">
                  <p className="text-foreground font-serif text-lg mb-2">Coming soon</p>
                  <p className="text-muted-foreground text-sm">
                    New {cat?.label?.toLowerCase()} sessions are on the way.
                  </p>
                </div>
              ) : (
                filteredCategoryTracks.map((t: any) => <TrackRow key={t.id} track={t} />)
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------- Landing --------------------------- */
  // Apply shortcut + search filters globally to carousels
  const popularDisplay = searchFilter(shortcutFilter(popularTracks));
  const recommendedDisplay = searchFilter(shortcutFilter(recommendedTracks));

  return (
    <div className="min-h-screen w-full bg-radial-subtle overflow-x-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 lg:px-8 pt-6 pb-12">
        {Header}

        <h1
          className="text-display text-[2.6rem] leading-[1.05] mb-2"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Library
        </h1>
        <p className="text-muted-foreground text-sm font-sans mb-6">
          Every tool, sorted the way your body finds them.
        </p>

        {searchOpen && (
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the library…"
              className="w-full bg-[hsl(156,52%,14%)] border border-accent/22 rounded-xl pl-11 pr-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/45 transition-colors"
            />
          </div>
        )}

        {/* Shortcut pills */}
        <div className="mb-8 -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max">
            {SHORTCUTS.map((s) => {
              const active = shortcut === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setShortcut(active ? null : s.key)}
                  className={`px-4 py-2 rounded-full text-xs font-sans font-medium tracking-wide whitespace-nowrap transition-all border ${
                    active
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-[hsl(156,52%,14%)] border-accent/22 text-foreground/80 hover:border-accent/40"
                  }`}
                >
                  {s.label}
                  {active && <Check className="w-3 h-3 inline-block ml-1.5 -mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular carousel — only if data exists */}
        {popularDisplay.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-eyebrow">Popular</h2>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 min-w-max snap-x snap-mandatory">
                {popularDisplay.map((t: any) => (
                  <div key={t.id} className="snap-start">
                    <TrackCard track={t} big />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended carousel */}
        {recommendedDisplay.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-eyebrow">Recommended for you</h2>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="flex gap-3 min-w-max snap-x snap-mandatory">
                {recommendedDisplay.map((t: any) => (
                  <div key={t.id} className="snap-start">
                    <TrackCard track={t} big />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Browse by Category */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-eyebrow">Browse by category</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_CARDS.map((c) => {
              let count = 0;
              let label = "";
              if (c.key === "quests") {
                count = courses.length;
                label = count === 0 ? "Coming soon" : `${count} ${count === 1 ? "quest" : "quests"}`;
              } else if (c.key === "mastery") {
                count = masteryClasses.length;
                label = count === 0 ? "Coming soon" : `${count} ${count === 1 ? "class" : "classes"}`;
              } else if (c.key === "custom") {
                label = "Yours to build";
              } else {
                count = categoryCounts[c.key] || 0;
                label = count === 0 ? "Coming soon" : `${count} ${count === 1 ? "session" : "sessions"}`;
              }
              const coverUrl = `${COVER_BASE}/${c.coverSlug}.jpg`;
              return (
                <motion.button
                  key={c.key}
                  onClick={() => goToCategory(c.key)}
                  whileTap={{ scale: 0.97 }}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-accent/20 bg-[hsl(156,52%,9%)] text-left group"
                >
                  <img
                    src={coverUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-end">
                      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center">
                        {c.key === "custom" ? (
                          <Sparkles className="w-4 h-4 text-accent" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-foreground ml-0.5" fill="currentColor" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p
                        className="text-foreground font-serif text-[1.3rem] leading-tight uppercase tracking-wide drop-shadow-2xl"
                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                      >
                        {c.label}
                      </p>
                      <p className="text-foreground/70 text-[11px] mt-1 tracking-wide">{label}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
