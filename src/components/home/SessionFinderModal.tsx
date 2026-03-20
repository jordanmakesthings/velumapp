import { useState, useMemo } from "react";
import { X, ArrowRight, ArrowLeft, RotateCcw, Play, SlidersHorizontal, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { key: "meditation", label: "Meditation" },
  { key: "rapid_resets", label: "Rapid Resets" },
  { key: "breathwork", label: "Breathwork" },
  { key: "tapping", label: "Tapping" },
  { key: "journaling", label: "Journaling" },
];

const MOODS = [
  { key: "calm", label: "Calm" },
  { key: "energize", label: "Energize" },
  { key: "focus", label: "Focus" },
  { key: "process", label: "Process" },
  { key: "confidence", label: "Confidence" },
  { key: "sleep", label: "Sleep" },
];

const GOALS = [
  { key: "calm", label: "Calm" },
  { key: "focus", label: "Focus" },
  { key: "energize", label: "Energize" },
  { key: "process", label: "Process" },
  { key: "sleep", label: "Sleep" },
  { key: "confidence", label: "Confidence" },
];

const SESSION_TYPES = [
  { key: "guided", label: "Guided" },
  { key: "unguided", label: "Unguided" },
  { key: "interactive", label: "Interactive" },
];

const DURATION_RANGES = [
  { key: "0-5", label: "Under 5 min", min: 0, max: 5 },
  { key: "5-10", label: "5–10 min", min: 5, max: 10 },
  { key: "10-20", label: "10–20 min", min: 10, max: 20 },
  { key: "20+", label: "20+ min", min: 20, max: 999 },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

type WizardStep = 0 | 1 | 2;

export function SessionFinderModal({ open, onClose }: Props) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
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
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      if (selectedDuration) {
        const range = DURATION_RANGES.find(r => r.key === selectedDuration);
        if (range && (t.duration_minutes < range.min || t.duration_minutes > range.max)) return false;
      }
      if (selectedMood && t.tags) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        if (tags.length > 0 && !tags.some((tag: string) => tag.toLowerCase().includes(selectedMood))) return false;
      }
      if (selectedGoals.length > 0 && t.tags) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        if (tags.length > 0 && !selectedGoals.some(g => tags.some((tag: string) => tag.toLowerCase().includes(g)))) return false;
      }
      return true;
    });
  }, [tracks, selectedCategories, selectedMood, selectedGoals, selectedType, selectedDuration]);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedGoals([]);
    setSelectedMood(null);
    setSelectedType(null);
    setSelectedDuration(null);
    setWizardStep(0);
  };

  const handleClose = () => {
    onClose();
    setTimeout(clearAll, 300);
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleGoal = (key: string) => {
    setSelectedGoals(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const PillToggle = ({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`px-4 py-2.5 rounded-xl text-sm font-sans transition-all duration-200 ${
        selected
          ? "gold-gradient text-primary-foreground font-semibold"
          : "bg-card text-muted-foreground hover:text-foreground border border-foreground/10"
      }`}
    >
      {label}
    </button>
  );

  const stepTitles = [
    "What brings you here today?",
    "Let's refine your session.",
    `${filteredTracks.length} ${filteredTracks.length === 1 ? "session" : "sessions"} found`,
  ];

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
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  i <= wizardStep ? "bg-accent" : "bg-muted-foreground/15"
                }`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Step 0: Category + Goal */}
              {wizardStep === 0 && (
                <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[0]}</h2>
                  <p className="text-ui text-sm mb-6">Choose categories and goals that resonate.</p>

                  <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">Category</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {CATEGORIES.map(({ key, label }) => (
                      <PillToggle key={key} label={label} selected={selectedCategories.includes(key)} onToggle={() => toggleCategory(key)} />
                    ))}
                  </div>

                  <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">Goal</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {GOALS.map(({ key, label }) => (
                      <PillToggle key={key} label={label} selected={selectedGoals.includes(key)} onToggle={() => toggleGoal(key)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Mood, Type, Duration */}
              {wizardStep === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[1]}</h2>
                  <p className="text-ui text-sm mb-6">Fine-tune to find the perfect match.</p>

                  <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">How are you feeling</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {MOODS.map(({ key, label }) => (
                      <PillToggle key={key} label={label} selected={selectedMood === key} onToggle={() => setSelectedMood(selectedMood === key ? null : key)} />
                    ))}
                  </div>

                  <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">Session type</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {SESSION_TYPES.map(({ key, label }) => (
                      <PillToggle key={key} label={label} selected={selectedType === key} onToggle={() => setSelectedType(selectedType === key ? null : key)} />
                    ))}
                  </div>

                  <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">Duration</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {DURATION_RANGES.map(({ key, label }) => (
                      <PillToggle key={key} label={label} selected={selectedDuration === key} onToggle={() => setSelectedDuration(selectedDuration === key ? null : key)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Results */}
              {wizardStep === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                  <h2 className="text-display text-2xl mb-1">{stepTitles[2]}</h2>
                  <p className="text-ui text-sm mb-4">Here are your curated sessions.</p>

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
                  <button onClick={clearAll} className="text-muted-foreground text-sm font-sans hover:text-foreground transition-colors">
                    Skip
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {wizardStep === 2 && (
                  <button onClick={clearAll} className="flex items-center gap-1.5 text-accent text-sm font-sans hover:underline">
                    <RotateCcw className="w-3.5 h-3.5" /> Start over
                  </button>
                )}
                {wizardStep < 2 && (
                  <button
                    onClick={() => setWizardStep((wizardStep + 1) as WizardStep)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-[0.98] transition-transform"
                  >
                    {wizardStep === 0 ? "Next" : "Show results"} <ArrowRight className="w-4 h-4" />
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
