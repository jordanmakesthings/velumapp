import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Play, Sparkles, Clock, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGoals } from "@/lib/goals";

type TimeBucket = "any" | "short" | "mid" | "long";
const TIME_OPTIONS: { key: TimeBucket; label: string; hint: string }[] = [
  { key: "short", label: "Under 5 min", hint: "a quick reset" },
  { key: "mid", label: "~10 min", hint: "a proper sit" },
  { key: "long", label: "20+ min", hint: "go deep" },
  { key: "any", label: "Any length", hint: "show me everything" },
];

const FORMATS: { key: string; label: string }[] = [
  { key: "any", label: "Surprise me" },
  { key: "meditation", label: "Meditation" },
  { key: "breathwork", label: "Breathwork" },
  { key: "rapid_resets", label: "Rapid Resets" },
  { key: "tapping", label: "Tapping" },
  { key: "journaling", label: "Journaling" },
];

function inBucket(mins: number, b: TimeBucket): boolean {
  if (b === "any") return true;
  if (b === "short") return mins <= 6;
  if (b === "mid") return mins >= 7 && mins <= 14;
  return mins >= 15;
}

export default function FinderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 goal, 1 time, 2 format, 3 results
  const [goal, setGoal] = useState<string>("");
  const [time, setTime] = useState<TimeBucket>("any");
  const [format, setFormat] = useState<string>("any");

  const goalList = useGoals();
  const goalBySlug = Object.fromEntries(goalList.map((g) => [g.slug, g]));

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const results = (tracks as any[]).filter((t) => {
    if (!t.audio_url) return false;
    if (!Array.isArray(t.goals) || !t.goals.includes(goal)) return false;
    if (format !== "any" && t.category !== format) return false;
    if (!inBucket(t.duration_minutes || 0, time)) return false;
    return true;
  });

  const goalObj = goalBySlug[goal];
  const back = () => setStep((s) => Math.max(0, s - 1));

  const StepShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-8">
        {step === 0 ? (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <button onClick={back} className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ChevronLeft className="w-5 h-5" /></button>
        )}
        <div className="flex-1 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-foreground/10"}`} />
          ))}
        </div>
      </div>
      <h1 className="text-display text-3xl mb-7 leading-tight">{title}</h1>
      {children}
    </div>
  );

  // STEP 0 — Goal
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StepShell title="What do you need right now?">
          <div className="grid grid-cols-2 gap-3">
            {goalList.map((g) => (
              <button
                key={g.slug}
                onClick={() => { setGoal(g.slug); setStep(1); }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-foreground/10 text-left group"
              >
                <img src={g.cover} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                <span className="absolute bottom-3 left-3 right-3 text-foreground font-display italic text-lg leading-tight drop-shadow">{g.label}</span>
              </button>
            ))}
          </div>
        </StepShell>
      </div>
    );
  }

  // STEP 1 — Time
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <StepShell title="How much time do you have?">
          <div className="space-y-3">
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => { setTime(o.key); setStep(2); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-foreground/10 hover:border-accent/40 transition-colors text-left"
              >
                <Clock className="w-5 h-5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-foreground font-sans">{o.label}</p>
                  <p className="text-muted-foreground text-xs">{o.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </StepShell>
      </div>
    );
  }

  // STEP 2 — Format
  if (step === 2) {
    return (
      <div className="min-h-screen bg-background">
        <StepShell title="How do you want to get there?">
          <div className="grid grid-cols-2 gap-3">
            {FORMATS.map((o) => (
              <button
                key={o.key}
                onClick={() => { setFormat(o.key); setStep(3); }}
                className={`p-5 rounded-2xl border text-left transition-colors ${o.key === "any" ? "col-span-2 gold-gradient text-primary-foreground border-transparent" : "bg-card border-foreground/10 hover:border-accent/40 text-foreground"}`}
              >
                {o.key === "any" && <Sparkles className="w-5 h-5 mb-1.5" />}
                <span className="font-sans">{o.label}</span>
              </button>
            ))}
          </div>
        </StepShell>
      </div>
    );
  }

  // STEP 3 — Results
  return (
    <div className="min-h-screen bg-background">
      <StepShell title={results.length ? `For ${goalObj?.short ?? "you"}` : "Nothing exact — but…"}>
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((t, i) => (
              <Link
                key={t.id}
                to={`/player?trackId=${t.id}`}
                className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${i === 0 ? "bg-card border-accent/40" : "bg-card border-foreground/10 hover:border-foreground/30"}`}
              >
                {t.thumbnail_square_url || t.thumbnail_url ? (
                  <img src={t.thumbnail_square_url || t.thumbnail_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-light shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {i === 0 && <p className="text-accent text-[10px] uppercase tracking-widest mb-0.5">Top pick</p>}
                  <p className="text-foreground font-sans truncate">{t.title}</p>
                  <p className="text-muted-foreground text-xs">{t.duration_minutes} min · {String(t.category || "").replace("_", " ")}</p>
                </div>
                <span className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 text-primary-foreground fill-current" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm mb-6">
            No saved session matched exactly. Let's make you one — a custom track for {goalObj?.short ?? "this"}, in about 90 seconds.
          </p>
        )}

        {/* Fallthrough to the custom generator — the wedge */}
        <Link
          to="/custom-track"
          className="mt-6 flex items-center gap-4 p-4 rounded-2xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors"
        >
          <Wand2 className="w-5 h-5 text-accent shrink-0" />
          <div className="flex-1">
            <p className="text-foreground font-sans">Generate a custom track</p>
            <p className="text-muted-foreground text-xs">Made for exactly what you're working on, in ~90s</p>
          </div>
        </Link>
      </StepShell>
    </div>
  );
}
