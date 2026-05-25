import { Check, Sparkles } from "lucide-react";

const STRIPE_URL = "https://buy.stripe.com/3cI9AU5W3duS4k2fIe7ss08";

const LEARN = [
  "Why change never sticks when you white-knuckle behavior — and the level beneath it where it finally holds",
  "Why you keep defaulting to the same old self, even when every part of you wants to change",
  "Why who you're being matters more than any strategy or amount of effort",
  "The pond: how your identity quietly runs your thoughts, feelings, behaviors, and results on a loop — and how to change it at the source",
  "Why your dreams are far closer than you think once you shift who you are",
  "The Monday Stress Test — the exercise that unlocks what you actually want, and the version of you who already has it",
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

        <div className="velum-card p-6 md:p-7 mb-6">
          <p className="text-[17px] leading-relaxed mb-4">
            You've changed the habits. Tried the strategy. White-knuckled the willpower. And you
            keep snapping back to the same old you.
          </p>
          <p className="text-[17px] leading-relaxed">
            Here's why: change doesn't hold at the level of behavior. It holds at the level of{" "}
            <span className="italic">who you are</span> — your identity, the way you see yourself
            and the world.{" "}
            <span className="text-accent font-medium">Redesign that, and your reality reorganizes around the new you.</span>
          </p>
        </div>

        <div className="velum-card-flat p-5 md:p-6 mb-8">
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Your identity is a pond of beliefs. It trickles out your{" "}
            <span className="text-foreground">thoughts</span> → which become your{" "}
            <span className="text-foreground">feelings</span> → which become your{" "}
            <span className="text-foreground">behaviors</span> → which become your{" "}
            <span className="text-foreground">results</span> — and those flow right back up to
            reinforce the identity. Most people spend their lives fighting the behavior.{" "}
            <span className="text-accent">We change the water at the source.</span>
          </p>
        </div>

        <p className="text-center text-[17px] mb-2">
          On <strong>Thursday, June 11 · 6PM PST</strong>, we redesign it — at the root.
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
