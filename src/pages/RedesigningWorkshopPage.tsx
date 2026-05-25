import { Check, Sparkles } from "lucide-react";

const STRIPE_URL = "https://buy.stripe.com/3cI9AU5W3duS4k2fIe7ss08";

const LEARN = [
  "Why you keep running the same scripts on repeat — even when every part of you wants change",
  "Why more effort isn't the answer (real change comes from thinking differently, not grinding harder)",
  "Why your self-concept is the one thing standing between you and the life you want",
  "Why your dreams are far closer than you think",
  "The Monday Stress Test — the exercise that unlocks exactly what you want, and what your architected life actually looks like",
  "How to turn your gifts into something you're paid for — if you aren't already",
];

const GET = [
  "The Architect Meditation — yours to keep",
  "Lifetime access to the full replay",
];

export default function RedesigningWorkshopPage() {
  return (
    <div className="min-h-screen w-full bg-radial-subtle font-sans text-foreground">
      <div className="mx-auto w-full max-w-2xl px-5 py-14 lg:py-20">

        <div className="flex items-center justify-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-accent" />
          <p className="text-eyebrow text-accent">Redesigning Reality · Live Workshop</p>
        </div>

        <h1 className="text-display text-4xl md:text-5xl leading-[1.08] text-center mb-7">
          Stop being the passenger in your own life.{" "}
          <span className="italic text-accent">Become the architect.</span>
        </h1>

        <div className="velum-card p-6 md:p-7 mb-8">
          <p className="text-[17px] leading-relaxed mb-4">
            The #1 reason people don't get what they want isn't that they're not smart enough,
            capable enough, or "worthy" enough.
          </p>
          <p className="text-[17px] leading-relaxed">
            It's that they don't know <span className="italic">what they actually want.</span>{" "}
            <span className="text-accent font-medium">You can't hit a target you can't see.</span>
          </p>
        </div>

        <p className="text-center text-[17px] mb-2">
          On <strong>Thursday, June 11 · 6PM PST</strong>, we're going to fix that.
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12">
          A real 90-minute live workshop — not a pre-recorded "webinar" with a sales pitch eating half of it.
        </p>

        <p className="text-eyebrow mb-5">What we'll get into</p>
        <ul className="space-y-4 mb-12">
          {LEARN.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span className="text-[16px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-eyebrow mb-5">What you walk away with</p>
        <ul className="space-y-3 mb-12">
          {GET.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-accent mt-1 shrink-0" strokeWidth={2.5} />
              <span className="text-[16px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="velum-card p-8 text-center border border-accent/30">
          <p className="text-display text-2xl mb-1">Redesigning Reality Workshop</p>
          <p className="text-muted-foreground text-sm mb-4">
            Thursday, June 11 · 6PM PST · 90 minutes · Live on Zoom
          </p>
          <p className="text-display text-4xl text-accent mb-6">$29</p>
          <a
            href={STRIPE_URL}
            className="inline-block w-full sm:w-auto gold-gradient text-primary-foreground rounded-full px-10 py-4 text-base font-extrabold tracking-[0.02em] active:scale-[0.98] transition-transform"
          >
            Register now →
          </a>
          <p className="text-xs text-muted-foreground/60 mt-5 max-w-sm mx-auto">
            Replay included. You don't need more willpower — you need to stop being the passenger.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground/70 mt-10">— Jordan</p>
      </div>
    </div>
  );
}
