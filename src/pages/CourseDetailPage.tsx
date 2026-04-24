import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Check, Lock, Clock, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAccess } = useAuth();

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["courseTracks", id],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").eq("course_id", id).order("order_in_course");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["courseProgress", user?.id, id],
    queryFn: async () => {
      if (!user) return [];
      const trackIds = tracks.map((t: any) => t.id);
      if (trackIds.length === 0) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true).in("track_id", trackIds);
      return data || [];
    },
    enabled: !!user && tracks.length > 0,
  });

  const completedTrackIds = new Set(progress.map((p: any) => p.track_id));
  const isPremium = course?.is_premium;
  const canAccess = !isPremium || hasAccess;

  // Find earliest progress date for timed locks
  const sortedProgress = [...progress].sort((a: any, b: any) => (a.completed_date || a.created_at).localeCompare(b.completed_date || b.created_at));
  const courseStartDate = sortedProgress[0]?.created_at ? new Date(sortedProgress[0].created_at) : new Date();
  const daysSinceStart = Math.floor((Date.now() - courseStartDate.getTime()) / (1000 * 60 * 60 * 24));

  const isTrackLocked = (track: any, trackIndex: number) => {
    if (!canAccess) return true;
    const lockType = (track as any).lock_type || "none";
    if (lockType === "none") return false;
    if (lockType === "sequential") {
      if (trackIndex === 0) return false;
      const prevTrack = tracks[trackIndex - 1];
      return !completedTrackIds.has(prevTrack?.id);
    }
    if (lockType === "timed") {
      return daysSinceStart < ((track as any).lock_days || 0);
    }
    return false;
  };

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen bg-radial-subtle flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = tracks.filter((t: any) => completedTrackIds.has(t.id)).length;

  return (
    <div className="min-h-screen bg-radial-subtle">
      {/* Hero */}
      <div className="relative h-48 bg-surface-light overflow-hidden">
        {(course as any).cover_image_url ? (
          <img src={(course as any).cover_image_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_hsl(var(--card)),_hsl(var(--surface-light)))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 lg:px-8 -mt-8 relative z-10 max-w-2xl mx-auto pb-8">
        <div className="flex items-center gap-3 mb-3">
          {(course as any).category && (
            <p className="text-accent text-[10px] font-sans tracking-[0.15em] uppercase">{(course as any).category}</p>
          )}
        </div>

        <h1 className="text-display text-3xl mb-2">{course.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-ui text-xs mb-4">
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {tracks.length} sessions</span>
          {(course as any).estimated_weeks && (
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {(course as any).estimated_weeks} weeks</span>
          )}
        </div>

        <p className="text-ui text-sm mb-6">{course.description}</p>

        {/* Progress */}
        {progress.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full gold-gradient rounded-full" style={{ width: `${tracks.length ? (completedCount / tracks.length) * 100 : 0}%` }} />
            </div>
            <span className="text-ui text-xs font-sans tabular-nums">{completedCount}/{tracks.length} sessions</span>
          </div>
        )}

        {/* Track list */}
        <div className="flex flex-col gap-2">
          {tracks.map((track: any, index: number) => {
            const isCompleted = completedTrackIds.has(track.id);
            const locked = isTrackLocked(track, index);

            return (
              <Link
                key={track.id}
                to={locked ? "#" : `/player?trackId=${track.id}`}
                onClick={(e) => locked && e.preventDefault()}
                className={`velum-card p-4 flex items-center gap-4 group ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium shrink-0 ${
                  isCompleted
                    ? "gold-gradient text-primary-foreground"
                    : "bg-surface-light text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : locked ? <Lock className="w-3.5 h-3.5" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-sans truncate ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>{track.title}</p>
                  <p className="text-ui text-xs">
                    {locked && canAccess
                      ? (track.lock_type === "timed" ? `Unlocks day ${track.lock_days}` : "Complete previous first")
                      : `${track.duration_minutes} min`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!locked && (
                    <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5 text-foreground ml-0.5" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {!canAccess && (
          <div className="velum-card p-6 mt-8 text-center border border-accent/20">
            <h3 className="text-display text-lg text-accent mb-2">Unlock this course</h3>
            <p className="text-ui text-sm mb-4">Subscribe to access all courses and the full library.</p>
            <Link to="/premium" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium">
              Begin My Journey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
