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
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-foreground font-sans text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <div className="px-4 mt-3 mb-6">
        <h1 className="text-display text-2xl">{subcategory}</h1>
        <p className="text-ui text-xs tracking-widest uppercase mt-1">
          {CATEGORY_LABELS[category] || category}
        </p>
      </div>

      {/* Track Grid */}
      <div className="px-4">
        {tracks.length === 0 ? (
          <p className="text-ui text-sm text-center mt-10">No sessions found in this collection.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tracks.map((track: any) => {
              const isCompleted = completedIds instanceof Set && completedIds.has(track.id);
              return (
                <Link
                  key={track.id}
                  to={`/player?trackId=${track.id}`}
                  className="velum-card overflow-hidden"
                >
                  {track.thumbnail_url ? (
                    <div className="aspect-video overflow-hidden relative">
                      <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-surface-light relative">
                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-foreground text-xs font-sans font-medium leading-tight">{track.title}</p>
                    {track.duration_minutes && (
                      <p className="text-muted-foreground text-[11px] mt-1">{track.duration_minutes}m</p>
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
