import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Plus, Check, Edit2, X, Play, Pause, Rewind, FastForward, Settings2, Flame, Clock, Library } from "lucide-react";
import { toast } from "sonner";

const BACKING_TRACK_URL = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/backing-tracks/Binaural%20Loop.mp3";
const PROGRAM_DAYS = 21;

const STRIPE_BUY_1_URL = "https://buy.stripe.com/REPLACE_SINGLE_LINK";
const STRIPE_BUY_3_URL = "https://buy.stripe.com/REPLACE_THREEPACK_LINK";
const ADDON_PURCHASE_ENABLED = false;

// ── helpers ──
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function AudiosPage() {
  const navigate = useNavigate();
  const { user, hasAccess } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [listensByTrack, setListensByTrack] = useState<Record<string, Set<string>>>({});
  const [credits, setCredits] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayKey = dayKey(new Date());

  const saveTitle = async (trackId: string) => {
    const newTitle = editTitle.trim();
    if (!newTitle) { setEditingId(null); return; }
    const { error } = await supabase.from("custom_tracks" as any).update({ title: newTitle } as any).eq("id", trackId);
    if (error) toast.error("Couldn't rename: " + error.message);
    else {
      setTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, title: newTitle } : t));
      toast.success("Renamed");
    }
    setEditingId(null);
  };

  useEffect(() => {
    const added = parseInt(searchParams.get("credit_added") || "0", 10);
    if (added > 0) {
      toast.success(`✓ ${added} extra track${added === 1 ? "" : "s"} added`, { duration: 5000 });
      const next = new URLSearchParams(searchParams);
      next.delete("credit_added");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Backing audio (Web Audio API — sample-accurate seamless loop)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const backingBufferRef = useRef<AudioBuffer | null>(null);
  const backingSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const backingGainRef = useRef<GainNode | null>(null);
  const backingLoadingRef = useRef<Promise<void> | null>(null);
  const playingCount = useRef(0);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const recordedRef = useRef<Set<string>>(new Set());

  const [bgVol, setBgVol] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_bg_vol") || "0.22");
    return isNaN(v) ? 0.22 : v;
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_voice_rate") || "0.95");
    return isNaN(v) ? 0.95 : v;
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("extra_track_credits")
        .eq("id", user.id)
        .maybeSingle();
      setCredits(((prof as any)?.extra_track_credits as number | null) ?? 0);

      const { data } = await supabase
        .from("custom_tracks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data || []) as any[];
      setTracks(list);
      if (list.length > 0) {
        const urls: Record<string, string> = {};
        for (const t of list) {
          if (!t.audio_url) continue;
          const { data: s } = await supabase.storage.from("custom-tracks").createSignedUrl(t.audio_url, 3600);
          if (s?.signedUrl) urls[t.id] = s.signedUrl;
        }
        setSignedUrls(urls);
        const ids = list.map((t) => t.id);
        const { data: ls } = await supabase
          .from("custom_track_listens" as any)
          .select("track_id, listened_date")
          .in("track_id", ids);
        const m: Record<string, Set<string>> = {};
        (ls || []).forEach((l: any) => {
          if (!m[l.track_id]) m[l.track_id] = new Set();
          m[l.track_id].add(l.listened_date);
        });
        setListensByTrack(m);
      }
      setLoading(false);
    })();
  }, [user]);

  // Lazy-load + decode the backing buffer once.
  const ensureBacking = async () => {
    if (backingBufferRef.current) return;
    if (backingLoadingRef.current) return backingLoadingRef.current;
    backingLoadingRef.current = (async () => {
      try {
        const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = audioCtxRef.current ?? new Ctx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = bgVol;
        gain.connect(ctx.destination);
        backingGainRef.current = gain;
        const res = await fetch(BACKING_TRACK_URL);
        const arr = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        backingBufferRef.current = buf;
      } catch (e) {
        console.warn("backing buffer load failed", e);
      }
    })();
    return backingLoadingRef.current;
  };
  const startBacking = async () => {
    await ensureBacking();
    const ctx = audioCtxRef.current; const buf = backingBufferRef.current; const gain = backingGainRef.current;
    if (!ctx || !buf || !gain) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (backingSourceRef.current) return; // already running
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;            // sample-accurate seamless loop at the buffer level
    src.loopStart = 0;
    src.loopEnd = buf.duration; // explicit, in case browser defaults differ
    src.connect(gain);
    src.start(0);
    backingSourceRef.current = src;
  };
  const stopBacking = () => {
    const src = backingSourceRef.current;
    if (src) {
      try { src.stop(); src.disconnect(); } catch {}
      backingSourceRef.current = null;
    }
  };
  useEffect(() => () => {
    stopBacking();
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  useEffect(() => {
    if (backingGainRef.current && audioCtxRef.current) {
      // smooth ramp to avoid click on slider drag
      backingGainRef.current.gain.setTargetAtTime(bgVol, audioCtxRef.current.currentTime, 0.05);
    }
    localStorage.setItem("velum_bg_vol", String(bgVol));
  }, [bgVol]);
  useEffect(() => {
    localStorage.setItem("velum_voice_rate", String(voiceRate));
    Object.values(audioRefs.current).forEach((a) => { if (a) a.playbackRate = voiceRate; });
  }, [voiceRate]);

  const handleVoicePlay = (id: string) => {
    playingCount.current += 1;
    startBacking();
    const a = audioRefs.current[id];
    if (a) a.playbackRate = voiceRate;
    // Pause every other voice track (one at a time)
    Object.entries(audioRefs.current).forEach(([k, el]) => {
      if (k !== id && el && !el.paused) el.pause();
    });
  };
  const handleVoicePause = () => {
    playingCount.current = Math.max(0, playingCount.current - 1);
    if (playingCount.current === 0) stopBacking();
  };
  const handleVoiceTimeUpdate = async (trackId: string, e: React.SyntheticEvent<HTMLAudioElement>) => {
    const t = e.currentTarget.currentTime;
    const todayK = trackId + ":" + todayKey;
    if (t < 30 || recordedRef.current.has(todayK)) return;
    recordedRef.current.add(todayK);
    await supabase.rpc("record_track_listen" as any, { p_track_id: trackId, p_seconds: Math.round(t) });
    setListensByTrack((prev) => {
      const cp = { ...prev };
      const set = new Set(cp[trackId] || []);
      set.add(todayKey);
      cp[trackId] = set;
      return cp;
    });
  };

  // ── stats ──
  const stats = useMemo(() => {
    const allListenDates = new Set<string>();
    Object.values(listensByTrack).forEach((s) => s.forEach((d) => allListenDates.add(d)));
    let streak = 0;
    const cursor = new Date(today);
    while (allListenDates.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const totalListens = Array.from(allListenDates).length;
    return { streak, totalListens, trackCount: tracks.length };
  }, [listensByTrack, tracks, today]);

  // Active = user-promoted track or most-recent
  const [promotedId, setPromotedId] = useState<string | null>(null);
  const activeTrack = useMemo(() => {
    if (tracks.length === 0) return null;
    if (promotedId) {
      const p = tracks.find((t) => t.id === promotedId);
      if (p) return p;
    }
    return tracks[0];
  }, [tracks, promotedId]);
  const archivedTracks = useMemo(() => {
    return tracks.filter((t) => !activeTrack || t.id !== activeTrack.id);
  }, [tracks, activeTrack]);

  const renderTrackTitle = (t: any, size: "hero" | "row") => (
    editingId === t.id ? (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle(t.id);
            if (e.key === "Escape") setEditingId(null);
          }}
          onBlur={() => saveTitle(t.id)}
          className={`bg-card border border-accent/40 rounded-lg px-3 py-1 text-foreground font-serif font-light focus:outline-none flex-1 min-w-0 ${size === "hero" ? "text-2xl" : "text-base"}`}
          maxLength={80}
          style={{ fontSize: size === "hero" ? "24px" : "16px" }}
        />
        <button onClick={() => setEditingId(null)} className="text-muted-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2 min-w-0">
        <p className={`text-foreground font-serif font-light leading-tight truncate ${size === "hero" ? "text-display text-3xl md:text-4xl" : "text-lg"}`}>{t.title}</p>
        <button
          onClick={() => { setEditingId(t.id); setEditTitle(t.title); }}
          className="text-muted-foreground/60 hover:text-accent transition-colors p-1 shrink-0"
          title="Rename"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  );

  return (
    <div className="min-h-screen w-full max-w-full bg-radial-subtle overflow-x-hidden pb-32">
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-8 lg:px-8">

        {/* ── Header ── */}
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-accent mb-2">Your Library</p>
            <h1 className="text-display text-3xl md:text-4xl leading-tight">Custom Audio Library</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className={`w-10 h-10 rounded-full border transition-colors flex items-center justify-center ${showSettings ? "border-accent text-accent bg-accent/10" : "border-foreground/15 text-muted-foreground hover:text-accent hover:border-accent/40"}`}
              aria-label="Playback settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/custom-track")}
              className="gold-gradient text-primary-foreground rounded-full pl-3 pr-4 py-2.5 text-xs font-sans font-bold tracking-wide flex items-center gap-1.5 shadow-lg shadow-accent/20"
            >
              <Plus className="w-3.5 h-3.5" /> New track
            </button>
          </div>
        </header>

        {/* ── Settings drawer ── */}
        {showSettings && tracks.length > 0 && (
          <div className="velum-card-flat p-4 mb-6 border border-accent/15">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider min-w-[80px]">Voice speed</span>
              <input type="range" min={0.7} max={1.1} step={0.05} value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-600" />
              <span className="text-muted-foreground text-[11px] min-w-[36px] text-right">{voiceRate.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-[10px] uppercase tracking-wider min-w-[80px]">Background</span>
              <input type="range" min={0} max={0.5} step={0.01} value={bgVol}
                onChange={(e) => setBgVol(parseFloat(e.target.value))}
                className="flex-1 accent-yellow-600" />
              <span className="text-muted-foreground text-[11px] min-w-[36px] text-right">{Math.round(bgVol * 200)}%</span>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && tracks.length === 0 && <EmptyState hasAccess={hasAccess} />}

        {tracks.length > 0 && (
          <>
            {/* ── Stats strip ── */}
            <StatsStrip streak={stats.streak} totalListens={stats.totalListens} trackCount={stats.trackCount} />

            {ADDON_PURCHASE_ENABLED && (
              <BuyMoreCard credits={credits} userId={user?.id} userEmail={user?.email} />
            )}

            {/* ── Hero (active 21-day track) ── */}
            {activeTrack && (
              <HeroTrackCard
                track={activeTrack}
                titleNode={renderTrackTitle(activeTrack, "hero")}
                signedUrl={signedUrls[activeTrack.id]}
                listens={listensByTrack[activeTrack.id] || new Set()}
                today={today}
                todayKey={todayKey}
                voiceRate={voiceRate}
                onPlay={() => handleVoicePlay(activeTrack.id)}
                onPause={handleVoicePause}
                onTimeUpdate={(e) => handleVoiceTimeUpdate(activeTrack.id, e)}
                registerRef={(el) => { audioRefs.current[activeTrack.id] = el; }}
              />
            )}

            {/* ── Archive ── */}
            {archivedTracks.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-eyebrow text-muted-foreground">Archive</p>
                  <div className="flex-1 h-px bg-foreground/10" />
                  <span className="text-muted-foreground text-[10px] tracking-wider uppercase">{archivedTracks.length}</span>
                </div>
                <div className="space-y-3">
                  {archivedTracks.map((t) => {
                    const created = new Date(t.created_at); created.setHours(0,0,0,0);
                    const dayInProgram = Math.min(PROGRAM_DAYS, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1);
                    const trackListens = listensByTrack[t.id] || new Set();
                    return (
                      <ArchiveTrackRow
                        key={t.id}
                        track={t}
                        titleNode={renderTrackTitle(t, "row")}
                        dayInProgram={dayInProgram}
                        listenCount={trackListens.size}
                        onPromote={() => {
                          setPromotedId(t.id);
                          // Scroll the hero into view
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ────────────── Stats Strip ──────────────
function StatsStrip({ streak, totalListens, trackCount }: { streak: number; totalListens: number; trackCount: number }) {
  const items = [
    { icon: Flame, label: "Day streak", value: streak, accent: streak > 0 },
    { icon: Clock, label: "Total listens", value: totalListens, accent: false },
    { icon: Library, label: "Tracks", value: trackCount, accent: false },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mb-8">
      {items.map(({ icon: Icon, label, value, accent }) => (
        <div key={label} className="velum-card-flat py-4 px-3 text-center border border-accent/10">
          <Icon className={`w-4 h-4 mx-auto mb-1.5 ${accent ? "text-accent" : "text-muted-foreground/70"}`} strokeWidth={1.5} />
          <p className={`font-serif text-2xl font-light leading-none mb-1 ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
          <p className="text-muted-foreground text-[10px] tracking-wider uppercase">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ────────────── Hero Track Card (active 21-day program) ──────────────
function HeroTrackCard({
  track, titleNode, signedUrl, listens, today, todayKey, voiceRate,
  onPlay, onPause, onTimeUpdate, registerRef,
}: {
  track: any;
  titleNode: React.ReactNode;
  signedUrl?: string;
  listens: Set<string>;
  today: Date;
  todayKey: string;
  voiceRate: number;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  registerRef: (el: HTMLAudioElement | null) => void;
}) {
  const created = new Date(track.created_at); created.setHours(0,0,0,0);
  const dayInProgram = Math.min(PROGRAM_DAYS, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1);
  const listenedToday = listens.has(todayKey);
  const completedDays = listens.size;

  return (
    <div className="relative">
      {/* Ambient halo */}
      <div className="absolute -inset-4 -z-10 opacity-60 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full"
             style={{ background: "radial-gradient(ellipse, hsla(42, 53%, 45%, 0.10) 0%, transparent 65%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative velum-card-accent p-7 md:p-9">
        <div className="flex items-center justify-end mb-3">
          <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
            {track.duration_sec ? `${Math.round(track.duration_sec / 60)} min` : "—"}
          </span>
        </div>

        <div className="mb-5">{titleNode}</div>

        {signedUrl ? (
          <BigPlayer
            src={signedUrl}
            durationHint={track.duration_sec}
            voiceRate={voiceRate}
            onPlay={onPlay}
            onPause={onPause}
            onTimeUpdate={onTimeUpdate}
            registerRef={registerRef}
          />
        ) : (
          <p className="text-muted-foreground text-xs">Audio unavailable</p>
        )}

        {/* Day strip */}
        <div className="mt-7 pt-5 border-t border-accent/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground/80 text-[11px] tracking-wider uppercase font-medium">
              Day <span className="text-accent">{dayInProgram}</span> <span className="text-muted-foreground/60">of {PROGRAM_DAYS}</span>
            </span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${listenedToday ? "text-accent" : "text-muted-foreground"}`}>
              {listenedToday ? "✓ Listened today" : completedDays > 0 ? `${completedDays}/${PROGRAM_DAYS}` : "Begin today"}
            </span>
          </div>
          <div className="flex gap-1 justify-between">
            {Array.from({ length: PROGRAM_DAYS }).map((_, i) => {
              const dayDate = new Date(created); dayDate.setDate(created.getDate() + i);
              const dayK = dayKey(dayDate);
              const listened = listens.has(dayK);
              const isPast = dayDate < today;
              const isToday = dayK === todayKey;
              return (
                <div key={i}
                  className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${
                    listened
                      ? "bg-accent/95 text-primary-foreground"
                      : isToday
                        ? "border-2 border-accent/70 bg-accent/10 ring-2 ring-accent/25 animate-pulse"
                        : isPast
                          ? "border border-destructive/25 bg-destructive/5"
                          : "border border-foreground/10"
                  }`}
                  title={`Day ${i + 1}${listened ? " · listened" : isToday ? " · today" : isPast ? " · missed" : ""}`}
                >
                  {listened && <Check className="w-3 h-3" strokeWidth={3} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────── Big Player (hero) ──────────────
function BigPlayer({
  src, durationHint, voiceRate,
  onPlay, onPause, onTimeUpdate, registerRef,
}: {
  src: string;
  durationHint?: number;
  voiceRate: number;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  registerRef: (el: HTMLAudioElement | null) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationHint || 0);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.playbackRate = voiceRate;
      try { await a.play(); setPlaying(true); } catch {}
    } else {
      a.pause();
      setPlaying(false);
    }
  };
  const skip = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.duration || 0) - 0.1, a.currentTime + delta));
  };
  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * a.duration;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div>
      <audio
        ref={(el) => { audioRef.current = el; registerRef(el); if (el) el.playbackRate = voiceRate; }}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || durationHint || 0)}
        onPlay={() => { setPlaying(true); onPlay(); }}
        onPause={() => { setPlaying(false); onPause(); }}
        onEnded={() => { setPlaying(false); setCurrent(0); onPause(); }}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); onTimeUpdate(e); }}
        className="hidden"
      />

      {/* Progress + times */}
      <div className="mb-5">
        <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden cursor-pointer" onClick={onSeek}>
          <div className="h-full gold-gradient rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] tracking-wider font-sans text-muted-foreground/80 tabular-nums">
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-15)}
          className="w-12 h-12 rounded-full border border-accent/25 flex items-center justify-center text-accent/80 hover:text-accent hover:border-accent/50 transition-colors"
          aria-label="Back 15 seconds"
        >
          <Rewind className="w-5 h-5" fill="currentColor" />
        </button>
        <button
          onClick={toggle}
          className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center shadow-2xl shadow-accent/40 active:scale-95 transition-transform"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="w-9 h-9 text-primary-foreground" fill="currentColor" />
          ) : (
            <Play className="w-9 h-9 text-primary-foreground ml-1" fill="currentColor" />
          )}
        </button>
        <button
          onClick={() => skip(15)}
          className="w-12 h-12 rounded-full border border-accent/25 flex items-center justify-center text-accent/80 hover:text-accent hover:border-accent/50 transition-colors"
          aria-label="Forward 15 seconds"
        >
          <FastForward className="w-5 h-5" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}

// ────────────── Archive Row (tap to promote to hero) ──────────────
function ArchiveTrackRow({
  track, titleNode, dayInProgram, listenCount, onPromote,
}: {
  track: any;
  titleNode: React.ReactNode;
  dayInProgram: number;
  listenCount: number;
  onPromote: () => void;
}) {
  const completedProgram = listenCount >= PROGRAM_DAYS;
  return (
    <button
      onClick={onPromote}
      className="velum-card w-full p-4 text-left transition-all hover:border-accent/40 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-full gold-gradient flex items-center justify-center shadow-md shadow-accent/25 group-hover:scale-105 transition-transform">
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          {titleNode}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] tracking-wider uppercase text-muted-foreground/70">
            <span>{track.duration_sec ? `${Math.round(track.duration_sec / 60)} min` : "—"}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>Day {dayInProgram}/{PROGRAM_DAYS}</span>
            {completedProgram && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-accent">✓ Complete</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ────────────── Empty State ──────────────
function EmptyState({ hasAccess }: { hasAccess: boolean }) {
  return (
    <Link
      to={hasAccess ? "/custom-track" : "/premium"}
      className="velum-card-accent block p-8 md:p-10 relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <p className="text-eyebrow text-accent">Made for you · Included</p>
        </div>
        <p className="text-display text-3xl md:text-4xl mb-4 max-w-[440px] leading-tight">
          Make your first<br />custom rewiring audio.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-7 max-w-[440px]">
          A short conversation. A 10-minute audio designed around your deepest desires, in your chosen voice. Listen daily — your nervous system rewires itself.
        </p>
        <span className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-6 py-3 text-xs font-bold tracking-wide">
          {hasAccess ? "Begin your audio →" : "Subscribe to begin →"}
        </span>
      </div>
    </Link>
  );
}

// ────────────── Buy More (parked) ──────────────
function BuyMoreCard({ credits, userId, userEmail }: { credits: number; userId?: string; userEmail?: string }) {
  const buildLink = (base: string) => {
    if (!userId) return base;
    const params = new URLSearchParams();
    params.set("client_reference_id", userId);
    if (userEmail) params.set("prefilled_email", userEmail);
    return `${base}?${params.toString()}`;
  };
  const isPlaceholder = STRIPE_BUY_1_URL.includes("REPLACE");
  return (
    <div className="velum-card-flat p-4 mb-5 border border-accent/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <p className="text-eyebrow text-accent">Need more this month?</p>
        </div>
        {credits > 0 && (
          <span className="text-accent text-[11px] font-sans font-medium tracking-wide">
            ✓ {credits} extra {credits === 1 ? "track" : "tracks"} ready
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={buildLink(STRIPE_BUY_1_URL)} target="_blank" rel="noopener noreferrer"
          className="border border-accent/40 rounded-lg px-3 py-2.5 text-center text-foreground text-sm font-sans hover:bg-accent/5 transition-colors">
          <div className="text-foreground font-semibold">Buy 1</div>
          <div className="text-muted-foreground text-[11px] mt-0.5">$14</div>
        </a>
        <a href={buildLink(STRIPE_BUY_3_URL)} target="_blank" rel="noopener noreferrer"
          className="gold-gradient rounded-lg px-3 py-2.5 text-center text-primary-foreground text-sm font-sans relative">
          <span className="absolute top-1 right-2 text-[9px] tracking-wider uppercase font-bold opacity-80">Save $6</span>
          <div className="font-bold">Buy 3</div>
          <div className="text-[11px] mt-0.5 opacity-90">$36</div>
        </a>
      </div>
      {isPlaceholder && (
        <p className="text-destructive text-[10px] mt-2 italic">Stripe links not configured yet</p>
      )}
    </div>
  );
}
