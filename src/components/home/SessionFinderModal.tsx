import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { X, ArrowLeft, RotateCcw, Play, SlidersHorizontal } from "lucide-react";
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

const FALLBACK_CATEGORIES: FinderOption[] = [
  { key: "meditation", label: "Meditation", desc: "Guided & unguided practices" },
  { key: "rapid_resets", label: "Rapid Resets", desc: "Under 10 min, instant calm" },
  { key: "breathwork", label: "Breathwork", desc: "Shift your nervous system" },
  { key: "tapping", label: "Tapping", desc: "Clear stress & limiting beliefs" },
  { key: "journaling", label: "Journaling", desc: "Deeper self-awareness" },
];

const FALLBACK_GOALS: FinderOption[] = [
  { key: "calm", label: "Calm", desc: "Settle the nervous system" },
  { key: "focus", label: "Focus", desc: "Sharpen attention & clarity" },
  { key: "energize", label: "Energize", desc: "Boost vitality & drive" },
  { key: "process", label: "Process", desc: "Work through emotions" },
  { key: "sleep", label: "Sleep", desc: "Wind down & rest deeply" },
  { key: "confidence", label: "Confidence", desc: "Strengthen self-trust" },
];

const FALLBACK_MOODS: FinderOption[] = [
  { key: "calm", label: "Calm", desc: "Already feeling settled" },
  { key: "energize", label: "Energized", desc: "Need a boost" },
  { key: "focus", label: "Focused", desc: "Mind is scattered" },
  { key: "process", label: "Processing", desc: "Something heavy to work through" },
  { key: "confidence", label: "Grounded", desc: "Need grounding" },
  { key: "sleep", label: "Tired", desc: "Ready to wind down" },
];

const FALLBACK_DURATIONS: FinderOption[] = [
  { key: "0-5", label: "Under 5 min", desc: "Quick reset", min: 0, max: 5 },
  { key: "5-10", label: "5–10 min", desc: "Short session", min: 5, max: 10 },
  { key: "10-20", label: "10–20 min", desc: "Deep practice", min: 10, max: 20 },
  { key: "20+", label: "20+ min", desc: "Extended journey", min: 20, max: 999 },
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

const TOTAL_STEPS = 5;

export function SessionFinderModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  const { data: categories } = useFinderSetting("session_finder_categories", FALLBACK_CATEGORIES);
  const { data: goals } = useFinderSetting("session_finder_goals", FALLBACK_GOALS);
  const { data: moods } = useFinderSetting("session_finder_moods", FALLBACK_MOODS);
  const { data: durations } = useFinderSetting("session_finder_durations", FALLBACK_DURATIONS);

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").order("order_index");
      return data || [];
    },
  });

  const filteredTracks = useMemo(() => {
    return (tracks as any[]).filter(t => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedDuration) {
        const range = durations.find((r: FinderOption) => r.key === selectedDuration);
        if (range && range.min != null && range.max != null && (t.duration_minutes < range.min || t.duration_minutes > range.max)) return false;
      }
      if (selectedMoods.length > 0 && t.tags) {
        const tags = (Array.isArray(t.tags) ? t.tags : []).map((tag: string) => tag.toLowerCase());
        if (tags.length > 0 && !selectedMoods.some(m => tags.some((tag: string) => tag.includes(m)))) return false;
      }
      if (selectedGoal && t.tags) {
        const tags = (Array.isArray(t.tags) ? t.tags : []).map((tag: string) => tag.toLowerCase());
        if (tags.length > 0 && !tags.some((tag: string) => tag.includes(selectedGoal))) return false;
      }
      return true;
    });
  }, [tracks, selectedCategory, selectedMoods, selectedGoal, selectedDuration, durations]);

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedGoal(null);
    setSelectedMoods([]);
    setSelectedDuration(null);
    setStep(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(clearAll, 300);
  };

  const handleSingleSelect = (value: string, setter: (v: string | null) => void) => {
    setter(value);
    setTimeout(() => setStep(s => Math.min(TOTAL_STEPS - 1, s + 1)), 250);
  };

  const toggleMood = (key: string) => {
    setSelectedMoods(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const removeFilter = (type: string) => {
    if (type === "category") setSelectedCategory(null);
    else if (type === "goal") setSelectedGoal(null);
    else if (type === "mood") setSelectedMoods([]);
    else if (type === "duration") setSelectedDuration(null);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const activeFilters = useMemo(() => {
    const filters: { type: string; label: string }[] = [];
    if (selectedCategory) {
      const cat = categories.find((c: FinderOption) => c.key === selectedCategory);
      filters.push({ type: "category", label: cat?.label || selectedCategory });
    }
    if (selectedGoal) {
      const goal = goals.find((g: FinderOption) => g.key === selectedGoal);
      filters.push({ type: "goal", label: goal?.label || selectedGoal });
    }
    if (selectedMoods.length > 0) {
      const moodLabels = selectedMoods.map(m => moods.find((mo: FinderOption) => mo.key === m)?.label || m).join(", ");
      filters.push({ type: "mood", label: moodLabels });
    }
    if (selectedDuration) {
      const dur = durations.find((d: FinderOption) => d.key === selectedDuration);
      filters.push({ type: "duration", label: dur?.label || selectedDuration });
    }
    return filters;
  }, [selectedCategory, selectedGoal, selectedMoods, selectedDuration, categories, goals, moods, durations]);

  const SelectionCard = ({ label, desc, selected, onSelect }: { label: string; desc: string; selected: boolean; onSelect: () => void }) => (
    <button
      onClick={onSelect}
      className={`velum-card p-4 text-left transition-all duration-200 w-full ${
        selected ? "ring-1 ring-accent/50 border-accent/30" : "hover:border-accent/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-sans font-medium ${selected ? "text-accent" : "text-foreground"}`}>{label}</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">{desc}</p>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-[10px]">✓</span>
          </div>
        )}
      </div>
    </button>
  );

  const stepConfig = [
    { title: "What are you looking for?", subtitle: "Choose a practice type" },
    { title: "What's your goal?", subtitle: "What do you want to walk away with?" },
    { title: "How are you feeling?", subtitle: "Select all that apply — we'll match your current state" },
    { title: "How much time do you have?", subtitle: "Choose a duration" },
    {
      title: `${filteredTracks.length} ${filteredTracks.length === 1 ? "session" : "sessions"} found`,
      subtitle: "Here are your curated sessions",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end lg:items-center justify-center overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="velum-card w-full max-w-lg p-6 mx-4 mb-4 lg:mb-0 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-accent" />
                <h3 className="text-display text-xl">Session Finder</h3>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-6">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-accent" : "bg-muted-foreground/15"
                }`} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepConfig[0].title}</h2>
                  <p className="text-ui text-sm mb-5">{stepConfig[0].subtitle}</p>
                  <div className="flex flex-col gap-2">
                    {categories.map((opt: FinderOption) => (
                      <SelectionCard key={opt.key} label={opt.label} desc={opt.desc}
                        selected={selectedCategory === opt.key}
                        onSelect={() => handleSingleSelect(opt.key, setSelectedCategory)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepConfig[1].title}</h2>
                  <p className="text-ui text-sm mb-5">{stepConfig[1].subtitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {goals.map((opt: FinderOption) => (
                      <SelectionCard key={opt.key} label={opt.label} desc={opt.desc}
                        selected={selectedGoal === opt.key}
                        onSelect={() => handleSingleSelect(opt.key, setSelectedGoal)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepConfig[2].title}</h2>
                  <p className="text-ui text-sm mb-5">{stepConfig[2].subtitle}</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {moods.map((opt: FinderOption) => (
                      <SelectionCard key={opt.key} label={opt.label} desc={opt.desc}
                        selected={selectedMoods.includes(opt.key)}
                        onSelect={() => toggleMood(opt.key)} />
                    ))}
                  </div>
                  <button onClick={() => setStep(3)}
                    className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-[0.98] transition-transform">
                    {selectedMoods.length > 0 ? `Continue with ${selectedMoods.length} selected →` : "Skip →"}
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepConfig[3].title}</h2>
                  <p className="text-ui text-sm mb-5">{stepConfig[3].subtitle}</p>
                  <div className="flex flex-col gap-2">
                    {durations.map((opt: FinderOption) => (
                      <SelectionCard key={opt.key} label={opt.label} desc={opt.desc}
                        selected={selectedDuration === opt.key}
                        onSelect={() => handleSingleSelect(opt.key, setSelectedDuration)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepConfig[4].title}</h2>
                  <p className="text-ui text-sm mb-3">{stepConfig[4].subtitle}</p>

                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {activeFilters.map(f => (
                        <button key={f.type} onClick={() => removeFilter(f.type)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-sans font-medium hover:bg-accent/20 transition-colors">
                          {f.label} <X className="w-3 h-3" />
                        </button>
                      ))}
                      <button onClick={clearAll}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted-foreground/10 text-muted-foreground text-[11px] font-sans hover:text-foreground transition-colors">
                        <RotateCcw className="w-3 h-3" /> Clear all
                      </button>
                    </div>
                  )}

                  {filteredTracks.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground text-sm mb-4">No sessions match your filters. Try adjusting.</p>
                      <button onClick={clearAll} className="text-accent text-sm font-sans hover:underline">Start over</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredTracks.slice(0, 25).map((track: any) => (
                        <Link key={track.id} to={`/player?trackId=${track.id}`} onClick={handleClose}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-foreground/5 hover:border-accent/30 hover:bg-card transition-all active:scale-[0.98]">
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Play className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-sans font-medium truncate">{track.title}</p>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                              {track.category?.replace("_", " ")} · {track.duration_minutes} min
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-foreground/10">
              <div>
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step === 0 && (
                  <button onClick={() => { clearAll(); setStep(4); }} className="text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    Skip all → Browse everything
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {step === 4 && (
                  <button onClick={clearAll} className="flex items-center gap-1.5 text-accent text-sm font-sans hover:underline">
                    <RotateCcw className="w-3.5 h-3.5" /> Start over
                  </button>
                )}
                {step > 0 && step < 4 && step !== 2 && (
                  <button onClick={() => setStep(s => s + 1)}
                    className="text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    Skip
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
