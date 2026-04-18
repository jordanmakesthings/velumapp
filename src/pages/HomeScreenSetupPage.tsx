import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VelumMark from "@/components/VelumMark";

const iosSteps = [
  "Open Velum in Safari — not Chrome",
  "Tap the Share icon at the bottom of the screen (box with arrow pointing up)",
  'Scroll down and tap "Add to Home Screen"',
  'Tap "Add" in the top right corner',
  "Open the Velum icon from your home screen",
];

const androidSteps = [
  "Open Velum in Chrome",
  "Tap the three-dot Menu icon in the top right",
  'Tap "Add to Home Screen"',
  'Tap "Add" to confirm',
  "Open the Velum icon from your home screen",
];

export default function HomeScreenSetupPage() {
  const [device, setDevice] = useState<"ios" | "android" | null>(null);
  const navigate = useNavigate();
  const steps = device === "ios" ? iosSteps : androidSteps;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12">
      {/* Ambient green glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(156,51%,14%,0.55) 0%, transparent 60%)", filter: "blur(20px)" }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsla(42,53%,35%,0.12) 0%, transparent 60%)", filter: "blur(40px)" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="velum-card-accent p-8 md:p-10 text-center">
          <div className="flex justify-center mb-6">
            <VelumMark variant="lotus" size="lg" />
          </div>

          <p className="text-eyebrow mb-3">Setup</p>
          <h2 className="text-display text-[2rem] leading-[1.1] mb-4">
            Let's get you
            <br />
            <span className="italic text-accent">set up.</span>
          </h2>

          <p className="text-muted-foreground text-sm font-sans mb-7 max-w-[320px] mx-auto leading-relaxed">
            Add Velum to your home screen for the best experience — no browser, no distractions.
          </p>

          {!device && (
            <>
              <p className="text-eyebrow mb-4">What device are you using?</p>
              <div className="w-full flex flex-col gap-3 mb-6">
                <button
                  onClick={() => setDevice("ios")}
                  className="w-full bg-black/25 border border-accent/15 rounded-xl p-5 flex items-center justify-between text-left hover:border-accent/40 transition-colors"
                >
                  <div>
                    <p className="text-foreground text-base font-sans font-medium mb-1">Apple iPhone / iPad</p>
                    <p className="text-accent text-xs font-sans">iOS · Safari browser</p>
                  </div>
                  <span className="text-accent text-xl shrink-0 ml-4">›</span>
                </button>
                <button
                  onClick={() => setDevice("android")}
                  className="w-full bg-black/25 border border-accent/15 rounded-xl p-5 flex items-center justify-between text-left hover:border-accent/40 transition-colors"
                >
                  <div>
                    <p className="text-foreground text-base font-sans font-medium mb-1">Android</p>
                    <p className="text-accent text-xs font-sans">Chrome browser</p>
                  </div>
                  <span className="text-accent text-xl shrink-0 ml-4">›</span>
                </button>
              </div>
              <button
                onClick={() => navigate("/")}
                className="text-muted-foreground/70 text-xs font-sans underline underline-offset-2 hover:text-muted-foreground"
              >
                Skip this step
              </button>
            </>
          )}

          {device && (
            <>
              <p className="text-eyebrow mb-5">
                {device === "ios" ? "iOS Instructions" : "Android Instructions"}
              </p>
              <ol className="text-left bg-black/25 border border-accent/15 rounded-xl p-5 mb-6 flex flex-col gap-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="shrink-0 w-7 h-7 rounded-full border border-accent/60 flex items-center justify-center text-accent text-sm font-sans font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground text-[13px] font-sans leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => navigate("/")}
                className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform shadow-[0_0_30px_rgba(201,168,76,0.25)] mb-4"
              >
                Enter Velum →
              </button>
              <button
                onClick={() => setDevice(null)}
                className="text-muted-foreground/70 text-xs font-sans underline underline-offset-2 hover:text-muted-foreground"
              >
                ← Choose a different device
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
