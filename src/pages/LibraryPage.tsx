import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, Heart, Sparkles, Wind, Zap, GraduationCap, Feather, BookOpen, Check, Play, ChevronLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VelumMark from "@/components/VelumMark";

type Tab = "sessions" | "favorites" | "courses" | "mastery" | "journal";

const TABS: { key: Tab; label: string }[] = [
  { key: "sessions", label: "Sessions" },
  { key: "favorites", label: "Favorites" },
  { key: "courses", label: "Courses" },
  { key: "mastery", label: "MasteryClasses" },
  { key: "journal", label: "Journal" },
];

const CATEGORIES = [
  { key: "meditation", label: "Meditation", icon: Sparkles },
  { key: "rapid_resets", label: "Rapid Resets", icon: Zap },
  { key: "breathwork", label: "Breathwork", icon: Wind },
  { key: "tapping", label: "Tapping", icon: Heart },
  { key: "journaling", label: "Journaling", icon: Feather },
  { key: "mastery", label: "MasteryClasses", icon: GraduationCap },
];

export default function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const categoryParam = searchParams.get("category");
    if (tabParam && TABS.some(t => t.key === tabParam)) {
      setActiveTab(tabParam as Tab);
    }
    if (categoryParam) {
      setActiveTab("sessions");
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: masteryClasses = [] } = useQuery({
    queryKey: ["mastery_classes"],
    queryFn: async () => {
      const { data } = await supabase.from("mastery_classes").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data } = await supabase.from("subcategories").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["user_progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user,
  });

  const favoriteTrackIds = new Set(favorites.map((f: any) => f.track_id));
  const completedTrackIds = new Set(progress.map((p: any) => p.track_id));

  const toggleFavMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) return;
      const existing = favorites.find((f: any) => f.track_id === trackId);
      if (existing) {
        await supabase.from("favorites").delete().eq("id", (existing as any).id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, track_id: trackId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] }),
  });

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: c.key === "mastery" ? masteryClasses.length : tracks.filter((t: any) => t.category === c.key).length,
  }));

  const filteredTracks = tracks.filter((t: any) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const favoriteTracks = tracks.filter((t: any) => favoriteTrackIds.has(t.id));
  const categorySubcats = selectedCategory ? subcategories.filter((s: any) => s.category === selectedCategory) : [];

  const TrackCard = ({ track }: { track: any }) => (
    <Link key={track.id} to={`/player?trackId=${track.id}`} className="velum-card overflow-hidden group min-w-0">
      <div className="aspect-square bg-surface-light relative overflow-hidden rounded-xl">
        {(track.thumbnail_square_url || track.thumbnail_url) ? (
          <img src={track.thumbnail_square_url ?? track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,_hsl(var(--card)),_hsl(var(--background)))]" />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          </div>
        </div>
        {completedTrackIds.has(track.id) && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-foreground text-xs font-sans leading-tight line-clamp-2">{track.title}</p>
          {track.description && (
            <p className="text-muted-foreground text-[11px] mt-1 line-clamp-2 leading-snug">{track.description}</p>
          )}
          <p className="text-ui text-[10px] mt-1">{track.duration_minutes} min</p>
        </div>
        <button onClick={(e) => { e.preventDefault(); toggleFavMutation.mutate(track.id); }}
          className={`transition-colors shrink-0 ${favoriteTrackIds.has(track.id) ? "text-accent" : "text-muted-foreground hover:text-accent"}`}>
          <Heart className={`w-4 h-4 ${favoriteTrackIds.has(track.id) ? "fill-current" : ""}`} />
        </button>
      </div>
    </Link>
  );

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-3xl mx-auto overflow-x-hidden">
      <div className="mb-8">
        <div className="mb-5">
          <VelumMark variant="lotus" size="sm" />
        </div>
        <h1 className="text-display text-[2.4rem] leading-[1.05]">The <span className="text-accent italic">library.</span></h1>
        <p className="text-muted-foreground text-sm font-sans mt-2">Every tool, sorted the way your body finds them.</p>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedCategory(null); setSearch(""); setShowAllSessions(false); }}
            className={`px-4 py-2 rounded-full text-xs font-sans font-medium tracking-wide whitespace-nowrap transition-all border ${
              activeTab === key ? "gold-gradient text-primary-foreground border-transparent" : "bg-[hsl(156,52%,14%)] border-accent/22 text-muted-foreground hover:text-foreground hover:border-accent/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "sessions" && (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-[hsl(156,52%,14%)] border border-accent/22 rounded-xl pl-11 pr-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent/45 transition-colors"
            />
          </div>

          {!selectedCategory ? (
            <div className="grid grid-cols-2 gap-3">
              {categoryCounts.map(({ key, label, icon: Icon, count }) => (
                <button key={key} onClick={() => {
                  if (key === "mastery") {
                    setActiveTab("mastery");
                    setSelectedCategory(null);
                  } else {
                    setSelectedCategory(key);
                    setShowAllSessions(false);
                  }
                }}
                  className="velum-card p-5 flex flex-col gap-3 text-left group">
                  <Icon className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-foreground text-sm font-sans font-medium">{label}</p>
                    <p className="text-ui text-xs">{count} sessions</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Back button */}
              <button onClick={() => { setSelectedCategory(null); setShowAllSessions(false); }}
                className="flex items-center gap-1 text-foreground font-sans text-sm mb-4">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Subcategory grid or all sessions */}
              {!showAllSessions && categorySubcats.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase">Categories</p>
                    <button onClick={() => setShowAllSessions(true)}
                      className="text-accent text-xs font-sans">
                      See All →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {categorySubcats.map((sc: any) => (
                      <Link
                        key={sc.id}
                        to={`/subcategory?category=${selectedCategory}&subcategory=${sc.id}`}
                        className="velum-card overflow-hidden"
                      >
                        <div className="aspect-video bg-surface-light relative overflow-hidden">
                          {sc.thumbnail_url ? (
                            <img src={sc.thumbnail_url} alt={sc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,_hsl(var(--card)),_hsl(var(--background)))]" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-foreground text-xs font-sans font-medium">{sc.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredTracks.map((track: any) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                  {filteredTracks.length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No sessions in this category yet.</p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === "favorites" && (
        favoriteTracks.length === 0 ? (
          <div className="velum-card p-12 text-center">
            <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-serif text-lg mb-2">No favorites yet</p>
            <p className="text-ui text-sm">Tap the heart icon on any session to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favoriteTracks.map((track: any) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )
      )}

      {activeTab === "courses" && (
        <div className="flex flex-col gap-4">
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No courses yet.</p>
          ) : courses.map((course: any) => (
            <Link key={course.id} to={`/course/${course.id}`} className="velum-card overflow-hidden group">
              <div className="h-32 bg-surface-light relative">
                {course.thumbnail_url && <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-5">
                <h3 className="text-foreground font-serif text-lg mb-1">{course.title}</h3>
                <p className="text-ui text-xs">{course.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "mastery" && (
        <div className="grid grid-cols-2 gap-3">
          {masteryClasses.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-2 text-center py-8">No mastery classes yet.</p>
          ) : masteryClasses.map((mc: any) => (
            <Link key={mc.id} to={`/mastery-player?id=${mc.id}`} className="velum-card overflow-hidden group min-w-0">
              <div className="aspect-video bg-surface-light relative overflow-hidden">
                {(mc.cover_image_url_16_9 || mc.thumbnail_url || mc.cover_image_url) ? (
                  <img src={mc.cover_image_url_16_9 || mc.thumbnail_url || mc.cover_image_url} alt={mc.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[radial-gradient(ellipse_at_left,_hsl(var(--card)),_hsl(var(--background)))]" />
                )}
              </div>
              <div className="p-3">
                <p className="text-foreground text-xs font-sans font-medium leading-tight line-clamp-2">{mc.title}</p>
                {mc.description && (
                  <p className="text-muted-foreground text-[11px] mt-1 line-clamp-2 leading-snug">{mc.description}</p>
                )}
                <p className="text-ui text-[10px] mt-1">{mc.duration_minutes} min</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "journal" && (
        <div>
          <div className="grid grid-cols-2 gap-3">
            {tracks.filter((t: any) => t.category === "journaling").length === 0 ? (
              <div className="col-span-2 velum-card p-8 text-center">
                <Feather className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No journaling sessions yet.</p>
              </div>
            ) : (
              tracks.filter((t: any) => t.category === "journaling").map((track: any) => (
                <TrackCard key={track.id} track={track} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
