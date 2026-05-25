import { Check, Calendar, Mail } from "lucide-react";

export default function RedesigningWorkshopThanksPage() {
  return (
    <div className="min-h-screen w-full bg-radial-subtle font-sans text-foreground flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg px-5 py-16 text-center">

        <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
          <Check className="w-7 h-7 text-primary-foreground" strokeWidth={3} />
        </div>

        <p className="text-eyebrow text-accent mb-3">You're in</p>

        <h1 className="text-display text-3xl md:text-4xl leading-[1.1] mb-5">
          You're registered for the{" "}
          <span className="italic text-accent">Redesigning Reality Workshop.</span>
        </h1>

        <p className="text-[17px] text-muted-foreground mb-8">
          Thursday, June 11 · 6PM PST · 90 minutes, live on Zoom. Replay included.
        </p>

        <div className="velum-card p-6 text-left space-y-4 mb-8">
          <div className="flex gap-3 items-start">
            <Mail className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <p className="text-[15px] leading-relaxed">
              Check your inbox — your confirmation is on its way, and I'll send the Zoom link plus a
              reminder before we go live. (Peek in spam/promotions just in case.)
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <Calendar className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <p className="text-[15px] leading-relaxed">
              Block it now: <strong>Thursday, June 11 · 6:00 PM PST.</strong> Come ready to be honest
              with yourself — that's where the work happens.
            </p>
          </div>
        </div>

        <p className="text-[15px] text-muted-foreground/80 italic mb-2">
          You just did the hardest part — you decided to stop being the passenger.
        </p>
        <p className="text-sm text-muted-foreground/70">See you June 11. — Jordan</p>

      </div>
    </div>
  );
}
