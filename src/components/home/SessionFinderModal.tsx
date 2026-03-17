import { useState } from "react";
import { X, Clock, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const durations = [5, 10, 15, 20];
const moods = [
  { key: "stressed", label: "Stressed" },
  { key: "anxious", label: "Anxious" },
  { key: "low_energy", label: "Low energy" },
  { key: "focus", label: "Need focus" },
  { key: "sleep", label: "Can't sleep" },
];

const recommendations: Record<string, { title: string; category: string; duration: number }> = {
  stressed: { title: "Box Breathing", category: "Breathwork", duration: 5 },
  anxious: { title: "4-7-8 Breathing", category: "Breathwork", duration: 10 },
  low_energy: { title: "Power Breath", category: "Breathwork", duration: 5 },
  focus: { title: "Coherence Breathing", category: "Breathwork", duration: 10 },
  sleep: { title: "Deep Sleep Meditation", category: "Meditation", duration: 15 },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SessionFinderModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const reset = () => {
    setStep(0);
    setSelectedDuration(null);
    setSelectedMood(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const rec = selectedMood ? recommendations[selectedMood] : null;

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
            className="velum-card w-full max-w-md p-6 mx-4 mb-4 lg:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-display text-xl">Session Finder</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 0 && (
              <div>
                <p className="text-ui text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> How much time do you have?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {durations.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDuration(d); setStep(1); }}
                      className={`velum-card-flat p-4 text-center transition-all duration-200 hover:border-accent/30 ${
                        selectedDuration === d ? "border-accent/50 text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span className="text-display text-2xl block">{d}</span>
                      <span className="text-ui text-xs">minutes</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-ui text-sm mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent" /> How are you feeling?
                </p>
                <div className="flex flex-col gap-2">
                  {moods.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedMood(key); setStep(2); }}
                      className="velum-card-flat p-4 text-left text-sm font-sans text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && rec && (
              <div className="text-center py-4">
                <p className="text-ui text-xs tracking-wide uppercase mb-3">We recommend</p>
                <h4 className="text-display text-2xl mb-2">{rec.title}</h4>
                <p className="text-ui text-sm mb-6">{rec.category} · {rec.duration} min</p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
                >
                  Start session
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
