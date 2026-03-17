import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Technique {
  key: string;
  name: string;
  description: string;
  phases: { label: string; duration: number }[];
  color: string;
}

const techniques: Technique[] = [
  {
    key: "box", name: "Box Breathing", description: "Rapid calm & focus",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Hold", duration: 4 },
      { label: "Exhale", duration: 4 }, { label: "Hold", duration: 4 },
    ],
    color: "bg-accent/20",
  },
  {
    key: "478", name: "4-7-8", description: "Parasympathetic activation",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Hold", duration: 7 },
      { label: "Exhale", duration: 8 },
    ],
    color: "bg-accent/20",
  },
  {
    key: "coherence", name: "Coherence", description: "Rhythmic reset",
    phases: [
      { label: "Inhale", duration: 5 }, { label: "Exhale", duration: 5 },
    ],
    color: "bg-accent/20",
  },
  {
    key: "sigh", name: "Physiological Sigh", description: "Collapse stress in minutes",
    phases: [
      { label: "Inhale", duration: 2 }, { label: "Inhale Again", duration: 3 },
      { label: "Long Exhale", duration: 6 },
    ],
    color: "bg-accent/20",
  },
  {
    key: "power", name: "Power Breath", description: "Rapid energy and clarity",
    phases: [
      { label: "Inhale", duration: 2 }, { label: "Exhale", duration: 2 },
    ],
    color: "bg-accent/20",
  },
  {
    key: "extended", name: "Extended Exhale", description: "From overwhelm to calm",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Exhale", duration: 8 },
    ],
    color: "bg-accent/20",
  },
];

type Stage = "select" | "checkin-before" | "session" | "checkin-after" | "done";

export default function BreathePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Technique>(techniques[0]);
  const [duration, setDuration] = useState(5);
  const [musicOn, setMusicOn] = useState(false);
  const [stage, setStage] = useState<Stage>("select");
  const [stressBefore, setStressBefore] = useState<number | null>(null);
  const [stressAfter, setStressAfter] = useState<number | null>(null);

  // Session state
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const totalSeconds = duration * 60;
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const currentPhase = selected.phases[phaseIndex];

  const orbScale = currentPhase
    ? currentPhase.label.includes("Inhale")
      ? 1.45
      : currentPhase.label.includes("Exhale")
      ? 0.65
      : 1.0
    : 1.0;

  const startSession = useCallback(() => {
    setPhaseIndex(0);
    setPhaseCountdown(selected.phases[0].duration);
    setElapsed(0);
    setStage("session");
  }, [selected]);

  useEffect(() => {
    if (stage !== "session") return;

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearInterval(intervalRef.current);
          setStage("checkin-after");
          return totalSeconds;
        }
        return next;
      });

      setPhaseCountdown((prev) => {
        if (prev <= 1) {
          setPhaseIndex((pi) => {
            const nextPhase = (pi + 1) % selected.phases.length;
            setPhaseCountdown(selected.phases[nextPhase].duration);
            return nextPhase;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [stage, totalSeconds, selected.phases]);

  const endSession = () => {
    clearInterval(intervalRef.current);
    setStage("checkin-after");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const stressReduction =
    stressBefore && stressAfter
      ? Math.round(((stressBefore - stressAfter) / stressBefore) * 100)
      : 0;

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto min-h-screen">
      <AnimatePresence mode="wait">
        {stage === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-display text-3xl mb-2">Breathe</h1>
            <p className="text-ui text-sm mb-8">Interactive nervous system regulation.</p>

            {/* Technique grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {techniques.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelected(t)}
                  className={`velum-card p-4 text-left transition-all duration-200 ${
                    selected.key === t.key ? "ring-1 ring-accent/50" : ""
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-accent mb-3" />
                  <p className="text-foreground text-sm font-sans font-medium mb-1">{t.name}</p>
                  <p className="text-ui text-xs mb-3">{t.description}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {t.phases.map((p, i) => (
                      <span key={i} className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {p.duration}s
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Duration */}
            <div className="velum-card p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-ui text-xs tracking-wide uppercase">Duration</p>
                <p className="text-display text-2xl text-accent">{duration} min</p>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-accent h-1 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
              />
            </div>

            {/* Music toggle */}
            <div className="velum-card-flat p-4 flex items-center justify-between mb-8">
              <div>
                <p className="text-foreground text-sm font-sans">Background music</p>
                <p className="text-ui text-xs">Headphones recommended</p>
              </div>
              <button
                onClick={() => setMusicOn(!musicOn)}
                className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-200 ${
                  musicOn ? "bg-accent" : "bg-surface-light"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-foreground transition-transform duration-200 ${
                    musicOn ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Begin */}
            <button
              onClick={() => setStage("checkin-before")}
              className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              Begin · {duration} min
            </button>
          </motion.div>
        )}

        {(stage === "checkin-before" || stage === "checkin-after") && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <h2 className="text-display text-2xl mb-2">
              {stage === "checkin-before"
                ? "How stressed do you feel right now?"
                : "How do you feel now?"}
            </h2>
            <p className="text-ui text-sm mb-10">Select a number from 1 to 10.</p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const val = stage === "checkin-before" ? stressBefore : stressAfter;
                const isSelected = val === n;
                return (
                  <button
                    key={n}
                    onClick={() =>
                      stage === "checkin-before"
                        ? setStressBefore(n)
                        : setStressAfter(n)
                    }
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-sans font-medium transition-all duration-200 ${
                      isSelected
                        ? "gold-gradient text-primary-foreground scale-110"
                        : "bg-card text-muted-foreground hover:bg-accent hover:text-primary-foreground"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            <button
              disabled={
                (stage === "checkin-before" && !stressBefore) ||
                (stage === "checkin-after" && !stressAfter)
              }
              onClick={() => {
                if (stage === "checkin-before") startSession();
                else setStage("done");
              }}
              className="px-10 py-3 rounded-xl gold-gradient text-primary-foreground font-sans font-medium disabled:opacity-30 active:scale-95 transition-transform"
            >
              {stage === "checkin-before" ? "Begin" : "Complete"}
            </button>
          </motion.div>
        )}

        {stage === "session" && (
          <motion.div
            key="session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[80vh] relative"
          >
            {/* Orb */}
            <motion.div
              animate={{ scale: orbScale }}
              transition={{ duration: currentPhase?.duration || 4, ease: "easeInOut" }}
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center relative"
              style={{
                background: "radial-gradient(circle, hsl(42,53%,54%) 0%, transparent 70%)",
              }}
            >
              <span className="text-primary-foreground font-serif text-lg">
                {currentPhase?.label}
              </span>
              <span className="text-primary-foreground/80 font-sans text-3xl tabular-nums font-light">
                {phaseCountdown}
              </span>
            </motion.div>

            {/* Timer */}
            <p className="text-ui text-sm mt-12 tabular-nums">
              {formatTime(elapsed)} / {formatTime(totalSeconds)}
            </p>

            <button
              onClick={endSession}
              className="mt-8 text-muted-foreground text-xs font-sans tracking-wide hover:text-foreground transition-colors"
            >
              End session
            </button>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6"
            >
              <span className="text-primary-foreground text-3xl">✓</span>
            </motion.div>
            <h2 className="text-display text-2xl mb-2">Session complete.</h2>
            <p className="text-ui text-sm mb-8">Your nervous system is settling.</p>

            {stressBefore && stressAfter && (
              <div className="velum-card p-6 text-center mb-8 w-full max-w-xs">
                <div className="flex justify-around mb-4">
                  <div>
                    <p className="text-ui text-xs mb-1">Before</p>
                    <p className="text-display text-3xl">{stressBefore}</p>
                  </div>
                  <div className="text-accent text-2xl self-center">→</div>
                  <div>
                    <p className="text-ui text-xs mb-1">After</p>
                    <p className="text-display text-3xl">{stressAfter}</p>
                  </div>
                </div>
                {stressReduction > 0 && (
                  <p className="text-accent text-sm font-sans font-medium">
                    −{stressReduction}% stress reduction
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStage("select");
                  setStressBefore(null);
                  setStressAfter(null);
                }}
                className="px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform"
              >
                Breathe again
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
