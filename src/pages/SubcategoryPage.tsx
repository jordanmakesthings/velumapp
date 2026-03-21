import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "Meditation",
  rapid_resets: "Rapid Resets",
  breathwork: "Breathwork",
  tapping: "Tapping",
  journaling: "Journaling",
};

export default function SubcategoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const { user } = useAuth();

  const { data: tracks = [] } = useQuery({
    queryKey: ["subcategoryTracks", category, subcategory],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("category", category)
        .eq("subcategory_id", subcategory)
        .order("order_index");
      return data || [];
    },
    enabled: !!category,
  });

  const { data: completedIds = new Set() } = useQuery({
    queryKey: ["subcategoryProgress", user?.id],
    queryFn: async () => {
      if (!user) return new Set();
      const { data } = await supabase
        .from("user_progress")
        .select("track_id")
        .eq("user_id", user.id)
        .eq("completed", true);
      return new Set((data || []).map((p: any) => p.track_id));
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background pb-24">
      {/* Header */}
      <div className="safe-area-pt px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-10 items-center gap-1 text-sm font-sans text-foreground"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Back
        </button>
      </div>
      <div className="mb-6 mt-3 px-4">
        <h1 className="text-display break-words text-2xl">{subcategory}</h1>
        <p className="text-ui mt-1 text-xs tracking-widest uppercase break-words">
          {CATEGORY_LABELS[category] || category}
        </p>
      </div>

      {/* Track Grid */}
      <div className="px-4">
        {tracks.length === 0 ? (
          <p className="text-ui mt-10 text-center text-sm">No sessions found in this collection.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tracks.map((track: any) => {
              const isCompleted = completedIds instanceof Set && completedIds.has(track.id);
              return (
                <Link
                  key={track.id}
                  to={`/player?trackId=${track.id}`}
                  className="velum-card min-w-0 max-w-full overflow-hidden"
                >
                  {track.thumbnail_url ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                      {isCompleted && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-surface-light">
                      {isCompleted && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full gold-gradient">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-2.5 min-w-0">
                    <p className="text-foreground break-words text-xs font-sans font-medium leading-tight">{track.title}</p>
                    {track.duration_minutes && (
                      <p className="text-muted-foreground mt-1 text-[11px]">{track.duration_minutes}m</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
