import { Check } from "lucide-react";

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

        <p className="text-[17px] text-muted-foreground mb-6">
          Thursday, June 11 · 6PM PST · 90 minutes, live on Zoom. Replay included.
        </p>

        <p className="text-[16px] text-foreground/80 mb-10">
          You'll receive all the details as we get closer to the date.
        </p>

        <p className="text-sm text-muted-foreground/70">— Jordan</p>

      </div>
    </div>
  );
}
