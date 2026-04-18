import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ChevronDown, ChevronRight, CheckCircle2, Circle, Download, Play, Pause, ChevronLeft, Lock } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import LessonJournal from "@/components/course/LessonJournal";

function AudioPlayerSimple({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, "0")}`; };

  const displayValue = scrubbing ? scrubValue : currentTime;
  const percent = duration > 0 ? (displayValue / duration) * 100 : 0;

  const commit = (val: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
    setScrubbing(false);
  };

  return (
    <div className="velum-card p-7 text-center">
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => { if (!scrubbing) setCurrentTime(audioRef.current?.currentTime || 0); }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)} />
      <button onClick={toggle}
        className="w-[72px] h-[72px] rounded-full gold-gradient flex items-center justify-center mx-auto mb-5 active:scale-95 transition-transform">
        {playing ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-0.5" />}
      </button>
      {duration > 0 && (
        <>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={displayValue}
            onPointerDown={() => { setScrubbing(true); setScrubValue(currentTime); }}
            onInput={e => setScrubValue(Number((e.target as HTMLInputElement).value))}
            onChange={e => { if (scrubbing) setScrubValue(Number(e.target.value)); }}
            onPointerUp={e => commit(Number((e.target as HTMLInputElement).value))}
            onPointerCancel={() => setScrubbing(false)}
            className="velum-audio-slider w-full touch-pan-y cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${percent}%, hsl(var(--foreground) / 0.12) ${percent}%, hsl(var(--foreground) / 0.12) 100%)`,
            }}
          />
          <div className="flex justify-between mt-2">
            <span className="text-ui text-[11px] tabular-nums">{fmt(displayValue)}</span>
            <span className="text-ui text-[11px] tabular-nums">{fmt(duration)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function CourseExperiencePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const qc = useQueryClient();
  const { user, profile, hasAccess } = useAuth();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(searchParams.get("lessonId"));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["courseV2", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("courses_v2").select("*").eq("id", courseId).single();
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["courseLessons", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("order_index");
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lessonProgress", user?.id, courseId],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("lesson_progress").select("*").eq("user_id", user.id).eq("course_id", courseId);
      return data || [];
    },
    enabled: !!user && !!courseId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;
      const existing = lessonProgress.find((p: any) => p.lesson_id === lessonId);
      if (existing) {
        await supabase.from("lesson_progress").update({ completed: true, completed_date: new Date().toISOString().split("T")[0] }).eq("id", (existing as any).id);
      } else {
        await supabase.from("lesson_progress").insert({ user_id: user.id, course_id: courseId, lesson_id: lessonId, completed: true, completed_date: new Date().toISOString().split("T")[0] });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessonProgress", user?.id, courseId] }),
  });

  const completedIds = new Set(lessonProgress.filter((p: any) => p.completed).map((p: any) => p.lesson_id));

  // Flatten lessons from modules
  const flatLessons: any[] = [];
  const modules = ((course as any)?.modules || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  modules.forEach((mod: any) => {
    (mod.lesson_ids || []).forEach((lid: string) => { const l = lessons.find((l: any) => l.id === lid); if (l) flatLessons.push(l); });
    (mod.submodules || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).forEach((sub: any) => {
      (sub.lesson_ids || []).forEach((lid: string) => { const l = lessons.find((l: any) => l.id === lid); if (l) flatLessons.push(l); });
    });
  });
  // If no modules structure, just use all lessons in order
  if (flatLessons.length === 0 && lessons.length > 0) flatLessons.push(...lessons);

  const activeLesson = flatLessons.find(l => l.id === activeLessonId) || flatLessons[0] || null;
  const activeIndex = flatLessons.findIndex(l => l.id === activeLesson?.id);
  const nextLesson = flatLessons[activeIndex + 1] || null;
  const prevLesson = flatLessons[activeIndex - 1] || null;

  // Drip unlock — lessons become available on a per-day schedule since trial start
  const anchorDate = (profile as any)?.trial_started_at || (user as any)?.created_at || null;
  const daysSinceStart = anchorDate ? Math.floor((Date.now() - new Date(anchorDate).getTime()) / 86400000) : 9999;
  const lessonDripInfo = (lesson: any) => {
    const offset = typeof lesson.drip_day_offset === "number" ? lesson.drip_day_offset : 0;
    const isLocked = offset > daysSinceStart;
    const unlocksInDays = isLocked ? offset - daysSinceStart : 0;
    return { isLocked, unlocksInDays };
  };

  const openLesson = (lesson: any) => {
    if (!hasAccess) { setShowPaywall(true); return; }
    const { isLocked } = lessonDripInfo(lesson);
    if (isLocked) return;
    setActiveLessonId(lesson.id);
  };

  useEffect(() => {
    if (course && !activeLessonId && flatLessons.length > 0) {
      // Default to the first unlocked lesson the user hasn't completed, or fall back to first unlocked
      const firstAvailable = flatLessons.find(l => !lessonDripInfo(l).isLocked && !completedIds.has(l.id))
        || flatLessons.find(l => !lessonDripInfo(l).isLocked)
        || flatLessons[0];
      setActiveLessonId(firstAvailable.id);
      const expandAll: Record<string, boolean> = {};
      modules.forEach((m: any) => { expandAll[m.id] = true; });
      setExpandedModules(expandAll);
    }
  }, [course, lessons]);

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter(l => completedIds.has(l.id)).length;
  const progressPct = totalLessons ? (completedCount / totalLessons) * 100 : 0;
  const courseType = (course as any).course_type || "audio";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showPaywall && <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-accent/10 bg-background sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-sans">Back</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-display text-sm truncate">{course.title}</p>
          <p className="text-ui text-[11px]">{completedCount}/{totalLessons} lessons complete</p>
        </div>
        <div className="w-20 h-1 bg-surface-light rounded-full shrink-0">
          <div className="h-full gold-gradient rounded-full transition-all duration-400" style={{ width: `${progressPct}%` }} />
        </div>
        <button onClick={() => setSidebarOpen(s => !s)}
          className="text-xs font-sans text-muted-foreground border border-foreground/10 px-2.5 py-1.5 rounded-lg hover:text-foreground transition-colors">
          Contents
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-[280px] shrink-0 border-r border-accent/10 overflow-y-auto bg-background/50 hidden lg:flex flex-col">
            <div className="p-4">
              {modules.length > 0 ? modules.map((mod: any) => {
                const isOpen = expandedModules[mod.id] !== false;
                const modLessons = (mod.lesson_ids || []).map((lid: string) => lessons.find((l: any) => l.id === lid)).filter(Boolean);
                return (
                  <div key={mod.id} className="mb-2">
                    <button onClick={() => setExpandedModules(e => ({ ...e, [mod.id]: !isOpen }))}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left hover:bg-card/50 transition-colors">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className="text-xs font-sans font-semibold text-foreground">{mod.title}</span>
                    </button>
                    {isOpen && (
                      <div className="pl-2">
                        {modLessons.map((lesson: any) => (
                          <SidebarLesson key={lesson.id} lesson={lesson} isActive={activeLesson?.id === lesson.id} isCompleted={completedIds.has(lesson.id)} daysSinceStart={daysSinceStart} onClick={() => openLesson(lesson)} />
                        ))}
                        {(mod.submodules || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((sub: any) => {
                          const subLessons = (sub.lesson_ids || []).map((lid: string) => lessons.find((l: any) => l.id === lid)).filter(Boolean);
                          return (
                            <div key={sub.id} className="ml-2">
                              <p className="text-ui text-[10px] px-3 py-1.5 tracking-wide">{sub.title}</p>
                              {subLessons.map((lesson: any) => (
                                <SidebarLesson key={lesson.id} lesson={lesson} isActive={activeLesson?.id === lesson.id} isCompleted={completedIds.has(lesson.id)} daysSinceStart={daysSinceStart} onClick={() => openLesson(lesson)} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }) : lessons.map((lesson: any) => (
                <SidebarLesson key={lesson.id} lesson={lesson} isActive={activeLesson?.id === lesson.id} isCompleted={completedIds.has(lesson.id)} daysSinceStart={daysSinceStart} onClick={() => openLesson(lesson)} />
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-3xl mx-auto">
          {activeLesson ? (
            <>
              <h1 className="text-display text-2xl lg:text-3xl mb-2">{activeLesson.title}</h1>
              {activeLesson.description && <p className="text-ui text-sm mb-6 leading-relaxed">{activeLesson.description}</p>}

              {/* Media */}
              <div className="mb-7">
                {courseType === "audio" && activeLesson.media_url && <AudioPlayerSimple src={activeLesson.media_url} />}
                {courseType === "video" && activeLesson.media_url && (
                  <div className="rounded-2xl overflow-hidden bg-background aspect-video">
                    <video src={activeLesson.media_url} controls className="w-full h-full" />
                  </div>
                )}
                {courseType === "written" && activeLesson.written_content && (
                  <div className="text-foreground leading-[1.8] font-sans text-base prose-invert"
                    dangerouslySetInnerHTML={{ __html: activeLesson.written_content }} />
                )}
              </div>

              {/* Downloads */}
              {(activeLesson.downloadable_files || []).length > 0 && (
                <div className="mb-7">
                  <p className="text-ui text-[11px] tracking-[2px] uppercase mb-3">Downloads</p>
                  {(activeLesson.downloadable_files as any[]).map((file: any, i: number) => (
                    <a key={i} href={file.url} download target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl velum-card-flat mb-1.5 hover:border-accent/30 transition-colors">
                      <Download className="w-4 h-4 text-accent" />
                      <span className="text-foreground text-sm font-sans flex-1">{file.label || "Download"}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Journal */}
              {activeLesson.journal_prompt && (
                <LessonJournal
                  courseId={courseId}
                  lessonId={activeLesson.id}
                  dayNumber={activeIndex + 1}
                  prompt={activeLesson.journal_prompt}
                />
              )}

              {/* Actions */}
              <div className="flex gap-3 flex-wrap items-center">
                {!completedIds.has(activeLesson.id) ? (
                  <button onClick={() => user && markCompleteMutation.mutate(activeLesson.id)}
                    disabled={markCompleteMutation.isPending}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-bold active:scale-95 transition-transform disabled:opacity-60">
                    <CheckCircle2 className="w-4 h-4" />
                    {markCompleteMutation.isPending ? "Saving…" : "Mark Complete"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent/10 border border-accent/30">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span className="text-accent text-sm font-sans">Completed</span>
                  </div>
                )}
                {prevLesson && (
                  <button onClick={() => openLesson(prevLesson)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-foreground/15 text-foreground text-sm font-sans hover:border-foreground/30 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                )}
                {nextLesson && (
                  <button onClick={() => openLesson(nextLesson)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-foreground/15 text-foreground text-sm font-sans hover:border-foreground/30 transition-colors">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center pt-20">
              <p className="text-display text-2xl mb-3">{course.title}</p>
              {(course as any).cover_image_url && <img src={(course as any).cover_image_url} alt="" className="w-full max-w-md mx-auto rounded-2xl object-cover mb-5" />}
              {course.description && <p className="text-ui text-sm leading-relaxed">{course.description}</p>}
              {flatLessons.length > 0 && (
                <button onClick={() => openLesson(flatLessons[0])}
                  className="mt-6 px-7 py-3.5 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-bold active:scale-95 transition-transform">
                  Start Course →
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarLesson({ lesson, isActive, isCompleted, daysSinceStart, onClick }: { lesson: any; isActive: boolean; isCompleted: boolean; daysSinceStart: number; onClick: () => void }) {
  const offset = typeof lesson.drip_day_offset === "number" ? lesson.drip_day_offset : 0;
  const isLocked = offset > daysSinceStart;
  const unlocksInDays = isLocked ? offset - daysSinceStart : 0;
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left mb-0.5 transition-all ${
        isActive ? "bg-card border border-accent/25" : "border border-transparent hover:bg-card/30"
      } ${isLocked ? "opacity-60" : ""}`}>
      {isLocked ? (
        <Lock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      ) : isCompleted ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      )}
      <span className={`text-xs font-sans flex-1 leading-snug truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{lesson.title}</span>
      {isLocked && typeof unlocksInDays === "number" ? (
        <span className="text-[10px] font-sans text-accent/70 shrink-0">{unlocksInDays === 1 ? "1 day" : `${unlocksInDays} days`}</span>
      ) : (
        lesson.duration_minutes > 0 && <span className="text-ui text-[10px] shrink-0">{lesson.duration_minutes}m</span>
      )}
    </button>
  );
}
