import { useState, useMemo } from "react";
import { X, ArrowRight, ArrowLeft, RotateCcw, Play, SlidersHorizontal, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { key: "meditation", label: "Meditation", desc: "Guided & unguided practices" },
  { key: "rapid_resets", label: "Rapid Resets", desc: "Under 10 min, instant calm" },
  { key: "breathwork", label: "Breathwork", desc: "Shift your nervous system" },
  { key: "tapping", label: "Tapping", desc: "Clear stress & limiting beliefs" },
  { key: "journaling", label: "Journaling", desc: "Deeper self-awareness" },
];

const GOALS = [
  { key: "calm", label: "Calm", desc: "Settle the nervous system" },
  { key: "focus", label: "Focus", desc: "Sharpen attention & clarity" },
  { key: "energize", label: "Energize", desc: "Boost vitality & drive" },
  { key: "process", label: "Process", desc: "Work through emotions" },
  { key: "sleep", label: "Sleep", desc: "Wind down & rest deeply" },
  { key: "confidence", label: "Confidence", desc: "Strengthen self-trust" },
];

const MOODS = [
  { key: "calm", label: "Calm", desc: "Already feeling settled" },
  { key: "energize", label: "Energize", desc: "Need a boost" },
  { key: "focus", label: "Focus", desc: "Mind is scattered" },
  { key: "process", label: "Process", desc: "Something heavy to work through" },
  { key: "confidence", label: "Confidence", desc: "Need grounding" },
  { key: "sleep", label: "Sleep", desc: "Ready to wind down" },
];

const DURATION_RANGES = [
  { key: "0-5", label: "Under 5 min", desc: "Quick reset", min: 0, max: 5 },
  { key: "5-10", label: "5–10 min", desc: "Short session", min: 5, max: 10 },
  { key: "10-20", label: "10–20 min", desc: "Deep practice", min: 10, max: 20 },
  { key: "20+", label: "20+ min", desc: "Extended journey", min: 20, max: 999 },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

type WizardStep = 0 | 1 | 2 | 3;

export function SessionFinderModal({ open, onClose }: Props) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

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
        const range = DURATION_RANGES.find(r => r.key === selectedDuration);
        if (range && (t.duration_minutes < range.min || t.duration_minutes > range.max)) return false;
      }
      if (selectedMood && t.tags) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        if (tags.length > 0 && !tags.some((tag: string) => tag.toLowerCase().includes(selectedMood))) return false;
      }
      if (selectedGoal && t.tags) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        if (tags.length > 0 && !tags.some((tag: string) => tag.toLowerCase().includes(selectedGoal))) return false;
      }
      return true;
    });
  }, [tracks, selectedCategory, selectedMood, selectedGoal, selectedDuration]);

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedGoal(null);
    setSelectedMood(null);
    setSelectedDuration(null);
    setWizardStep(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(clearAll, 300);
  };

  const handleCardSelect = (step: WizardStep, value: string, setter: (v: string | null) => void) => {
    setter(value);
    // Auto-advance to next step after a brief delay
    setTimeout(() => {
      if (step < 3) setWizardStep((step + 1) as WizardStep);
    }, 250);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const stepTitles = [
    "What are you looking for?",
    "What's your goal?",
    "How are you feeling?",
    `${filteredTracks.length} ${filteredTracks.length === 1 ? "session" : "sessions"} found`,
  ];

  const stepSubtitles = [
    "Choose a practice type",
    "What do you want to walk away with?",
    "We'll match your current state",
    "Here are your curated sessions",
  ];

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end lg:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="velum-card w-full max-w-lg p-6 mx-4 mb-4 lg:mb-0 max-h-[85vh] overflow-y-auto"
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
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  i <= wizardStep ? "bg-accent" : "bg-muted-foreground/15"
                }`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 0: Category */}
              {wizardStep === 0 && (
                <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[0]}</h2>
                  <p className="text-ui text-sm mb-5">{stepSubtitles[0]}</p>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(({ key, label, desc }) => (
                      <SelectionCard
                        key={key}
                        label={label}
                        desc={desc}
                        selected={selectedCategory === key}
                        onSelect={() => handleCardSelect(0, key, setSelectedCategory)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Goal */}
              {wizardStep === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[1]}</h2>
                  <p className="text-ui text-sm mb-5">{stepSubtitles[1]}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map(({ key, label, desc }) => (
                      <SelectionCard
                        key={key}
                        label={label}
                        desc={desc}
                        selected={selectedGoal === key}
                        onSelect={() => handleCardSelect(1, key, setSelectedGoal)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Duration */}
              {wizardStep === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[2]}</h2>
                  <p className="text-ui text-sm mb-5">{stepSubtitles[2]}</p>
                  <div className="flex flex-col gap-2">
                    {DURATION_RANGES.map(({ key, label, desc }) => (
                      <SelectionCard
                        key={key}
                        label={label}
                        desc={desc}
                        selected={selectedDuration === key}
                        onSelect={() => handleCardSelect(2, key, setSelectedDuration)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Results */}
              {wizardStep === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[3]}</h2>
                  <p className="text-ui text-sm mb-4">{stepSubtitles[3]}</p>

                  {filteredTracks.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground text-sm mb-4">No sessions match your filters. Try adjusting.</p>
                      <button onClick={clearAll} className="text-accent text-sm font-sans hover:underline">Start over</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto">
                      {filteredTracks.slice(0, 25).map((track: any) => (
                        <Link
                          key={track.id}
                          to={`/player?trackId=${track.id}`}
                          onClick={handleClose}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-foreground/5 hover:border-accent/30 hover:bg-card transition-all active:scale-[0.98]"
                        >
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

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-foreground/10">
              <div>
                {wizardStep > 0 && (
                  <button onClick={() => setWizardStep((wizardStep - 1) as WizardStep)} className="flex items-center gap-1.5 text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {wizardStep === 0 && (
                  <button onClick={() => { clearAll(); setWizardStep(3 as WizardStep); }} className="text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    Skip all
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {wizardStep === 3 && (
                  <button onClick={clearAll} className="flex items-center gap-1.5 text-accent text-sm font-sans hover:underline">
                    <RotateCcw className="w-3.5 h-3.5" /> Start over
                  </button>
                )}
                {wizardStep > 0 && wizardStep < 3 && (
                  <button onClick={() => setWizardStep((wizardStep + 1) as WizardStep)}
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
