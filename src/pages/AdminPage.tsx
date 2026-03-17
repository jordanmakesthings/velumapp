import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Plus, Upload, Trash2, Edit2, X, Check, Music, BookOpen,
  GraduationCap, Feather, Settings, Users, GripVertical
} from "lucide-react";
import { toast } from "sonner";

type AdminTab = "tracks" | "courses" | "mastery" | "prompts" | "settings";

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Music }[] = [
  { key: "tracks", label: "Sessions", icon: Music },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "mastery", label: "Mastery", icon: GraduationCap },
  { key: "prompts", label: "Prompts", icon: Feather },
  { key: "settings", label: "Settings", icon: Settings },
];

const CATEGORIES: Record<string, string> = {
  meditation: "Meditation",
  rapid_resets: "Rapid Resets",
  breathwork: "Breathwork",
  tapping: "Tapping",
  sleep_journeys: "Sleep Journeys",
  journaling: "Journaling",
};

const emptyTrackForm = {
  title: "", description: "", category: "meditation",
  duration_minutes: 10, is_premium: false, is_featured: false,
  audio_url: "", thumbnail_url: "", course_id: "", order_index: 0,
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("tracks");

  // --- Tracks state ---
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [trackForm, setTrackForm] = useState(emptyTrackForm);
  const [uploading, setUploading] = useState({ audio: false, image: false });

  // --- Prompts state ---
  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("");

  // --- Course state ---
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", is_premium: true, thumbnail_url: "" });
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // --- Mastery state ---
  const [showMasteryForm, setShowMasteryForm] = useState(false);
  const [masteryForm, setMasteryForm] = useState({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "" });
  const [editingMastery, setEditingMastery] = useState<any>(null);

  const { isAdmin } = useAuth();

  // Queries
  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["adminTracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["adminCourses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: masteryClasses = [] } = useQuery({
    queryKey: ["adminMastery"],
    queryFn: async () => {
      const { data } = await supabase.from("mastery_classes").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["adminPrompts"],
    queryFn: async () => {
      const { data } = await supabase.from("journaling_prompts").select("*").order("order_index");
      return data || [];
    },
  });

  // File upload helper
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("track-media").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("track-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "audio_url" | "thumbnail_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = field === "audio_url" ? "audio" : "image";
    setUploading(u => ({ ...u, [key]: true }));
    try {
      // Auto-detect duration for audio
      if (field === "audio_url" && file.type.startsWith("audio")) {
        const url = URL.createObjectURL(file);
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.src = url;
        audio.onloadedmetadata = () => {
          setTrackForm(f => ({ ...f, duration_minutes: Math.round(audio.duration / 60) }));
          URL.revokeObjectURL(url);
        };
      }
      const publicUrl = await uploadFile(file, field === "audio_url" ? "audio" : "images");
      if (publicUrl) setTrackForm(f => ({ ...f, [field]: publicUrl }));
    } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  // Track mutations
  const saveTrackMutation = useMutation({
    mutationFn: async (data: typeof emptyTrackForm) => {
      const saveData = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        duration_minutes: data.duration_minutes,
        is_premium: data.is_premium,
        is_featured: data.is_featured,
        audio_url: data.audio_url || null,
        thumbnail_url: data.thumbnail_url || null,
        course_id: data.course_id || null,
        order_index: data.order_index,
      };
      if (editingTrack) {
        const { error } = await supabase.from("tracks").update(saveData).eq("id", editingTrack.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tracks").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTracks"] });
      setShowTrackForm(false);
      setEditingTrack(null);
      setTrackForm(emptyTrackForm);
      toast.success(editingTrack ? "Track updated" : "Track created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTracks"] });
      toast.success("Track deleted");
    },
  });

  // Course mutations
  const saveCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const saveData = { title: data.title, description: data.description || null, is_premium: data.is_premium, thumbnail_url: data.thumbnail_url || null };
      if (editingCourse) {
        const { error } = await supabase.from("courses").update(saveData).eq("id", editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ title: "", description: "", is_premium: true, thumbnail_url: "" });
      toast.success(editingCourse ? "Course updated" : "Course created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      toast.success("Course deleted");
    },
  });

  // Mastery mutations
  const saveMasteryMutation = useMutation({
    mutationFn: async (data: typeof masteryForm) => {
      const saveData = { title: data.title, description: data.description || null, duration_minutes: data.duration_minutes, is_premium: data.is_premium, audio_url: data.audio_url || null, thumbnail_url: data.thumbnail_url || null };
      if (editingMastery) {
        const { error } = await supabase.from("mastery_classes").update(saveData).eq("id", editingMastery.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mastery_classes").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMastery"] });
      setShowMasteryForm(false);
      setEditingMastery(null);
      setMasteryForm({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "" });
      toast.success(editingMastery ? "Class updated" : "Class created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMasteryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mastery_classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMastery"] });
      toast.success("Class deleted");
    },
  });

  // Prompt mutations
  const addPromptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("journaling_prompts").insert({
        prompt: newPrompt,
        category: newPromptCategory || null,
        order_index: prompts.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPrompts"] });
      setNewPrompt("");
      toast.success("Prompt added");
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journaling_prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPrompts"] });
      toast.success("Prompt deleted");
    },
  });

  const openEditTrack = (track: any) => {
    setEditingTrack(track);
    setTrackForm({
      title: track.title,
      description: track.description || "",
      category: track.category,
      duration_minutes: track.duration_minutes,
      is_premium: track.is_premium,
      is_featured: track.is_featured,
      audio_url: track.audio_url || "",
      thumbnail_url: track.thumbnail_url || "",
      course_id: track.course_id || "",
      order_index: track.order_index,
    });
    setShowTrackForm(true);
  };

  // Grouped tracks by category
  const tracksByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    tracks.forEach((t: any) => {
      const cat = t.category || "uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });
    return grouped;
  }, [tracks]);

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-background border border-foreground/10 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40";
  const labelClass = "block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-accent/10">
        <button onClick={() => navigate("/")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-display text-xl">Content Manager</h1>
          <p className="text-xs text-muted-foreground">Upload and manage sessions</p>
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex flex-col w-48 border-r border-accent/10 min-h-[calc(100vh-57px)] py-4 px-3">
          {ADMIN_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all mb-1 ${
                activeTab === key ? "text-foreground bg-card" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 py-3 border-b border-accent/10 w-full">
          {ADMIN_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all ${
                activeTab === key ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-4xl mx-auto">

        {/* ============ TRACKS TAB ============ */}
        {activeTab === "tracks" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Sessions</h2>
              <button onClick={() => { setEditingTrack(null); setTrackForm(emptyTrackForm); setShowTrackForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Add Session
              </button>
            </div>

            {/* Track form */}
            {showTrackForm && (
              <div className="velum-card p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-display text-lg">{editingTrack ? "Edit Session" : "New Session"}</h3>
                  <button onClick={() => { setShowTrackForm(false); setEditingTrack(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Title *</label>
                    <input value={trackForm.title} onChange={e => setTrackForm(f => ({ ...f, title: e.target.value }))}
                      className={inputClass} placeholder="Session title" />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea value={trackForm.description} onChange={e => setTrackForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} className={inputClass + " resize-none"} placeholder="Brief description" />
                  </div>

                  <div>
                    <label className={labelClass}>Category</label>
                    <select value={trackForm.category} onChange={e => setTrackForm(f => ({ ...f, category: e.target.value }))}
                      className={inputClass}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Duration (minutes)</label>
                    <input type="number" value={trackForm.duration_minutes}
                      onChange={e => setTrackForm(f => ({ ...f, duration_minutes: Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>Course (optional)</label>
                    <select value={trackForm.course_id} onChange={e => setTrackForm(f => ({ ...f, course_id: e.target.value }))}
                      className={inputClass}>
                      <option value="">— Standalone —</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Order Index</label>
                    <input type="number" value={trackForm.order_index}
                      onChange={e => setTrackForm(f => ({ ...f, order_index: Number(e.target.value) || 0 }))}
                      className={inputClass} />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-foreground text-sm font-sans cursor-pointer">
                      <input type="checkbox" checked={trackForm.is_premium}
                        onChange={e => setTrackForm(f => ({ ...f, is_premium: e.target.checked }))}
                        className="accent-accent" /> Premium
                    </label>
                    <label className="flex items-center gap-2 text-foreground text-sm font-sans cursor-pointer">
                      <input type="checkbox" checked={trackForm.is_featured}
                        onChange={e => setTrackForm(f => ({ ...f, is_featured: e.target.checked }))}
                        className="accent-accent" /> Featured
                    </label>
                  </div>

                  {/* Audio upload */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Audio File</label>
                    <div className="flex gap-3 items-center">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all">
                        <Upload className="w-4 h-4" />
                        {uploading.audio ? "Uploading..." : "Upload audio"}
                        <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, "audio_url")} disabled={uploading.audio} />
                      </label>
                      {trackForm.audio_url && <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-accent" /> Uploaded</span>}
                    </div>
                    <input value={trackForm.audio_url} onChange={e => setTrackForm(f => ({ ...f, audio_url: e.target.value }))}
                      className={inputClass + " mt-2 text-xs"} placeholder="Or paste audio URL" />
                  </div>

                  {/* Thumbnail upload */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Thumbnail Image</label>
                    <div className="flex gap-3 items-center">
                      <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all">
                        <Upload className="w-4 h-4" />
                        {uploading.image ? "Uploading..." : "Upload image"}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, "thumbnail_url")} disabled={uploading.image} />
                      </label>
                      {trackForm.thumbnail_url && <img src={trackForm.thumbnail_url} alt="thumb" className="w-16 h-9 rounded-lg object-cover border border-foreground/10" />}
                    </div>
                    <input value={trackForm.thumbnail_url} onChange={e => setTrackForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                      className={inputClass + " mt-2 text-xs"} placeholder="Or paste image URL" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => { setShowTrackForm(false); setEditingTrack(null); }}
                    className="px-5 py-2.5 rounded-full text-sm border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => saveTrackMutation.mutate(trackForm)}
                    disabled={!trackForm.title || saveTrackMutation.isPending}
                    className="px-5 py-2.5 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform">
                    {saveTrackMutation.isPending ? "Saving..." : editingTrack ? "Save Changes" : "Create Track"}
                  </button>
                </div>
              </div>
            )}

            {/* Track list */}
            {tracksLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />)}</div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">No sessions yet. Add your first session above.</div>
            ) : (
              <div className="space-y-8">
                {Object.entries(tracksByCategory).map(([cat, catTracks]) => (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-display text-lg">{CATEGORIES[cat] || cat}</h3>
                      <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">{catTracks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {catTracks.map((track: any) => (
                        <div key={track.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-foreground/5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-surface-light">
                            <Music className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {track.duration_minutes} min{track.is_premium ? " · Premium" : ""}{!track.audio_url ? " · No file" : ""}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => openEditTrack(track)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { if (confirm("Delete this track?")) deleteTrackMutation.mutate(track.id); }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface-light transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ COURSES TAB ============ */}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Courses</h2>
              <button onClick={() => { setEditingCourse(null); setCourseForm({ title: "", description: "", is_premium: true, thumbnail_url: "" }); setShowCourseForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            </div>

            {showCourseForm && (
              <div className="velum-card p-6 mb-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-display text-lg">{editingCourse ? "Edit Course" : "New Course"}</h3>
                  <button onClick={() => setShowCourseForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Title *</label>
                    <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="Course title" />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass + " resize-none"} />
                  </div>
                  <label className="flex items-center gap-2 text-foreground text-sm font-sans cursor-pointer">
                    <input type="checkbox" checked={courseForm.is_premium} onChange={e => setCourseForm(f => ({ ...f, is_premium: e.target.checked }))} className="accent-accent" /> Premium
                  </label>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowCourseForm(false)} className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
                    <button onClick={() => saveCourseMutation.mutate(courseForm)} disabled={!courseForm.title || saveCourseMutation.isPending}
                      className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                      {saveCourseMutation.isPending ? "Saving..." : editingCourse ? "Save" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No courses yet.</p>
              ) : courses.map((course: any) => (
                <div key={course.id} className="velum-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-sans font-medium">{course.title}</p>
                    <p className="text-ui text-xs">{course.description}{course.is_premium ? " · Premium" : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCourse(course); setCourseForm({ title: course.title, description: course.description || "", is_premium: course.is_premium, thumbnail_url: course.thumbnail_url || "" }); setShowCourseForm(true); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteCourseMutation.mutate(course.id); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ MASTERY TAB ============ */}
        {activeTab === "mastery" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Mastery Classes</h2>
              <button onClick={() => { setEditingMastery(null); setMasteryForm({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "" }); setShowMasteryForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Add Class
              </button>
            </div>

            {showMasteryForm && (
              <div className="velum-card p-6 mb-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-display text-lg">{editingMastery ? "Edit Class" : "New Class"}</h3>
                  <button onClick={() => setShowMasteryForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className={labelClass}>Title *</label><input value={masteryForm.title} onChange={e => setMasteryForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>Description</label><textarea value={masteryForm.description} onChange={e => setMasteryForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass + " resize-none"} /></div>
                  <div><label className={labelClass}>Duration (min)</label><input type="number" value={masteryForm.duration_minutes} onChange={e => setMasteryForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className={inputClass} /></div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={masteryForm.is_premium} onChange={e => setMasteryForm(f => ({ ...f, is_premium: e.target.checked }))} className="accent-accent" /> Premium</label>
                  <div><label className={labelClass}>Audio URL</label><input value={masteryForm.audio_url} onChange={e => setMasteryForm(f => ({ ...f, audio_url: e.target.value }))} className={inputClass} placeholder="Paste URL or upload" /></div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowMasteryForm(false)} className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
                    <button onClick={() => saveMasteryMutation.mutate(masteryForm)} disabled={!masteryForm.title || saveMasteryMutation.isPending}
                      className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                      {saveMasteryMutation.isPending ? "Saving..." : editingMastery ? "Save" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {masteryClasses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No mastery classes yet.</p>
              ) : masteryClasses.map((mc: any) => (
                <div key={mc.id} className="velum-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm font-sans font-medium">{mc.title}</p>
                    <p className="text-ui text-xs">{mc.duration_minutes} min{mc.is_premium ? " · Premium" : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingMastery(mc); setMasteryForm({ title: mc.title, description: mc.description || "", duration_minutes: mc.duration_minutes, is_premium: mc.is_premium, audio_url: mc.audio_url || "", thumbnail_url: mc.thumbnail_url || "" }); setShowMasteryForm(true); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMasteryMutation.mutate(mc.id); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ PROMPTS TAB ============ */}
        {activeTab === "prompts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Journaling Prompts</h2>
            </div>

            <div className="velum-card p-5 mb-6">
              <label className={labelClass}>New Prompt</label>
              <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                rows={2} className={inputClass + " resize-none mb-3"} placeholder="What does your body need from you today?" />
              <div className="flex items-center gap-3">
                <input value={newPromptCategory} onChange={e => setNewPromptCategory(e.target.value)}
                  className={inputClass + " max-w-[200px]"} placeholder="Category (optional)" />
                <button onClick={() => addPromptMutation.mutate()}
                  disabled={!newPrompt.trim() || addPromptMutation.isPending}
                  className="px-5 py-2.5 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform">
                  <Plus className="w-4 h-4 inline mr-1" /> Add
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {prompts.map((prompt: any) => (
                <div key={prompt.id} className="velum-card p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground text-sm font-sans">{prompt.prompt}</p>
                    {prompt.category && <p className="text-accent text-[10px] uppercase tracking-wider mt-1">{prompt.category}</p>}
                  </div>
                  <button onClick={() => { if (confirm("Delete this prompt?")) deletePromptMutation.mutate(prompt.id); }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ SETTINGS TAB ============ */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-display text-2xl mb-6">Settings</h2>
            <div className="velum-card p-6">
              <p className="text-ui text-xs tracking-wide uppercase mb-4">App Configuration</p>
              <p className="text-muted-foreground text-sm">Settings management coming soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
