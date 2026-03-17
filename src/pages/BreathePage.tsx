import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Technique {
  id: string;
  name: string;
  desc: string;
  color: string;
  phases: { label: string; duration: number }[];
}

const techniques: Technique[] = [
  {
    id: "box", name: "Box Breathing", desc: "Rapid calm & focus", color: "#4a7a6e",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Hold", duration: 4 },
      { label: "Exhale", duration: 4 }, { label: "Hold", duration: 4 },
    ],
  },
  {
    id: "478", name: "4-7-8", desc: "Parasympathetic activation and relaxation", color: "#6f8a7e",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Hold", duration: 7 },
      { label: "Exhale", duration: 8 },
    ],
  },
  {
    id: "coherent", name: "Coherence", desc: "Rhythmic Breathing for Nervous System Reset", color: "#5a8a5e",
    phases: [
      { label: "Inhale", duration: 5 }, { label: "Exhale", duration: 5 },
    ],
  },
  {
    id: "physiological", name: "Physiological Sigh", desc: "Scientifically proven to collapse stress in minutes", color: "#4a7a8e",
    phases: [
      { label: "Inhale", duration: 2 }, { label: "Inhale Again", duration: 3 },
      { label: "Long Exhale", duration: 6 },
    ],
  },
  {
    id: "wim", name: "Power Breath", desc: "Rapid energy and clarity", color: "#8a7a4e",
    phases: [
      { label: "Inhale", duration: 2 }, { label: "Exhale", duration: 2 },
    ],
  },
  {
    id: "extended_exhale", name: "Extended Exhale", desc: "From overwhelm to calm and clarity through prolonged exhales", color: "#6a5a8e",
    phases: [
      { label: "Inhale", duration: 4 }, { label: "Exhale", duration: 8 },
    ],
  },
];

type Stage = "setup" | "checkin_before" | "session" | "checkin_after" | "done";

const getOrbScale = (label: string, prevScale: number) => {
  const l = label.toLowerCase();
  if (l === "inhale again") return Math.min((prevScale || 1.45) + 0.2, 1.65);
  if (l.includes("inhale")) return 1.45;
  if (l.includes("exhale")) return 0.65;
  return prevScale;
};

const getOrbTransitionDur = (label: string, duration: number) => {
  const l = label.toLowerCase();
  if (l === "inhale again") return 3;
  if (l.includes("hold")) return 0;
  return duration;
};

function StressRating({ label, onSelect }: { label: string; onSelect: (n: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col items-center py-8">
      <p className="text-display text-lg italic mb-6">{label}</p>
      <div className="flex gap-2.5 justify-center flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => { setSelected(n); onSelect(n); }}
            className={`w-11 h-11 rounded-full text-sm font-sans font-bold transition-all duration-200 ${
              selected === n
                ? "gold-gradient text-primary-foreground scale-110"
                : "border border-muted-foreground/30 text-foreground hover:border-accent/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BreathePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTech, setSelectedTech] = useState(techniques[0]);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [step, setStep] = useState<Stage>("setup");
  const [stressBefore, setStressBefore] = useState<number | null>(null);
  const [stressAfter, setStressAfter] = useState<number | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [orbScale, setOrbScale] = useState(0.65);
  const [orbTransitionDur, setOrbTransitionDur] = useState(4);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const { data: progress = [] } = useQuery({
    queryKey: ["breathProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .like("track_id", "breathwork_%");
      return data || [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      track_id: string; completed: boolean; completed_date: string;
      stress_before: number | null; stress_after: number; progress_seconds: number;
    }) => {
      if (!user) return;
      const { error } = await supabase.from("user_progress").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["breathProgress"] }),
  });

  const totalSeconds = selectedDuration * 60;
  const phases = selectedTech.phases;

  useEffect(() => {
    if (step !== "session") { clearInterval(timerRef.current); return; }
    const initDelay = setTimeout(() => {
      setOrbScale(prev => getOrbScale(phases[phaseIndex].label, prev));
      setOrbTransitionDur(getOrbTransitionDur(phases[phaseIndex].label, phases[phaseIndex].duration));
    }, 50);

    timerRef.current = setInterval(() => {
      setPhaseTime(prev => {
        const phaseDur = phases[phaseIndex].duration;
        if (prev + 1 >= phaseDur) {
          const nextIndex = (phaseIndex + 1) % phases.length;
          setPhaseIndex(nextIndex);
          setOrbScale(prev => getOrbScale(phases[nextIndex].label, prev));
          setOrbTransitionDur(getOrbTransitionDur(phases[nextIndex].label, phases[nextIndex].duration));
          return 0;
        }
        return prev + 1;
      });
      setTotalElapsed(prev => {
        if (prev + 1 >= totalSeconds) {
          clearInterval(timerRef.current);
          setStep("checkin_after");
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { clearInterval(timerRef.current); clearTimeout(initDelay); };
  }, [step, phaseIndex, phases, totalSeconds]);

  const handleStart = () => {
    setPhaseIndex(0);
    setPhaseTime(0);
    setTotalElapsed(0);
    setOrbScale(0.65);
    setOrbTransitionDur(phases[0].duration);
    setStep("checkin_before");
  };

  const handleBeforeRated = (val: number) => {
    setStressBefore(val);
    setTimeout(() => setStep("session"), 600);
  };

  const handleAfterRated = (val: number) => {
    setStressAfter(val);
    if (user) {
      saveMutation.mutate({
        track_id: `breathwork_${selectedTech.id}`,
        completed: true,
        completed_date: new Date().toISOString().split("T")[0],
        stress_before: stressBefore,
        stress_after: val,
        progress_seconds: totalSeconds,
      });
    }
    setStep("done");
  };

  const phaseDur = phases[phaseIndex]?.duration || 4;
  const breathworkSessions = progress.filter((p: any) => p.track_id?.startsWith("breathwork_"));
  const validSessions = breathworkSessions.filter((p: any) => p.stress_before && p.stress_after);
  const avgReduction = validSessions.length > 0
    ? Math.round(validSessions.reduce((s: number, p: any) => s + ((p.stress_before - p.stress_after) / p.stress_before) * 100, 0) / validSessions.length)
    : null;

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-[520px] mx-auto px-5 pt-10 pb-24">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-display text-4xl mb-1.5">Breathwork</h1>
          <p className="text-ui text-xs tracking-[0.05em]">Real-Time Regulation</p>
        </div>

        {/* Stats */}
        {breathworkSessions.length > 0 && (
          <div className="flex gap-2.5 mb-6">
            <div className="flex-1 velum-card-flat p-3.5 text-center">
              <div className="text-display text-2xl">{breathworkSessions.length}</div>
              <div className="text-[10px] text-muted-foreground/50 tracking-[1.5px] uppercase mt-1">Sessions</div>
            </div>
            {avgReduction !== null && (
              <div className="flex-1 velum-card-flat p-3.5 text-center">
                <div className="text-display text-2xl">−{avgReduction}%</div>
                <div className="text-[10px] text-muted-foreground/50 tracking-[1.5px] uppercase mt-1">Avg Stress Drop</div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* SETUP */}
          {step === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Technique grid */}
              <div className="mb-5">
                <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50 mb-3">Choose Technique</p>
                <div className="grid grid-cols-2 gap-2">
                  {techniques.map(t => {
                    const sel = selectedTech.id === t.id;
                    return (
                      <button key={t.id} onClick={() => setSelectedTech(t)}
                        className={`velum-card p-3.5 text-left transition-all duration-200 ${sel ? "ring-1 ring-accent/50" : ""}`}
                      >
                        <div className="w-2 h-2 rounded-full mb-2" style={{ background: t.color, boxShadow: sel ? `0 0 8px ${t.color}` : "none" }} />
                        <div className="text-[13px] font-semibold text-foreground mb-0.5 uppercase">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {t.phases.map((p, i) => (
                            <div key={i} className={`text-[9px] rounded px-1 py-0.5 ${sel ? "text-accent bg-accent/15" : "text-muted-foreground bg-muted-foreground/15"}`}>
                              {p.duration}s
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration slider */}
              <div className="velum-card p-5 mb-5 border border-accent/20">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50">Duration</p>
                  <span className="text-display text-2xl text-accent">{selectedDuration} min</span>
                </div>
                <input
                  type="range" min={3} max={10} step={1}
                  value={selectedDuration}
                  onChange={e => setSelectedDuration(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground/40">3 min</span>
                  <span className="text-[10px] text-muted-foreground/40">10 min</span>
                </div>
              </div>

              {/* Music toggle */}
              <div className={`velum-card-flat p-4 flex items-center justify-between mb-3.5 border transition-colors duration-200 ${musicEnabled ? "border-accent/30" : "border-foreground/10"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎧</span>
                  <div>
                    <div className="text-[13px] font-semibold text-foreground">Background Music</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Headphones recommended</div>
                  </div>
                </div>
                <button onClick={() => setMusicEnabled(v => !v)}
                  className={`w-12 h-[26px] rounded-full relative transition-colors duration-250 flex-shrink-0 ${musicEnabled ? "bg-accent" : "bg-muted-foreground/30"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-[3px] transition-all duration-250 shadow ${musicEnabled ? "left-[25px]" : "left-[3px]"}`} />
                </button>
              </div>

              {/* Begin */}
              <button onClick={handleStart}
                className="w-full gold-gradient text-primary-foreground rounded-[14px] py-[19px] text-base font-extrabold font-sans tracking-[0.02em] active:scale-[0.98] transition-transform">
                Begin · {selectedDuration} min
              </button>
            </motion.div>
          )}

          {/* STRESS CHECK-IN */}
          {step === "checkin_before" && (
            <motion.div key="checkin_before" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <StressRating label="How stressed do you feel right now?" onSelect={handleBeforeRated} />
            </motion.div>
          )}

          {/* SESSION */}
          {step === "session" && (
            <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center pt-5">
              <div className="relative w-[260px] h-[260px] mx-auto mb-8 flex items-center justify-center">
                {/* Gold ring */}
                <div className="absolute w-40 h-40 rounded-full border border-accent/50"
                  style={{
                    boxShadow: "0 0 20px hsl(var(--accent) / 0.3)",
                    transform: `scale(${orbScale * 1.18})`,
                    transition: `transform ${orbTransitionDur}s ease-in-out`,
                  }} />
                {/* Orb */}
                <div className="absolute w-40 h-40 rounded-full"
                  style={{
                    background: "radial-gradient(circle, hsl(var(--accent) / 0.87) 0%, hsl(var(--accent) / 0.4) 50%, transparent 100%)",
                    transform: `scale(${orbScale})`,
                    transition: `transform ${orbTransitionDur}s ease-in-out`,
                    boxShadow: `0 0 ${orbScale > 1 ? 80 : 24}px hsl(var(--accent) / 0.47)`,
                  }} />
                {/* Phase label */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="text-display text-2xl text-foreground">{phases[phaseIndex].label}</div>
                  <div className="text-[32px] font-bold text-foreground mt-0.5">{phaseDur - phaseTime}</div>
                </div>
              </div>

              <div className="text-[13px] text-muted-foreground/50 mb-7">
                {Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, "0")} / {selectedDuration}:00
              </div>

              <button onClick={() => setStep("checkin_after")}
                className="border border-muted-foreground/30 rounded-[10px] px-6 py-2.5 text-[13px] text-foreground/40 font-sans hover:text-foreground/60 transition-colors">
                End session
              </button>
            </motion.div>
          )}

          {/* CHECK-IN AFTER */}
          {step === "checkin_after" && (
            <motion.div key="checkin_after" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <StressRating label="How do you feel now?" onSelect={handleAfterRated} />
            </motion.div>
          )}

          {/* DONE */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                className="w-[72px] h-[72px] rounded-full border-2 border-accent flex items-center justify-center mx-auto mb-6 text-3xl text-accent">
                ◌
              </motion.div>
              <h2 className="text-display text-[30px] text-foreground mb-2.5">Session complete.</h2>
              {stressBefore && stressAfter && (
                <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
                  Stress: {stressBefore} → {stressAfter}
                  {stressAfter < stressBefore && (
                    <span className="text-accent"> ↓ {Math.round(((stressBefore - stressAfter) / stressBefore) * 100)}%</span>
                  )}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                <button onClick={() => { setStep("setup"); setStressBefore(null); setStressAfter(null); }}
                  className="w-full gold-gradient text-primary-foreground rounded-[14px] py-[18px] text-base font-extrabold font-sans active:scale-[0.98] transition-transform">
                  Practice another session
                </button>
                <button onClick={() => navigate("/")}
                  className="w-full border border-muted-foreground/35 text-foreground rounded-[14px] py-[17px] text-[15px] font-semibold font-sans active:scale-[0.98] transition-transform">
                  Return to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
