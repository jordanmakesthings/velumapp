import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MasteryPlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [visiblePromptIds, setVisiblePromptIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: mc, isLoading } = useQuery({
    queryKey: ["masteryClass", id],
    queryFn: async () => {
      const { data } = await supabase.from("mastery_classes").select("*").eq("id", id).single();
      return data;
    },
    enabled: !!id,
  });

  const allPrompts = useMemo(() => (mc as any)?.pause_prompts || [], [mc]);
  const midPrompts = useMemo(() => allPrompts.filter((p: any) => p.post_completion === false), [allPrompts]);
  const postPrompts = useMemo(() => allPrompts.filter((p: any) => p.post_completion !== false), [allPrompts]);

  // Reveal mid-session prompts at their timestamp WITHOUT pausing audio
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const ct = audioRef.current.currentTime;
    setCurrentTime(ct);
    for (const prompt of midPrompts) {
      if (
        prompt.timestamp_seconds != null &&
        ct >= prompt.timestamp_seconds &&
        !visiblePromptIds.has(prompt.prompt_id)
      ) {
        setVisiblePromptIds(prev => new Set([...prev, prompt.prompt_id]));
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCompleted(true);
    // Reveal all post-completion prompts
    const postIds = postPrompts.map((p: any) => p.prompt_id);
    if (postIds.length > 0) {
      setVisiblePromptIds(prev => new Set([...prev, ...postIds]));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !mc) return;
      const responseEntries = allPrompts.map((p: any) => ({
        prompt_text: p.text,
        response: responses[p.prompt_id] || "",
      }));
      await supabase.from("mastery_class_responses").insert({
        user_id: user.id,
        mastery_class_id: mc.id,
        mastery_class_title: mc.title,
        mastery_class_theme: (mc as any).theme || "",
        date: new Date().toISOString().split("T")[0],
        responses: responseEntries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masteryResponses"] });
      setSaved(true);
      toast.success("Reflections saved to your journal");
    },
  });

  const hasAccess = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
  const isGated = !hasAccess;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Collect visible prompts in order
  const activePrompts = useMemo(() => {
    return allPrompts.filter((p: any) => visiblePromptIds.has(p.prompt_id));
  }, [allPrompts, visiblePromptIds]);

  const hasAnyResponse = Object.values(responses).some(r => r.trim().length > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-ui text-sm">Mastery class not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {mc.audio_url && (
        <audio
          ref={audioRef}
          src={mc.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-surface opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(42,53%,54%,0.08)_0%,_transparent_60%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground font-sans text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Mastery Class</p>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-6 overflow-y-auto pb-24">
        {/* Cover */}
      {/* Cover — use player_image_url_1_1 if available, else cover_image_url_16_9, else cover_image_url */}
        {((mc as any).player_image_url_1_1 || (mc as any).cover_image_url_16_9 || (mc as any).cover_image_url) ? (
          <div className={`w-full max-w-sm overflow-hidden mb-8 ${(mc as any).player_image_url_1_1 ? "aspect-square rounded-3xl" : "aspect-video rounded-2xl"}`}>
            <img src={(mc as any).player_image_url_1_1 || (mc as any).cover_image_url_16_9 || (mc as any).cover_image_url} alt={mc.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <motion.div
            animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-64 h-64 rounded-3xl bg-card overflow-hidden mb-8 shadow-2xl flex items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
          </motion.div>
        )}

        {/* Title & theme */}
        {(mc as any).theme && (
          <p className="text-accent text-[10px] font-sans font-medium tracking-[2.5px] uppercase mb-2">{(mc as any).theme}</p>
        )}
        <h2 className="text-display text-2xl mb-1 text-center">{mc.title}</h2>
        {mc.description && <p className="text-ui text-sm mb-8 text-center max-w-md">{mc.description}</p>}

        {isGated ? (
          <div className="velum-card p-8 text-center max-w-sm w-full">
            <p className="text-accent text-3xl mb-3">◈</p>
            <h3 className="text-display text-xl mb-2">Subscribe to Access</h3>
            <p className="text-ui text-sm mb-5">Subscribe to unlock this class and all content in Velum.</p>
            <button
              onClick={() => navigate("/premium")}
              className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
            >
              Begin My Journey
            </button>
          </div>
        ) : (
          <>
            {/* Audio player */}
            <div className="w-full max-w-sm mb-3">
              <div className="h-1.5 bg-surface-light rounded-full cursor-pointer relative" onClick={handleSeek}>
                <div className="absolute inset-y-0 left-0 gold-gradient rounded-full" style={{ width: `${progress}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-lg" style={{ left: `calc(${progress}% - 7px)` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-ui text-[10px] tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-ui text-[10px] tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 mb-8">
              <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15); }}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipBack className="w-6 h-6" />
              </button>
              <button onClick={togglePlay}
                className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center active:scale-95 transition-transform">
                {isPlaying ? <Pause className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 text-primary-foreground ml-1" />}
              </button>
              <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15); }}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Prompts appear below player — never interrupt audio */}
            {activePrompts.length > 0 && (
              <div className="max-w-sm w-full">
                <div className="h-px bg-accent/10 mb-6" />
                <p className="text-accent/50 text-[10px] font-sans tracking-[2.5px] uppercase mb-2">Reflect & Write</p>
                <p className="text-muted-foreground text-xs font-sans mb-6">Journaling is optional — write as much or as little as you like.</p>
                {activePrompts.map((prompt: any) => (
                  <motion.div
                    key={prompt.prompt_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-6"
                  >
                    <p className="text-display text-base italic text-foreground/70 mb-3">"{prompt.text}"</p>
                    <textarea
                      value={responses[prompt.prompt_id] || ""}
                      onChange={(e) => setResponses(r => ({ ...r, [prompt.prompt_id]: e.target.value }))}
                      rows={4}
                      placeholder="Your reflection…"
                      className="w-full bg-card rounded-xl p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none focus:outline-none border border-accent/10"
                    />
                  </motion.div>
                ))}

                {/* Save button */}
                {!saved ? (
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || !hasAnyResponse}
                    className="w-full py-4 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
                  >
                    {saveMutation.isPending ? "Saving…" : "Save Reflections to Journal"}
                  </button>
                ) : (
                  <div className="velum-card p-5 text-center">
                    <p className="text-accent text-sm font-sans font-semibold">✓ Saved to your journal</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed without prompts */}
            {completed && activePrompts.length === 0 && (
              <div className="flex flex-col items-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                  className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6">
                  <span className="text-primary-foreground text-3xl">✓</span>
                </motion.div>
                <h3 className="text-display text-2xl mb-2">Class complete</h3>
                <p className="text-ui text-sm mb-8">{mc.title}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setCurrentTime(0); setCompleted(false); setVisiblePromptIds(new Set()); if (audioRef.current) audioRef.current.currentTime = 0; }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform">
                    <RotateCcw className="w-4 h-4" /> Play again
                  </button>
                  <button onClick={() => navigate("/library")}
                    className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                    Back to Library
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
