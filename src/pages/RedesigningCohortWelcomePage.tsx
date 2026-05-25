import { Check, Calendar, Mail, Sparkles } from "lucide-react";

const INCLUDED = [
  "6 live sessions with me — teaching, guided practice, and hot seats (Thursdays, 6PM PST)",
  "Full Velum access for the cohort",
  "The complete toolkit — breathwork, tapping, hypnosis, NLP, somatics",
  "A small, serious group doing the work alongside you",
  "Recordings of everything",
];

export default function RedesigningCohortWelcomePage() {
  return (
    <div className="min-h-screen w-full bg-radial-subtle font-sans text-foreground">
      <div className="mx-auto w-full max-w-xl px-5 py-16">

        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-primary-foreground" strokeWidth={3} />
          </div>
          <p className="text-eyebrow text-accent mb-3">Welcome to the founding cohort</p>
          <h1 className="text-display text-3xl md:text-4xl leading-[1.1] mb-5">
            You're in <span className="italic text-accent">Redesigning Reality.</span>
          </h1>
          <p className="text-[17px] text-muted-foreground">
            Starts Thursday, June 18 · 6PM PST · 6 weeks, live on Zoom. Recordings included.
          </p>
        </div>

        <div className="velum-card p-6 mb-6">
          <div className="flex gap-3 items-start mb-4">
            <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <p className="text-[15px] leading-relaxed">
              Watch your inbox — your onboarding, the Zoom link, the full schedule, and your Velum
              access are on the way. (Check spam/promotions just in case.)
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <Calendar className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <p className="text-[15px] leading-relaxed">
              Block the next 6 Thursdays, 6:00 PM PST, starting <strong>June 18.</strong> Show up
              fully — this is where you stop being the passenger.
            </p>
          </div>
        </div>

        <p className="text-eyebrow mb-4">What you've got</p>
        <ul className="space-y-3 mb-10">
          {INCLUDED.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <Check className="w-4 h-4 text-accent mt-1 shrink-0" strokeWidth={2.5} />
              <span className="text-[15px] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="velum-card p-6 text-center border border-accent/30">
          <Sparkles className="w-5 h-5 text-accent mx-auto mb-3" />
          <p className="text-[16px] leading-relaxed">
            You didn't just buy a program. You made the decision to become the architect of your own
            life. That decision <span className="italic">is</span> the work, starting now.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-4">See you June 18. — Jordan</p>
        </div>

      </div>
    </div>
  );
}
