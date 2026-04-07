import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Hand, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaceBodyDiagram, HandDiagram, FingerPointDiagram, TappingGuide } from "@/components/TappingPointDiagram";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TappingPoint {
  point: string;
  phrase: string;
}

interface TappingRound {
  label: string;
  points: TappingPoint[];
}

interface GamutProcedure {
  when: string;
  note: string;
}

interface FingerPoint {
  point: string;
  location: string;
  reason: string;
  phrases: string[];
}

interface TappingScript {
  title: string;
  body_location?: string;
  setup_statements: string[];
  rounds: TappingRound[];
  gamut?: GamutProcedure | null;
  finger_point?: FingerPoint | null;
  closing: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POINT_DESCRIPTIONS: Record<string, string> = {
  "Eyebrow":      "Inner edge of eyebrow",
  "Side of Eye":  "Temple, beside the eye",
  "Under Eye":    "Below eye on cheekbone",
  "Under Nose":   "Between nose and lip",
  "Chin":         "Centre of chin",
  "Collarbone":   "Below collarbone, either side",
  "Under Arm":    "4 inches below armpit",
  "Top of Head":  "Crown of the head",
};

const GAMUT_STEPS = [
  "Close your eyes",
  "Open your eyes",
  "Eyes hard down right (head still)",
  "Eyes hard down left (head still)",
  "Roll eyes in a full circle",
  "Roll eyes the other direction",
  "Hum any tune for 2 seconds",
  "Count out loud: 1, 2, 3, 4, 5",
  "Hum again for 2 seconds",
];

const EMOTION_TYPES = [
  "Anxiety", "Anger", "Grief", "Fear", "Shame", "Overwhelm",
  "Limiting belief", "Physical pain", "Relationship stress", "Work stress",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type Phase = "input" | "generating" | "setup" | "round" | "gamut" | "finger" | "closing" | "done";

export default function TappingGeneratorPage() {
  const navigate = useNavigate();

  // Input state
  const [issue, setIssue] = useState("");
  const [intensity, setIntensity] = useState(7);
  const [emotionType, setEmotionType] = useState("");
  const [error, setError] = useState("");

  // Script state
  const [script, setScript] = useState<TappingScript | null>(null);
  const [phase, setPhase] = useState<Phase>("input");

  // Navigation within script
  const [setupIdx, setSetupIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [pointIdx, setPointIdx] = useState(0);
  const [gamutStep, setGamutStep] = useState(0);
  const [fingerIdx, setFingerIdx] = useState(0);

  // UI state
  const [showGuide, setShowGuide] = useState(false);

  // ---------------------------------------------------------------------------
  // Generate
  // ---------------------------------------------------------------------------
  const generate = async () => {
    if (!issue.trim()) { setError("Tell me what you'd like to work on."); return; }
    setError("");
    setPhase("generating");

    try {
      const response = await fetch("/api/generate-tapping-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, intensity, emotion_type: emotionType || null }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Request failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.script) throw new Error("No script returned");

      setScript(data.script);
      setSetupIdx(0);
      setRoundIdx(0);
      setPointIdx(0);
      setGamutStep(0);
      setFingerIdx(0);
      setPhase("setup");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setPhase("input");
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  const nextSetup = () => {
    if (setupIdx < 2) setSetupIdx(setupIdx + 1);
    else { setRoundIdx(0); setPointIdx(0); setPhase("round"); }
  };

  const nextPoint = () => {
    if (!script) return;
    const round = script.rounds[roundIdx];
    if (pointIdx < round.points.length - 1) {
      setPointIdx(pointIdx + 1);
    } else {
      // End of this round — check for gamut or finger points
      const isLastRound = roundIdx >= script.rounds.length - 1;

      if (!isLastRound) {
        // After round 1 (index 0), offer gamut if present
        if (roundIdx === 0 && script.gamut) {
          setGamutStep(0);
          setPhase("gamut");
        } else {
          setRoundIdx(roundIdx + 1);
          setPointIdx(0);
        }
      } else {
        // After last round — offer finger points if present
        if (script.finger_point) {
          setFingerIdx(0);
          setPhase("finger");
        } else {
          setPhase("closing");
        }
      }
    }
  };

  const prevPoint = () => {
    if (pointIdx > 0) {
      setPointIdx(pointIdx - 1);
    } else if (roundIdx > 0) {
      setRoundIdx(roundIdx - 1);
      setPointIdx((script?.rounds[roundIdx - 1].points.length ?? 1) - 1);
    } else {
      setPhase("setup");
      setSetupIdx(2);
    }
  };

  const restart = () => {
    setScript(null);
    setIssue("");
    setEmotionType("");
    setIntensity(7);
    setPhase("input");
  };

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const totalPoints = script ? script.rounds.reduce((s, r) => s + r.points.length, 0) : 0;
  const pointsCompleted = script
    ? script.rounds.slice(0, roundIdx).reduce((s, r) => s + r.points.length, 0) + pointIdx
    : 0;
  const progressPct = totalPoints > 0 ? (pointsCompleted / totalPoints) * 100 : 0;

  const slide = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

  // ---------------------------------------------------------------------------
  // Tapping points guide drawer
  // ---------------------------------------------------------------------------
  const GuideDrawer = () => (
    <AnimatePresence>
      {showGuide && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowGuide(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[88vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-background pt-4 pb-2 px-6 flex items-center justify-between border-b border-foreground/5">
              <p className="text-xs font-sans font-medium tracking-widest uppercase text-accent">Tapping Points Guide</p>
              <button onClick={() => setShowGuide(false)} className="p-2 -mr-2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 pt-4">
              <TappingGuide />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ---------------------------------------------------------------------------
  // Input screen
  // ---------------------------------------------------------------------------
  if (phase === "input") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GuideDrawer />
        <div className="flex items-center justify-between px-4 pt-4 mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors min-h-10"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Points guide
          </button>
        </div>

        <div className="flex-1 px-6 max-w-lg mx-auto w-full pb-8">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center mb-4">
              <Hand className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-display text-3xl mb-2">AI Tapping</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Describe what you're feeling right now and get a personalised EFT session.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">
              What would you like to work on?
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. I feel anxious about a difficult conversation I need to have…"
              rows={4}
              className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">
                Intensity right now
              </label>
              <span className="text-accent text-lg font-display">{intensity}<span className="text-muted-foreground text-xs">/10</span></span>
            </div>
            <input
              type="range" min={1} max={10} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-accent h-1.5 bg-surface-light rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-accent"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-muted-foreground">Mild</span>
              <span className="text-[10px] text-muted-foreground">Overwhelming</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Primary emotion <span className="normal-case">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_TYPES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmotionType(emotionType === e ? "" : e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${
                    emotionType === e
                      ? "gold-gradient text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-destructive text-xs mb-4">{error}</p>}

          <button
            onClick={generate}
            disabled={!issue.trim()}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-base disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate My Script
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Generating
  // ---------------------------------------------------------------------------
  if (phase === "generating") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-display text-xl mb-2">Creating your script…</p>
          <p className="text-muted-foreground text-sm">Personalising to what you shared.</p>
        </div>
      </div>
    );
  }

  if (!script) return null;

  // ---------------------------------------------------------------------------
  // Setup statements (Karate chop)
  // ---------------------------------------------------------------------------
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GuideDrawer />
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={restart} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
            <ArrowLeft className="w-4 h-4" /> New script
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Setup</p>
          <button onClick={() => setShowGuide(true)} className="p-2 -mr-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={setupIdx} {...slide} className="w-full text-center">
              {/* Hand diagram */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <HandDiagram activePoint="Karate Chop" size={120} />
                </div>
              </div>

              {script.body_location && setupIdx === 0 && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-card inline-block">
                  <p className="text-[11px] text-muted-foreground">
                    Notice the <span className="text-accent">{script.body_location}</span> as you say this
                  </p>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                Say out loud · {setupIdx + 1} of 3
              </p>
              <p className="text-foreground font-serif text-xl leading-relaxed mb-8 px-4">
                "{script.setup_statements[setupIdx]}"
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 mb-8">
            {script.setup_statements.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === setupIdx ? "bg-accent" : "bg-foreground/20"}`} />
            ))}
          </div>

          <button
            onClick={nextSetup}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {setupIdx < 2 ? "Next statement" : "Begin tapping"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="mt-4 text-center text-muted-foreground text-[11px] leading-relaxed">
            Tap the side of your hand while repeating each statement 3 times.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tapping rounds
  // ---------------------------------------------------------------------------
  if (phase === "round") {
    const round = script.rounds[roundIdx];
    const point = round.points[pointIdx];
    const isHeadPoint = ["Top of Head", "Eyebrow", "Side of Eye", "Under Eye", "Under Nose", "Chin"].includes(point.point);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GuideDrawer />
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">{round.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-xs font-sans">{pointIdx + 1}/8</p>
              <button onClick={() => setShowGuide(true)} className="p-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full gold-gradient rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={`${roundIdx}-${pointIdx}`} {...slide} className="w-full flex flex-col items-center">
              {/* Diagram showing current point */}
              <div className="mb-4">
                {isHeadPoint ? (
                  <FaceBodyDiagram activePoint={point.point} size={130} />
                ) : (
                  <FaceBodyDiagram activePoint={point.point} size={130} />
                )}
              </div>

              {/* Point name badge */}
              <div className="mb-2 text-center">
                <span className="inline-block px-4 py-1.5 rounded-full bg-surface-light text-accent text-xs font-sans font-medium tracking-wide">
                  {point.point}
                </span>
                <p className="text-muted-foreground text-[11px] mt-1.5">
                  {POINT_DESCRIPTIONS[point.point] ?? ""}
                </p>
              </div>

              {/* Phrase */}
              <p className="text-foreground font-serif text-2xl leading-relaxed mb-8 px-2 text-center">
                "{point.phrase}"
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 w-full mb-4">
            <button
              onClick={prevPoint}
              className="flex-none px-5 py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm active:scale-[0.97] transition-transform"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPoint}
              className="flex-1 py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-muted-foreground text-[11px]">
            Tap firmly but gently, 5–7 times per point.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Gamut procedure (optional, between rounds)
  // ---------------------------------------------------------------------------
  if (phase === "gamut" && script.gamut) {
    const isDone = gamutStep >= GAMUT_STEPS.length;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => { setRoundIdx(roundIdx + 1); setPointIdx(0); setPhase("round"); }}
            className="text-sm font-sans text-muted-foreground min-h-10"
          >
            Skip
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">9 Gamut</p>
          <div className="w-12" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              {script.gamut.note}
            </p>
          </div>

          {/* Gamut hand diagram */}
          <div className="mb-8 flex justify-center">
            <HandDiagram activePoint="Gamut Point" size={140} />
          </div>

          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            Tap gamut point continuously
          </p>

          <AnimatePresence mode="wait">
            {!isDone ? (
              <motion.div key={gamutStep} {...slide} className="w-full text-center mb-8">
                <p className="text-foreground font-serif text-xl mb-1">
                  {GAMUT_STEPS[gamutStep]}
                </p>
                <p className="text-muted-foreground text-xs">
                  Step {gamutStep + 1} of {GAMUT_STEPS.length}
                </p>
              </motion.div>
            ) : (
              <motion.div key="done" {...slide} className="w-full text-center mb-8">
                <p className="text-foreground font-serif text-xl">Gamut complete</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex gap-1.5 mb-8 flex-wrap justify-center">
            {GAMUT_STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < gamutStep ? "bg-accent" : i === gamutStep ? "bg-accent" : "bg-foreground/15"}`} />
            ))}
          </div>

          <button
            onClick={() => {
              if (!isDone) {
                setGamutStep(gamutStep + 1);
              } else {
                setRoundIdx(roundIdx + 1);
                setPointIdx(0);
                setPhase("round");
              }
            }}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {!isDone ? "Next step" : "Continue tapping"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Finger points (optional, after main rounds)
  // ---------------------------------------------------------------------------
  if (phase === "finger" && script.finger_point) {
    const fp = script.finger_point;
    const isDone = fingerIdx >= fp.phrases.length;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => setPhase("closing")}
            className="text-sm font-sans text-muted-foreground min-h-10"
          >
            Skip
          </button>
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Finger Points</p>
          <div className="w-12" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <div className="mb-6 flex justify-center">
            <FingerPointDiagram activePoint={fp.point} size={130} />
          </div>

          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-surface-light text-accent text-xs font-sans font-medium tracking-wide mb-2">
              {fp.point}
            </span>
            <p className="text-muted-foreground text-[11px]">{fp.location}</p>
            <p className="text-muted-foreground text-[11px] mt-1 italic">{fp.reason}</p>
          </div>

          <AnimatePresence mode="wait">
            {!isDone ? (
              <motion.div key={fingerIdx} {...slide} className="w-full text-center mb-8">
                <p className="text-foreground font-serif text-2xl leading-relaxed">
                  "{fp.phrases[fingerIdx]}"
                </p>
                <p className="text-muted-foreground text-xs mt-2">{fingerIdx + 1} of {fp.phrases.length}</p>
              </motion.div>
            ) : (
              <motion.div key="done" {...slide} className="w-full text-center mb-8">
                <p className="text-foreground font-serif text-xl">Finger points complete</p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              if (!isDone) setFingerIdx(fingerIdx + 1);
              else setPhase("closing");
            }}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {!isDone ? "Next phrase" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="mt-4 text-center text-muted-foreground text-[11px]">
            Tap firmly on the inside edge of the finger, at the base of the nail.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Closing
  // ---------------------------------------------------------------------------
  if (phase === "closing") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Integration</p>
          <p className="text-foreground font-serif text-xl leading-relaxed mb-10 px-2">
            {script.closing}
          </p>
          <button
            onClick={() => setPhase("done")}
            className="w-full py-4 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium active:scale-[0.98] transition-transform"
          >
            Complete session
          </button>
        </motion.div>
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
          <Hand className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-display text-2xl mb-2">Session complete</h2>
        <p className="text-muted-foreground text-sm mb-2">"{script.title}"</p>
        <p className="text-muted-foreground text-sm mb-10">
          Take a breath. Notice what has shifted.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setSetupIdx(0); setRoundIdx(0); setPointIdx(0); setPhase("setup"); }}
            className="w-full py-3.5 rounded-2xl bg-card text-foreground font-sans text-sm flex items-center justify-center gap-2 border border-foreground/10 active:scale-[0.98] transition-transform"
          >
            <RotateCcw className="w-4 h-4" /> Run again
          </button>
          <button
            onClick={restart}
            className="w-full py-3.5 rounded-2xl gold-gradient text-primary-foreground font-sans font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Sparkles className="w-4 h-4" /> New script
          </button>
        </div>
      </motion.div>
    </div>
  );
}
