import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Touch sequences — generic somatic regulation protocol
// ---------------------------------------------------------------------------
const SEQUENCES = [
  {
    id: "arms",
    label: "Arm Strokes",
    instruction: "Cross your arms over your chest. Slowly stroke from your shoulders down to your elbows, one arm at a time. Keep the motion deliberate and unhurried.",
    cue: "Feel the weight and warmth of your hands on your arms.",
    duration: 45,
  },
  {
    id: "face",
    label: "Face Glide",
    instruction: "Using your fingertips, gently stroke from your temples, across your cheekbones, down to your jaw. Slow, smooth strokes.",
    cue: "Let your face soften with each pass. There is nothing to hold here.",
    duration: 45,
  },
  {
    id: "chest",
    label: "Chest Tap",
    instruction: "With relaxed fingertips, gently tap across your collarbone and upper chest — slowly moving from one side to the other.",
    cue: "Each tap sends a signal of safety inward.",
    duration: 35,
  },
  {
    id: "palms",
    label: "Palm Press",
    instruction: "Rub your palms together slowly until you feel warmth build. Then place both hands over your heart and rest there.",
    cue: "Feel the heat you created. Notice your breath. You are here.",
    duration: 30,
  },
] as const;

const SENSATIONS = ["Tension", "Anxiety", "Overwhelm", "Grief", "Fear", "Anger", "Numbness", "Restlessness"];
const LOCATIONS  = ["Head", "Throat", "Chest", "Stomach", "Shoulders", "Jaw", "Whole body"];

// ---------------------------------------------------------------------------
// SVG touch zone illustrations
// ---------------------------------------------------------------------------
function ArmsDiagram() {
  return (
    <svg viewBox="0 0 180 220" width="140" height="160" className="select-none mx-auto">
      {/* Torso */}
      <rect x="62" y="90" width="56" height="90" rx="10" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Head */}
      <circle cx="90" cy="62" r="28" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Left arm crossed */}
      <path d="M 62 105 Q 30 115 22 145" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Right arm crossed */}
      <path d="M 118 105 Q 150 115 158 145" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Left arm stroke arrow (down) */}
      <path d="M 50 110 L 30 138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" />
      <path d="M 30 138 L 25 130 M 30 138 L 38 134" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
      {/* Right arm stroke arrow (down) */}
      <path d="M 130 110 L 150 138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" />
      <path d="M 150 138 L 142 134 M 150 138 L 155 130" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
    </svg>
  );
}

function FaceDiagram() {
  return (
    <svg viewBox="0 0 180 200" width="140" height="155" className="select-none mx-auto">
      {/* Head */}
      <circle cx="90" cy="90" r="65" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Eyes subtle */}
      <ellipse cx="68" cy="82" rx="9" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />
      <ellipse cx="112" cy="82" rx="9" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />
      {/* Stroke arrows — temples to jaw, both sides */}
      {/* Left side */}
      <path d="M 38 72 Q 30 100 45 128" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" />
      <path d="M 45 128 L 36 122 M 45 128 L 50 120" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
      {/* Right side */}
      <path d="M 142 72 Q 150 100 135 128" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" />
      <path d="M 135 128 L 144 122 M 135 128 L 130 120" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
    </svg>
  );
}

function ChestDiagram() {
  return (
    <svg viewBox="0 0 180 200" width="140" height="155" className="select-none mx-auto">
      {/* Head */}
      <circle cx="90" cy="45" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Torso */}
      <path d="M 50 75 Q 35 80 30 95 L 30 180 Q 50 188 90 188 Q 130 188 150 180 L 150 95 Q 145 80 130 75 L 110 72 L 90 75 L 70 72 Z"
        fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Collarbone line */}
      <path d="M 55 82 Q 90 78 125 82" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/15" strokeDasharray="3 3" />
      {/* Tap dots across collarbone — left to right sweep */}
      {[58, 72, 86, 100, 114, 122].map((x, i) => (
        <circle key={i} cx={x} cy={86} r="4.5" className="fill-accent/70" />
      ))}
      {/* Arrow showing sweep direction */}
      <path d="M 52 100 L 128 100" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" strokeDasharray="4 3" />
      <path d="M 128 100 L 120 96 M 128 100 L 120 104" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
    </svg>
  );
}

function PalmsDiagram() {
  return (
    <svg viewBox="0 0 180 180" width="140" height="140" className="select-none mx-auto">
      {/* Left palm */}
      <rect x="18" y="60" width="58" height="75" rx="16" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="26" y="30" width="12" height="34" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="42" y="22" width="12" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="58" y="26" width="11" height="36" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Right palm */}
      <rect x="104" y="60" width="58" height="75" rx="16" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="142" y="30" width="12" height="34" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="126" y="22" width="12" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="111" y="26" width="11" height="36" rx="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      {/* Warmth/heat dots between palms */}
      <circle cx="90" cy="90" r="6" className="fill-accent/60" />
      <circle cx="90" cy="90" r="11" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent/30" />
      <circle cx="90" cy="90" r="17" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-accent/15" />
    </svg>
  );
}

const DIAGRAMS = [ArmsDiagram, FaceDiagram, ChestDiagram, PalmsDiagram];

// ---------------------------------------------------------------------------
// Breathing guide — 4s in, 6s out cycle
// ---------------------------------------------------------------------------
function BreathGuide() {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const durations = { in: 4000, out: 6000 };
    const id = setTimeout(() => setPhase((p) => (p === "in" ? "out" : "in")), durations[phase]);
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={{ scale: phase === "in" ? 1.25 : 0.85, opacity: phase === "in" ? 0.9 : 0.5 }}
        transition={{ duration: phase === "in" ? 4 : 6, ease: "easeInOut" }}
        className="w-8 h-8 rounded-full border border-accent/40 bg-accent/10"
      />
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
        {phase === "in" ? "Breathe in" : "Breathe out"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types & phases
// ---------------------------------------------------------------------------
type Phase = "intake-sensation" | "intake-intensity" | "session" | "done";

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.22 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SomaticTouchPage() {
  const navigate = useNavigate();

  // Intake
  const [phase, setPhase] = useState<Phase>("intake-sensation");
  const [sensations, setSensations] = useState<string[]>([]);
  const [bodyLocation, setBodyLocation] = useState("");
  const [intensity, setIntensity] = useState(6);
  const [startIntensity, setStartIntensity] = useState(6);

  // Session
  const [seqIdx, setSeqIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SEQUENCES[0].duration);
  const [running, setRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSeq = SEQUENCES[seqIdx];
  const Diagram = DIAGRAMS[seqIdx];
  const totalDuration = SEQUENCES.reduce((s, sq) => s + sq.duration, 0);
  const completedDuration = SEQUENCES.slice(0, seqIdx).reduce((s, sq) => s + sq.duration, 0);
  const progressPct = ((completedDuration + (currentSeq.duration - timeLeft)) / totalDuration) * 100;

  const startTimer = () => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          advanceSequence();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const advanceSequence = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const next = seqIdx + 1;
    if (next < SEQUENCES.length) {
      setSeqIdx(next);
      setTimeLeft(SEQUENCES[next].duration);
    } else {
      setPhase("done");
    }
  };

  // Auto-start timer when sequence index changes (after first one is started)
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const beginSession = () => {
    setSeqIdx(0);
    setTimeLeft(SEQUENCES[0].duration);
    setPhase("session");
    // Small delay then start
    setTimeout(startTimer, 400);
  };

  const togglePause = () => {
    if (running) {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      startTimer();
    }
  };

  const skipSequence = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    const next = seqIdx + 1;
    if (next < SEQUENCES.length) {
      setSeqIdx(next);
      setTimeLeft(SEQUENCES[next].duration);
      setTimeout(startTimer, 300);
    } else {
      setPhase("done");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ---------------------------------------------------------------------------
  // Intake — Sensation
  // ---------------------------------------------------------------------------
  if (phase === "intake-sensation") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="sensation" {...slide} className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-8">
            <div className="mb-8">
              <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-3">Step 1 of 2</p>
              <h1 className="text-display text-3xl mb-3">What's present right now?</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Notice what's alive in your body. Select anything that resonates.
              </p>
            </div>

            <div className="mb-6">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Sensation</p>
              <div className="flex flex-wrap gap-2">
                {SENSATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSensations((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`px-3.5 py-2 rounded-full text-sm font-sans transition-all ${
                      sensations.includes(s) ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Where do you feel it?</p>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setBodyLocation(bodyLocation === l ? "" : l)}
                    className={`px-3.5 py-2 rounded-full text-sm font-sans transition-all ${
                      bodyLocation === l ? "gold-gradient text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPhase("intake-intensity")}
              disabled={sensations.length === 0}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Intake — Intensity
  // ---------------------------------------------------------------------------
  if (phase === "intake-intensity") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-4 mb-6">
          <button onClick={() => setPhase("intake-sensation")} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key="intensity" {...slide} className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-8">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-6">Step 2 of 2</p>
            <h1 className="text-display text-3xl mb-3 text-center">How activated does it feel?</h1>
            <p className="text-muted-foreground text-sm mb-10 text-center">
              Rate the intensity in your body right now, from 1 to 10.
            </p>

            {bodyLocation && (
              <div className="mb-6 px-4 py-2 rounded-lg bg-card">
                <p className="text-[11px] text-muted-foreground text-center">
                  Noticing <span className="text-accent">{sensations.join(", ").toLowerCase()}</span>
                  {bodyLocation ? <> in your <span className="text-accent">{bodyLocation.toLowerCase()}</span></> : ""}
                </p>
              </div>
            )}

            <p className="text-display text-7xl text-accent mb-2 tabular-nums">{intensity}</p>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-10">
              {intensity <= 3 ? "Mild" : intensity <= 6 ? "Moderate" : intensity <= 8 ? "High" : "Overwhelming"}
            </p>

            <div className="w-full mb-10">
              <input
                type="range" min={1} max={10} value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">1 · Mild</span>
                <span className="text-[10px] text-muted-foreground">10 · Overwhelming</span>
              </div>
            </div>

            <button
              onClick={() => { setStartIntensity(intensity); beginSession(); }}
              className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform"
            >
              Begin session
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------
  if (phase === "session") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header + progress */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); navigate("/tools"); }}
              className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Somatic Touch</p>
            <p className="text-muted-foreground text-xs font-sans">{seqIdx + 1}/{SEQUENCES.length}</p>
          </div>
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <motion.div
              className="h-full gold-gradient rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={seqIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              {/* Diagram */}
              <div className="mb-4">
                <Diagram />
              </div>

              {/* Sequence label */}
              <span className="inline-block px-4 py-1.5 rounded-full bg-surface-light text-accent text-xs font-sans font-medium tracking-wide mb-4">
                {currentSeq.label}
              </span>

              {/* Instruction */}
              <p className="text-foreground text-base leading-relaxed text-center mb-3 font-serif">
                {currentSeq.instruction}
              </p>

              {/* Cue */}
              <p className="text-muted-foreground text-sm text-center italic mb-6">
                {currentSeq.cue}
              </p>

              {/* Breathing guide */}
              <div className="mb-6">
                <BreathGuide />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Timer + controls */}
        <div className="px-6 pb-8 shrink-0 space-y-3">
          {/* Countdown */}
          <div className="text-center mb-2">
            <p className="text-display text-3xl text-accent tabular-nums">{formatTime(timeLeft)}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={togglePause}
              className="flex-1 py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm border border-foreground/10 active:scale-[0.98] transition-transform"
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button
              onClick={skipSequence}
              className="flex-1 py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {seqIdx < SEQUENCES.length - 1 ? "Next" : "Finish"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✦</span>
        </div>
        <h2 className="text-display text-2xl mb-2">Well done</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Take a moment. Notice what has softened.
        </p>

        {/* Before / after */}
        <div className="velum-card p-5 mb-6 text-left">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Intensity shift</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-display text-2xl text-accent">{startIntensity}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Before</p>
            </div>
            <div className="flex-1 h-px bg-foreground/10 relative">
              <div className="absolute inset-y-0 left-0 bg-accent/40 rounded-full transition-all"
                style={{ width: `${Math.max(0, (startIntensity - intensity) / startIntensity * 100)}%` }} />
            </div>
            <div className="text-center">
              <p className="text-display text-2xl text-accent">{intensity}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">After</p>
            </div>
          </div>
          {intensity < startIntensity && (
            <p className="text-accent text-xs text-center">
              ↓ {startIntensity - intensity} point{startIntensity - intensity !== 1 ? "s" : ""} shift
            </p>
          )}
        </div>

        {/* Re-rate */}
        <div className="velum-card p-4 mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">How does it feel now?</p>
          <input
            type="range" min={1} max={10} value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">1</span>
            <span className="text-display text-lg text-accent">{intensity}</span>
            <span className="text-[10px] text-muted-foreground">10</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setSeqIdx(0); setTimeLeft(SEQUENCES[0].duration); setIntensity(startIntensity); beginSession(); }}
            className="w-full py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm flex items-center justify-center gap-2 border border-foreground/10 active:scale-[0.98] transition-transform"
          >
            <RotateCcw className="w-4 h-4" /> Run again
          </button>
          <button
            onClick={() => navigate("/tools")}
            className="w-full py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
