import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";
import { motion, useAnimationFrame } from "framer-motion";

// ---------------------------------------------------------------------------
// Speed presets — full left-to-right-to-left cycle in seconds
// ---------------------------------------------------------------------------
const SPEEDS = [
  { label: "Slow", value: 3.0, description: "Deep processing" },
  { label: "Medium", value: 1.8, description: "Balanced" },
  { label: "Fast", value: 0.9, description: "Activation" },
] as const;

const DURATIONS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "Open", seconds: 0 },
] as const;

// ---------------------------------------------------------------------------
// Web Audio engine for stereo-panning tones
// ---------------------------------------------------------------------------
class BilateralAudio {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private clickGain: GainNode | null = null;

  start(volume: number) {
    this.ctx = new AudioContext();

    // Continuous low sine tone (barely audible carrier — 80Hz sub-bass feel)
    this.osc = this.ctx.createOscillator();
    this.osc.type = "sine";
    this.osc.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.panner = this.ctx.createStereoPanner();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume * 0.18, this.ctx.currentTime);

    this.osc.connect(this.gainNode);
    this.gainNode.connect(this.panner);
    this.panner.connect(this.ctx.destination);
    this.osc.start();

    // Separate click gain for the "tap" sounds
    this.clickGain = this.ctx.createGain();
    this.clickGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.clickGain.connect(this.ctx.destination);
  }

  /** Called every frame — position is -1 (left) to +1 (right) */
  setPan(position: number) {
    if (!this.panner || !this.ctx) return;
    this.panner.pan.setTargetAtTime(position, this.ctx.currentTime, 0.02);
  }

  /** Play a soft tap when the orb reaches an edge */
  tap(side: "left" | "right") {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(264, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

    pan.pan.setValueAtTime(side === "left" ? -0.9 : 0.9, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  stop() {
    this.osc?.stop();
    this.ctx?.close();
    this.ctx = null;
    this.osc = null;
    this.panner = null;
    this.gainNode = null;
  }

  isRunning() {
    return this.ctx !== null && this.ctx.state !== "closed";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BilateralPage() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showOrb, setShowOrb] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(1); // Medium default
  const [durationIdx, setDurationIdx] = useState(1); // 5 min default
  const [elapsed, setElapsed] = useState(0);
  const [orbX, setOrbX] = useState(0); // -1 to +1

  const audioRef = useRef<BilateralAudio>(new BilateralAudio());
  const startTimeRef = useRef<number>(0);
  const lastEdgeRef = useRef<"left" | "right" | null>(null);
  const elapsedRef = useRef(0);

  const speed = SPEEDS[speedIdx];
  const duration = DURATIONS[durationIdx];

  // Keep elapsedRef in sync
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  const stop = useCallback(() => {
    setIsRunning(false);
    audioRef.current.stop();
  }, []);

  const start = useCallback(() => {
    setElapsed(0);
    elapsedRef.current = 0;
    startTimeRef.current = performance.now();
    lastEdgeRef.current = null;
    if (soundOn) audioRef.current.start(1);
    setIsRunning(true);
  }, [soundOn]);

  // Session timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (duration.seconds > 0 && next >= duration.seconds) {
          stop();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, duration.seconds, stop]);

  // Animation loop — drives orb position and audio panning
  useAnimationFrame((time) => {
    if (!isRunning) return;

    // Position: sine wave cycling at the chosen speed
    // cycleDuration = half-period (L→R or R→L) in ms
    const halfCycleMs = (speed.value / 2) * 1000;
    const phase = (time % (halfCycleMs * 2)) / (halfCycleMs * 2); // 0..1
    // Use sine to get smooth -1..+1 travel
    const pos = Math.sin(phase * Math.PI * 2); // -1 to +1

    setOrbX(pos);

    if (soundOn && audioRef.current.isRunning()) {
      audioRef.current.setPan(pos);

      // Tap sound at each edge (debounced — only once per edge visit)
      if (pos > 0.92 && lastEdgeRef.current !== "right") {
        lastEdgeRef.current = "right";
        audioRef.current.tap("right");
      } else if (pos < -0.92 && lastEdgeRef.current !== "left") {
        lastEdgeRef.current = "left";
        audioRef.current.tap("left");
      }
    }
  });

  // Cleanup on unmount
  useEffect(() => () => audioRef.current.stop(), []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const remaining =
    duration.seconds > 0 ? Math.max(0, duration.seconds - elapsed) : elapsed;

  // Map orbX (-1..+1) to screen percentage (5%..95%)
  const orbPercent = ((orbX + 1) / 2) * 90 + 5;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-sans text-foreground min-h-10"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <p className="text-accent text-[10px] font-sans font-medium tracking-[3px] uppercase">
            Bilateral
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Main stage */}
      <div className="flex-1 flex flex-col">
        {/* Orb track */}
        <div className="relative flex items-center justify-center" style={{ height: "40vh" }}>
          {/* Track line */}
          <div className="absolute inset-x-[5%] top-1/2 -translate-y-1/2 h-px bg-foreground/8" />

          {/* Left / Right markers */}
          <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground/15" />
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-foreground/15" />

          {/* Orb */}
          {showOrb && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${orbPercent}%` }}
              transition={{ type: "tween", duration: 0 }}
            >
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60 scale-150"
                style={{
                  background: "radial-gradient(circle, hsl(42,53%,54%) 0%, transparent 70%)",
                  width: "3.5rem",
                  height: "3.5rem",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%) scale(2)",
                }}
              />
              {/* Core */}
              <div
                className="relative rounded-full gold-gradient shadow-lg"
                style={{ width: "2.25rem", height: "2.25rem" }}
              />
            </motion.div>
          )}

          {/* Eyes-closed instruction */}
          {!showOrb && isRunning && (
            <p className="text-muted-foreground text-sm font-serif italic text-center px-8">
              Let the sound guide you.<br />Follow it with your mind's eye.
            </p>
          )}

          {/* Idle instruction */}
          {!isRunning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8">
              <p className="text-foreground font-serif text-xl text-center">
                Bilateral Stimulation
              </p>
              <p className="text-muted-foreground text-sm text-center leading-relaxed">
                Follow the light with your eyes as it moves.<br />
                Let your thoughts process without effort.
              </p>
            </div>
          )}
        </div>

        {/* Timer */}
        {isRunning && (
          <div className="text-center mb-2">
            <p className="text-display text-3xl text-accent tabular-nums">
              {formatTime(remaining)}
            </p>
            <p className="text-muted-foreground text-[10px] font-sans tracking-widest uppercase mt-1">
              {duration.seconds > 0 ? "remaining" : "elapsed"}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 pb-safe pb-8 space-y-5 mt-auto">

          {/* Speed + Duration — only visible when stopped */}
          {!isRunning && (
            <>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5 text-center">Speed</p>
                <div className="flex gap-2">
                  {SPEEDS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setSpeedIdx(i)}
                      className={`flex-1 py-3 rounded-xl text-sm font-sans transition-all ${
                        speedIdx === i
                          ? "gold-gradient text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="block font-medium">{s.label}</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">{s.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5 text-center">Duration</p>
                <div className="flex gap-2">
                  {DURATIONS.map((d, i) => (
                    <button
                      key={d.label}
                      onClick={() => setDurationIdx(i)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-sans transition-all ${
                        durationIdx === i
                          ? "gold-gradient text-primary-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Option toggles */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSoundOn(!soundOn);
                if (isRunning) {
                  if (soundOn) audioRef.current.stop();
                  else audioRef.current.start(1);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans transition-colors ${
                soundOn ? "bg-card text-foreground" : "bg-card text-muted-foreground"
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4" />}
              {soundOn ? "Sound on" : "Sound off"}
            </button>

            <button
              onClick={() => setShowOrb(!showOrb)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-sans transition-colors ${
                showOrb ? "bg-card text-foreground" : "bg-card text-muted-foreground"
              }`}
            >
              {showOrb ? <Eye className="w-4 h-4 text-accent" /> : <EyeOff className="w-4 h-4" />}
              {showOrb ? "Visual on" : "Eyes closed"}
            </button>
          </div>

          {/* Play / Stop */}
          <button
            onClick={isRunning ? stop : start}
            className={`w-full py-4 rounded-2xl font-sans font-medium text-base transition-all active:scale-[0.98] ${
              isRunning
                ? "bg-card text-foreground border border-foreground/10"
                : "gold-gradient text-primary-foreground"
            }`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <Pause className="w-5 h-5" /> Stop
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5 ml-0.5" /> Begin
              </span>
            )}
          </button>

          {!isRunning && (
            <p className="text-center text-muted-foreground text-[11px] leading-relaxed">
              Use headphones for the full stereo experience.<br />
              Follow the light with soft, relaxed eyes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
