import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, SkipBack, Play, Pause, SkipForward, Heart, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function PlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get("trackId") || "";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch track
  const { data: track, isLoading } = useQuery({
    queryKey: ["track", trackId],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*").eq("id", trackId).single();
      return data;
    },
    enabled: !!trackId,
  });

  // Fetch favorite status
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    setIsFavorited(favorites.some((f: any) => f.track_id === trackId));
  }, [favorites, trackId]);

  // Toggle favorite
  const toggleFavMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const existing = favorites.find((f: any) => f.track_id === trackId);
      if (existing) {
        await supabase.from("favorites").delete().eq("id", (existing as any).id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, track_id: trackId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      setIsFavorited(!isFavorited);
    },
  });

  // Save progress on completion
  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      if (!user || !track) return;
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        track_id: trackId,
        completed: true,
        completed_date: new Date().toISOString().split("T")[0],
        progress_seconds: Math.round(duration),
      }, { onConflict: "user_id,track_id" }).select();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProgress"] });
    },
  });

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCompleted(true);
    saveProgressMutation.mutate();
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayDuration = track?.audio_url ? duration : (track?.duration_minutes || 10) * 60;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * (duration || displayDuration);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-ui text-sm">Track not found.</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mb-6"
        >
          <span className="text-primary-foreground text-3xl">✓</span>
        </motion.div>
        <h2 className="text-display text-2xl mb-2">Session complete</h2>
        <p className="text-ui text-sm mb-8">{track.title}</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrentTime(0); setCompleted(false); if (audioRef.current) audioRef.current.currentTime = 0; }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl velum-card-flat text-foreground text-sm font-sans active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
          <button
            onClick={() => navigate("/library")}
            className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Hidden audio element */}
      {track.audio_url && (
        <audio
          ref={audioRef}
          src={track.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Blurred background */}
      <div className="absolute inset-0 bg-surface opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(42,53%,54%,0.08)_0%,_transparent_60%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-ui text-xs tracking-wide uppercase">Now Playing</p>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Artwork */}
        <motion.div
          animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-64 h-64 lg:w-72 lg:h-72 rounded-3xl bg-card overflow-hidden mb-10 shadow-2xl"
        >
          {track.thumbnail_url ? (
            <img src={track.thumbnail_url} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-light flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-60" />
            </div>
          )}
        </motion.div>

        {/* Track info */}
        <h2 className="text-display text-2xl mb-1 text-center">{track.title}</h2>
        <p className="text-ui text-sm mb-10">{track.category}</p>

        {/* Seek bar */}
        <div className="w-full max-w-sm mb-3">
          <div
            className="h-1.5 bg-surface-light rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 gold-gradient rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-lg transition-all duration-100"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-ui text-[10px] tabular-nums">{formatTime(currentTime)}</span>
            <span className="text-ui text-[10px] tabular-nums">{formatTime(duration || displayDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mb-8">
          <button onClick={() => skip(-15)} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            )}
          </button>
          <button onClick={() => skip(15)} className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Speed & Favorite */}
        <div className="flex items-center gap-6">
          <button
            onClick={cycleSpeed}
            className="text-muted-foreground hover:text-foreground text-xs font-sans font-medium px-3 py-1.5 rounded-full bg-card transition-colors"
          >
            {speed}x
          </button>
          <button
            onClick={() => toggleFavMutation.mutate()}
            className="transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isFavorited ? "text-accent fill-accent" : "text-muted-foreground hover:text-foreground"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
