import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Velum diagnostic quiz — 7 questions, email gate, personalized results page,
// then funnels to /signup → /premium for card-required checkout.
//
// Quiz answers persist to localStorage so a refresh doesn't lose progress,
// and they're written into Loops + (post-signup) to the user's profile so
// the existing generate-custom-track function can pick them up.
//
// No card-free trial option from this flow — explicit product decision.
//
// Styling matches AuthPage / login screen brand tokens:
//   - bg gradient orbs (absolute positioned)
//   - velum-card-accent containers
//   - gold-gradient primary CTAs
//   - text-display / text-eyebrow / text-accent type system
//   - bg-black/30 + accent/15 border inputs

type Step =
  | "intro"
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7"
  | "email"
  | "results";

interface QuizAnswers {
  pattern?: string[];
  duration?: string;
  tried?: string[];
  somatic?: string;
  desiredOutcome?: string;
  futureSelf?: string;
  firstName?: string;
  email?: string;
}

const STORAGE_KEY = "velum_quiz_answers_v1";

// Q1 reframed around the GAP, not the pattern. Most cold traffic doesn't
// self-identify with "anxiety patterns" — they just know there's a gap
// between who they are and who they could be. Lead with what they FEEL.
const PATTERN_OPTIONS = [
  { v: "money", label: "Money — freedom, abundance, ease around it" },
  { v: "body", label: "Body — energy, vitality, presence in it" },
  { v: "mind", label: "Mind — focus, calm, less mental noise" },
  { v: "identity", label: "Identity — who I am vs. who I know I am" },
  { v: "work", label: "Work — purpose, output, momentum" },
  { v: "relationships", label: "Relationships — depth, ease, attraction" },
  { v: "sleep", label: "Sleep — restorative rest, quiet mind at night" },
  { v: "anxiety", label: "Anxiety — spiraling thoughts, can't switch off" },
];
const DURATION_OPTIONS = [
  { v: "<1y", label: "Less than a year" },
  { v: "1-5y", label: "One to five years" },
  { v: "5+y", label: "More than five years" },
  { v: "always", label: "As long as I can remember" },
];
const TRIED_OPTIONS = [
  { v: "meditation-apps", label: "Meditation apps (Headspace, Calm, Insight Timer)" },
  { v: "journaling", label: "Journaling" },
  { v: "therapy", label: "Therapy" },
  { v: "affirmations", label: "Affirmations / vision boards / manifesting" },
  { v: "breathwork", label: "Breathwork" },
  { v: "hypnosis", label: "Hypnosis (other apps or in-person)" },
  { v: "modalities", label: "Other modalities (Dispenza, EFT, BSC, plant medicine)" },
  { v: "nothing", label: "Honestly, nothing structured yet" },
];
const SOMATIC_OPTIONS = [
  { v: "chest", label: "Chest tightness" },
  { v: "throat-jaw", label: "Throat or jaw" },
  { v: "gut", label: "Stomach / gut" },
  { v: "shoulders-neck", label: "Shoulders or neck" },
  { v: "whole-body", label: "Whole body — diffuse" },
  { v: "head-only", label: "Head only — nothing physical" },
];

function loadAnswers(): QuizAnswers {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return {};
}
function saveAnswers(a: QuizAnswers) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); } catch {}
}

function buildDiagnosis(a: QuizAnswers): { headline: string; body: string[] } {
  const name = a.firstName?.trim() || "";
  const patternList = (a.pattern || []).map(v =>
    PATTERN_OPTIONS.find(p => p.v === v)?.label.toLowerCase().split(" — ")[0] || v
  );
  const primary = patternList[0] || "the area you named";
  const triedList = a.tried || [];
  const triedMeditation = triedList.includes("meditation-apps");
  const triedAffirmations = triedList.includes("affirmations");
  const triedNothing = triedList.includes("nothing");

  const headline = name
    ? `${name}, here's why the gap is still there.`
    : "Here's why the gap is still there.";

  const para1 =
    `The gap shows up in ${primary}. It's been with you ${
      a.duration === "<1y" ? "less than a year" :
      a.duration === "1-5y" ? "for years" :
      a.duration === "5+y" ? "for over half a decade" :
      "for as long as you can remember"
    }. ${
      a.somatic === "chest" ? "You feel it in the chest." :
      a.somatic === "throat-jaw" ? "You feel it in the throat and jaw." :
      a.somatic === "gut" ? "You feel it in the gut." :
      a.somatic === "shoulders-neck" ? "You carry it in the shoulders." :
      a.somatic === "whole-body" ? "It moves through the whole body." :
      "It lives in the mind, not the body."
    } That detail matters. The body knows before the mind does — and the gap is being held in place by something below conscious thought. That's why it hasn't moved yet.`;

  const para2 = triedNothing
    ? `You haven't done structured work on this yet. That's actually ideal. There are no installed patterns from previous attempts to undo. The version of you that's already there is closer than you think — you just haven't been shown the door.`
    : triedMeditation || triedAffirmations
    ? `You've tried ${triedMeditation && triedAffirmations ? "meditation apps and affirmations" : triedMeditation ? "meditation apps" : "affirmations and visualization"}. That work isn't useless — it just operates at the conscious 5% of your mind. The gap is being held in place by the other 95%, the subconscious. That's the layer Velum is built for. That's why surface practices haven't closed it.`
    : `You've already done real work — therapy, breathwork, modalities. Velum isn't a replacement for that work. It's a different angle of attack: Ericksonian hypnosis at the subconscious layer, custom-built for the gap you just described.`;

  const para3 = a.desiredOutcome
    ? `When the gap closes, you said: "${a.desiredOutcome.trim()}." That's the script. That's exactly what your custom track will be built around — not a generic guided meditation. Words and images chosen specifically for that outcome, repeated in trance until the subconscious accepts it as true.`
    : `Your first custom track will be built around the specific outcome you wrote. Not generic. Not "be more present." Built for what you actually said.`;

  const para4 = a.futureSelf
    ? `You wrote that the version of you on the other side is: "${a.futureSelf.trim()}." That version isn't in the future. They're available now — the brain just hasn't rehearsed them long enough to default to them. That's the mechanism. Repetition, daily, in trance, until the subconscious stops asking permission.`
    : `The version of you on the other side isn't in the future. They're available now. The brain just hasn't rehearsed them long enough to default to them. That's the work.`;

  return { headline, body: [para1, para2, para3, para4] };
}

// Brand background — copies the floating-orb gradient pattern from AuthPage.
function BrandBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)" }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 60%)" }}
      />
    </div>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>(() => loadAnswers());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { saveAnswers(answers); }, [answers]);

  useEffect(() => {
    const fire = async (event: "ViewContent" | "Lead") => {
      try { const { rdtTrack } = await import("@/lib/reddit-pixel"); rdtTrack(event); } catch {}
      try { const { fbqTrack } = await import("@/lib/meta-pixel"); fbqTrack(event); } catch {}
    };
    if (step === "intro") fire("ViewContent");
    if (step === "results") fire("Lead");
  }, [step]);

  const update = (patch: Partial<QuizAnswers>) =>
    setAnswers(prev => ({ ...prev, ...patch }));

  const togglePattern = (v: string) => setAnswers(prev => {
    const cur = prev.pattern || [];
    return { ...prev, pattern: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] };
  });
  const toggleTried = (v: string) => setAnswers(prev => {
    const cur = prev.tried || [];
    return { ...prev, tried: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] };
  });

  const submitEmail = async () => {
    if (!answers.email?.includes("@")) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      try {
        await supabase.functions.invoke("loops-leadmagnet", {
          body: {
            email: answers.email.trim().toLowerCase(),
            firstName: answers.firstName || "",
            magnet: "quiz",
            utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
            utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
            utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
          },
        });
      } catch {}
      setStep("results");
    } finally {
      setSubmitting(false);
    }
  };

  const startSignup = () => {
    const email = encodeURIComponent(answers.email || "");
    navigate(`/signup?email=${email}&from=quiz`);
  };

  const stepNum = ["intro","q1","q2","q3","q4","q5","q6","q7","email","results"].indexOf(step);
  const progress = step === "intro" ? 0 : step === "results" ? 100
    : Math.round((stepNum / 9) * 100);

  // ─── Reusable bits ─────────────────────────────────────────────────────────
  const inputCls =
    "w-full bg-black/30 border border-accent/15 rounded-xl px-4 py-4 text-foreground text-sm font-sans focus:outline-none focus:border-accent/45 transition-colors placeholder:text-muted-foreground/50";

  const ChoiceList = ({ options, selected, onToggle, multi = false }: {
    options: { v: string; label: string }[];
    selected: string[] | string | undefined;
    onToggle: (v: string) => void;
    multi?: boolean;
  }) => {
    const isSelected = (v: string) =>
      multi ? Array.isArray(selected) && selected.includes(v) : selected === v;
    return (
      <div className="flex flex-col gap-2.5">
        {options.map(opt => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onToggle(opt.v)}
            className={`text-left px-4 py-4 rounded-xl border font-sans text-sm transition-all flex items-center gap-3 ${
              isSelected(opt.v)
                ? "bg-accent/10 border-accent/45 text-foreground"
                : "bg-black/30 border-accent/15 text-foreground/85 hover:border-accent/30"
            }`}
          >
            <span className={`flex-shrink-0 w-4 h-4 ${multi ? "rounded-sm" : "rounded-full"} border transition-colors ${
              isSelected(opt.v) ? "bg-accent border-accent" : "border-accent/30"
            }`} />
            <span className="leading-snug">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const QuestionCard = ({
    eyebrow, title, subtitle, children, onBack, onNext, nextDisabled, nextLabel = "Continue →",
  }: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
  }) => (
    <div className="velum-card-accent p-7 md:p-9">
      <p className="text-eyebrow mb-4">{eyebrow}</p>
      <h1 className="text-display text-3xl md:text-[2rem] leading-[1.1] mb-3">{title}</h1>
      {subtitle && (
        <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-7">{subtitle}</p>
      )}
      <div className="mb-7">{children}</div>
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-[11px] text-muted-foreground/70 hover:text-foreground font-sans tracking-[2px] uppercase transition-colors">
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="ml-auto gold-gradient text-primary-foreground rounded-full px-7 py-3 font-sans font-semibold tracking-[2px] uppercase text-[11px] hover:opacity-95 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );

  // ─── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <BrandBg />

      {/* Top bar with progress */}
      <header className="relative px-6 py-5 flex items-center gap-3">
        <span className="font-serif tracking-[0.4em] text-[11px] text-foreground/85">V&nbsp;E&nbsp;L&nbsp;U&nbsp;M</span>
        {step !== "intro" && step !== "results" && (
          <div className="ml-auto w-32 h-[2px] bg-foreground/10 rounded-full overflow-hidden">
            <div className="h-full gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="relative flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-xl">

          {step === "intro" && (
            <div className="velum-card-accent p-8 md:p-10 text-center">
              <p className="text-eyebrow mb-5">For the version of you that's already there</p>
              <h1 className="text-display text-4xl md:text-[2.6rem] leading-[1.05] mb-5">
                There's a gap between who you are<br /><span className="italic text-accent">and who you know you could be.</span>
              </h1>
              <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-9 max-w-[420px] mx-auto">
                Most people accept it. Some try meditation. Some try therapy. Some try grinding harder. The gap stays. We diagnose where it's actually stuck — at the layer most practices can't reach — and rewire it. About 60 seconds.
              </p>
              <button
                onClick={() => setStep("q1")}
                className="gold-gradient text-primary-foreground rounded-full px-10 py-4 font-sans font-semibold tracking-[2px] uppercase text-xs hover:opacity-95 active:scale-[0.99] transition-all"
              >
                Show me where I'm stuck →
              </button>
              <p className="text-[11px] text-muted-foreground/60 mt-6 font-sans">
                No fluff. No "transform your life." Real diagnostic, real track.
              </p>
            </div>
          )}

          {step === "q1" && (
            <QuestionCard
              eyebrow="Question 1 of 7"
              title="Where do you feel the gap most?"
              subtitle="Where does the current you fall short of who you know you could be? Pick one or more."
              onBack={() => setStep("intro")}
              onNext={() => setStep("q2")}
              nextDisabled={!(answers.pattern && answers.pattern.length > 0)}
            >
              <ChoiceList options={PATTERN_OPTIONS} selected={answers.pattern} onToggle={togglePattern} multi />
            </QuestionCard>
          )}

          {step === "q2" && (
            <QuestionCard
              eyebrow="Question 2 of 7"
              title="How long has it been running?"
              subtitle="Most patterns started before the conscious mind could veto them. Rough is fine."
              onBack={() => setStep("q1")}
              onNext={() => setStep("q3")}
              nextDisabled={!answers.duration}
            >
              <ChoiceList options={DURATION_OPTIONS} selected={answers.duration} onToggle={(v) => update({ duration: v })} />
            </QuestionCard>
          )}

          {step === "q3" && (
            <QuestionCard
              eyebrow="Question 3 of 7"
              title="What have you tried so far?"
              subtitle="No judgment. Just data."
              onBack={() => setStep("q2")}
              onNext={() => setStep("q4")}
              nextDisabled={!(answers.tried && answers.tried.length > 0)}
            >
              <ChoiceList options={TRIED_OPTIONS} selected={answers.tried} onToggle={toggleTried} multi />
            </QuestionCard>
          )}

          {step === "q4" && (
            <QuestionCard
              eyebrow="Question 4 of 7"
              title="When this pattern shows up — where do you feel it in the body?"
              subtitle="The body knows before the mind does."
              onBack={() => setStep("q3")}
              onNext={() => setStep("q5")}
              nextDisabled={!answers.somatic}
            >
              <ChoiceList options={SOMATIC_OPTIONS} selected={answers.somatic} onToggle={(v) => update({ somatic: v })} />
            </QuestionCard>
          )}

          {step === "q5" && (
            <QuestionCard
              eyebrow="Question 5 of 7"
              title="If this pattern dissolved tomorrow — what changes about your day?"
              subtitle="Specifics. Not 'I'd be happier.' Write what actually shifts."
              onBack={() => setStep("q4")}
              onNext={() => setStep("q6")}
              nextDisabled={!(answers.desiredOutcome && answers.desiredOutcome.trim().length > 5)}
            >
              <textarea
                value={answers.desiredOutcome || ""}
                onChange={(e) => update({ desiredOutcome: e.target.value })}
                placeholder="When I wake up, I don't immediately reach for my phone to check…"
                autoFocus
                rows={5}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </QuestionCard>
          )}

          {step === "q6" && (
            <QuestionCard
              eyebrow="Question 6 of 7"
              title="Who are you on the other side of this?"
              subtitle="The version of you that isn't running this anymore. Describe them."
              onBack={() => setStep("q5")}
              onNext={() => setStep("q7")}
              nextDisabled={!(answers.futureSelf && answers.futureSelf.trim().length > 5)}
            >
              <textarea
                value={answers.futureSelf || ""}
                onChange={(e) => update({ futureSelf: e.target.value })}
                placeholder="Someone who moves through the day from a place of…"
                autoFocus
                rows={5}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </QuestionCard>
          )}

          {step === "q7" && (
            <QuestionCard
              eyebrow="Question 7 of 7"
              title="What's your first name?"
              subtitle="So your custom track addresses you, not 'you' generically."
              onBack={() => setStep("q6")}
              onNext={() => setStep("email")}
              nextDisabled={!(answers.firstName && answers.firstName.trim().length > 0)}
              nextLabel="See my diagnostic →"
            >
              <input
                type="text"
                value={answers.firstName || ""}
                onChange={(e) => update({ firstName: e.target.value })}
                placeholder="First name"
                autoFocus
                autoComplete="given-name"
                className={inputCls}
              />
            </QuestionCard>
          )}

          {step === "email" && (
            <QuestionCard
              eyebrow="Almost there"
              title="Where should we send your diagnostic?"
              subtitle="We'll email you a copy plus the link to your first custom track."
              onBack={() => setStep("q7")}
              onNext={submitEmail}
              nextDisabled={submitting || !answers.email}
              nextLabel={submitting ? "Sending…" : "Show my diagnostic →"}
            >
              <input
                type="email"
                value={answers.email || ""}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="you@email.com"
                autoFocus
                autoComplete="email"
                className={inputCls}
              />
              {error && <p className="text-destructive text-xs font-sans mt-3">{error}</p>}
              <p className="text-[11px] text-muted-foreground/70 mt-4 font-sans leading-relaxed">
                No spam. Just occasional notes from Jordan, the founder. Unsubscribe anytime.
              </p>
            </QuestionCard>
          )}

          {step === "results" && (() => {
            const { headline, body } = buildDiagnosis(answers);
            return (
              <div className="velum-card-accent p-8 md:p-10">
                <p className="text-eyebrow mb-5">Your diagnostic</p>
                <h1 className="text-display text-4xl md:text-[2.4rem] leading-[1.05] mb-7">{headline}</h1>
                <div className="space-y-5 mb-10">
                  {body.map((p, i) => (
                    <p key={i} className="text-foreground/85 text-[15px] leading-relaxed font-sans">{p}</p>
                  ))}
                </div>

                <div className="border-t border-accent/15 pt-8">
                  <p className="text-eyebrow mb-3">How we close the gap</p>
                  <h2 className="text-display text-2xl md:text-[1.8rem] leading-[1.1] mb-4">
                    Built specifically for<br /><span className="italic text-accent">what you just described.</span>
                  </h2>
                  <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-7">
                    Your first custom rewiring track — written for the exact gap, words, and identity you described above — rendered to audio in about 90 seconds inside the app. Yours forever, plus the full Velum library and every Collection we've built.
                  </p>

                  <button
                    onClick={startSignup}
                    className="w-full md:w-auto gold-gradient text-primary-foreground rounded-full px-10 py-4 font-sans font-semibold tracking-[2px] uppercase text-xs hover:opacity-95 active:scale-[0.99] transition-all"
                  >
                    Close the gap →
                  </button>
                  <p className="text-[11px] text-muted-foreground/70 mt-5 font-sans leading-relaxed">
                    7-day annual trial · cancel anytime · 30-day full refund
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </main>

      <footer className="relative px-6 py-6 text-center">
        <p className="text-[11px] text-muted-foreground/60 font-sans tracking-wide">
          Velum · Subconscious rewiring · govelum.com
        </p>
      </footer>

      {submitting && step === "email" && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}
    </div>
  );
}
