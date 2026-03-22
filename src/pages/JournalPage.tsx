import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Feather, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function countWords(text: string) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

type FilterType = "all" | "reflection" | "exercise" | "mastery" | "course";

export default function JournalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reflection, setReflection] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("journaling_prompts").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: reflections = [], isLoading: loadingReflections } = useQuery({
    queryKey: ["reflections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("daily_reflections").select("*").eq("user_id", user.id).order("reflection_date", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ["journalingProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true).order("completed_date", { ascending: false }).limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: journalingTracks = [] } = useQuery({
    queryKey: ["journalingTracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").eq("category", "journaling").order("order_index");
      return data || [];
    },
  });

  const { data: masteryResponses = [] } = useQuery({
    queryKey: ["masteryResponses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("mastery_class_responses").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: courseJournalEntries = [] } = useQuery({
    queryKey: ["courseJournalEntries", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_journal_entries")
        .select("*, courses_v2(title), lessons(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user,
  });

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayPrompt = prompts.length > 0 ? prompts[dayOfYear % prompts.length]?.prompt : "What does your body need from you today?";
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = reflections.find((r: any) => r.reflection_date === today);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (todayEntry) {
        const { error } = await supabase.from("daily_reflections").update({ content: reflection, prompt: todayPrompt }).eq("id", (todayEntry as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_reflections").insert({ user_id: user.id, content: reflection, prompt: todayPrompt, reflection_date: today });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      toast.success("Reflection saved");
      if (!todayEntry) setReflection("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reflections"] }); toast.success("Entry deleted"); },
  });

  const displayReflection = todayEntry && !reflection ? (todayEntry as any).content : reflection;

  const journalingTrackMap = useMemo(() => {
    const map: Record<string, any> = {};
    journalingTracks.forEach((t: any) => { map[t.id] = t; });
    return map;
  }, [journalingTracks]);

  const completedJournaling = useMemo(() => {
    return allProgress.filter((p: any) => journalingTrackMap[p.track_id]).map((p: any) => ({ ...p, track: journalingTrackMap[p.track_id] }));
  }, [allProgress, journalingTrackMap]);

  const allEntries = useMemo(() => {
    const items: { type: FilterType; date: string; data: any }[] = [];
    reflections.forEach((r: any) => items.push({ type: "reflection", date: r.reflection_date, data: r }));
    completedJournaling.forEach((p: any) => items.push({ type: "exercise", date: p.completed_date || p.created_at?.split("T")[0], data: p }));
    masteryResponses.forEach((m: any) => items.push({ type: "mastery", date: (m as any).date, data: m }));
    courseJournalEntries.forEach((e: any) => items.push({
      type: "course",
      date: e.created_at?.split("T")[0],
      data: e,
    }));
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return items;
  }, [reflections, completedJournaling, masteryResponses, courseJournalEntries]);

  const filtered = useMemo(() => {
    if (filter === "all") return allEntries;
    return allEntries.filter(e => e.type === filter);
  }, [allEntries, filter]);

  const totalWords = useMemo(() => reflections.reduce((sum: number, r: any) => sum + countWords(r.content), 0), [reflections]);
  const completedTrackIds = useMemo(() => new Set(allProgress.map((p: any) => p.track_id)), [allProgress]);

  const pastEntries = filtered.filter(e => !(e.type === "reflection" && e.date === today));
  const isLoading = loadingReflections || !user;

  return (
    <div className="min-h-screen bg-radial-subtle relative overflow-x-hidden">
      {/* Decorative lines */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 52px, rgba(201,168,76,0.03) 52px, rgba(201,168,76,0.03) 53px)" }} />
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/8 to-transparent" />
      </div>

      <div className="relative z-10 px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-accent/10 pb-8 mb-8">
          <p className="text-accent/50 text-[10px] font-sans tracking-[3px] uppercase mb-2">Personal Archive</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="text-display text-4xl leading-none">
              Digital<br /><span className="italic text-accent">Velum</span> Journal
            </h1>
            <div className="flex gap-6 shrink-0">
              <div className="text-right">
                <p className="text-display text-xl">{allEntries.length}</p>
                <p className="text-accent/45 text-[10px] font-sans tracking-[1.5px] uppercase mt-0.5">Entries</p>
              </div>
              <div className="text-right">
                <p className="text-display text-xl">{totalWords.toLocaleString()}</p>
                <p className="text-accent/45 text-[10px] font-sans tracking-[1.5px] uppercase mt-0.5">Words</p>
              </div>
              <div className="text-right">
                <p className="text-display text-xl">{completedJournaling.length}</p>
                <p className="text-accent/45 text-[10px] font-sans tracking-[1.5px] uppercase mt-0.5">Exercises</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's prompt */}
        <div className="velum-card p-6 mb-6">
          <p className="text-ui text-xs tracking-wide uppercase mb-3">Today's prompt</p>
          <p className="text-foreground font-serif text-lg mb-4">{todayPrompt}</p>
          <textarea
            value={displayReflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Write your reflection..."
            className="w-full rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow border border-foreground/15 bg-background"
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!displayReflection?.trim() || saveMutation.isPending}
            className="mt-3 px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform disabled:opacity-30"
          >
            {saveMutation.isPending ? "Saving..." : todayEntry ? "Update" : "Save"}
          </button>
          {todayEntry && <p className="text-accent text-[10px] font-sans mt-2">You've already reflected today. Edit above to update.</p>}
        </div>

        {/* Explore Guided Journaling Exercises */}
        {journalingTracks.length > 0 && (
          <div className="mb-8">
            <Link to="/library?tab=journal" className="velum-card p-5 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Feather className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-foreground font-serif text-base">Explore Guided Journaling Exercises</p>
                  <p className="text-ui text-xs mt-0.5">{journalingTracks.length} guided sessions available</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}

        {/* Past Entries heading */}
        <p className="text-display text-xl mb-4">Past Entries</p>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto">
          {([
            { key: "all" as FilterType, label: "All" },
            { key: "reflection" as FilterType, label: "My Entries" },
            { key: "course" as FilterType, label: "Courses" },
            { key: "exercise" as FilterType, label: "Guided Exercises" },
            { key: "mastery" as FilterType, label: "Mastery Classes" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-wide whitespace-nowrap transition-all ${
                filter === key
                  ? "gold-gradient text-primary-foreground font-semibold"
                  : "bg-accent/5 text-foreground/50 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : pastEntries.length === 0 ? (
          <div className="velum-card p-12 text-center">
            <p className="text-3xl opacity-30 mb-4">✎</p>
            <p className="text-display text-xl mb-2">
              {filter === "all" ? "Your journal awaits" : filter === "reflection" ? "No daily reflections yet" : filter === "exercise" ? "No guided exercises yet" : "No mastery responses yet"}
            </p>
            <p className="text-ui text-sm">
              {filter === "all" ? "Complete today's daily reflection or a journaling exercise to begin." : "Start exploring to fill this section."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {pastEntries.map((entry, idx) => {
              const entryId = entry.type + (entry.data.id || idx);
              const isExpanded = expandedId === entryId;
              const isReflection = entry.type === "reflection";
              const isMastery = entry.type === "mastery";
              const isCourse = entry.type === "course";

              return (
                <div key={entryId} className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? (isReflection ? "bg-card/80 border-accent/25" : isMastery ? "bg-card/90 border-accent/30" : isCourse ? "bg-card/80 border-accent/20" : "bg-surface/50 border-muted-foreground/20")
                    : "bg-transparent border-transparent"
                }`}>
                  <button onClick={() => setExpandedId(isExpanded ? null : entryId)} className="w-full text-left flex items-center gap-4 p-5">
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm ${
                      isReflection || isMastery || isCourse ? "bg-accent/10 text-accent" : "bg-muted-foreground/10 text-muted-foreground"
                    }`}>
                      {isReflection ? "✎" : isCourse ? "📖" : "◈"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2.5 mb-1">
                        <span className={`text-[9px] tracking-[2px] uppercase font-sans shrink-0 ${
                          isReflection ? "text-accent/55" : isMastery ? "text-accent/65" : "text-muted-foreground/70"
                        }`}>
                          {isReflection ? "Daily Reflection" : isMastery ? "Mastery Class" : "Guided Exercise"}
                        </span>
                        <span className="text-foreground/25 text-[11px] font-sans">{formatDate(entry.date)}</span>
                      </div>
                      <p className="text-foreground/80 font-serif text-sm truncate leading-snug">
                        {isReflection ? `"${entry.data.prompt}"` : isMastery ? entry.data.mastery_class_title : entry.data.track?.title}
                      </p>
                      {isMastery && entry.data.mastery_class_theme && (
                        <p className="text-accent/45 text-[11px] font-sans mt-0.5">{entry.data.mastery_class_theme}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {isReflection && <span className="text-foreground/25 text-[10px] font-sans">{countWords(entry.data.content)}w</span>}
                      <div className={`text-foreground/20 text-xs mt-0.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}>›</div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <div className={`h-px mb-5 ${isReflection ? "bg-accent/10" : isMastery ? "bg-accent/12" : "bg-muted-foreground/10"}`} />
                      {isReflection ? (
                        <>
                          <p className="text-display text-base italic text-foreground/60 mb-4">"{entry.data.prompt}"</p>
                          <p className="text-foreground/80 text-sm font-sans leading-relaxed whitespace-pre-wrap">{entry.data.content}</p>
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-foreground/20 text-[10px] font-sans tracking-wide">{countWords(entry.data.content)} words · {formatDate(entry.date)}</p>
                            <button onClick={() => { if (confirm("Delete this entry?")) deleteMutation.mutate(entry.data.id); }}
                              className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : isMastery ? (
                        <div>
                          {entry.data.mastery_class_theme && (
                            <p className="text-accent/50 text-[10px] tracking-[2px] uppercase font-sans mb-4">{entry.data.mastery_class_theme}</p>
                          )}
                          {((entry.data.responses as any[]) || []).filter((r: any) => r.response).map((r: any, i: number) => (
                            <div key={i} className="mb-5">
                              <p className="text-display text-sm italic text-foreground/50 mb-2">"{r.prompt_text}"</p>
                              <p className="text-foreground/80 text-sm font-sans leading-relaxed whitespace-pre-wrap">{r.response}</p>
                            </div>
                          ))}
                          <p className="text-foreground/20 text-[10px] font-sans tracking-wide mt-2">{formatDate(entry.date)}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-lg text-accent shrink-0">◈</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-display text-sm mb-1">{entry.data.track?.title}</p>
                            <p className="text-ui text-[11px]">Completed journaling exercise · {formatDate(entry.date)}</p>
                          </div>
                          <Link to={`/player?trackId=${entry.data.track_id}`} className="text-accent/60 text-[11px] font-sans shrink-0">
                            Practice again →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
