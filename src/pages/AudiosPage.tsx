import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Plus, Check, ShoppingCart } from "lucide-react";
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

  // Backing audio (Web Audio API for reliable looping)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);
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
  const ensureBacking = async () => {
    if (bufferRef.current) return;
    if (loadingRef.current) return loadingRef.current;
    loadingRef.current = (async () => {
      try {
        const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = bgVol;
        gain.connect(ctx.destination);
        gainRef.current = gain;
        const res = await fetch(BACKING_TRACK_URL);
        const arr = await res.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        bufferRef.current = buf;
      } catch (e) {
        console.warn("backing load failed", e);
      }
    })();
    return loadingRef.current;
  };
  const startBacking = async () => {
    await ensureBacking();
    const ctx = audioCtxRef.current; const buf = bufferRef.current; const gain = gainRef.current;
    if (!ctx || !buf || !gain) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (sourceRef.current) return;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; src.connect(gain); src.start();
    sourceRef.current = src;
  };
  const stopBacking = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
  };
  useEffect(() => () => { stopBacking(); audioCtxRef.current?.close().catch(() => {}); }, []);

  // Persist + apply user controls
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = bgVol;
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
                        <p className="text-foreground text-xl font-serif font-light leading-tight">{t.title}</p>
                        {t.issue_summary && (
                          <p className="text-muted-foreground text-xs italic mt-1 line-clamp-2">{t.issue_summary}</p>
                        )}
                      </div>
                      <span className="text-accent text-[10px] uppercase tracking-wider shrink-0 font-sans font-medium">
                        {t.duration_sec ? `${Math.round(t.duration_sec / 60)} min` : "—"}
                      </span>
                    </div>

                    {signedUrls[t.id] ? (
                      <audio
                        ref={(el) => { audioRefs.current[t.id] = el; if (el) el.playbackRate = voiceRate; }}
                        controls
                        src={signedUrls[t.id]}
                        className="w-full mt-3"
                        preload="metadata"
                        style={{ height: 40 }}
                        onPlay={() => handleVoicePlay(t.id)}
                        onPause={handleVoicePause}
                        onEnded={handleVoicePause}
                        onTimeUpdate={(e) => handleVoiceTimeUpdate(t.id, e)}
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
