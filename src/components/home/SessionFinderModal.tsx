import { useState, useMemo } from "react";
import { ChevronLeft, X, RotateCcw, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FinderOption {
  key: string;
  label: string;
  desc: string;
  min?: number;
  max?: number;
}

const FALLBACK_TYPES: FinderOption[] = [
  { key: "guided", label: "Guided", desc: "Led by a facilitator" },
  { key: "unguided", label: "Unguided", desc: "Self-directed practice" },
  { key: "interactive", label: "Interactive", desc: "Active participation" },
  { key: "walking", label: "Walking", desc: "Movement-based" },
];

const FALLBACK_GOALS: FinderOption[] = [
  { key: "calm", label: "Calm", desc: "Settle the nervous system" },
  { key: "focus", label: "Focus", desc: "Sharpen attention & clarity" },
  { key: "energize", label: "Energize", desc: "Boost vitality & drive" },
  { key: "process", label: "Process", desc: "Work through emotions" },
  { key: "sleep", label: "Sleep", desc: "Wind down & rest deeply" },
  { key: "confidence", label: "Confidence", desc: "Strengthen self-trust" },
];

const FALLBACK_STATES: FinderOption[] = [
  { key: "calm", label: "Calm", desc: "Already feeling settled" },
  { key: "energized", label: "Energized", desc: "Feeling wired or restless" },
  { key: "focused", label: "Focused", desc: "Mind is sharp" },
  { key: "processing", label: "Processing", desc: "Something heavy to work through" },
  { key: "grounded", label: "Grounded", desc: "Feeling steady" },
  { key: "tired", label: "Tired", desc: "Ready to wind down" },
];

const FALLBACK_DURATIONS: FinderOption[] = [
  { key: "0-5", label: "Under 5 minutes", desc: "Quick reset", min: 0, max: 5 },
  { key: "5-10", label: "5–10 minutes", desc: "Short session", min: 5, max: 10 },
  { key: "10-20", label: "10–20 minutes", desc: "Deep practice", min: 10, max: 20 },
  { key: "20+", label: "20+ minutes", desc: "Extended session", min: 20, max: 999 },
  { key: "extended", label: "Extended Journey", desc: "Full immersive experience", min: 30, max: 999 },
];

function useFinderSetting(key: string, fallback: FinderOption[]) {
  return useQuery({
    queryKey: ["appSettings", key],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", key).single();
      return (data?.value as unknown as FinderOption[]) || fallback;
    },
    initialData: fallback,
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

export function SessionFinderModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { data: sessionTypes } = useFinderSetting("session_finder_types", FALLBACK_TYPES);
  const { data: goals } = useFinderSetting("session_finder_goals", FALLBACK_GOALS);
  const { data: states } = useFinderSetting("session_finder_states", FALLBACK_STATES);
  const { data: durations } = useFinderSetting("session_finder_durations", FALLBACK_DURATIONS);

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const getTrackTags = (track: any): string[] => {
    if (!track.tags || !Array.isArray(track.tags)) return [];
    return track.tags.map((t: string) => t.toLowerCase());
  };

  const filteredTracks = useMemo(() => {
    let results = (tracks as any[]).filter((t) => {
      const tags = getTrackTags(t);

      // session_type: exact match on "type:<key>"
      if (selectedType && !tags.some((tag) => tag === `type:${selectedType}`)) return false;

      // goal: tag includes "goal:<key>"
      if (selectedGoal && !tags.some((tag) => tag === `goal:${selectedGoal}`)) return false;

      // current_state: OR logic — at least one selected state matches
      if (selectedStates.length > 0) {
        const hasMatch = selectedStates.some((s) => tags.some((tag) => tag === `state:${s}`));
        if (!hasMatch) return false;
      }

      // duration
      if (selectedDuration) {
        const range = durations.find((d: FinderOption) => d.key === selectedDuration);
        if (range && range.min != null && range.max != null) {
          if (t.duration_minutes < range.min || t.duration_minutes > range.max) return false;
        }
      }

      return true;
    });

    // Fallback: relax current_state first, then goal
    if (results.length === 0 && (selectedStates.length > 0 || selectedGoal)) {
      results = (tracks as any[]).filter((t) => {
        const tags = getTrackTags(t);
        if (selectedType && !tags.some((tag) => tag === `type:${selectedType}`)) return false;
        if (selectedGoal && !tags.some((tag) => tag === `goal:${selectedGoal}`)) return false;
        if (selectedDuration) {
          const range = durations.find((d: FinderOption) => d.key === selectedDuration);
          if (range && range.min != null && range.max != null) {
            if (t.duration_minutes < range.min || t.duration_minutes > range.max) return false;
          }
        }
        return true;
      });

      if (results.length === 0) {
        results = (tracks as any[]).filter((t) => {
          const tags = getTrackTags(t);
          if (selectedType && !tags.some((tag) => tag === `type:${selectedType}`)) return false;
          if (selectedDuration) {
            const range = durations.find((d: FinderOption) => d.key === selectedDuration);
            if (range && range.min != null && range.max != null) {
              if (t.duration_minutes < range.min || t.duration_minutes > range.max) return false;
            }
          }
          return true;
        });
      }
    }

    return results;
  }, [tracks, selectedType, selectedGoal, selectedStates, selectedDuration, durations]);

  const clearAll = () => {
    setSelectedType(null);
    setSelectedGoal(null);
    setSelectedStates([]);
    setSelectedDuration(null);
    setStep(0);
    setShowResults(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(clearAll, 300);
  };

  const handleSingleSelect = (value: string, setter: (v: string | null) => void) => {
    setter(value);
    setTimeout(() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1)), 200);
  };

  const handleDurationSelect = (value: string) => {
    setSelectedDuration(value);
    setTimeout(() => setShowResults(true), 200);
  };

  const toggleState = (key: string) => {
    setSelectedStates((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const getSessionTypeLabel = (track: any) => {
    const tags = getTrackTags(track);
    const typeTag = tags.find((t) => t.startsWith("type:"));
    if (!typeTag) return null;
    const key = typeTag.replace("type:", "");
    const opt = sessionTypes.find((o: FinderOption) => o.key === key);
    return opt?.label || key;
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const Chip = ({
    label,
    selected,
    onSelect,
  }: {
    label: string;
    selected: boolean;
    onSelect: () => void;
  }) => (
    <button
      onClick={onSelect}
      className={`px-5 py-3 rounded-[12px] text-sm font-sans font-medium transition-all duration-150 ${
        selected
          ? "bg-accent text-accent-foreground"
          : "bg-card border border-foreground/[0.08] text-foreground hover:border-foreground/20"
      }`}
    >
      {label}
    </button>
  );

  const stepTitles = [
    "What are you looking for?",
    "What do you want to walk away with?",
    "How are you feeling right now?",
    "How much time do you have?",
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              {!showResults && step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : showResults ? (
                <button
                  onClick={() => { setShowResults(false); setStep(3); }}
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9" />
              )}
            </div>
            {!showResults && (
              <span className="text-muted-foreground text-xs font-sans tracking-wider">
                {step + 1} / {TOTAL_STEPS}
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                {!showResults && step === 0 && (
                  <motion.div
                    key="s0"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-display text-3xl text-center mb-8">
                      {stepTitles[0]}
                    </h1>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {sessionTypes.map((opt: FinderOption) => (
                        <Chip
                          key={opt.key}
                          label={opt.label}
                          selected={selectedType === opt.key}
                          onSelect={() => handleSingleSelect(opt.key, setSelectedType)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {!showResults && step === 1 && (
                  <motion.div
                    key="s1"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-display text-3xl text-center mb-8">
                      {stepTitles[1]}
                    </h1>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {goals.map((opt: FinderOption) => (
                        <Chip
                          key={opt.key}
                          label={opt.label}
                          selected={selectedGoal === opt.key}
                          onSelect={() => handleSingleSelect(opt.key, setSelectedGoal)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {!showResults && step === 2 && (
                  <motion.div
                    key="s2"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-display text-3xl text-center mb-2">
                      {stepTitles[2]}
                    </h1>
                    <p className="text-muted-foreground text-sm font-sans mb-8 text-center">
                      Select all that apply.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center mb-8">
                      {states.map((opt: FinderOption) => (
                        <Chip
                          key={opt.key}
                          label={opt.label}
                          selected={selectedStates.includes(opt.key)}
                          onSelect={() => toggleState(opt.key)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="px-8 py-3 rounded-[12px] bg-accent text-accent-foreground text-sm font-sans font-medium transition-all active:scale-[0.97]"
                    >
                      {selectedStates.length > 0
                        ? `Continue with ${selectedStates.length} selected`
                        : "Continue"}
                    </button>
                  </motion.div>
                )}

                {!showResults && step === 3 && (
                  <motion.div
                    key="s3"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <h1 className="text-display text-3xl text-center mb-8">
                      {stepTitles[3]}
                    </h1>
                    <div className="flex flex-col gap-3 w-full">
                      {durations.map((opt: FinderOption) => (
                        <Chip
                          key={opt.key}
                          label={opt.label}
                          selected={selectedDuration === opt.key}
                          onSelect={() => handleDurationSelect(opt.key)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {showResults && (
                  <motion.div
                    key="results"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="w-full pb-8"
                  >
                    <h1 className="text-display text-3xl text-center mb-2">
                      {filteredTracks.length}{" "}
                      {filteredTracks.length === 1 ? "session" : "sessions"} found
                    </h1>
                    {filteredTracks.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center mb-6">
                        No sessions match exactly — try adjusting your filters.
                      </p>
                    )}

                    {filteredTracks.length > 0 && (
                      <div className="flex flex-col gap-3 mt-6">
                        {filteredTracks.slice(0, 25).map((track: any) => {
                          const typeLabel = getSessionTypeLabel(track);
                          return (
                            <Link
                              key={track.id}
                              to={`/player?trackId=${track.id}`}
                              onClick={handleClose}
                              className="flex items-start gap-4 p-4 rounded-[12px] bg-card border border-foreground/[0.06] hover:border-foreground/15 transition-all active:scale-[0.98]"
                            >
                              <div className="w-10 h-10 rounded-[10px] bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Play className="w-4 h-4 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-sans font-medium mb-1">
                                  {track.title}
                                </p>
                                {track.description && (
                                  <p className="text-muted-foreground text-xs font-sans leading-relaxed mb-2 line-clamp-2">
                                    {track.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {typeLabel && (
                                    <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                                      {typeLabel}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">
                                    {track.duration_minutes} min
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-center mt-8">
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] border border-foreground/10 text-muted-foreground text-sm font-sans hover:text-foreground hover:border-foreground/20 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Start Over
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
