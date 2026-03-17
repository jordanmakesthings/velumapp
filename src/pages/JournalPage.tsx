import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function JournalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reflection, setReflection] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Fetch prompts
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("journaling_prompts").select("*").order("order_index");
      return data || [];
    },
  });

  // Fetch past reflections
  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("reflection_date", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  // Get today's prompt (cycle through prompts by day of year)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todayPrompt = prompts.length > 0
    ? prompts[dayOfYear % prompts.length]?.prompt
    : "What does your body need from you today?";

  // Check if already reflected today
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = reflections.find((r: any) => r.reflection_date === today);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (todayEntry) {
        // Update existing entry
        const { error } = await supabase
          .from("daily_reflections")
          .update({ content: reflection, prompt: todayPrompt })
          .eq("id", (todayEntry as any).id);
        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from("daily_reflections")
          .insert({
            user_id: user.id,
            content: reflection,
            prompt: todayPrompt,
            reflection_date: today,
          });
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_reflections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      toast.success("Entry deleted");
    },
  });

  // Initialize reflection with today's entry content if it exists
  const displayReflection = todayEntry && !reflection ? (todayEntry as any).content : reflection;

  const pastEntries = reflections.filter((r: any) => r.reflection_date !== today);

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Journal</h1>
      <p className="text-ui text-sm mb-8">Daily reflection and self-inquiry.</p>

      {/* Today's prompt */}
      <div className="velum-card p-6 mb-6">
        <p className="text-ui text-xs tracking-wide uppercase mb-3">Today's prompt</p>
        <p className="text-foreground font-serif text-lg mb-4">{todayPrompt}</p>
        <textarea
          value={displayReflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write your reflection..."
          className="w-full bg-secondary rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
        />
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!displayReflection?.trim() || saveMutation.isPending}
          className="mt-3 px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform disabled:opacity-30"
        >
          {saveMutation.isPending ? "Saving..." : todayEntry ? "Update" : "Save"}
        </button>
        {todayEntry && (
          <p className="text-accent text-[10px] font-sans mt-2">You've already reflected today. Edit above to update.</p>
        )}
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div>
          <p className="text-ui text-xs tracking-wide uppercase mb-4">Past Entries</p>
          <div className="flex flex-col gap-3">
            {pastEntries.map((entry: any) => {
              const isExpanded = expandedEntry === entry.id;
              const dateLabel = new Date(entry.reflection_date + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              });

              return (
                <div key={entry.id} className="velum-card p-5">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-ui text-xs">{dateLabel}</p>
                      <div className="flex items-center gap-2">
                        {isExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm("Delete this entry?")) deleteMutation.mutate(entry.id); }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    {entry.prompt && (
                      <p className="text-foreground font-serif text-sm mb-2 italic">"{entry.prompt}"</p>
                    )}
                    <p className={`text-foreground/80 text-sm font-sans ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {entry.content}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastEntries.length === 0 && !todayEntry && (
        <div className="velum-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Your past reflections will appear here.</p>
        </div>
      )}
    </div>
  );
}
