import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, Upload, Check, Music, Video, FileText } from "lucide-react";
import { toast } from "sonner";
import ThumbnailGenerator from "@/components/admin/ThumbnailGenerator";

interface LessonForm {
  id?: string;
  title: string;
  description: string;
  duration_minutes: number;
  media_url: string;
  written_content: string;
  is_free_preview: boolean;
  order_index: number;
  downloadable_files: { name: string; url: string }[];
  lesson_type: "audio" | "video" | "writing";
  thumbnail_url: string;
  thumbnail_square_url: string;
}

interface ModuleData {
  id: string;
  title: string;
  submodules?: { id: string; title: string }[];
}

const emptyLesson: LessonForm = {
  title: "", description: "", duration_minutes: 0, media_url: "",
  written_content: "", is_free_preview: false, order_index: 0,
  downloadable_files: [], lesson_type: "audio",
  thumbnail_url: "", thumbnail_square_url: "",
};

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-background border border-foreground/10 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40";
const labelClass = "block text-xs text-muted-foreground mb-1.5 uppercase tracking-wider";

export default function CourseBuilder({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Module management
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newSubmoduleTitle, setNewSubmoduleTitle] = useState("");
  const [addingSubmoduleTo, setAddingSubmoduleTo] = useState<string | null>(null);

  const { data: course } = useQuery({
    queryKey: ["courseV2", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("courses_v2").select("*").eq("id", courseId).single();
      return data;
    },
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["courseLessons", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("order_index");
      return data || [];
    },
  });

  const modules: ModuleData[] = Array.isArray(course?.modules) ? (course.modules as unknown as ModuleData[]) : [];

  const saveModulesMutation = useMutation({
    mutationFn: async (newModules: ModuleData[]) => {
      const { error } = await supabase.from("courses_v2").update({ modules: newModules as any }).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseV2", courseId] });
      toast.success("Modules updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addModule = () => {
    if (!newModuleTitle.trim()) return;
    const newModule: ModuleData = { id: `mod_${Date.now()}`, title: newModuleTitle.trim(), submodules: [] };
    saveModulesMutation.mutate([...modules, newModule]);
    setNewModuleTitle("");
    setShowModuleForm(false);
  };

  const removeModule = (modId: string) => {
    if (!confirm("Remove this module?")) return;
    saveModulesMutation.mutate(modules.filter(m => m.id !== modId));
  };

  const addSubmodule = (modId: string) => {
    if (!newSubmoduleTitle.trim()) return;
    const updated = modules.map(m => {
      if (m.id !== modId) return m;
      const subs = m.submodules || [];
      return { ...m, submodules: [...subs, { id: `sub_${Date.now()}`, title: newSubmoduleTitle.trim() }] };
    });
    saveModulesMutation.mutate(updated);
    setNewSubmoduleTitle("");
    setAddingSubmoduleTo(null);
  };

  const removeSubmodule = (modId: string, subId: string) => {
    const updated = modules.map(m => {
      if (m.id !== modId) return m;
      return { ...m, submodules: (m.submodules || []).filter(s => s.id !== subId) };
    });
    saveModulesMutation.mutate(updated);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("track-media").upload(path, file);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data } = supabase.storage.from("track-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const folder = lessonForm.lesson_type === "video" ? "video" : "audio";
      const url = await uploadFile(file, folder);
      if (url) {
        setLessonForm(f => ({ ...f, media_url: url }));
        // Auto-detect duration
        if (file.type.startsWith("audio") || file.type.startsWith("video")) {
          const tempUrl = URL.createObjectURL(file);
          const el = document.createElement(file.type.startsWith("video") ? "video" : "audio");
          el.preload = "metadata";
          el.src = tempUrl;
          el.onloadedmetadata = () => {
            setLessonForm(f => ({ ...f, duration_minutes: Math.round(el.duration / 60) }));
            URL.revokeObjectURL(tempUrl);
          };
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const saveLessonMutation = useMutation({
    mutationFn: async (data: LessonForm) => {
      const saveData = {
        title: data.title,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        media_url: data.media_url || null,
        written_content: data.written_content || null,
        is_free_preview: data.is_free_preview,
        order_index: data.order_index,
        course_id: courseId,
        downloadable_files: data.downloadable_files as any,
        thumbnail_url: data.thumbnail_url || null,
        thumbnail_square_url: data.thumbnail_square_url || null,
      };
      if (editingLesson) {
        const { error } = await supabase.from("lessons").update(saveData).eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseLessons", courseId] });
      setShowLessonForm(false);
      setEditingLesson(null);
      setLessonForm(emptyLesson);
      toast.success(editingLesson ? "Lesson updated" : "Lesson created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courseLessons", courseId] });
      toast.success("Lesson deleted");
    },
  });

  const typeIcon = (type: string) => {
    if (type === "video") return <Video className="w-3.5 h-3.5" />;
    if (type === "writing") return <FileText className="w-3.5 h-3.5" />;
    return <Music className="w-3.5 h-3.5" />;
  };

  const detectLessonType = (lesson: any): string => {
    if (lesson.written_content && !lesson.media_url) return "writing";
    if (lesson.media_url?.includes("video")) return "video";
    return "audio";
  };

  return (
    <div className="velum-card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-display text-xl">{course?.title || "Course"}</h3>
          <p className="text-muted-foreground text-xs font-sans">Manage modules, submodules, and lessons</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* MODULES */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase">Modules</h4>
          <button onClick={() => setShowModuleForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-accent hover:text-foreground border border-accent/20 hover:border-accent/40 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Module
          </button>
        </div>

        {showModuleForm && (
          <div className="flex gap-3 mb-4">
            <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
              className={inputClass} placeholder="Module title" autoFocus
              onKeyDown={e => e.key === "Enter" && addModule()} />
            <button onClick={addModule} disabled={!newModuleTitle.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50 shrink-0">Add</button>
            <button onClick={() => setShowModuleForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {modules.length === 0 && !showModuleForm && (
          <p className="text-muted-foreground text-sm text-center py-4">No modules yet. Add one to organize your lessons.</p>
        )}

        <div className="space-y-3">
          {modules.map((mod) => (
            <div key={mod.id} className="border border-foreground/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-foreground text-sm font-sans font-bold">{mod.title}</h5>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAddingSubmoduleTo(addingSubmoduleTo === mod.id ? null : mod.id); setNewSubmoduleTitle(""); }}
                    className="text-accent text-xs font-sans hover:underline">+ Submodule</button>
                  <button onClick={() => removeModule(mod.id)}
                    className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {addingSubmoduleTo === mod.id && (
                <div className="flex gap-2 mb-3 ml-4">
                  <input value={newSubmoduleTitle} onChange={e => setNewSubmoduleTitle(e.target.value)}
                    className={inputClass + " text-xs"} placeholder="Submodule title" autoFocus
                    onKeyDown={e => e.key === "Enter" && addSubmodule(mod.id)} />
                  <button onClick={() => addSubmodule(mod.id)} disabled={!newSubmoduleTitle.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium gold-gradient text-primary-foreground disabled:opacity-50 shrink-0">Add</button>
                </div>
              )}

              {(mod.submodules || []).length > 0 && (
                <div className="ml-4 space-y-1.5">
                  {(mod.submodules || []).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-background/50">
                      <span className="text-foreground/80 text-xs font-sans">{sub.title}</span>
                      <button onClick={() => removeSubmodule(mod.id, sub.id)}
                        className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LESSONS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase">Lessons</h4>
          <button onClick={() => { setEditingLesson(null); setLessonForm({ ...emptyLesson, order_index: lessons.length }); setShowLessonForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-accent hover:text-foreground border border-accent/20 hover:border-accent/40 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Lesson
          </button>
        </div>

        {showLessonForm && (
          <div className="border border-accent/20 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-display text-lg">{editingLesson ? "Edit Lesson" : "New Lesson"}</h5>
              <button onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}
                className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Title *</label>
                <input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                  className={inputClass} placeholder="Lesson title" />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className={inputClass + " resize-none"} />
              </div>

              <div>
                <label className={labelClass}>Lesson Type</label>
                <select value={lessonForm.lesson_type} onChange={e => setLessonForm(f => ({ ...f, lesson_type: e.target.value as any }))} className={inputClass}>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="writing">Writing / Text</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Duration (min)</label>
                <input type="number" value={lessonForm.duration_minutes}
                  onChange={e => setLessonForm(f => ({ ...f, duration_minutes: Number(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Order Index</label>
                <input type="number" value={lessonForm.order_index}
                  onChange={e => setLessonForm(f => ({ ...f, order_index: Number(e.target.value) || 0 }))}
                  className={inputClass} />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={lessonForm.is_free_preview}
                  onChange={e => setLessonForm(f => ({ ...f, is_free_preview: e.target.checked }))}
                  className="w-4 h-4 rounded accent-accent" />
                <label className="text-xs text-foreground/80 font-sans">Free preview</label>
              </div>

              {(lessonForm.lesson_type === "audio" || lessonForm.lesson_type === "video") && (
                <div className="md:col-span-2">
                  <label className={labelClass}>{lessonForm.lesson_type === "video" ? "Video File" : "Audio File"}</label>
                  <div className="flex gap-3 items-center flex-wrap">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading..." : `Upload ${lessonForm.lesson_type}`}
                      <input type="file" accept={lessonForm.lesson_type === "video" ? "video/*" : "audio/*"}
                        className="hidden" onChange={handleMediaUpload} disabled={uploading} />
                    </label>
                    {lessonForm.media_url && <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-accent" /> Uploaded</span>}
                  </div>
                  <input value={lessonForm.media_url} onChange={e => setLessonForm(f => ({ ...f, media_url: e.target.value }))}
                    className={inputClass + " mt-2 text-xs"} placeholder="Or paste URL" />
                </div>
              )}

              {lessonForm.lesson_type === "writing" && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Written Content</label>
                  <textarea value={lessonForm.written_content}
                    onChange={e => setLessonForm(f => ({ ...f, written_content: e.target.value }))}
                    rows={6} className={inputClass + " resize-none"} placeholder="Lesson content (supports markdown)" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}
                className="px-5 py-2 rounded-full text-sm border border-foreground/10 text-muted-foreground">Cancel</button>
              <button onClick={() => saveLessonMutation.mutate(lessonForm)}
                disabled={!lessonForm.title || saveLessonMutation.isPending}
                className="px-5 py-2 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50">
                {saveLessonMutation.isPending ? "Saving..." : editingLesson ? "Save" : "Create"}
              </button>
            </div>
          </div>
        )}

        {lessons.length === 0 && !showLessonForm ? (
          <p className="text-muted-foreground text-sm text-center py-4">No lessons yet.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any) => {
              const type = detectLessonType(lesson);
              return (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-foreground/5">
                  <span className={`p-1.5 rounded-lg ${type === "video" ? "bg-blue-500/10 text-blue-400" : type === "writing" ? "bg-emerald-500/10 text-emerald-400" : "bg-accent/10 text-accent"}`}>
                    {typeIcon(type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-sans font-medium truncate">{lesson.title}</p>
                    <p className="text-muted-foreground text-xs font-sans">
                      {lesson.duration_minutes} min
                      {lesson.is_free_preview && <span className="ml-2 text-accent">· Free preview</span>}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => {
                      setEditingLesson(lesson);
                      setLessonForm({
                        title: lesson.title,
                        description: lesson.description || "",
                        duration_minutes: lesson.duration_minutes,
                        media_url: lesson.media_url || "",
                        written_content: lesson.written_content || "",
                        is_free_preview: lesson.is_free_preview,
                        order_index: lesson.order_index,
                        downloadable_files: Array.isArray(lesson.downloadable_files) ? lesson.downloadable_files as any : [],
                        lesson_type: detectLessonType(lesson) as any,
                      });
                      setShowLessonForm(true);
                    }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this lesson?")) deleteLessonMutation.mutate(lesson.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
