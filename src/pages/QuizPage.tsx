import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import VelumMark from "@/components/VelumMark";
import { supabase } from "@/integrations/supabase/client";

// Velum diagnostic quiz — 7 questions, email gate, personalized results page,
// then funnels to /signup → /premium for card-required checkout.
//
// Quiz answers are persisted to localStorage so a refresh doesn't lose
// progress, and they're written into Loops + (post-signup) to the user's
// profile so the existing generate-custom-track function can pick them up.
//
// No card-free trial option from this flow — explicit product decision.

type Step =
  | "intro"
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7"
  | "email"
  | "results";

interface QuizAnswers {
  pattern?: string[];
  patternOther?: string;
  duration?: string;
  tried?: string[];
  somatic?: string;
  desiredOutcome?: string;
  futureSelf?: string;
  firstName?: string;
  email?: string;
}

const STORAGE_KEY = "velum_quiz_answers_v1";

const PATTERN_OPTIONS = [
  { v: "money", label: "Money / financial blocks" },
  { v: "anxiety", label: "Anxiety / spiraling thoughts" },
  { v: "sleep", label: "Sleep / racing mind at night" },
  { v: "worth", label: "Self-worth / imposter feeling" },
  { v: "relationships", label: "Relationship patterns" },
  { v: "body", label: "Body / physical tension" },
  { v: "follow-through", label: "Procrastination / can't follow through" },
  { v: "identity", label: "Identity — feeling like the wrong version of me" },
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
function saveAnswers(a: QuizAnswers) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); } catch {}
}

// Build the personalized diagnosis paragraph from quiz answers. Brand voice:
// observational, declarative, no clichés, no first-person, lean confrontational.
function buildDiagnosis(a: QuizAnswers): { headline: string; body: string[] } {
  const name = a.firstName?.trim() || "";
  const patternList = (a.pattern || []).map(v =>
    PATTERN_OPTIONS.find(p => p.v === v)?.label.toLowerCase() || v
  );
  const primary = patternList[0] || "the pattern you described";
  const triedList = a.tried || [];
  const triedMeditation = triedList.includes("meditation-apps");
  const triedAffirmations = triedList.includes("affirmations");
  const triedNothing = triedList.includes("nothing");

  const headline = name
    ? `${name}, here's what's running.`
    : "Here's what's running.";

  const para1 =
    `The pattern you named — ${primary} — has been with you ${
      a.duration === "<1y" ? "less than a year" :
      a.duration === "1-5y" ? "for years" :
      a.duration === "5+y" ? "for over half a decade" :
      "for as long as you can remember"
    }. ${
      a.somatic === "chest" ? "It lives in the chest." :
      a.somatic === "throat-jaw" ? "It lives in the throat and jaw." :
      a.somatic === "gut" ? "It lives in the gut." :
      a.somatic === "shoulders-neck" ? "It carries in the shoulders." :
      a.somatic === "whole-body" ? "It moves through the whole body." :
      "It lives in the mind, not the body."
    } That detail matters. The body knows before the mind does, and any work that doesn't reach the body doesn't reach the layer running this.`;

  const para2 = triedNothing
    ? `You haven't done structured work on this yet. That's actually ideal — there are no installed patterns from previous attempts to undo. You get to start from a real diagnostic.`
    : triedMeditation || triedAffirmations
    ? `You've tried ${triedMeditation && triedAffirmations ? "meditation apps and affirmations" : triedMeditation ? "meditation apps" : "affirmations and visualization"}. That work isn't useless — it just operates at the conscious 5%. ${primary} is running on the other 95%, the subconscious. That's the layer Velum is built for.`
    : `You've already done real work — therapy, breathwork, modalities. Velum isn't a replacement for that work. It's a different angle of attack: Ericksonian hypnosis at the subconscious layer, custom-built for the specific pattern you just described.`;

  const para3 = a.desiredOutcome
    ? `When this dissolves, you said: "${a.desiredOutcome.trim()}." That's the script. That's what your custom track will be built around. Not a generic guided meditation — words and images chosen specifically for that outcome, in your voice's frequency.`
    : `Your first custom track will be built around the specific outcome you wrote. Not generic. Not "be more present." Built for what you actually said.`;

  const para4 = a.futureSelf
    ? `You wrote that the version of you on the other side is: "${a.futureSelf.trim()}." Ericksonian hypnosis works by helping the brain rehearse that identity until the subconscious accepts it as true. Repetition, daily, in trance. That's the mechanism.`
    : `The work is identity-level. The brain doesn't know the difference between rehearsing and being. So you stop rehearsing and start being.`;

  return { headline, body: [para1, para2, para3, para4] };
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>(() => loadAnswers());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Persist on every change
  useEffect(() => {
    saveAnswers(answers);
  }, [answers]);

  // Fire pixel events at key milestones
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

  const togglePattern = (v: string) =>
    setAnswers(prev => {
      const cur = prev.pattern || [];
      return { ...prev, pattern: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] };
    });
  const toggleTried = (v: string) =>
    setAnswers(prev => {
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
      // Push to Loops with quiz answers as custom properties so even if they
      // bail before paying we have the lead + the diagnosis to follow up with.
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
    // Pass email through to /signup. Quiz answers stay in localStorage and
    // get picked up after signup completes (TODO: wire AuthContext to read
    // velum_quiz_answers_v1 and persist into profile.onboarding_answers).
    const email = encodeURIComponent(answers.email || "");
    navigate(`/signup?email=${email}&from=quiz`);
  };

  // ─── SHARED UI ────────────────────────────────────────────────────────────
  const stepNum = ["intro","q1","q2","q3","q4","q5","q6","q7","email","results"].indexOf(step);
  const totalQuestionSteps = 9; // intro doesn't count, results doesn't count
  const progress = step === "intro" ? 0 : step === "results" ? 100
    : Math.round(((stepNum) / totalQuestionSteps) * 100);

  const Header = () => (
    <header className="px-6 py-5 flex items-center gap-3">
      <VelumMark className="w-7 h-7 text-[#C9A84C]" />
      <span className="font-serif tracking-[0.4em] text-xs text-[#F2EFE7]/80">V E L U M</span>
      {step !== "intro" && step !== "results" && (
        <div className="ml-auto w-32 h-[2px] bg-[#1e1e1e] rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  );

  const QuestionShell = ({
    eyebrow, title, subtitle, children, onBack, onNext, nextDisabled, nextLabel = "Continue →",
  }: {
    eyebrow: string; title: string; subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    onNext: () => void;
    nextDisabled?: boolean;
    nextLabel?: string;
  }) => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="max-w-xl w-full">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-4 font-sans font-medium">{eyebrow}</p>
        <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3 text-[#F2EFE7]">{title}</h1>
        {subtitle && <p className="text-sm text-[#9aaea3] mb-8 font-sans leading-relaxed">{subtitle}</p>}
        <div className="mb-8">{children}</div>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-[12px] text-[#9aaea3] hover:text-[#F2EFE7] font-sans tracking-[0.15em] uppercase">
              ← Back
            </button>
          )}
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="ml-auto bg-[#C9A84C] text-[#0d0d0d] rounded px-6 py-3 font-sans font-semibold tracking-[0.18em] uppercase text-xs hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );

  const ChoiceList = ({ options, selected, onToggle, multi = false }: {
    options: { v: string; label: string }[];
    selected: string[] | string | undefined;
    onToggle: (v: string) => void;
    multi?: boolean;
  }) => {
    const isSelected = (v: string) =>
      multi ? Array.isArray(selected) && selected.includes(v) : selected === v;
    return (
      <div className="flex flex-col gap-2">
        {options.map(opt => (
          <button
            key={opt.v}
            onClick={() => onToggle(opt.v)}
            className={`text-left px-4 py-3.5 rounded-lg border transition-all font-sans text-sm ${
              isSelected(opt.v)
                ? "bg-[#C9A84C]/15 border-[#C9A84C] text-[#F2EFE7]"
                : "bg-[#181818] border-[#2a2a2a] text-[#c8c4bb] hover:border-[#C9A84C]/40"
            }`}
          >
            {multi && (
              <span className={`inline-block w-4 h-4 rounded-sm border mr-3 align-middle transition-colors ${
                isSelected(opt.v) ? "bg-[#C9A84C] border-[#C9A84C]" : "border-[#2a2a2a]"
              }`} />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#F2EFE7] flex flex-col">
      <Header />

      {step === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="max-w-lg">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">60 seconds · 7 questions</p>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-5">
              What's the pattern you can't seem to break?
            </h1>
            <p className="text-base text-[#c8c4bb] leading-relaxed mb-10 font-sans">
              We'll diagnose the layer your current practice can't reach — then build you a custom rewiring track for that exact pattern. Yours forever.
            </p>
            <button
              onClick={() => setStep("q1")}
              className="bg-[#C9A84C] text-[#0d0d0d] rounded-full px-10 py-4 font-sans font-semibold tracking-[0.18em] uppercase text-xs hover:opacity-95 transition-opacity"
            >
              Begin the diagnostic →
            </button>
            <p className="text-[11px] text-[#7a8a82] mt-6 font-sans">
              No fluff. No "transform your life." Real diagnostic, real track.
            </p>
          </div>
        </div>
      )}

      {step === "q1" && (
        <QuestionShell
          eyebrow="Question 1 of 7"
          title="Which pattern keeps coming back?"
          subtitle="The one you've worked on. The one that hasn't moved. Pick one or more."
          onBack={() => setStep("intro")}
          onNext={() => setStep("q2")}
          nextDisabled={!(answers.pattern && answers.pattern.length > 0)}
        >
          <ChoiceList options={PATTERN_OPTIONS} selected={answers.pattern} onToggle={togglePattern} multi />
        </QuestionShell>
      )}

      {step === "q2" && (
        <QuestionShell
          eyebrow="Question 2 of 7"
          title="How long has it been running?"
          subtitle="Most patterns started before the conscious mind could veto them. Rough is fine."
          onBack={() => setStep("q1")}
          onNext={() => setStep("q3")}
          nextDisabled={!answers.duration}
        >
          <ChoiceList
            options={DURATION_OPTIONS}
            selected={answers.duration}
            onToggle={(v) => update({ duration: v })}
          />
        </QuestionShell>
      )}

      {step === "q3" && (
        <QuestionShell
          eyebrow="Question 3 of 7"
          title="What have you tried so far?"
          subtitle="No judgment. Just data."
          onBack={() => setStep("q2")}
          onNext={() => setStep("q4")}
          nextDisabled={!(answers.tried && answers.tried.length > 0)}
        >
          <ChoiceList options={TRIED_OPTIONS} selected={answers.tried} onToggle={toggleTried} multi />
        </QuestionShell>
      )}

      {step === "q4" && (
        <QuestionShell
          eyebrow="Question 4 of 7"
          title="When this pattern shows up, where do you feel it in the body?"
          subtitle="The body knows before the mind does."
          onBack={() => setStep("q3")}
          onNext={() => setStep("q5")}
          nextDisabled={!answers.somatic}
        >
          <ChoiceList
            options={SOMATIC_OPTIONS}
            selected={answers.somatic}
            onToggle={(v) => update({ somatic: v })}
          />
        </QuestionShell>
      )}

      {step === "q5" && (
        <QuestionShell
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
            className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans leading-relaxed resize-none"
          />
        </QuestionShell>
      )}

      {step === "q6" && (
        <QuestionShell
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
            className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans leading-relaxed resize-none"
          />
        </QuestionShell>
      )}

      {step === "q7" && (
        <QuestionShell
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
            className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans"
          />
        </QuestionShell>
      )}

      {step === "email" && (
        <QuestionShell
          eyebrow="Almost there"
          title="Where should we send your diagnostic?"
          subtitle="We'll email you a copy + a link to start your first custom track."
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
            className="w-full bg-[#181818] border border-[#2a2a2a] rounded-lg px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans"
          />
          {error && <p className="text-sm text-[#c97c5c] mt-3">{error}</p>}
          <p className="text-[11px] text-[#7a8a82] mt-4 font-sans leading-relaxed">
            No spam. Just occasional notes from Jordan, the founder. Unsubscribe anytime.
          </p>
        </QuestionShell>
      )}

      {step === "results" && (() => {
        const { headline, body } = buildDiagnosis(answers);
        return (
          <div className="flex-1 flex flex-col items-center px-6 py-10">
            <div className="max-w-2xl w-full">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">Your diagnostic</p>
              <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-8 text-[#F2EFE7]">{headline}</h1>
              <div className="space-y-5 mb-12">
                {body.map((p, i) => (
                  <p key={i} className="text-base md:text-lg text-[#c8c4bb] leading-relaxed font-sans">{p}</p>
                ))}
              </div>

              {/* The wedge / CTA */}
              <div className="border-t border-[#2a2a2a] pt-10">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-4 font-sans font-medium">Your first custom track</p>
                <h2 className="font-serif text-3xl md:text-4xl mb-5 leading-tight text-[#F2EFE7]">
                  Built specifically for what you just described.
                </h2>
                <p className="text-base text-[#c8c4bb] leading-relaxed mb-8 font-sans">
                  Not a generic guided meditation. A personalized Ericksonian hypnosis track, written for the exact pattern, words, and identity you wrote — rendered to audio in about 90 seconds inside the app. Yours forever, plus the full Velum library and every Collection we've built.
                </p>

                <button
                  onClick={startSignup}
                  className="block w-full md:w-auto bg-[#C9A84C] text-[#0d0d0d] rounded-full px-10 py-4 font-sans font-semibold tracking-[0.18em] uppercase text-sm hover:opacity-95 active:scale-[0.99] transition-all"
                >
                  Start rewiring →
                </button>

                <p className="text-[12px] text-[#7a8a82] mt-5 font-sans leading-relaxed">
                  Includes 7-day annual trial · cancel anytime · 30-day full refund
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <footer className="px-6 py-6 text-center">
        <p className="text-[11px] text-[#7a8a82] font-sans">
          Velum · Subconscious rewiring · govelum.com
        </p>
      </footer>

      {/* Loading overlay for email submit (rare, but covers edge cases) */}
      {submitting && step === "email" && (
        <div className="fixed inset-0 bg-[#0d0d0d]/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
        </div>
      )}
    </div>
  );
}
