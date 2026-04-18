import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Hand, Sparkles, RotateCcw, Wind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Path = "negative" | "positive";
type Phase =
  | "intent"
  | "input"
  | "body_yn"
  | "body_where"
  | "suds"
  | "aspects"
  | "generating_setup"
  | "setup"
  | "generating_round"
  | "round"
  | "breath_pause"
  | "reassess"
  | "shift_input"
  | "generating_shift"
  | "shift_round"
  | "shift_reassess"
  | "complete";

interface PointPhrase { point: string; location: string; image: string; phrase: string; }

// ─── Constants ─────────────────────────────────────────────────────────────────

const POINTS: { point: string; location: string; image: string }[] = [
  { point: "Eyebrow",      location: "Inner edge of eyebrow, at the bridge of your nose",   image: "/tapping-points/eyebrow.png" },
  { point: "Side of Eye",  location: "On the bone at the outer corner of your eye",         image: "/tapping-points/side-of-eye.png" },
  { point: "Under Eye",    location: "On the bone directly below your pupil",               image: "/tapping-points/under-eye.png" },
  { point: "Under Nose",   location: "Between your nose and upper lip",                     image: "/tapping-points/under-nose.png" },
  { point: "Chin",         location: "In the crease between your lower lip and chin",       image: "/tapping-points/under-mouth.png" },
  { point: "Collarbone",   location: "Just below the collarbone, either side of the chest", image: "/tapping-points/collarbone.png" },
  { point: "Under Arm",    location: "About four inches below your armpit",                 image: "/tapping-points/under-arm.png" },
  { point: "Top of Head",  location: "Crown of your head",                                  image: "/tapping-points/top-of-head.png" },
];

const KARATE_CHOP_IMAGE = "/tapping-points/karate-chop.png";

const BODY_LOCATIONS = ["Chest", "Throat", "Stomach", "Shoulders", "Jaw", "Head", "Back", "Hands", "Whole body", "Nowhere specific"];

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -16, transition: { duration: 0.18 } },
};

// ─── SUDS Chart ────────────────────────────────────────────────────────────────

function SudsChart({ journey }: { journey: number[] }) {
  if (journey.length < 2) return null;
  const W = 280, H = 100, pad = 16;
  const xs = journey.map((_, i) => pad + (i / (journey.length - 1)) * (W - pad * 2));
  const ys = journey.map(v => pad + ((10 - v) / 10) * (H - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg width={W} height={H} className="mx-auto">
      {/* Grid lines */}
      {[0, 5, 10].map(v => {
        const y = pad + ((10 - v) / 10) * (H - pad * 2);
        return <g key={v}>
          <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pad - 4} y={y + 4} fontSize="7" fill="rgba(255,255,255,0.25)" textAnchor="end">{v}</text>
        </g>;
      })}
      <path d={path} fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3" fill="#C9A84C" />
      ))}
    </svg>
  );
}

// ─── SUDS Selector ─────────────────────────────────────────────────────────────

function SudsSelector({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  const getLabelText = (v: number) => {
    if (v === 0) return "Not at all";
    if (v <= 2) return "Very mild";
    if (v <= 4) return "Noticeable";
    if (v <= 6) return "Moderate";
    if (v <= 8) return "Intense";
    return "Overwhelming";
  };
  return (
    <div className="w-full text-center">
      <div className="mb-6">
        <span className="text-display text-8xl text-accent">{value}</span>
        <span className="text-muted-foreground/30 text-4xl font-sans">/10</span>
      </div>
      <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-6">{getLabelText(value)}</p>
      {label && <p className="text-muted-foreground text-xs font-sans mb-6">{label}</p>}
      <div className="grid grid-cols-11 gap-1.5 px-2">
        {Array.from({ length: 11 }, (_, i) => i).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`py-3 rounded-lg text-sm font-sans font-medium transition-all ${
              n === value
                ? "gold-gradient text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-surface-light hover:text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-2">
        <span className="text-muted-foreground/50 text-[10px]">None</span>
        <span className="text-muted-foreground/50 text-[10px]">Overwhelming</span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TappingGeneratorPage() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Flow state
  const [phase, setPhase] = useState<Phase>("intent");
  const [path, setPath] = useState<Path>("negative");
  const [error, setError] = useState("");

  // Input state
  const [issue, setIssue] = useState("");
  const [hasBodyLocation, setHasBodyLocation] = useState<boolean | null>(null);
  const [bodyLocation, setBodyLocation] = useState("");
  const [initialSuds, setInitialSuds] = useState(5);
  const [aspects, setAspects] = useState("");

  // Setup state
  const [setupStatements, setSetupStatements] = useState<string[]>([]);
  const [setupIdx, setSetupIdx] = useState(0);

  // Round state
  const [roundPhrases, setRoundPhrases] = useState<PointPhrase[]>([]);
  const [pointIdx, setPointIdx] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);

  // Reassess state
  const [currentSuds, setCurrentSuds] = useState(5);
  const [newAspects, setNewAspects] = useState("");
  const [sudsJourney, setSudsJourney] = useState<number[]>([]);

  // Positive shift state
  const [positiveBelief, setPositiveBelief] = useState("");
  const [resistance, setResistance] = useState(5);
  const [shiftPhrases, setShiftPhrases] = useState<PointPhrase[]>([]);
  const [shiftPointIdx, setShiftPointIdx] = useState(0);
  const [shiftRound, setShiftRound] = useState(1);
  const [newResistance, setNewResistance] = useState(5);
  const [resistanceJourney, setResistanceJourney] = useState<number[]>([]);

  // ─── API ──────────────────────────────────────────────────────────────────

  const callApi = async (body: object) => {
    const token = session?.access_token;
    const res = await fetch("/api/generate-tapping-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 429) throw new Error(data.error ?? "Daily limit reached.");
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  };

  // ─── Session logging ──────────────────────────────────────────────────────

  const createSession = async () => {
    if (!session?.user) return;
    const { data } = await supabase.from("tapping_sessions").insert({
      user_id: session.user.id,
      path,
      issue,
      body_location: hasBodyLocation ? bodyLocation : null,
      initial_suds: initialSuds,
      suds_journey: [initialSuds],
    }).select("id").single();
    if (data) sessionIdRef.current = data.id;
  };

  const updateSession = async (updates: Record<string, unknown>) => {
    if (!sessionIdRef.current) return;
    await supabase.from("tapping_sessions").update(updates).eq("id", sessionIdRef.current);
  };

  const completeSession = async (finalSuds: number, finalResistance?: number) => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    await updateSession({
      final_suds: finalSuds,
      resistance_final: finalResistance,
      suds_journey: sudsJourney,
      completed: true,
      duration_seconds: duration,
      positive_belief: positiveBelief || null,
    });
  };

  // ─── Generators ──────────────────────────────────────────────────────────

  const generateSetup = async () => {
    setPhase("generating_setup");
    setError("");
    try {
      await createSession();
      const data = await callApi({
        action: "setup",
        path,
        issue,
        body_location: hasBodyLocation ? bodyLocation : null,
        suds: initialSuds,
        aspects: aspects || null,
      });
      setSetupStatements(data.statements);
      setSetupIdx(0);
      setPhase("setup");
    } catch (e: any) {
      setError(e.message);
      setPhase("aspects");
    }
  };

  const generateRound = async (roundNum: number, extraAspects?: string) => {
    setPhase("generating_round");
    setError("");
    try {
      const data = await callApi({
        action: "round",
        path,
        issue,
        body_location: hasBodyLocation ? bodyLocation : null,
        suds: roundNum === 1 ? initialSuds : currentSuds,
        aspects: [aspects, extraAspects].filter(Boolean).join(". ") || null,
        round_number: roundNum,
      });
      const phrases: PointPhrase[] = POINTS.map((p, i) => ({
        ...p,
        phrase: data.phrases[i] ?? `${p.point}: focus here`,
      }));
      setRoundPhrases(phrases);
      setPointIdx(0);
      setPhase("round");
    } catch (e: any) {
      setError(e.message);
      setPhase("reassess");
    }
  };

  const generateShiftRound = async (rNum: number) => {
    setPhase("generating_shift");
    setError("");
    try {
      const data = await callApi({
        action: "positive_round",
        positive_belief: positiveBelief,
        resistance: rNum === 1 ? resistance : newResistance,
        round_number: rNum,
      });
      const phrases: PointPhrase[] = POINTS.map((p, i) => ({
        ...p,
        phrase: data.phrases[i] ?? `${p.point}: open to this`,
      }));
      setShiftPhrases(phrases);
      setShiftPointIdx(0);
      setPhase("shift_round");
    } catch (e: any) {
      setError(e.message);
      setPhase("shift_reassess");
    }
  };

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const handleIntentSelect = (p: Path) => {
    setPath(p);
    setPhase("input");
  };

  const handleInputNext = () => {
    if (!issue.trim()) return;
    setPhase("body_yn");
  };

  const handleBodyYn = (yn: boolean) => {
    setHasBodyLocation(yn);
    if (yn) setPhase("body_where");
    else setPhase("suds");
  };

  const handleBodyWhere = (loc: string) => {
    setBodyLocation(loc);
    setPhase("suds");
  };

  const handleSudsNext = () => {
    setSudsJourney([initialSuds]);
    setCurrentSuds(initialSuds);
    setPhase("aspects");
  };

  const handleAspectsNext = () => {
    generateSetup();
  };

  const handleSetupNext = () => {
    if (setupIdx < setupStatements.length - 1) {
      setSetupIdx(setupIdx + 1);
    } else {
      generateRound(1);
    }
  };

  const handlePointNext = () => {
    if (pointIdx < POINTS.length - 1) {
      setPointIdx(pointIdx + 1);
    } else {
      setPhase("breath_pause");
    }
  };

  const handleBreathDone = () => {
    setCurrentSuds(sudsJourney[sudsJourney.length - 1]);
    setNewAspects("");
    setPhase("reassess");
  };

  const handleReassess = () => {
    const journey = [...sudsJourney, currentSuds];
    setSudsJourney(journey);
    updateSession({ suds_journey: journey });

    if (currentSuds <= 3) {
      // Win — offer shift to positive
      setPhase("shift_input");
    } else {
      // Keep going
      const next = roundNumber + 1;
      setRoundNumber(next);
      generateRound(next, newAspects || undefined);
    }
  };

  const handleShiftNext = () => {
    if (!positiveBelief.trim()) return;
    setResistanceJourney([resistance]);
    setShiftRound(1);
    generateShiftRound(1);
  };

  const handleShiftPointNext = () => {
    if (shiftPointIdx < POINTS.length - 1) {
      setShiftPointIdx(shiftPointIdx + 1);
    } else {
      setNewResistance(resistance);
      setPhase("shift_reassess");
    }
  };

  const handleShiftReassess = () => {
    const rJourney = [...resistanceJourney, newResistance];
    setResistanceJourney(rJourney);
    if (newResistance <= 3 || shiftRound >= 3) {
      completeSession(currentSuds, newResistance);
      setPhase("complete");
    } else {
      const next = shiftRound + 1;
      setShiftRound(next);
      generateShiftRound(next);
    }
  };

  const handleSkipShift = () => {
    completeSession(currentSuds);
    setPhase("complete");
  };

  const restart = () => {
    setPhase("intent");
    setIssue(""); setAspects(""); setBodyLocation("");
    setHasBodyLocation(null); setSetupStatements([]); setSetupIdx(0);
    setRoundPhrases([]); setPointIdx(0); setRoundNumber(1);
    setSudsJourney([]); setCurrentSuds(5); setInitialSuds(5);
    setNewAspects(""); setPositiveBelief(""); setResistance(5);
    setShiftPhrases([]); setShiftPointIdx(0); setShiftRound(1);
    setResistanceJourney([]); setNewResistance(5);
    sessionIdRef.current = null;
    startTimeRef.current = Date.now();
    setError("");
  };

  // ─── Shared UI pieces ─────────────────────────────────────────────────────

  const BackBar = ({ onBack, label = "Back" }: { onBack: () => void; label?: string }) => (
    <div className="flex items-center px-4 mb-6 flex-shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top) + 16px)" }}>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10">
        <ArrowLeft className="w-4 h-4" /> {label}
      </button>
    </div>
  );

  const Generating = ({ msg = "Building your session…" }: { msg?: string }) => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-display text-xl mb-2">{msg}</p>
        <p className="text-muted-foreground text-sm">Personalising to what you shared.</p>
      </div>
    </div>
  );

  // ─── Phases ───────────────────────────────────────────────────────────────

  // INTENT
  if (phase === "intent") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => navigate(-1)} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-8">
        <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center mb-5">
          <Hand className="w-5 h-5 text-primary-foreground" />
        </div>
        <h1 className="text-display text-3xl mb-2 text-center">Today I'm here to tap on…</h1>
        <p className="text-muted-foreground text-sm font-sans text-center mb-10 max-w-xs">
          Choose where you're starting from.
        </p>
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => handleIntentSelect("negative")}
            className="w-full border border-foreground/10 rounded-xl px-6 py-6 text-left hover:border-accent/30 hover:bg-surface-light/20 transition-all active:scale-[0.98]"
          >
            <p className="text-foreground text-base font-sans font-semibold mb-1">Something difficult</p>
            <p className="text-muted-foreground text-sm font-sans leading-relaxed">A difficult emotion, feeling, or situation I want to work through.</p>
          </button>
          <button
            onClick={() => handleIntentSelect("positive")}
            className="w-full border border-foreground/10 rounded-xl px-6 py-6 text-left hover:border-accent/30 hover:bg-surface-light/20 transition-all active:scale-[0.98]"
          >
            <p className="text-foreground text-base font-sans font-semibold mb-1">A positive feeling I want more of</p>
            <p className="text-muted-foreground text-sm font-sans leading-relaxed">Gratitude, joy, abundance, confidence — but something's in the way.</p>
          </button>
        </div>
        <a
          href="/velum-tapping-guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 text-accent text-xs font-sans underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          New to tapping? Read the intro guide →
        </a>
      </div>
    </div>
  );

  // INPUT
  if (phase === "input") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => setPhase("intent")} />
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="input" {...slide}>
            {path === "positive" && (
              <div className="mb-6 p-4 rounded-xl bg-surface-light/30 border border-accent/15">
                <p className="text-accent text-[10px] font-sans font-medium tracking-[2px] uppercase mb-1">Heads up</p>
                <p className="text-muted-foreground text-xs font-sans leading-relaxed">
                  If you have strong negative emotions blocking this, it helps to clear those first.{" "}
                  <button onClick={() => handleIntentSelect("negative")} className="text-accent underline underline-offset-1">
                    Tap on something difficult instead →
                  </button>
                </p>
              </div>
            )}
            <h1 className="text-display text-2xl mb-2">
              {path === "negative" ? "What's bothering you?" : "What do you want to feel more of?"}
            </h1>
            <p className="text-muted-foreground text-sm font-sans mb-6 leading-relaxed">
              {path === "negative"
                ? 'Complete the sentence: "I feel…" or "I am dealing with…" or "I am experiencing…"'
                : 'e.g. "gratitude", "abundance", "joy", "confidence in my own worth"'}
            </p>
            <textarea
              value={issue}
              onChange={e => setIssue(e.target.value)}
              placeholder={path === "negative"
                ? "e.g. anger towards my spouse…"
                : "e.g. more joy and ease in my daily life…"}
              rows={4}
              className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
              autoFocus
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={handleInputNext}
          disabled={!issue.trim()}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // BODY YES/NO
  if (phase === "body_yn") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => setPhase("input")} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-8">
        <AnimatePresence mode="wait">
          <motion.div key="body_yn" {...slide} className="w-full text-center">
            <h1 className="text-display text-2xl mb-3">Do you feel this anywhere in your body?</h1>
            <p className="text-muted-foreground text-sm font-sans mb-10">A tightness in your chest, a knot in your stomach, tension in your shoulders…</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleBodyYn(true)}
                className="flex-1 py-5 rounded-xl border border-foreground/10 text-foreground font-sans font-medium hover:border-accent/30 hover:bg-surface-light/20 transition-all active:scale-[0.98]"
              >
                Yes
              </button>
              <button
                onClick={() => handleBodyYn(false)}
                className="flex-1 py-5 rounded-xl border border-foreground/10 text-foreground font-sans font-medium hover:border-accent/30 hover:bg-surface-light/20 transition-all active:scale-[0.98]"
              >
                Not really
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  // BODY WHERE
  if (phase === "body_where") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => setPhase("body_yn")} />
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="body_where" {...slide} className="w-full">
            <h1 className="text-display text-2xl mb-2">Where do you feel it?</h1>
            <p className="text-muted-foreground text-sm font-sans mb-6">Tap the one that fits, or write your own below.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {BODY_LOCATIONS.map(loc => (
                <button
                  key={loc}
                  onClick={() => setBodyLocation(bodyLocation === loc ? "" : loc)}
                  className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${
                    bodyLocation === loc
                      ? "gold-gradient text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={bodyLocation}
              onChange={e => setBodyLocation(e.target.value)}
              placeholder="Or describe it…"
              className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={() => setPhase("suds")}
          disabled={!bodyLocation.trim()}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // SUDS
  if (phase === "suds") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => hasBodyLocation ? setPhase("body_where") : setPhase("body_yn")} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="suds" {...slide} className="w-full">
            <h1 className="text-display text-2xl mb-2 text-center">
              {path === "negative" ? "How intense is this right now?" : "How strong is the resistance to feeling this?"}
            </h1>
            <p className="text-muted-foreground text-sm font-sans text-center mb-10">
              0 = not present at all · 10 = overwhelmingly intense
            </p>
            <SudsSelector value={initialSuds} onChange={setInitialSuds} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={handleSudsNext}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ASPECTS
  if (phase === "aspects") return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackBar onBack={() => setPhase("suds")} />
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="aspects" {...slide} className="w-full">
            <h1 className="text-display text-2xl mb-2">Any other details?</h1>
            <p className="text-muted-foreground text-sm font-sans mb-6 leading-relaxed">
              Are there specific things about this situation that bother you most? The more you share, the more targeted your session will be.
            </p>
            <textarea
              value={aspects}
              onChange={e => setAspects(e.target.value)}
              placeholder="e.g. the way they speak to me, feeling unheard, not being respected… (optional)"
              rows={4}
              className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
            />
            {error && <p className="text-destructive text-xs mt-3">{error}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={handleAspectsNext}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform"
        >
          Build My Session <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (phase === "generating_setup") return <Generating msg="Writing your session…" />;
  if (phase === "generating_round") return <Generating msg={`Writing round ${roundNumber}…`} />;
  if (phase === "generating_shift") return <Generating msg="Writing your positive round…" />;

  // SETUP (karate chop) — single statement, repeated 3x, one tap to begin
  if (phase === "setup" && setupStatements.length > 0) return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 mb-4 flex-shrink-0">
        <button onClick={restart} className="flex items-center gap-1 text-sm font-sans text-muted-foreground min-h-10">
          <ArrowLeft className="w-4 h-4" /> New session
        </button>
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Setup</p>
        <div className="w-20" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full pb-8">
        <AnimatePresence mode="wait">
          <motion.div key="setup" {...slide} className="w-full text-center flex flex-col items-center">
            <div className="mb-5 w-full max-w-[280px]">
              <img
                src={KARATE_CHOP_IMAGE}
                alt="Karate chop point"
                className="w-full rounded-2xl border border-foreground/10 bg-surface-light/10"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Where to tap</p>
            <p className="text-foreground text-sm font-sans mb-7">Karate chop</p>

            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase mb-4">
              Say this 3 times
            </p>
            <p className="text-foreground font-serif text-xl leading-relaxed mb-6 px-2">
              "{setupStatements[0]}"
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed max-w-xs">
              Tap continuously on the side of your hand while repeating the statement 3 times.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="p-6">
        <button
          onClick={() => generateRound(1)}
          className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          Begin tapping
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // ROUND
  if (phase === "round" && roundPhrases.length > 0) {
    const point = roundPhrases[pointIdx];
    const progress = (pointIdx / POINTS.length) * 100;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Round {roundNumber}</p>
            <p className="text-muted-foreground text-xs font-sans">{pointIdx + 1} / {POINTS.length}</p>
          </div>
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div className="h-full gold-gradient rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={`${roundNumber}-${pointIdx}`} {...slide} className="w-full flex flex-col items-center">
              <div className="mb-5 text-center flex flex-col items-center">
                <div className="mb-3 w-full max-w-[240px]">
                  <img
                    src={point.image}
                    alt={`${point.point} tapping point`}
                    className="w-full rounded-2xl border border-foreground/10 bg-surface-light/10"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <p className="text-foreground font-sans font-semibold text-lg tracking-wide">{point.point}</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-xs">{point.location}</p>
              </div>
              <p className="text-foreground font-serif text-2xl leading-relaxed text-center mb-8 px-2">
                "{point.phrase}"
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => pointIdx > 0 && setPointIdx(pointIdx - 1)}
              disabled={pointIdx === 0}
              className="flex-none px-5 py-3.5 rounded-xl bg-card text-foreground font-sans text-sm active:scale-[0.97] transition-transform disabled:opacity-25"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handlePointNext}
              className="flex-1 py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {pointIdx < POINTS.length - 1 ? "Next" : "Done with round"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-[11px] text-center mt-4">Tap firmly 5–7 times on each point.</p>
        </div>
      </div>
    );
  }

  // BREATH PAUSE
  if (phase === "breath_pause") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center mx-auto mb-6">
          <Wind className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-display text-2xl mb-4">Stop. Take a breath.</h2>
        <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-10">
          Breathe in slowly through your nose… hold for a moment… and let it all go.
        </p>
        <button
          onClick={handleBreathDone}
          className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform"
        >
          I've taken my breath
        </button>
      </motion.div>
    </div>
  );

  // REASSESS
  if (phase === "reassess") return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 mb-6 flex-shrink-0">
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase text-center">Check In</p>
      </div>
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="reassess" {...slide} className="w-full">
            <h1 className="text-display text-2xl mb-2 text-center">Where are you now?</h1>
            <p className="text-muted-foreground text-sm font-sans text-center mb-8">Rate the same feeling again.</p>
            <SudsSelector
              value={currentSuds}
              onChange={setCurrentSuds}
              label={`Started at ${initialSuds}. Did that number move?`}
            />
            <div className="mt-8">
              <label className="block text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                Did any new aspects surface? <span className="normal-case">(optional)</span>
              </label>
              <textarea
                value={newAspects}
                onChange={e => setNewAspects(e.target.value)}
                placeholder="e.g. I'm also feeling hurt about something specific…"
                rows={3}
                className="w-full bg-card rounded-xl px-4 py-3 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40"
              />
            </div>
            {currentSuds <= 3 && (
              <div className="mt-4 p-3 rounded-xl bg-accent/8 border border-accent/20 text-center">
                <p className="text-accent text-xs font-sans">
                  {currentSuds === 0 ? "🎉 Clear." : "That's a real shift."} {currentSuds}/10 is a win.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={handleReassess}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform"
        >
          {currentSuds <= 3 ? "Shift to the positive →" : `Continue · Round ${roundNumber + 1}`}
        </button>
      </div>
    </div>
  );

  // SHIFT INPUT
  if (phase === "shift_input") return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 mb-6 flex-shrink-0">
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase text-center">Positive Shift</p>
      </div>
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="shift" {...slide} className="w-full">
            <div className="text-center mb-6">
              <p className="text-muted-foreground/50 text-sm font-sans line-through mb-1">{issue}</p>
              <div className="w-6 h-[1px] bg-accent/40 mx-auto my-2" />
            </div>
            <h1 className="text-display text-2xl mb-2">What would you rather experience?</h1>
            <p className="text-muted-foreground text-sm font-sans mb-6 leading-relaxed">
              The opposite of what you were clearing. What's the positive state or belief you want to tap into?
            </p>
            <textarea
              value={positiveBelief}
              onChange={e => setPositiveBelief(e.target.value)}
              placeholder="e.g. I love and accept this person unconditionally, I feel at peace with this situation…"
              rows={3}
              className="w-full bg-card rounded-xl px-4 py-3.5 text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/40 mb-6"
              autoFocus
            />
            <h2 className="text-foreground text-sm font-sans font-semibold mb-2">Rate your resistance to this — 0 to 10</h2>
            <p className="text-muted-foreground text-xs font-sans mb-4">0 = you fully believe it · 10 = feels completely untrue right now</p>
            <SudsSelector value={resistance} onChange={setResistance} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex flex-col gap-2">
        <button
          onClick={handleShiftNext}
          disabled={!positiveBelief.trim()}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base disabled:opacity-30 active:scale-[0.98] transition-transform"
        >
          Tap into this <Sparkles className="w-4 h-4" />
        </button>
        <button onClick={handleSkipShift} className="w-full text-center text-muted-foreground/60 text-xs font-sans py-2">
          Skip — complete session
        </button>
      </div>
    </div>
  );

  // SHIFT ROUND
  if (phase === "shift_round" && shiftPhrases.length > 0) {
    const point = shiftPhrases[shiftPointIdx];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">Positive · Round {shiftRound}</p>
            <p className="text-muted-foreground text-xs font-sans">{shiftPointIdx + 1} / {POINTS.length}</p>
          </div>
          <div className="h-1 bg-surface-light rounded-full overflow-hidden">
            <div className="h-full bg-accent/60 rounded-full transition-all duration-300" style={{ width: `${(shiftPointIdx / POINTS.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div key={`shift-${shiftRound}-${shiftPointIdx}`} {...slide} className="w-full flex flex-col items-center">
              <div className="mb-6 text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center mx-auto mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                </div>
                <p className="text-foreground font-sans font-semibold text-lg">{point.point}</p>
                <p className="text-muted-foreground text-xs mt-1">{point.location}</p>
              </div>
              <p className="text-foreground font-serif text-2xl leading-relaxed text-center mb-8 px-2">
                "{point.phrase}"
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => shiftPointIdx > 0 && setShiftPointIdx(shiftPointIdx - 1)}
              disabled={shiftPointIdx === 0}
              className="flex-none px-5 py-3.5 rounded-xl bg-card text-foreground font-sans text-sm disabled:opacity-25"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleShiftPointNext}
              className="flex-1 py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {shiftPointIdx < POINTS.length - 1 ? "Next" : "Done"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SHIFT REASSESS
  if (phase === "shift_reassess") return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 mb-6">
        <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase text-center">Check In</p>
      </div>
      <div className="flex-1 flex flex-col px-6 max-w-lg mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          <motion.div key="shift-reassess" {...slide} className="w-full">
            <h1 className="text-display text-2xl mb-2 text-center">How does that feel now?</h1>
            <p className="text-muted-foreground text-sm font-sans text-center mb-3">
              "{positiveBelief}"
            </p>
            <p className="text-muted-foreground text-xs font-sans text-center mb-8">Rate your resistance — 0 = fully believe it</p>
            <SudsSelector value={newResistance} onChange={setNewResistance} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex flex-col gap-2">
        <button
          onClick={handleShiftReassess}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform"
        >
          {newResistance <= 3 || shiftRound >= 3 ? "Complete Session" : `Another round`}
        </button>
        {(newResistance > 3 && shiftRound < 3) && (
          <button onClick={() => { completeSession(currentSuds, newResistance); setPhase("complete"); }} className="w-full text-center text-muted-foreground/60 text-xs font-sans py-2">
            That's enough for today
          </button>
        )}
      </div>
    </div>
  );

  // COMPLETE
  if (phase === "complete") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
          <Hand className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-display text-3xl mb-2">Session complete.</h2>
        <p className="text-muted-foreground text-sm font-sans mb-6">Take a moment. Notice what has shifted.</p>

        {/* SUDS journey */}
        {sudsJourney.length >= 2 && (
          <div className="bg-card rounded-2xl p-5 mb-4 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Your SUDS Journey</p>
            <SudsChart journey={sudsJourney} />
            <div className="flex justify-between mt-3">
              <div className="text-center">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Started</p>
                <p className="text-accent text-2xl font-serif">{sudsJourney[0]}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Finished</p>
                <p className="text-accent text-2xl font-serif">{sudsJourney[sudsJourney.length - 1]}</p>
              </div>
              {sudsJourney[0] > sudsJourney[sudsJourney.length - 1] && (
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Released</p>
                  <p className="text-green-400 text-2xl font-serif">↓{sudsJourney[0] - sudsJourney[sudsJourney.length - 1]}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {positiveBelief && resistanceJourney.length >= 2 && (
          <div className="bg-card rounded-2xl p-5 mb-6 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Positive Belief</p>
            <p className="text-foreground text-sm font-serif italic mb-3">"{positiveBelief}"</p>
            <div className="flex justify-between">
              <div>
                <p className="text-muted-foreground text-[10px]">Resistance start</p>
                <p className="text-accent text-xl font-serif">{resistanceJourney[0]}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px]">Resistance end</p>
                <p className="text-accent text-xl font-serif">{resistanceJourney[resistanceJourney.length - 1]}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={restart}
            className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> New Session
          </button>
          <button
            onClick={() => navigate("/home")}
            className="w-full py-3.5 rounded-xl bg-card border border-foreground/10 text-foreground font-sans text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );

  return null;
}
