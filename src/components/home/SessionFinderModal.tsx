import { useState, useMemo } from "react";
import { X, Clock, Brain, Sparkles, Wind, Heart, Feather, Zap, SlidersHorizontal, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { key: "meditation", label: "Meditation", icon: Sparkles },
  { key: "rapid_resets", label: "Rapid Resets", icon: Zap },
  { key: "breathwork", label: "Breathwork", icon: Wind },
  { key: "tapping", label: "Tapping", icon: Heart },
  { key: "journaling", label: "Journaling", icon: Feather },
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

export function SessionFinderModal({ open, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
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
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedDuration) {
        const range = DURATION_RANGES.find(r => r.key === selectedDuration);
        if (range && (t.duration_minutes < range.min || t.duration_minutes > range.max)) return false;
      }
      // Mood and goal filtering based on tags if available
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
  }, [tracks, selectedCategory, selectedMood, selectedGoal, selectedType, selectedDuration]);

  const hasFilters = selectedCategory || selectedMood || selectedGoal || selectedType || selectedDuration;

  const clearAll = () => {
    setSelectedCategory(null);
    setSelectedMood(null);
    setSelectedGoal(null);
    setSelectedType(null);
    setSelectedDuration(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(clearAll, 300);
  };

  const PillGroup = ({ title, items, selected, onSelect }: {
    title: string;
    items: { key: string; label: string }[];
    selected: string | null;
    onSelect: (key: string | null) => void;
  }) => (
    <div className="mb-5">
      <p className="text-ui text-[10px] tracking-[2px] uppercase mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSelect(selected === key ? null : key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all ${
              selected === key
                ? "gold-gradient text-primary-foreground font-semibold"
                : "bg-card text-muted-foreground hover:text-foreground border border-foreground/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-accent" />
                <h3 className="text-display text-xl">Session Finder</h3>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <PillGroup title="Category" items={CATEGORIES} selected={selectedCategory} onSelect={setSelectedCategory} />
            <PillGroup title="How are you feeling" items={MOODS} selected={selectedMood} onSelect={setSelectedMood} />
            <PillGroup title="Your goal" items={GOALS} selected={selectedGoal} onSelect={setSelectedGoal} />
            <PillGroup title="Session type" items={SESSION_TYPES} selected={selectedType} onSelect={setSelectedType} />
            <PillGroup title="Duration" items={DURATION_RANGES.map(r => ({ key: r.key, label: r.label }))} selected={selectedDuration} onSelect={setSelectedDuration} />

            {hasFilters && (
              <button onClick={clearAll} className="text-accent text-xs font-sans mb-4 inline-block hover:underline">
                Clear all filters
              </button>
            )}

            {/* Results */}
            <div className="border-t border-foreground/10 pt-4 mt-2">
              <p className="text-ui text-[10px] tracking-[2px] uppercase mb-3">
                {filteredTracks.length} {filteredTracks.length === 1 ? "result" : "results"}
              </p>
              {filteredTracks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No sessions match your filters. Try adjusting.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  {filteredTracks.slice(0, 20).map((track: any) => (
                    <Link
                      key={track.id}
                      to={`/player?trackId=${track.id}`}
                      onClick={handleClose}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-foreground/5 hover:border-accent/30 hover:bg-card transition-all"
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
