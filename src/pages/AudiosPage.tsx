import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Plus, Check, Edit2, X, Play, Pause, Rewind, FastForward } from "lucide-react";
import { toast } from "sonner";

const BACKING_TRACK_URL = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/backing-tracks/Binaural%20Loop.mp3";
const PROGRAM_DAYS = 21;

// Stripe Payment Links — REPLACE with your actual links once created in Stripe dashboard.
// Both links must have metadata: product=custom_track_addon, quantity=1 (single) or quantity=3 (3-pack).
const STRIPE_BUY_1_URL = "https://buy.stripe.com/REPLACE_SINGLE_LINK";
const STRIPE_BUY_3_URL = "https://buy.stripe.com/REPLACE_THREEPACK_LINK";

// Set to true once Stripe Payment Links are created and pasted above.
const ADDON_PURCHASE_ENABLED = false;

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

  const saveTitle = async (trackId: string) => {
    const newTitle = editTitle.trim();
    if (!newTitle) { setEditingId(null); return; }
    const { error } = await supabase.from("custom_tracks" as any).update({ title: newTitle } as any).eq("id", trackId);
    if (error) {
      toast.error("Couldn't rename: " + error.message);
    } else {
      setTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, title: newTitle } : t));
      toast.success("Renamed");
    }
    setEditingId(null);
  };

  // Stripe success redirect handling: ?credit_added=N appended to success_url
  useEffect(() => {
    const added = parseInt(searchParams.get("credit_added") || "0", 10);
    if (added > 0) {
      toast.success(`✓ ${added} extra track${added === 1 ? "" : "s"} added — generate a new track now`, { duration: 5000 });
      // Clean the param so refresh doesn't re-toast
      const next = new URLSearchParams(searchParams);
      next.delete("credit_added");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Backing audio: HTMLAudioElement + loop attr + watchdog poll. Web Audio kept dropping out on mobile.
  const backingRef = useRef<HTMLAudioElement | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const playingCount = useRef(0);

  // Per-track audio state
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const recordedRef = useRef<Set<string>>(new Set());

  // User-tunable
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
      // Fetch profile credits
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
          const { data: s } = await supabase.storage
            .from("custom-tracks")
            .createSignedUrl(t.audio_url, 3600);
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

  // Backing track load + control
  const ensureBackingEl = () => {
    if (backingRef.current) return backingRef.current;
    const a = new Audio(BACKING_TRACK_URL);
    a.loop = true;
    a.preload = "auto";
    a.volume = bgVol;
    a.crossOrigin = "anonymous";
    // Belt: ended event fallback if loop attr drops on iOS
    a.addEventListener("ended", () => { try { a.currentTime = 0; a.play().catch(() => {}); } catch {} });
    backingRef.current = a;
    return a;
  };
  const startBacking = async () => {
    const a = ensureBackingEl();
    try { await a.play(); } catch (e) { console.warn("backing play failed", e); }
    // Watchdog: every 4 seconds while voice plays, verify backing is still going. Restart if not.
    if (watchdogRef.current == null) {
      watchdogRef.current = window.setInterval(() => {
        const b = backingRef.current;
        if (!b || playingCount.current === 0) return;
        if (b.paused || b.ended) {
          try { b.currentTime = 0; b.play().catch(() => {}); } catch {}
        } else if (b.duration > 0 && (b.duration - b.currentTime) < 0.5) {
          // About to end — preemptively rewind to avoid the gap
          try { b.currentTime = 0; } catch {}
        }
      }, 4000);
    }
  };
  const stopBacking = () => {
    if (backingRef.current) backingRef.current.pause();
    if (watchdogRef.current != null) {
      window.clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  };
  useEffect(() => () => {
    stopBacking();
    if (backingRef.current) { backingRef.current.src = ""; backingRef.current = null; }
  }, []);

  // Persist + apply user controls
  useEffect(() => {
    if (backingRef.current) backingRef.current.volume = bgVol;
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
  };
  const handleVoicePause = () => {
    playingCount.current = Math.max(0, playingCount.current - 1);
    if (playingCount.current === 0) stopBacking();
  };
  const handleVoiceTimeUpdate = async (trackId: string, e: React.SyntheticEvent<HTMLAudioElement>) => {
    const t = e.currentTarget.currentTime;
    const todayKey = trackId + ":" + new Date().toISOString().slice(0, 10);
    if (t < 30 || recordedRef.current.has(todayKey)) return;
    recordedRef.current.add(todayKey);
    await supabase.rpc("record_track_listen" as any, { p_track_id: trackId, p_seconds: Math.round(t) });
    setListensByTrack((prev) => {
      const cp = { ...prev };
      const set = new Set(cp[trackId] || []);
      set.add(new Date().toISOString().slice(0, 10));
      cp[trackId] = set;
      return cp;
    });
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen w-full max-w-full bg-radial-subtle overflow-x-hidden pb-24">
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <p className="text-eyebrow text-accent">My Audio Library</p>
            </div>
            <h1 className="text-display text-3xl md:text-4xl leading-tight">Your custom tracks</h1>
          </div>
          <button
            onClick={() => navigate("/custom-track")}
            className="shrink-0 gold-gradient text-primary-foreground rounded-full px-4 py-2.5 text-xs font-sans font-bold tracking-wide flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {!loading && tracks.length === 0 && (
          <EmptyState hasAccess={hasAccess} />
        )}

        {tracks.length > 0 && (
          <>
            {/* Playback controls */}
            <div className="velum-card-flat p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider min-w-[80px]">Voice speed</span>
                <input
                  type="range"
                  min={0.7}
                  max={1.1}
                  step={0.05}
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="flex-1 accent-yellow-600"
                />
                <span className="text-muted-foreground text-[11px] min-w-[36px] text-right">{voiceRate.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider min-w-[80px]">Background</span>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={bgVol}
                  onChange={(e) => setBgVol(parseFloat(e.target.value))}
                  className="flex-1 accent-yellow-600"
                />
                <span className="text-muted-foreground text-[11px] min-w-[36px] text-right">{Math.round(bgVol * 200)}%</span>
              </div>
            </div>

            {/* Buy more / credits — hidden until Stripe is wired */}
            {ADDON_PURCHASE_ENABLED && (
              <BuyMoreCard credits={credits} userId={user?.id} userEmail={user?.email} />
            )}

            {/* Tracks */}
            <div className="space-y-4">
              {tracks.map((t: any) => {
                const created = new Date(t.created_at); created.setHours(0,0,0,0);
                const dayInProgram = Math.min(PROGRAM_DAYS, Math.floor((today.getTime() - created.getTime()) / 86400000) + 1);
                const trackListens = listensByTrack[t.id] || new Set();
                const listenedToday = trackListens.has(todayKey);
                return (
                  <div key={t.id} className="velum-card p-5 border border-accent/25">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        {editingId === t.id ? (
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
                              className="bg-card border border-accent/40 rounded-lg px-3 py-1 text-foreground text-xl font-serif font-light focus:outline-none flex-1 min-w-0"
                              maxLength={80}
                              style={{ fontSize: "16px" }}
                            />
                            <button onClick={() => setEditingId(null)} className="text-muted-foreground p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-foreground text-xl font-serif font-light leading-tight truncate">{t.title}</p>
                            <button
                              onClick={() => { setEditingId(t.id); setEditTitle(t.title); }}
                              className="text-muted-foreground hover:text-accent transition-colors p-1 shrink-0"
                              title="Rename"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-accent text-[10px] uppercase tracking-wider shrink-0 font-sans font-medium">
                        {t.duration_sec ? `${Math.round(t.duration_sec / 60)} min` : "—"}
                      </span>
                    </div>

                    {signedUrls[t.id] ? (
                      <CustomPlayer
                        trackId={t.id}
                        src={signedUrls[t.id]}
                        durationHint={t.duration_sec}
                        voiceRate={voiceRate}
                        onPlay={() => handleVoicePlay(t.id)}
                        onPause={handleVoicePause}
                        onTimeUpdate={(e) => handleVoiceTimeUpdate(t.id, e)}
                        registerRef={(el) => { audioRefs.current[t.id] = el; }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-xs">Audio unavailable</p>
                    )}

                    {/* 21-day progress meter (checkmarks) */}
                    <div className="mt-4 pt-3 border-t border-accent/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                          Day {dayInProgram} of {PROGRAM_DAYS}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-medium ${listenedToday ? "text-accent" : "text-muted-foreground"}`}>
                          {listenedToday ? "✓ Listened today" : trackListens.size > 0 ? `${trackListens.size} day${trackListens.size === 1 ? "" : "s"} listened` : "Start today"}
                        </span>
                      </div>
                      <div className="flex gap-1 justify-between">
                        {Array.from({ length: PROGRAM_DAYS }).map((_, i) => {
                          const dayDate = new Date(created); dayDate.setDate(created.getDate() + i);
                          const dayK = dayDate.toISOString().slice(0, 10);
                          const listened = trackListens.has(dayK);
                          const isPast = dayDate < today;
                          const isToday = dayK === todayKey;
                          return (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                listened
                                  ? "bg-accent text-primary-foreground"
                                  : isToday
                                    ? "border-2 border-accent/70 bg-accent/10 ring-2 ring-accent/30 animate-pulse"
                                    : isPast
                                      ? "border border-destructive/30"
                                      : "border border-foreground/15"
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
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ────────────── Custom Audio Player ──────────────
function CustomPlayer({
  trackId,
  src,
  durationHint,
  voiceRate,
  onPlay,
  onPause,
  onTimeUpdate,
  registerRef,
}: {
  trackId: string;
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
  const [scrubbing, setScrubbing] = useState(false);

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

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
    <div className="mt-4 bg-gradient-to-br from-accent/8 via-accent/3 to-transparent border border-accent/20 rounded-2xl p-5">
      <audio
        ref={(el) => { audioRef.current = el; registerRef(el); if (el) el.playbackRate = voiceRate; }}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || durationHint || 0)}
        onPlay={() => { setPlaying(true); onPlay(); }}
        onPause={() => { setPlaying(false); onPause(); }}
        onEnded={() => { setPlaying(false); setCurrent(0); onPause(); }}
        onTimeUpdate={(e) => { if (!scrubbing) setCurrent(e.currentTarget.currentTime); onTimeUpdate(e); }}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        <button
          onClick={() => skip(-15)}
          className="w-10 h-10 rounded-full border border-accent/25 flex items-center justify-center text-accent/70 hover:text-accent hover:border-accent/50 transition-colors shrink-0"
          aria-label="Back 15 seconds"
        >
          <Rewind className="w-4 h-4" fill="currentColor" />
        </button>

        <button
          onClick={toggle}
          className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition-transform shrink-0"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="w-7 h-7 text-primary-foreground" fill="currentColor" />
          ) : (
            <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => skip(15)}
          className="w-10 h-10 rounded-full border border-accent/25 flex items-center justify-center text-accent/70 hover:text-accent hover:border-accent/50 transition-colors shrink-0"
          aria-label="Forward 15 seconds"
        >
          <FastForward className="w-4 h-4" fill="currentColor" />
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="h-2 bg-foreground/10 rounded-full overflow-hidden cursor-pointer group"
            onClick={onSeek}
          >
            <div
              className="h-full gold-gradient rounded-full transition-all"
              style={{ width: `${progress}%`, transitionDuration: scrubbing ? "0ms" : "120ms" }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] font-sans tracking-wider text-muted-foreground/70">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyMoreCard({ credits, userId, userEmail }: { credits: number; userId?: string; userEmail?: string }) {
  // Append client_reference_id (Supabase user id) and prefilled_email to the Stripe link.
  // Webhook reads client_reference_id to credit the right user.
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
      <p className="text-muted-foreground text-xs leading-relaxed mb-3">
        Skip the 30-day wait. Generate another custom track right now — same script + voice flow, lands in this library.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={buildLink(STRIPE_BUY_1_URL)}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-accent/40 rounded-lg px-3 py-2.5 text-center text-foreground text-sm font-sans hover:bg-accent/5 transition-colors"
        >
          <div className="text-foreground font-semibold">Buy 1</div>
          <div className="text-muted-foreground text-[11px] mt-0.5">$14</div>
        </a>
        <a
          href={buildLink(STRIPE_BUY_3_URL)}
          target="_blank"
          rel="noopener noreferrer"
          className="gold-gradient rounded-lg px-3 py-2.5 text-center text-primary-foreground text-sm font-sans relative"
        >
          <span className="absolute top-1 right-2 text-[9px] tracking-wider uppercase font-bold opacity-80">Save $6</span>
          <div className="font-bold">Buy 3</div>
          <div className="text-[11px] mt-0.5 opacity-90">$36 · $12 each</div>
        </a>
      </div>
      {isPlaceholder && (
        <p className="text-destructive text-[10px] mt-2 italic">Stripe links not configured yet — replace REPLACE_SINGLE_LINK / REPLACE_THREEPACK_LINK in AudiosPage.tsx</p>
      )}
    </div>
  );
}

function EmptyState({ hasAccess }: { hasAccess: boolean }) {
  return (
    <Link
      to={hasAccess ? "/custom-track" : "/premium"}
      className="velum-card mb-6 w-full p-7 block border border-accent/45 bg-gradient-to-br from-accent/15 via-accent/8 to-transparent shadow-xl shadow-accent/10 relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <p className="text-eyebrow text-accent">Built for you · Included</p>
        </div>
        <p className="text-foreground text-[1.7rem] font-serif font-light leading-[1.15] mb-3 max-w-[440px]">
          Your library is empty. Make your first custom track.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-[440px]">
          A five-minute conversation. A custom Ericksonian hypnosis track in your chosen voice. Listen daily — your nervous system rewires itself.
        </p>
        <span className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-5 py-2.5 text-xs font-semibold tracking-wide">
          {hasAccess ? "Begin your track" : "Subscribe to begin"} →
        </span>
      </div>
    </Link>
  );
}
