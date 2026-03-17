import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const [activePausePrompt, setActivePausePrompt] = useState<any>(null);
  const [completedPromptIds, setCompletedPromptIds] = useState<Set<string>>(new Set());
  const [showPostPrompts, setShowPostPrompts] = useState(false);
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !mc) return;
      const allPrompts = (mc as any).pause_prompts || [];
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
    },
  });

  const handleTimeUpdate = () => {
    if (!audioRef.current || !mc) return;
    const ct = audioRef.current.currentTime;
    setCurrentTime(ct);
    const prompts = (mc as any).pause_prompts || [];
    for (const prompt of prompts) {
      if (
        prompt.post_completion === false &&
        prompt.timestamp_seconds != null &&
        !completedPromptIds.has(prompt.prompt_id) &&
        ct >= prompt.timestamp_seconds &&
        ct < prompt.timestamp_seconds + 2
      ) {
        audioRef.current.pause();
        setIsPlaying(false);
        setActivePausePrompt(prompt);
        return;
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCompleted(true);
    const postPrompts = ((mc as any)?.pause_prompts || []).filter((p: any) => p.post_completion !== false);
    if (postPrompts.length > 0) setShowPostPrompts(true);
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

  const dismissPausePrompt = () => {
    if (activePausePrompt) {
      setCompletedPromptIds(prev => new Set([...prev, activePausePrompt.prompt_id]));
      setActivePausePrompt(null);
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const isPremiumGated = mc?.is_premium && profile?.subscription_status !== "active" && profile?.subscription_plan !== "lifetime";

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

  const postPrompts = ((mc as any).pause_prompts || []).filter((p: any) => p.post_completion !== false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Mastery Class</p>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-6 overflow-y-auto pb-24">
        {/* Cover */}
        {(mc as any).cover_image_url ? (
          <div className="w-full max-w-sm aspect-video rounded-2xl overflow-hidden mb-8">
            <img src={(mc as any).cover_image_url} alt={mc.title} className="w-full h-full object-cover" />
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

        {isPremiumGated ? (
          <div className="velum-card p-8 text-center max-w-sm w-full">
            <p className="text-accent text-3xl mb-3">◈</p>
            <h3 className="text-display text-xl mb-2">Premium Content</h3>
            <p className="text-ui text-sm mb-5">Upgrade to access this class and all premium content.</p>
            <button
              onClick={() => navigate("/premium")}
              className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
            >
              Upgrade to Premium
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

            {/* Mid-audio pause prompt */}
            {activePausePrompt && (
              <div className="velum-card p-6 max-w-sm w-full mb-6">
                <p className="text-accent text-[10px] font-sans tracking-[2px] uppercase mb-3">Pause & Reflect</p>
                <p className="text-display text-lg italic mb-4">{activePausePrompt.text}</p>
                <textarea
                  value={responses[activePausePrompt.prompt_id] || ""}
                  onChange={(e) => setResponses(r => ({ ...r, [activePausePrompt.prompt_id]: e.target.value }))}
                  rows={4}
                  placeholder="Write your reflection here…"
                  className="w-full bg-secondary rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-accent/30 mb-4"
                />
                <button onClick={dismissPausePrompt}
                  className="px-5 py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                  Continue listening →
                </button>
              </div>
            )}

            {/* Post-completion prompts */}
            {showPostPrompts && postPrompts.length > 0 && (
              <div className="max-w-sm w-full">
                <div className="h-px bg-accent/10 mb-7" />
                <p className="text-accent/50 text-[10px] font-sans tracking-[2.5px] uppercase mb-2">Reflect & Write</p>
                <h3 className="text-display text-2xl mb-6">Pause Prompts</h3>
                {postPrompts.map((prompt: any) => (
                  <div key={prompt.prompt_id} className="mb-6">
                    <p className="text-display text-base italic text-foreground/70 mb-3">"{prompt.text}"</p>
                    <textarea
                      value={responses[prompt.prompt_id] || ""}
                      onChange={(e) => setResponses(r => ({ ...r, [prompt.prompt_id]: e.target.value }))}
                      rows={4}
                      placeholder="Your reflection…"
                      className="w-full bg-card rounded-xl p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none focus:outline-none border border-accent/10"
                    />
                  </div>
                ))}
                {!saved ? (
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="w-full py-4 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-bold active:scale-[0.98] transition-transform disabled:opacity-60"
                  >
                    {saveMutation.isPending ? "Saving…" : "Save to Journal"}
                  </button>
                ) : (
                  <div className="velum-card p-5 text-center">
                    <p className="text-accent text-sm font-sans font-semibold">✓ Saved to your journal</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed without prompts */}
            {completed && !showPostPrompts && (
              <div className="flex flex-col items-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                  className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6">
                  <span className="text-primary-foreground text-3xl">✓</span>
                </motion.div>
                <h3 className="text-display text-2xl mb-2">Class complete</h3>
                <p className="text-ui text-sm mb-8">{mc.title}</p>
                <div className="flex gap-3">
                  <button onClick={() => { setCurrentTime(0); setCompleted(false); if (audioRef.current) audioRef.current.currentTime = 0; }}
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
