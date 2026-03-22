import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface LessonJournalProps {
  courseId: string;
  lessonId: string;
  dayNumber: number;
  prompt: string | null;
}

export default function LessonJournal({ courseId, lessonId, dayNumber, prompt }: LessonJournalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [entry, setEntry] = useState("");
  const [showInput, setShowInput] = useState(true);

  const { data: entries = [] } = useQuery({
    queryKey: ["courseJournal", user?.id, lessonId],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("course_journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user && !!lessonId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !entry.trim()) return;
      const { error } = await supabase.from("course_journal_entries").insert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        day_number: dayNumber,
        prompt: prompt || "",
        content: entry.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courseJournal", user?.id, lessonId] });
      toast.success("Entry saved");
      setEntry("");
      setShowInput(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!prompt) return null;

  const hasEntries = entries.length > 0;

  return (
    <div className="mt-8">
      <div className="h-px bg-accent/10 mb-8" />

      {/* Prompt */}
      <p className="font-serif text-muted-foreground text-[15px] leading-relaxed mb-5 italic">
        {prompt}
      </p>

      {/* Existing entries */}
      {hasEntries && (
        <div className="space-y-3 mb-5">
          {entries.map((e: any) => (
            <div key={e.id} className="rounded-xl bg-card p-5 border border-accent/10">
              <p className="text-foreground text-sm font-sans leading-relaxed whitespace-pre-wrap">{e.content}</p>
              <p className="text-muted-foreground text-[10px] font-sans mt-3 tracking-wide">
                {formatTimestamp(e.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      {showInput ? (
        <div>
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write freely..."
            className="w-full rounded-xl p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 resize-none min-h-[120px] focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow border border-foreground/10 bg-surface-light"
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!entry.trim() || saveMutation.isPending}
            className="mt-3 w-full sm:w-auto px-8 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-semibold active:scale-95 transition-transform disabled:opacity-30"
          >
            {saveMutation.isPending ? "Saving..." : "Save entry"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="text-accent text-sm font-sans hover:underline underline-offset-4"
        >
          Add another entry
        </button>
      )}
    </div>
  );
}
