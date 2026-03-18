import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCircle from "@/assets/logo-circle.png";

const iosSteps = [
"Open Velum in Safari — not Chrome",
'Tap the Share icon at the bottom of the screen (box with arrow pointing up)',
'Scroll down and tap "Add to Home Screen"',
'Tap "Add" in the top right corner',
"Open the Velum icon from your home screen"];


const androidSteps = [
"Open Velum in Chrome",
"Tap the three-dot Menu icon in the top right",
'Tap "Add to Home Screen"',
'Tap "Add" to confirm',
"Open the Velum icon from your home screen"];


export default function HomeScreenSetupPage() {
  const [device, setDevice] = useState<"ios" | "android" | null>(null);
  const navigate = useNavigate();
  const steps = device === "ios" ? iosSteps : androidSteps;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 pb-16">
      <div className="w-full max-w-[400px] flex flex-col items-center pt-16">
        {/* Logo */}
        <img alt="Velum" className="w-[52px] h-[52px] object-contain mb-4" src="/lovable-uploads/873c5ffb-ee75-4845-9045-d763a10a06c0.jpg" />
        <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase text-center mb-4">​Setup </p>
        <div className="w-12 h-px bg-accent/70 mb-9" />

        {/* Heading */}
        <h1 className="text-display text-4xl italic text-center mb-4">Let's get you set up.</h1>
        <p className="text-foreground text-center text-[15px] font-sans font-light leading-relaxed max-w-[320px] mb-12">
          Add Velum to your home screen for the best experience — no browser, no distractions.
        </p>

        {/* Device selection */}
        {!device &&
        <div className="w-full flex flex-col items-center">
            <p className="text-accent text-[10px] font-sans tracking-[2.5px] uppercase text-center mb-4 font-bold">
              What device are you using?
            </p>
            <div className="w-full flex flex-col gap-3 mb-8">
              <button onClick={() => setDevice("ios")}
            className="w-full velum-card p-5 flex items-center justify-between text-left bg-secondary">
                <div>
                  <p className="text-foreground text-lg font-sans font-medium mb-1">Apple iPhone / iPad</p>
                  <p className="text-accent text-sm font-sans">iOS · Safari browser</p>
                </div>
                <span className="text-accent text-xl shrink-0 ml-4">›</span>
              </button>
              <button onClick={() => setDevice("android")}
            className="w-full velum-card p-5 flex items-center justify-between text-left bg-secondary">
                <div>
                  <p className="text-foreground text-lg font-sans font-medium mb-1">Android</p>
                  <p className="text-accent text-sm font-sans">Chrome browser</p>
                </div>
                <span className="text-accent text-xl shrink-0 ml-4">›</span>
              </button>
            </div>
            <button onClick={() => navigate("/")} className="text-muted-foreground text-sm font-sans text-center p-2">
              Skip this step
            </button>
          </div>
        }

        {/* Steps */}
        {device &&
        <div className="w-full">
            <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase text-center mb-6">
              {device === "ios" ? "iOS Instructions" : "Android Instructions"}
            </p>
            <ol className="flex flex-col gap-4 mb-9">
              {steps.map((step, i) =>
            <li key={i} className="flex gap-4 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full border border-accent flex items-center justify-center text-accent text-sm font-sans font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground text-[15px] font-sans font-light leading-relaxed">{step}</span>
                </li>
            )}
            </ol>
            <button onClick={() => navigate("/")}
          className="w-full h-14 rounded-full gold-gradient text-primary-foreground text-[15px] font-sans font-bold tracking-wide active:scale-[0.98] transition-transform mb-5">
              Enter Velum →
            </button>
            <button onClick={() => setDevice(null)}
          className="text-muted-foreground text-sm font-sans text-center w-full p-1">
              ← Choose a different device
            </button>
          </div>
        }
      </div>
    </div>);

}