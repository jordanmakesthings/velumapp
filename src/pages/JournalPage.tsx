import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const PROMPTS = [
  "What does your body need from you today?",
  "What are you holding onto that no longer serves you?",
  "Describe a moment this week when you felt most like yourself.",
  "What would you do today if you weren't afraid?",
  "What pattern keeps showing up in your life that you're ready to release?",
];

// Mock past entries
const MOCK_ENTRIES = [
  { date: "2026-03-16", prompt: "What does your body need from you today?", content: "Rest. I've been pushing myself too hard this week and my body is asking me to slow down." },
  { date: "2026-03-15", prompt: "What are you holding onto that no longer serves you?", content: "The need to be perfect. It's exhausting and it keeps me from starting things." },
  { date: "2026-03-14", prompt: "What would you do today if you weren't afraid?", content: "I'd have that honest conversation I've been avoiding. I'd speak my truth." },
];

function getTodayPrompt() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

export default function JournalPage() {
  const [reflection, setReflection] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const todayPrompt = getTodayPrompt();

  const handleSave = () => {
    if (!reflection.trim()) return;
    console.log("Save reflection:", { prompt: todayPrompt, content: reflection });
    // Will save to Supabase later
  };

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Journal</h1>
      <p className="text-ui text-sm mb-8">Daily reflection and self-inquiry.</p>

      {/* Today's prompt */}
      <div className="velum-card p-6 mb-6">
        <p className="text-ui text-xs tracking-wide uppercase mb-3">Today's prompt</p>
        <p className="text-foreground font-serif text-lg mb-4">{todayPrompt}</p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write your reflection..."
          className="w-full bg-secondary rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
        />
        <button
          onClick={handleSave}
          disabled={!reflection.trim()}
          className="mt-3 px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform disabled:opacity-30"
        >
          Save
        </button>
      </div>

      {/* Past entries */}
      <div>
        <p className="text-ui text-xs tracking-wide uppercase mb-4">Past Entries</p>
        <div className="flex flex-col gap-3">
          {MOCK_ENTRIES.map((entry, i) => {
            const isExpanded = expandedEntry === i;
            const dateLabel = new Date(entry.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            });

            return (
              <button
                key={i}
                onClick={() => setExpandedEntry(isExpanded ? null : i)}
                className="velum-card p-5 text-left w-full"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-ui text-xs">{dateLabel}</p>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-foreground font-serif text-sm mb-2 italic">"{entry.prompt}"</p>
                <p className={`text-foreground/80 text-sm font-sans ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {entry.content}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
