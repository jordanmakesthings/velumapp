import { useState } from "react";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { listAllCovers, type TrackCover } from "@/lib/track-covers";

interface GoalRow {
  id: string;
  slug: string;
  label: string;
  short: string;
  cover: string | null;
  order_index: number;
}

const emptyGoal = { slug: "", label: "", short: "", cover: "", order_index: 0 };

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Admin manager for the Goals taxonomy — the cross-cutting "why you'd pick this"
// layer that powers Browse-by-Goal and the session finder.
export default function GoalsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GoalRow | null>(null);
  const [form, setForm] = useState({ ...emptyGoal });

  const { data: goals = [] } = useQuery({
    queryKey: ["adminGoals"],
    queryFn: async () => {
      const { data } = await supabase.from("goals" as any).select("*").order("order_index");
      return (data as unknown as GoalRow[]) || [];
    },
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["adminTracksForGoals"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("goals");
      return data || [];
    },
  });

  const { data: covers = [] } = useQuery({
    queryKey: ["allCovers"],
    queryFn: () => listAllCovers(),
  });

  const counts: Record<string, number> = {};
  (tracks as any[]).forEach((t) => (Array.isArray(t.goals) ? t.goals : []).forEach((g: string) => { counts[g] = (counts[g] || 0) + 1; }));

  const inputCls = "w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40";
  const labelCls = "block text-xs text-muted-foreground uppercase tracking-wider mb-1.5";

  const openNew = () => { setEditing(null); setForm({ ...emptyGoal, order_index: goals.length + 1 }); setShowForm(true); };
  const openEdit = (g: GoalRow) => { setEditing(g); setForm({ slug: g.slug, label: g.label, short: g.short, cover: g.cover || "", order_index: g.order_index }); setShowForm(true); };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug || slugify(form.label),
        label: form.label,
        short: form.short || form.label,
        cover: form.cover || null,
        order_index: form.order_index,
      };
      if (!payload.label) throw new Error("Label is required");
      if (editing) {
        const { error } = await supabase.from("goals" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminGoals"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false); setEditing(null); setForm({ ...emptyGoal });
      toast.success(editing ? "Goal updated" : "Goal created");
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (g: GoalRow) => {
      const { error } = await supabase.from("goals" as any).delete().eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminGoals"] }); qc.invalidateQueries({ queryKey: ["goals"] }); toast.success("Goal deleted"); },
    onError: (e: any) => toast.error(e.message || "Delete failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-display text-2xl">Goals</h2>
          <p className="text-xs text-muted-foreground mt-1">The cross-cutting taxonomy that powers Browse-by-Goal and the finder. Keep it tight — fewer, fuller goals feel more premium.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform shrink-0">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {showForm && (
        <div className="velum-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-display text-lg">{editing ? "Edit Goal" : "New Goal"}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Label</label>
              <input className={inputCls} value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} placeholder="e.g. Calm & Anxiety" />
            </div>
            <div>
              <label className={labelCls}>Short (chip)</label>
              <input className={inputCls} value={form.short} onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))} placeholder="e.g. Calm" />
            </div>
            <div>
              <label className={labelCls}>Slug {editing && <span className="opacity-50 normal-case">(careful — tracks reference this)</span>}</label>
              <input className={inputCls} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} placeholder="calm" />
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <input type="number" className={inputCls} value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) || 0 }))} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Cover artwork</label>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {(covers as TrackCover[]).map((c) => (
                  <button key={c.id} type="button" onClick={() => setForm((f) => ({ ...f, cover: c.url }))}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${form.cover === c.url ? "border-accent ring-1 ring-accent" : "border-foreground/10 hover:border-foreground/30"}`}>
                    <img src={c.url} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                    {form.cover === c.url && <span className="absolute inset-0 bg-accent/20 flex items-center justify-center"><Check className="w-4 h-4 text-foreground" /></span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-5 py-2.5 rounded-full text-sm border border-foreground/10 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={() => save.mutate()} disabled={!form.label || save.isPending}
              className="px-5 py-2.5 rounded-full text-sm font-medium gold-gradient text-primary-foreground disabled:opacity-50 active:scale-95 transition-transform">
              {save.isPending ? "Saving..." : editing ? "Save Changes" : "Create Goal"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-foreground/5">
            {g.cover ? <img src={g.cover} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-surface-light shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{g.label}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{g.slug} · {counts[g.slug] || 0} sessions</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(g)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light transition-all"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm(`Delete "${g.label}"? Sessions tagged with it keep the tag but it won't show in browse.`)) del.mutate(g); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-surface-light transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
