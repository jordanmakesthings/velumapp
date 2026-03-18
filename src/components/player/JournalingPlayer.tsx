import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Pencil, Star, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";

interface Step {
  step: number;
  type: "intro" | "breathe" | "write" | "reflect" | "close";
  prompt: string;
  instruction: string;
}

interface JournalingPlayerProps {
  track: any;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

const typeLabels: Record<string, string> = {
  intro: "Introduction",
  breathe: "Breathe",
  write: "Write",
  reflect: "Reflect",
  close: "Closing",
};

function StressCheckin({ title, subtitle, onSubmit, submitLabel }: {
  title: string; subtitle: string; onSubmit: (level: number) => void; submitLabel: string;
}) {
  const [level, setLevel] = useState(5);
  const getInfo = (v: number) => {
    if (v <= 2) return "Very calm";
    if (v <= 4) return "Mild tension";
    if (v === 5) return "Right in the middle. Neither here nor there.";
    if (v <= 7) return "Moderate stress";
    if (v <= 9) return "High stress";
    return "Overwhelmed";
  };

  return (
    <div className="text-center py-8">
      <h3 className="text-display text-xl mb-1">{title}</h3>
      <p className="text-ui text-sm mb-8">{subtitle}</p>
      <p className="text-display text-6xl text-accent mb-2">{level}</p>
      <p className="text-ui text-xs uppercase tracking-widest mb-8">{getInfo(level)}</p>
      <div className="px-4 mb-8">
        <input
          type="range" min={1} max={10} value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between mt-2">
          <span className="text-ui text-[10px]">1 · Calm</span>
          <span className="text-ui text-[10px]">10 · Overwhelmed</span>
        </div>
      </div>
      <button
        onClick={() => onSubmit(level)}
        className="px-10 py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-95 transition-transform"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function BreathingOrb() {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");

  useEffect(() => {
    const cycle = () => {
      setPhase("inhale");
      setTimeout(() => setPhase("hold"), 4000);
      setTimeout(() => setPhase("exhale"), 5500);
    };
    cycle();
    const interval = setInterval(cycle, 11500);
    return () => clearInterval(interval);
  }, []);

  const scale = phase === "inhale" ? 1.4 : phase === "exhale" ? 0.7 : undefined;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <motion.div
        animate={scale !== undefined ? { scale } : {}}
        transition={{ duration: phase === "inhale" ? 4 : phase === "exhale" ? 6 : 0, ease: "easeInOut" }}
        className="w-24 h-24 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--muted) / 0.6) 0%, hsl(var(--muted) / 0.15) 60%, transparent 80%)",
          boxShadow: "0 0 40px hsl(var(--muted) / 0.3)",
        }}
      />
      <p className="text-ui text-xs uppercase tracking-widest">
        {phase === "inhale" ? "Breathe in..." : phase === "hold" ? "Hold..." : "Breathe out..."}
      </p>
    </div>
  );
}

export default function JournalingPlayer({ track, isFavorited, onToggleFavorite }: JournalingPlayerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const steps: Step[] = (track.steps as Step[]) || [];
  const totalSteps = steps.length;

  const [phase, setPhase] = useState<"stress-before" | "playing" | "stress-after" | "done">("stress-before");
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [stressBefore, setStressBefore] = useState<number | null>(null);

  // Load existing entries for today
  const { data: existingEntries } = useQuery({
    queryKey: ["journalEntries", track.id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("track_id", track.id)
        .eq("entry_date", today);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existingEntries?.length) {
      const loaded: Record<number, string> = {};
      existingEntries.forEach((e: any) => { loaded[e.step_number] = e.content; });
      setResponses(prev => ({ ...loaded, ...prev }));
    }
  }, [existingEntries]);

  const step = steps[currentStep];

  // Save entry mutation
  const saveEntryMutation = useMutation({
    mutationFn: async ({ stepNumber, content }: { stepNumber: number; content: string }) => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", track.id)
        .eq("step_number", stepNumber)
        .eq("entry_date", today)
        .maybeSingle();

      if (existing) {
        await supabase.from("journal_entries").update({ content }).eq("id", existing.id);
      } else {
        await supabase.from("journal_entries").insert({
          user_id: user.id, track_id: track.id, step_number: stepNumber,
          content, entry_date: today,
        });
      }
    },
  });

  // Save progress on completion
  const saveProgressMutation = useMutation({
    mutationFn: async (stressAfter: number) => {
      if (!user) return;
      const { data: existing } = await supabase
        .from("user_progress").select("id").eq("user_id", user.id).eq("track_id", track.id).maybeSingle();
      const payload = {
        completed: true,
        completed_date: new Date().toISOString().split("T")[0],
        progress_seconds: (track.duration_minutes || 10) * 60,
        stress_before: stressBefore,
        stress_after: stressAfter,
      };
      if (existing) {
        await supabase.from("user_progress").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("user_progress").insert({ user_id: user.id, track_id: track.id, ...payload });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProgress"] });
      setPhase("done");
    },
    onError: () => setPhase("done"),
  });

  const handleNext = () => {
    // Save current response if it's a write/reflect step
    if ((step.type === "write" || step.type === "reflect") && responses[currentStep]) {
      saveEntryMutation.mutate({ stepNumber: currentStep, content: responses[currentStep] });
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setPhase("stress-after");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const progressPct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h2 className="text-display text-2xl mb-2">Session Complete</h2>
        <p className="text-ui text-sm mb-8">Your reflections have been saved.</p>
        <div className="flex gap-3">
          <button onClick={() => { setCurrentStep(0); setPhase("stress-before"); setStressBefore(null); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform">
            <RotateCcw className="w-4 h-4" /> Again
          </button>
          <button onClick={() => navigate("/library")}
            className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Journaling</p>
        <button onClick={onToggleFavorite} className="p-2">
          <Star className={`w-5 h-5 transition-all ${isFavorited ? "text-accent fill-accent" : "text-muted-foreground hover:text-foreground"}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-8 max-w-2xl mx-auto w-full">
        {/* Thumbnail card */}
        <div className="w-full max-w-sm aspect-[4/3] rounded-2xl bg-card overflow-hidden mb-6 flex flex-col items-center justify-center relative">
          {track.thumbnail_url ? (
            <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-light flex flex-col items-center justify-center gap-3">
              <Pencil className="w-10 h-10 text-accent" />
              <p className="text-accent text-xs tracking-[0.25em] uppercase font-sans">Journaling</p>
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-accent text-xs tracking-[0.2em] uppercase font-sans mb-1">Journaling</p>
        <h1 className="text-display text-2xl mb-1 text-center">{track.title}</h1>

        {phase === "stress-before" ? (
          <>
            {track.description && <p className="text-ui text-sm mb-4 text-center max-w-md">{track.description}</p>}
            <StressCheckin
              title="How are you feeling?"
              subtitle="Rate your stress level before this session"
              onSubmit={(level) => { setStressBefore(level); setPhase("playing"); }}
              submitLabel="Begin Session"
            />
          </>
        ) : phase === "stress-after" ? (
          <StressCheckin
            title="How do you feel now?"
            subtitle="Rate your stress level after this session"
            onSubmit={(level) => saveProgressMutation.mutate(level)}
            submitLabel="Complete Session"
          />
        ) : (
          <>
            {/* Progress */}
            <div className="w-full mt-4 mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-ui text-[10px] uppercase tracking-widest">Step {currentStep + 1} of {totalSteps}</span>
                <span className="text-ui text-[10px]">{typeLabels[step?.type] || step?.type}</span>
              </div>
              <div className="h-0.5 bg-surface-light rounded-full w-full">
                <div className="h-full gold-gradient rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Dot navigation */}
            <div className="flex items-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${
                  i === currentStep ? "w-5 h-2 gold-gradient" : i < currentStep ? "w-2 h-2 bg-accent" : "w-2 h-2 bg-surface-light"
                }`} />
              ))}
            </div>

            {/* Step content card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="w-full velum-card-flat p-6 rounded-2xl mb-6"
              >
                {step?.instruction && (
                  <p className="text-accent font-serif italic text-sm mb-3">{step.instruction}</p>
                )}
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{step?.prompt}</p>

                {/* Text area for write/reflect steps */}
                {(step?.type === "write" || step?.type === "reflect") && (
                  <Textarea
                    value={responses[currentStep] || ""}
                    onChange={(e) => setResponses(prev => ({ ...prev, [currentStep]: e.target.value }))}
                    placeholder="Write freely here..."
                    className="mt-4 bg-background border-foreground/10 text-foreground placeholder:text-muted-foreground/40 min-h-[120px] rounded-xl resize-y"
                  />
                )}

                {/* Breathing orb for breathe steps */}
                {step?.type === "breathe" && <BreathingOrb />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between w-full">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-sans transition-all ${
                  currentStep === 0 ? "opacity-0 pointer-events-none" : "velum-card-flat text-foreground active:scale-95"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {currentStep === totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
