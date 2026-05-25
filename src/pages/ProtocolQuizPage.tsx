import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  CircleDot,
  Compass,
  Fingerprint,
  Flame,
  Layers3,
  Loader2,
  Lock,
  Moon,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import VelumMark from "@/components/VelumMark";

type Step = "intro" | "gap" | "loop" | "friction" | "outcome" | "identity" | "name" | "email" | "building" | "results";

interface ProtocolAnswers {
  gap?: string[];
  loop?: string | string[];
  friction?: string[];
  outcome?: string;
  identity?: string;
  firstName?: string;
  email?: string;
  protocol?: ProtocolResult;
}

interface ProtocolResult {
  headline: string;
  primaryPattern: string;
  mechanism: string;
  trackTheme: string;
  tools: string[];
  sevenDayPlan: string[];
}

const STORAGE_KEY = "velum_protocol_quiz_v1";

const GAP_OPTIONS = [
  { v: "money", label: "Money", sub: "freedom, ease, receiving more" },
  { v: "identity", label: "Identity", sub: "who I am vs who I know I am" },
  { v: "work", label: "Work", sub: "output, focus, momentum" },
  { v: "relationships", label: "Relationships", sub: "depth, safety, attraction" },
  { v: "sleep", label: "Sleep", sub: "quiet mind, deeper recovery" },
  { v: "anxiety", label: "Anxiety", sub: "spirals, pressure, overthinking" },
  { v: "body", label: "Body", sub: "energy, confidence, presence" },
  { v: "purpose", label: "Purpose", sub: "direction, trust, conviction" },
];

const LOOP_OPTIONS = [
  { v: "overthinking", label: "I overthink until I freeze.", icon: Waves },
  { v: "self-sabotage", label: "I get close, then sabotage it.", icon: Flame },
  { v: "numbing", label: "I numb out instead of moving.", icon: Moon },
  { v: "proving", label: "I keep trying to prove I am enough.", icon: Zap },
  { v: "avoidance", label: "I avoid the exact thing that would free me.", icon: Layers3 },
];

const FRICTION_OPTIONS = [
  { v: "discipline", label: "Discipline never lasts" },
  { v: "confidence", label: "I do not fully trust myself" },
  { v: "consistency", label: "I start strong, then disappear" },
  { v: "safety", label: "The next level does not feel safe yet" },
  { v: "clarity", label: "I know too much and still do not move" },
  { v: "receiving", label: "I struggle to receive more" },
];

const BUILD_LINES = [
  "Reading your answers",
  "Finding the loop underneath the loop",
  "Mapping your first intervention",
  "Sequencing your 7-day protocol",
  "Preparing your custom audio brief",
  "Protocol ready",
];

function loadAnswers(): ProtocolAnswers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function buildProtocol(a: ProtocolAnswers): ProtocolResult {
  const gap = a.gap?.[0] || "identity";
  const loops = Array.isArray(a.loop) ? a.loop : a.loop ? [a.loop] : ["overthinking"];
  const loop = loops[0] || "overthinking";
  const primary = GAP_OPTIONS.find((x) => x.v === gap)?.label || "Identity";
  const loopLabel = loops
    .map((item) => LOOP_OPTIONS.find((x) => x.v === item)?.label.replace(".", ""))
    .filter(Boolean)
    .join(" + ") || "The old loop keeps running";

  const mechanisms: Record<string, string> = {
    money: "Your nervous system is still treating expansion like pressure, not safety.",
    identity: "The old self-image is still more rehearsed than the version you are becoming.",
    work: "Your system is leaking energy through friction before the work even starts.",
    relationships: "Connection is being filtered through old protection strategies.",
    sleep: "Your mind is still trying to solve life when your body is asking to power down.",
    anxiety: "Your system is scanning for threat before it scans for possibility.",
    body: "Your body is asking for consistency before it gives you confidence back.",
    purpose: "Your direction is there, but the signal is buried under old noise.",
  };

  const trackThemes: Record<string, string> = {
    overthinking: "Quiet Command",
    "self-sabotage": "Clean Follow Through",
    numbing: "Return To Motion",
    proving: "Already Enough",
    avoidance: "Open Door",
  };

  return {
    headline: `${primary} is the entry point.`,
    primaryPattern: loopLabel,
    mechanism: mechanisms[gap] || mechanisms.identity,
    trackTheme: trackThemes[loop] || "Inner Compass",
    tools: ["Custom rewiring audio", "Daily state check-in", "One rapid regulation tool", "Identity reflection"],
    sevenDayPlan: [
      "Generate your first custom rewiring audio",
      "Listen once and complete a 30-second state check",
      "Run a rapid reset when the old loop appears",
      "Write the new identity in one clear paragraph",
      "Listen again and mark what feels different",
      "Use breathwork or tapping to clear resistance",
      "Recalibrate the protocol from what changed",
    ],
  };
}

const slide = {
  initial: { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, filter: "blur(8px)", transition: { duration: 0.18 } },
};

export default function ProtocolQuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<ProtocolAnswers>(() => loadAnswers());
  const [buildIdx, setBuildIdx] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch {}
  }, [answers]);

  useEffect(() => {
    if (step !== "building") return;
    setBuildIdx(0);
    const interval = window.setInterval(() => setBuildIdx((i) => Math.min(i + 1, BUILD_LINES.length - 1)), 850);
    const timeout = window.setTimeout(() => {
      setAnswers((prev) => ({ ...prev, protocol: buildProtocol(prev) }));
      setStep("results");
    }, 5200);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [step]);

  const stepIndex = ["intro", "gap", "loop", "friction", "outcome", "identity", "name", "email", "building", "results"].indexOf(step);
  const progress = step === "intro" ? 0 : step === "results" ? 100 : Math.min(92, Math.round((stepIndex / 8) * 100));
  const protocol = useMemo(() => answers.protocol || buildProtocol(answers), [answers]);

  const toggleGap = (v: string) => setAnswers((prev) => {
    const cur = prev.gap || [];
    return { ...prev, gap: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].slice(0, 3) };
  });

  const toggleFriction = (v: string) => setAnswers((prev) => {
    const cur = prev.friction || [];
    return { ...prev, friction: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].slice(0, 3) };
  });

  const toggleLoop = (v: string) => setAnswers((prev) => {
    const cur = Array.isArray(prev.loop) ? prev.loop : prev.loop ? [prev.loop] : [];
    return { ...prev, loop: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v].slice(0, 3) };
  });

  const goSignup = () => {
    const params = new URLSearchParams();
    params.set("from", "protocol-quiz");
    if (answers.email) params.set("email", answers.email.trim());
    navigate(`/signup?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-radial-subtle relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-accent/10"
          animate={{ scale: [0.92, 1.04, 0.92], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[12%] top-[20%] h-40 w-40 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, 24, 0], opacity: [0.16, 0.28, 0.16] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[8%] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ y: [0, -28, 0], opacity: [0.16, 0.34, 0.16] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="relative z-10 flex items-center gap-4 px-5 py-5">
        <VelumMark variant="lotus" size="sm" />
        <div className="ml-auto h-[3px] w-32 overflow-hidden rounded-full bg-foreground/10">
          <motion.div className="h-full gold-gradient" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-2xl items-center justify-center px-5 pb-10">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.section key="intro" {...slide} className="w-full text-center">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-card/80 shadow-[0_0_60px_rgba(201,168,76,0.18)]">
                <Compass className="h-8 w-8 text-accent" />
              </div>
              <p className="text-eyebrow mb-5">Build your protocol</p>
              <h1 className="text-display mx-auto mb-5 max-w-xl text-[3rem] leading-[0.98] md:text-[4.5rem]">
                Find the loop<br /><span className="italic text-accent">beneath the loop.</span>
              </h1>
              <p className="mx-auto mb-9 max-w-md text-sm leading-relaxed text-muted-foreground">
                Answer a few questions and Velum will map your first rewiring protocol around the pattern you actually want to change.
              </p>
              <button onClick={() => setStep("gap")} className="gold-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_0_36px_rgba(201,168,76,0.25)] active:scale-[0.98]">
                Start assessment <ArrowRight className="h-4 w-4" />
              </button>
            </motion.section>
          )}

          {step === "gap" && (
            <QuestionShell key="gap" eyebrow="Question 1 of 7" title="Where do you feel the gap most?" subtitle="Pick up to three. This gives the protocol its direction." onBack={() => setStep("intro")} onNext={() => setStep("loop")} nextDisabled={!answers.gap?.length}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GAP_OPTIONS.map((opt) => {
                  const selected = answers.gap?.includes(opt.v);
                  return (
                    <button key={opt.v} onClick={() => toggleGap(opt.v)} className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${selected ? "border-accent/70 bg-accent/10 shadow-[0_0_24px_rgba(201,168,76,0.12)]" : "border-accent/15 bg-black/20 hover:border-accent/35"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-accent bg-accent" : "border-accent/30"}`}>{selected && <Check className="h-3 w-3 text-primary-foreground" />}</span>
                        <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      </div>
                      <p className="pl-6 text-xs leading-snug text-muted-foreground">{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
            </QuestionShell>
          )}

          {step === "loop" && (
            <QuestionShell key="loop" eyebrow="Question 2 of 7" title="Which loops feel most familiar?" subtitle="Pick up to three. The protocol will prioritize the first pattern you select." onBack={() => setStep("gap")} onNext={() => setStep("friction")} nextDisabled={!(Array.isArray(answers.loop) ? answers.loop.length : answers.loop)}>
              <div className="flex flex-col gap-3">
                {LOOP_OPTIONS.map(({ v, label, icon: Icon }) => {
                  const selectedLoops = Array.isArray(answers.loop) ? answers.loop : answers.loop ? [answers.loop] : [];
                  const selected = selectedLoops.includes(v);
                  return (
                  <button key={v} onClick={() => toggleLoop(v)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${selected ? "border-accent/70 bg-accent/10" : "border-accent/15 bg-black/20 hover:border-accent/35"}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "gold-gradient" : "bg-surface-light"}`}>
                      <Icon className={`h-5 w-5 ${selected ? "text-primary-foreground" : "text-accent"}`} />
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    {selected && <CircleDot className="ml-auto h-4 w-4 text-accent" />}
                  </button>
                  );
                })}
              </div>
            </QuestionShell>
          )}

          {step === "friction" && (
            <QuestionShell key="friction" eyebrow="Question 3 of 7" title="What keeps it alive?" subtitle="Pick up to three. This tells us where the resistance is." onBack={() => setStep("loop")} onNext={() => setStep("outcome")} nextDisabled={!answers.friction?.length}>
              <div className="flex flex-wrap gap-2.5">
                {FRICTION_OPTIONS.map((opt) => {
                  const selected = answers.friction?.includes(opt.v);
                  return (
                    <button key={opt.v} onClick={() => toggleFriction(opt.v)} className={`rounded-full border px-4 py-3 text-sm transition-all active:scale-[0.98] ${selected ? "gold-gradient border-transparent text-primary-foreground" : "border-accent/20 bg-black/20 text-foreground hover:border-accent/40"}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </QuestionShell>
          )}

          {step === "outcome" && (
            <QuestionShell key="outcome" eyebrow="Question 4 of 7" title="If this shifted in 7 days, what would change?" subtitle="Make it concrete. Your answer becomes the seed of the first audio." onBack={() => setStep("friction")} onNext={() => setStep("identity")} nextDisabled={!answers.outcome || answers.outcome.trim().length < 8}>
              <textarea value={answers.outcome || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, outcome: e.target.value }))} rows={5} autoFocus placeholder="I would wake up and move through the day without..." className="w-full resize-none rounded-2xl border border-accent/15 bg-black/25 px-4 py-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/45 focus:border-accent/45 focus:outline-none" />
            </QuestionShell>
          )}

          {step === "identity" && (
            <QuestionShell key="identity" eyebrow="Question 5 of 7" title="Who are you when the old loop stops running?" subtitle="Not perfect. Just the next version that feels honest." onBack={() => setStep("outcome")} onNext={() => setStep("name")} nextDisabled={!answers.identity || answers.identity.trim().length < 8}>
              <textarea value={answers.identity || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, identity: e.target.value }))} rows={5} autoFocus placeholder="Someone who trusts themselves enough to..." className="w-full resize-none rounded-2xl border border-accent/15 bg-black/25 px-4 py-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/45 focus:border-accent/45 focus:outline-none" />
            </QuestionShell>
          )}

          {step === "name" && (
            <QuestionShell key="name" eyebrow="Question 6 of 7" title="What should your protocol call you?" subtitle="This will personalize the result and first track brief." onBack={() => setStep("identity")} onNext={() => setStep("email")} nextDisabled={!answers.firstName?.trim()}>
              <input value={answers.firstName || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, firstName: e.target.value }))} autoFocus placeholder="First name" className="w-full rounded-2xl border border-accent/15 bg-black/25 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-accent/45 focus:outline-none" />
            </QuestionShell>
          )}

          {step === "email" && (
            <QuestionShell key="email" eyebrow="Final step" title="Where should we save the protocol?" subtitle="You'll see the result first. Then you can generate the first custom audio inside Velum." onBack={() => setStep("name")} onNext={() => setStep("building")} nextDisabled={!answers.email?.includes("@")} nextLabel="Build my protocol">
              <input type="email" value={answers.email || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, email: e.target.value }))} autoFocus placeholder="you@email.com" className="w-full rounded-2xl border border-accent/15 bg-black/25 px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground/45 focus:border-accent/45 focus:outline-none" />
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5 text-accent" /> No spam. This just lets us carry your protocol into signup.</p>
            </QuestionShell>
          )}

          {step === "building" && (
            <motion.section key="building" {...slide} className="w-full text-center">
              <div className="velum-card-accent mx-auto max-w-md p-8">
                <div className="relative mx-auto mb-8 h-36 w-36">
                  <motion.div className="absolute inset-0 rounded-full border border-accent/20" animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.65, 0.3] }} transition={{ duration: 2.2, repeat: Infinity }} />
                  <motion.div className="absolute inset-4 rounded-full border-2 border-transparent border-t-accent border-r-accent" animate={{ rotate: 360 }} transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }} />
                  <motion.div className="absolute inset-10 rounded-full bg-accent/15 blur-md" animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.8, repeat: Infinity }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Fingerprint className="h-11 w-11 text-accent" />
                  </div>
                </div>
                <p className="text-eyebrow mb-3">Building protocol</p>
                <AnimatePresence mode="wait">
                  <motion.p key={buildIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="h-6 text-sm text-muted-foreground">
                    {BUILD_LINES[buildIdx]}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-8 grid grid-cols-3 gap-2">
                  {["Pattern", "Audio", "Plan"].map((label, i) => (
                    <motion.div key={label} className="rounded-xl border border-accent/15 bg-black/20 p-3" animate={{ opacity: buildIdx > i + 1 ? 1 : 0.35, y: buildIdx > i + 1 ? 0 : 6 }}>
                      <Sparkles className="mx-auto mb-2 h-4 w-4 text-accent" />
                      <p className="text-[10px] uppercase tracking-[2px] text-muted-foreground">{label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {step === "results" && (
            <motion.section key="results" {...slide} className="w-full">
              <div className="velum-card-accent p-6 md:p-8">
                <p className="text-eyebrow mb-4">Your protocol</p>
                <h1 className="text-display mb-4 text-[2.7rem] leading-[1]">
                  {answers.firstName ? `${answers.firstName}, ` : ""}{protocol.headline}
                </h1>
                <p className="mb-7 text-sm leading-relaxed text-muted-foreground">{protocol.mechanism}</p>

                <div className="mb-6 grid gap-3 md:grid-cols-2">
                  <ResultTile label="Primary loop" value={protocol.primaryPattern} icon={Layers3} />
                  <ResultTile label="First audio theme" value={protocol.trackTheme} icon={Waves} />
                </div>

                <div className="mb-7 rounded-2xl border border-accent/15 bg-black/20 p-5">
                  <p className="mb-4 text-xs uppercase tracking-[2.5px] text-accent">7-day sequence</p>
                  <div className="space-y-3">
                    {protocol.sevenDayPlan.map((item, i) => (
                      <div key={item} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">{i + 1}</span>
                        <p className="pt-0.5 text-sm text-foreground/85">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={goSignup} className="gold-gradient flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-bold tracking-wide text-primary-foreground shadow-[0_0_36px_rgba(201,168,76,0.25)] active:scale-[0.98]">
                  Generate my first audio <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-4 text-center text-[11px] text-muted-foreground">Your answers carry into signup. Existing Stripe and app entry stay unchanged.</p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function QuestionShell({
  eyebrow,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <motion.section {...slide} className="w-full">
      <div className="velum-card-accent p-6 md:p-8">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-eyebrow mb-4">{eyebrow}</p>
        <h1 className="text-display mb-3 text-[2.4rem] leading-[1.02] md:text-[3rem]">{title}</h1>
        {subtitle && <p className="mb-7 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
        <div className="mb-7">{children}</div>
        <button onClick={onNext} disabled={nextDisabled} className="gold-gradient ml-auto flex items-center gap-2 rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[2px] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-35">
          {nextDisabled ? <Loader2 className="h-3.5 w-3.5 opacity-0" /> : null}
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.section>
  );
}

function ResultTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sparkles }) {
  return (
    <div className="rounded-2xl border border-accent/15 bg-black/20 p-4">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="mb-1 text-[10px] uppercase tracking-[2.5px] text-muted-foreground">{label}</p>
      <p className="text-base font-serif text-foreground">{value}</p>
    </div>
  );
}
