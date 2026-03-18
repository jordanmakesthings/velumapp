import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, Plus, Upload, Trash2, Edit2, X, Check, Music, BookOpen,
  GraduationCap, Feather, Settings, Layers, ChevronUp, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import ThumbnailGenerator from "@/components/admin/ThumbnailGenerator";

const STEP_TYPES = ["intro", "breathe", "write", "reflect", "close"] as const;

interface JournalingStep {
  step: number;
  type: string;
  instruction: string;
  prompt: string;
}

function StepsBuilder({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  let steps: JournalingStep[] = [];
  try {
    if (value) steps = JSON.parse(value);
  } catch { /* keep empty */ }

  const updateSteps = (newSteps: JournalingStep[]) => {
    onChange(JSON.stringify(newSteps.map((s, i) => ({ ...s, step: i + 1 })), null, 2));
  };

  const addStep = () => {
    updateSteps([...steps, { step: steps.length + 1, type: "write", instruction: "", prompt: "" }]);
  };

  const removeStep = (idx: number) => {
    updateSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof JournalingStep, val: string) => {
    const newSteps = [...steps];
    newSteps[idx] = { ...newSteps[idx], [field]: val };
    updateSteps(newSteps);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40";

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="p-4 rounded-xl bg-background border border-foreground/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-accent text-[10px] font-sans font-medium tracking-wider uppercase">Step {i + 1}</span>
            <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive text-xs">Remove</button>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
            <select value={s.type} onChange={e => updateStep(i, "type", e.target.value)} className={inputCls}>
              {STEP_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Instruction</label>
            <input value={s.instruction || ""} onChange={e => updateStep(i, "instruction", e.target.value)} className={inputCls} placeholder="e.g. Take a moment to settle in..." />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Prompt</label>
            <textarea value={s.prompt || ""} onChange={e => updateStep(i, "prompt", e.target.value)} rows={2} className={inputCls + " resize-none"} placeholder="e.g. What are you noticing in your body right now?" />
          </div>
        </div>
      ))}
      <button onClick={addStep} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-foreground/15 text-muted-foreground hover:text-foreground hover:border-accent/30 text-sm font-sans w-full justify-center transition-colors">
        <Plus className="w-4 h-4" /> Add Step
      </button>
    </div>
  );
}

type AdminTab = "tracks" | "subcategories" | "courses" | "mastery" | "prompts" | "settings";

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Music }[] = [
  { key: "tracks", label: "Sessions", icon: Music },
  { key: "subcategories", label: "Subcategories", icon: Layers },
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
  audio_url: "", thumbnail_url: "", course_id: "", subcategory_id: "", order_index: 0,
  content_type: "audio", steps: "", tags: "",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("tracks");

  const [showTrackForm, setShowTrackForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [trackForm, setTrackForm] = useState(emptyTrackForm);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const [newPrompt, setNewPrompt] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("");

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", is_premium: true, thumbnail_url: "", category: "", cover_image_url: "" });
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [showMasteryForm, setShowMasteryForm] = useState(false);
  const [masteryForm, setMasteryForm] = useState({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "", theme: "", cover_image_url: "", pause_prompts: "[]" });
  const [editingMastery, setEditingMastery] = useState<any>(null);

  const [showSubcatForm, setShowSubcatForm] = useState(false);
  const [subcatForm, setSubcatForm] = useState({ name: "", category: "meditation", thumbnail_url: "", order_index: 0 });
  const [editingSubcat, setEditingSubcat] = useState<any>(null);

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

  const { data: subcategories = [] } = useQuery({
    queryKey: ["adminSubcategories"],
    queryFn: async () => {
      const { data } = await supabase.from("subcategories").select("*").order("category").order("order_index");
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

  // Generic file upload helper
  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("track-media").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("track-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    folder: string,
    setForm: (fn: (prev: any) => any) => void,
    uploadKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(u => ({ ...u, [uploadKey]: true }));
    try {
      if (field === "audio_url" && file.type.startsWith("audio") && setForm === setTrackFormWrapped) {
        const url = URL.createObjectURL(file);
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.src = url;
        audio.onloadedmetadata = () => {
          setTrackForm(f => ({ ...f, duration_minutes: Math.round(audio.duration / 60) }));
          URL.revokeObjectURL(url);
        };
      }
      if (field === "audio_url" && file.type.startsWith("audio") && setForm === setMasteryFormWrapped) {
        const url = URL.createObjectURL(file);
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.src = url;
        audio.onloadedmetadata = () => {
          setMasteryForm(f => ({ ...f, duration_minutes: Math.round(audio.duration / 60) }));
          URL.revokeObjectURL(url);
        };
      }
      const publicUrl = await uploadFile(file, folder);
      if (publicUrl) setForm((f: any) => ({ ...f, [field]: publicUrl }));
    } finally {
      setUploading(u => ({ ...u, [uploadKey]: false }));
    }
  };

  const setTrackFormWrapped = (fn: (prev: any) => any) => setTrackForm(fn);
  const setMasteryFormWrapped = (fn: (prev: any) => any) => setMasteryForm(fn);

  // ===== REORDER HELPER =====
  const reorderMutation = useMutation({
    mutationFn: async ({ table, id, newIndex, siblings }: { table: string; id: string; newIndex: number; siblings: any[] }) => {
      // Swap order_index between the item and the one it's replacing
      const item = siblings.find((s: any) => s.id === id);
      const target = siblings[newIndex];
      if (!item || !target || item.id === target.id) return;
      await Promise.all([
        supabase.from(table as any).update({ order_index: target.order_index }).eq("id", item.id),
        supabase.from(table as any).update({ order_index: item.order_index }).eq("id", target.id),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTracks"] });
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      queryClient.invalidateQueries({ queryKey: ["adminMastery"] });
      queryClient.invalidateQueries({ queryKey: ["adminSubcategories"] });
      queryClient.invalidateQueries({ queryKey: ["adminPrompts"] });
    },
  });

  const ReorderButtons = ({ table, item, siblings }: { table: string; item: any; siblings: any[] }) => {
    const idx = siblings.findIndex((s: any) => s.id === item.id);
    return (
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          disabled={idx === 0 || reorderMutation.isPending}
          onClick={() => reorderMutation.mutate({ table, id: item.id, newIndex: idx - 1, siblings })}
          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={idx === siblings.length - 1 || reorderMutation.isPending}
          onClick={() => reorderMutation.mutate({ table, id: item.id, newIndex: idx + 1, siblings })}
          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Track mutations
  const saveTrackMutation = useMutation({
    mutationFn: async (data: typeof emptyTrackForm) => {
      let parsedSteps: any = null;
      try { if (data.steps) parsedSteps = JSON.parse(data.steps); } catch { /* keep null */ }
      const parsedTags = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : null;
      const saveData = {
        title: data.title, description: data.description || null, category: data.category,
        duration_minutes: data.duration_minutes, is_premium: data.is_premium, is_featured: data.is_featured,
        audio_url: data.audio_url || null, thumbnail_url: data.thumbnail_url || null,
        course_id: data.course_id || null, subcategory_id: data.subcategory_id || null, order_index: data.order_index,
        content_type: data.content_type || "audio", steps: parsedSteps, tags: parsedTags,
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
      setShowTrackForm(false); setEditingTrack(null); setTrackForm(emptyTrackForm);
      toast.success(editingTrack ? "Track updated" : "Track created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tracks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminTracks"] }); toast.success("Track deleted"); },
  });

  const saveCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const saveData = { title: data.title, description: data.description || null, is_premium: data.is_premium, thumbnail_url: data.thumbnail_url || null, category: data.category || null, cover_image_url: data.cover_image_url || null };
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
      setShowCourseForm(false); setEditingCourse(null);
      setCourseForm({ title: "", description: "", is_premium: true, thumbnail_url: "", category: "", cover_image_url: "" });
      toast.success(editingCourse ? "Course updated" : "Course created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminCourses"] }); toast.success("Course deleted"); },
  });

  const saveMasteryMutation = useMutation({
    mutationFn: async (data: typeof masteryForm) => {
      let parsedPrompts: any[] = [];
      try { parsedPrompts = JSON.parse(data.pause_prompts); } catch { /* keep empty */ }
      const saveData = {
        title: data.title, description: data.description || null, duration_minutes: data.duration_minutes,
        is_premium: data.is_premium, audio_url: data.audio_url || null, thumbnail_url: data.thumbnail_url || null,
        theme: data.theme || null, cover_image_url: data.cover_image_url || null, pause_prompts: parsedPrompts,
      };
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
      setShowMasteryForm(false); setEditingMastery(null);
      setMasteryForm({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "", theme: "", cover_image_url: "", pause_prompts: "[]" });
      toast.success(editingMastery ? "Class updated" : "Class created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMasteryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mastery_classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminMastery"] }); toast.success("Class deleted"); },
  });

  const saveSubcatMutation = useMutation({
    mutationFn: async (data: typeof subcatForm) => {
      const saveData = { name: data.name, category: data.category, thumbnail_url: data.thumbnail_url || null, order_index: data.order_index };
      if (editingSubcat) {
        const { error } = await supabase.from("subcategories").update(saveData).eq("id", editingSubcat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subcategories").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSubcategories"] });
      setShowSubcatForm(false); setEditingSubcat(null);
      setSubcatForm({ name: "", category: "meditation", thumbnail_url: "", order_index: 0 });
      toast.success(editingSubcat ? "Subcategory updated" : "Subcategory created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSubcatMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminSubcategories"] }); toast.success("Subcategory deleted"); },
  });

  const addPromptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("journaling_prompts").insert({ prompt: newPrompt, category: newPromptCategory || null, order_index: prompts.length });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminPrompts"] }); setNewPrompt(""); toast.success("Prompt added"); },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journaling_prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminPrompts"] }); toast.success("Prompt deleted"); },
  });

  const openEditTrack = (track: any) => {
    setEditingTrack(track);
    setTrackForm({
      title: track.title, description: track.description || "", category: track.category,
      duration_minutes: track.duration_minutes, is_premium: track.is_premium, is_featured: track.is_featured,
      audio_url: track.audio_url || "", thumbnail_url: track.thumbnail_url || "",
      course_id: track.course_id || "", subcategory_id: track.subcategory_id || "", order_index: track.order_index,
      content_type: track.content_type || "audio", steps: track.steps ? JSON.stringify(track.steps, null, 2) : "",
      tags: track.tags ? (Array.isArray(track.tags) ? track.tags.join(", ") : String(track.tags)) : "",
    });
    setShowTrackForm(true);
  };

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

  const UploadRow = ({ label, field, folder, value, setForm, uploadKey, accept = "image/*", preview = "image" }: {
    label: string; field: string; folder: string; value: string;
    setForm: (fn: (p: any) => any) => void; uploadKey: string;
    accept?: string; preview?: "image" | "audio";
  }) => (
    <div className="md:col-span-2">
      <label className={labelClass}>{label}</label>
      <div className="flex gap-3 items-center flex-wrap">
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all">
          <Upload className="w-4 h-4" />
          {uploading[uploadKey] ? "Uploading..." : `Upload ${preview === "audio" ? "audio" : "image"}`}
          <input type="file" accept={accept} className="hidden"
            onChange={e => handleUpload(e, field, folder, setForm, uploadKey)}
            disabled={!!uploading[uploadKey]} />
        </label>
        {value && preview === "image" && <img src={value} alt="thumb" className="w-16 h-10 rounded-lg object-cover border border-foreground/10" />}
        {value && preview === "audio" && <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-accent" /> Audio uploaded</span>}
      </div>
      <input value={value} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
        className={inputClass + " mt-2 text-xs"} placeholder={`Or paste ${preview === "audio" ? "audio" : "image"} URL`} />
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-accent/10">
        <button onClick={() => navigate("/")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-display text-xl">Content Manager</h1>
          <p className="text-xs text-muted-foreground">Upload and manage all content</p>
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
                    <select value={trackForm.category} onChange={e => setTrackForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Duration (minutes)</label>
                    <input type="number" value={trackForm.duration_minutes}
                      onChange={e => setTrackForm(f => ({ ...f, duration_minutes: Number(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Subcategory</label>
                    <select value={trackForm.subcategory_id} onChange={e => setTrackForm(f => ({ ...f, subcategory_id: e.target.value }))} className={inputClass}>
                      <option value="">— None —</option>
                      {subcategories.filter((s: any) => s.category === trackForm.category).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Course</label>
                    <select value={trackForm.course_id} onChange={e => setTrackForm(f => ({ ...f, course_id: e.target.value }))} className={inputClass}>
                      <option value="">— Standalone —</option>
                      {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Order Index</label>
                    <input type="number" value={trackForm.order_index}
                      onChange={e => setTrackForm(f => ({ ...f, order_index: Number(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-foreground text-sm font-sans cursor-pointer">
                      <input type="checkbox" checked={trackForm.is_featured} onChange={e => setTrackForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-accent" /> Featured
                    </label>
                  </div>
                  <div>
                    <label className={labelClass}>Content Type</label>
                    <select value={trackForm.content_type} onChange={e => setTrackForm(f => ({ ...f, content_type: e.target.value }))} className={inputClass}>
                      <option value="audio">Audio</option>
                      <option value="journaling">Journaling</option>
                    </select>
                  </div>

                  {/* Thumbnail Generator at top */}
                  <div className="md:col-span-2 border-b border-foreground/5 pb-4">
                    <ThumbnailGenerator
                      title={trackForm.title}
                      category={trackForm.category}
                    />
                  </div>

                  <UploadRow label="Thumbnail Image" field="thumbnail_url" folder="images" value={trackForm.thumbnail_url}
                    setForm={setTrackFormWrapped} uploadKey="trackImage" />

                  {trackForm.content_type === "audio" && (
                    <>
                      <UploadRow label="Audio File" field="audio_url" folder="audio" value={trackForm.audio_url}
                        setForm={setTrackFormWrapped} uploadKey="trackAudio" accept="audio/*" preview="audio" />
                    </>
                  )}

                  {trackForm.content_type === "journaling" && (
                    <div className="md:col-span-2">
                      <label className={labelClass}>Steps</label>
                      <StepsBuilder
                        value={trackForm.steps}
                        onChange={(val) => setTrackForm(f => ({ ...f, steps: val }))}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => { setShowTrackForm(false); setEditingTrack(null); }}
                    className="px-5 py-2.5 rounded-full text-sm border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
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
                        <div key={track.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-foreground/5">
                          <ReorderButtons table="tracks" item={track} siblings={catTracks} />
                          {track.thumbnail_url ? (
                            <img src={track.thumbnail_url} alt="" className="w-12 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-surface-light">
                              <Music className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {track.duration_minutes} min{!track.audio_url && track.content_type === "audio" ? " · No audio" : ""}{track.is_featured ? " · ★" : ""}{track.content_type === "journaling" ? " · Journaling" : ""}
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

        {/* ============ SUBCATEGORIES TAB ============ */}
        {activeTab === "subcategories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Subcategories</h2>
              <button onClick={() => { setEditingSubcat(null); setSubcatForm({ name: "", category: "meditation", thumbnail_url: "", order_index: 0 }); setShowSubcatForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Add Subcategory
              </button>
            </div>

            {showSubcatForm && (
              <div className="velum-card p-6 mb-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-display text-lg">{editingSubcat ? "Edit Subcategory" : "New Subcategory"}</h3>
                  <button onClick={() => setShowSubcatForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Name *</label>
                    <input value={subcatForm.name} onChange={e => setSubcatForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="e.g. Guided Visualizations" />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select value={subcatForm.category} onChange={e => setSubcatForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Order Index</label>
                    <input type="number" value={subcatForm.order_index} onChange={e => setSubcatForm(f => ({ ...f, order_index: Number(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                  <UploadRow label="Thumbnail Image" field="thumbnail_url" folder="images" value={subcatForm.thumbnail_url}
                    setForm={(fn) => setSubcatForm(fn)} uploadKey="subcatImage" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowSubcatForm(false)} className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
                  <button onClick={() => saveSubcatMutation.mutate(subcatForm)} disabled={!subcatForm.name || saveSubcatMutation.isPending}
                    className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                    {saveSubcatMutation.isPending ? "Saving..." : editingSubcat ? "Save" : "Create"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {Object.entries(CATEGORIES).map(([catKey, catLabel]) => {
                const catSubcats = subcategories.filter((s: any) => s.category === catKey);
                if (catSubcats.length === 0) return null;
                return (
                  <div key={catKey}>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-display text-lg">{catLabel}</h3>
                      <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">{catSubcats.length}</span>
                    </div>
                    <div className="space-y-2">
                      {catSubcats.map((sc: any) => (
                        <div key={sc.id} className="velum-card p-4 flex items-center gap-3">
                          <ReorderButtons table="subcategories" item={sc} siblings={catSubcats} />
                          <div className="flex items-center gap-3 flex-1">
                            {sc.thumbnail_url && <img src={sc.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                            <div>
                              <p className="text-foreground text-sm font-sans font-medium">{sc.name}</p>
                              <p className="text-ui text-xs">Order: {sc.order_index}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingSubcat(sc); setSubcatForm({ name: sc.name, category: sc.category, thumbnail_url: sc.thumbnail_url || "", order_index: sc.order_index }); setShowSubcatForm(true); }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm("Delete?")) deleteSubcatMutation.mutate(sc.id); }}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {subcategories.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No subcategories yet.</p>}
            </div>
          </div>
        )}

        {/* ============ COURSES TAB ============ */}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Courses</h2>
              <button onClick={() => { setEditingCourse(null); setCourseForm({ title: "", description: "", is_premium: true, thumbnail_url: "", category: "", cover_image_url: "" }); setShowCourseForm(true); }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Title *</label>
                    <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="Course title" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass + " resize-none"} />
                  </div>
                  <div>
                    <label className={labelClass}>Category</label>
                    <select value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                      <option value="">— None —</option>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-foreground text-sm font-sans cursor-pointer">
                      <input type="checkbox" checked={courseForm.is_premium} onChange={e => setCourseForm(f => ({ ...f, is_premium: e.target.checked }))} className="accent-accent" /> Premium
                    </label>
                  </div>
                  <UploadRow label="Thumbnail" field="thumbnail_url" folder="images" value={courseForm.thumbnail_url}
                    setForm={(fn) => setCourseForm(fn)} uploadKey="courseThumb" />
                  <UploadRow label="Cover Image" field="cover_image_url" folder="images" value={courseForm.cover_image_url}
                    setForm={(fn) => setCourseForm(fn)} uploadKey="courseCover" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowCourseForm(false)} className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
                  <button onClick={() => saveCourseMutation.mutate(courseForm)} disabled={!courseForm.title || saveCourseMutation.isPending}
                    className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                    {saveCourseMutation.isPending ? "Saving..." : editingCourse ? "Save" : "Create"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No courses yet.</p>
              ) : courses.map((course: any, idx: number) => (
                <div key={course.id} className="velum-card p-4 flex items-center gap-3">
                  <ReorderButtons table="courses" item={course} siblings={courses as any[]} />
                  <div className="flex items-center gap-3 flex-1">
                    {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-12 h-8 rounded-lg object-cover" />}
                    <div>
                      <p className="text-foreground text-sm font-sans font-medium">{course.title}</p>
                      <p className="text-ui text-xs">{course.category ? CATEGORIES[course.category] || course.category : "No category"}{course.is_premium ? " · Premium" : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCourse(course); setCourseForm({ title: course.title, description: course.description || "", is_premium: course.is_premium, thumbnail_url: course.thumbnail_url || "", category: course.category || "", cover_image_url: course.cover_image_url || "" }); setShowCourseForm(true); }}
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
              <button onClick={() => { setEditingMastery(null); setMasteryForm({ title: "", description: "", duration_minutes: 30, is_premium: true, audio_url: "", thumbnail_url: "", theme: "", cover_image_url: "", pause_prompts: "[]" }); setShowMasteryForm(true); }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Title *</label>
                    <input value={masteryForm.title} onChange={e => setMasteryForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Description</label>
                    <textarea value={masteryForm.description} onChange={e => setMasteryForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputClass + " resize-none"} />
                  </div>
                  <div>
                    <label className={labelClass}>Theme</label>
                    <input value={masteryForm.theme} onChange={e => setMasteryForm(f => ({ ...f, theme: e.target.value }))} className={inputClass} placeholder="e.g. Emotional Mastery" />
                  </div>
                  <div>
                    <label className={labelClass}>Duration (min)</label>
                    <input type="number" value={masteryForm.duration_minutes} onChange={e => setMasteryForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className={inputClass} />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={masteryForm.is_premium} onChange={e => setMasteryForm(f => ({ ...f, is_premium: e.target.checked }))} className="accent-accent" /> Premium
                    </label>
                  </div>
                  <div>{/* spacer */}</div>

                  <UploadRow label="Audio File" field="audio_url" folder="audio" value={masteryForm.audio_url}
                    setForm={setMasteryFormWrapped} uploadKey="masteryAudio" accept="audio/*" preview="audio" />
                  <UploadRow label="Thumbnail" field="thumbnail_url" folder="images" value={masteryForm.thumbnail_url}
                    setForm={setMasteryFormWrapped} uploadKey="masteryThumb" />
                  <UploadRow label="Cover Image" field="cover_image_url" folder="images" value={masteryForm.cover_image_url}
                    setForm={setMasteryFormWrapped} uploadKey="masteryCover" />

                  <div className="md:col-span-2">
                    <label className={labelClass}>Pause Prompts (JSON array)</label>
                    <textarea value={masteryForm.pause_prompts} onChange={e => setMasteryForm(f => ({ ...f, pause_prompts: e.target.value }))}
                      rows={3} className={inputClass + " resize-none font-mono text-xs"} placeholder='[{"time_seconds": 300, "prompt": "Reflect on..."}]' />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowMasteryForm(false)} className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
                  <button onClick={() => saveMasteryMutation.mutate(masteryForm)} disabled={!masteryForm.title || saveMasteryMutation.isPending}
                    className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                    {saveMasteryMutation.isPending ? "Saving..." : editingMastery ? "Save" : "Create"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {masteryClasses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No mastery classes yet.</p>
              ) : masteryClasses.map((mc: any) => (
                <div key={mc.id} className="velum-card p-4 flex items-center gap-3">
                  <ReorderButtons table="mastery_classes" item={mc} siblings={masteryClasses as any[]} />
                  <div className="flex items-center gap-3 flex-1">
                    {mc.thumbnail_url && <img src={mc.thumbnail_url} alt="" className="w-12 h-8 rounded-lg object-cover" />}
                    <div>
                      <p className="text-foreground text-sm font-sans font-medium">{mc.title}</p>
                      <p className="text-ui text-xs">{mc.duration_minutes} min{mc.is_premium ? " · Premium" : ""}{mc.theme ? ` · ${mc.theme}` : ""}{!mc.audio_url ? " · No audio" : ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingMastery(mc);
                      setMasteryForm({
                        title: mc.title, description: mc.description || "", duration_minutes: mc.duration_minutes,
                        is_premium: mc.is_premium, audio_url: mc.audio_url || "", thumbnail_url: mc.thumbnail_url || "",
                        theme: mc.theme || "", cover_image_url: mc.cover_image_url || "",
                        pause_prompts: JSON.stringify(mc.pause_prompts || [], null, 2),
                      });
                      setShowMasteryForm(true);
                    }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
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
            <div className="velum-card p-6 mb-6">
              <p className="text-ui text-xs tracking-wide uppercase mb-4">Stripe Configuration</p>
              <div className="space-y-2 text-sm font-sans">
                <p className="text-foreground"><span className="text-muted-foreground">Monthly Price ID:</span> price_1TC9J5Lv0dyfXaxONNpQ9wHV</p>
                <p className="text-foreground"><span className="text-muted-foreground">Lifetime Price ID:</span> price_1TC9JLLv0dyfXaxOM4HC5j8l</p>
                <p className="text-muted-foreground text-xs mt-3">These are already wired into the checkout function. No action needed.</p>
              </div>
            </div>
            <div className="velum-card p-6">
              <p className="text-ui text-xs tracking-wide uppercase mb-4">App Configuration</p>
              <p className="text-muted-foreground text-sm">Additional settings coming soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
