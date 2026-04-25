import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Wind, LogOut, CheckCircle2, AlertCircle, Bell, Camera, Edit2, X, Check, Zap, Gift, Copy } from "lucide-react";
import { getSUDSStats, getCheckins } from "@/lib/velumStorage";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import NervousSystemScore from "@/components/profile/NervousSystemScore";
import { useUserProgress, useTracks, calculateStreak } from "@/hooks/useVelumData";

const categoryLabels: Record<string, string> = {
  meditation: "Meditation",
  breathwork: "Breathwork",
  eft_tapping: "EFT Tapping",
  tapping: "Tapping",
  rapid_resets: "Rapid Resets",
  journaling: "Journaling",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, session, hasAccess, signOut, loading, refreshProfile } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.full_name || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isLifetime = profile?.subscription_plan === "lifetime";
  const isCanceling = profile?.subscription_status === "canceling";

  const { data: progress = [] } = useUserProgress(user?.id);
  const { data: tracks = [] } = useTracks();

  const trackMap = useMemo(() => {
    const map: Record<string, typeof tracks[number]> = {};
    tracks.forEach((t) => (map[t.id] = t));
    return map;
  }, [tracks]);

  const completedTracks = useMemo(() =>
    progress
      .filter((p) => trackMap[p.track_id])
      .map((p) => ({ ...p, track: trackMap[p.track_id] })),
    [progress, trackMap]
  );

  const totalMinutes = useMemo(() =>
    completedTracks.reduce((sum, p) => sum + (p.track?.duration_minutes ?? 0), 0),
    [completedTracks]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTracks.forEach((p) => {
      const cat = p.track?.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [completedTracks]);

  const currentStreak = useMemo(() => calculateStreak(progress), [progress]);

  const sudsStats = useMemo(() => getSUDSStats(), []);
  const checkinCount = useMemo(() => getCheckins().length, []);

  const avgReduction = useMemo(() => {
    const stressData = progress.filter((p) => p.stress_before != null && p.stress_after != null);
    if (stressData.length === 0) return null;
    return Math.round(
      stressData.reduce((sum, p) => sum + ((p.stress_before ?? 0) - (p.stress_after ?? 0)), 0) /
        stressData.length * 10
    ) / 10;
  }, [progress]);

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
      setCancelSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setCancelError(err.message || "Could not cancel subscription.");
    } finally {
      setCanceling(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open portal");
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      setCancelError(err.message || "Could not open billing portal.");
      setOpeningPortal(false);
    }
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
        <h1 className="text-display text-3xl mb-2">Profile</h1>
        <p className="text-ui text-sm mb-8">Your journey at a glance.</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Streak", value: "0", icon: Flame },
            { label: "Sessions", value: "0", icon: Sparkles },
            { label: "Minutes", value: "0", icon: Wind },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="velum-card p-4 text-center">
              <Icon className="w-4 h-4 text-accent mx-auto mb-2" />
              <p className="text-display text-2xl">{value}</p>
              <p className="text-ui text-xs">{label}</p>
            </div>
          ))}
        </div>

        <div className="velum-card p-6 text-center">
          <p className="text-foreground font-serif text-lg mb-3">Sign in to track your progress</p>
          <p className="text-ui text-sm mb-6">Your sessions, streaks, and insights will be saved securely.</p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Friend";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("track-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("track-media").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      await refreshProfile();
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    await supabase.from("profiles").update({ full_name: nameInput.trim() }).eq("id", user.id);
    await refreshProfile();
    setEditingName(false);
    toast.success("Name updated");
  };

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-display text-xl overflow-hidden border border-accent/20 hover:border-accent/40 transition-colors"
            title="Change profile photo"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span>{displayName[0]?.toUpperCase() || "V"}</span>
            )}
            {/* Always-visible camera badge so users know it's editable */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-lg bg-background flex items-center justify-center">
              <Camera className="w-3 h-3 text-accent" />
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {uploadingAvatar && <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center"><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}
          </button>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-card border border-accent/30 rounded-lg px-3 py-1 text-foreground text-lg font-serif focus:outline-none w-40"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-accent"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-display text-2xl">{displayName}</h1>
                <button onClick={() => { setNameInput(profile?.full_name || ""); setEditingName(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Custom tracks live on /audios now — not duplicated here. */}

      {/* Subscription management */}
      <div className="velum-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-sans font-medium">
              {cancelSuccess || isCanceling
                ? "Subscription canceling"
                : hasAccess
                  ? isLifetime
                    ? "Lifetime member"
                    : `${profile?.subscription_plan ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1) : "Monthly"} plan`
                  : "No active plan"
              }
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {cancelSuccess || isCanceling
                ? "Access continues until end of billing period"
                : hasAccess
                  ? isLifetime ? "You have lifetime access" : "Active"
                  : "Subscribe to access all content"
              }
            </p>
          </div>
          {hasAccess && !isLifetime && (
            <button
              onClick={handleManageBilling}
              disabled={openingPortal}
              className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {openingPortal ? "Opening…" : "Manage"}
            </button>
          )}
          {!hasAccess && (
            <Link
              to="/premium"
              className="text-xs text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors"
            >
              Subscribe
            </Link>
          )}
        </div>
        {hasAccess && !isLifetime && (
          <p className="text-muted-foreground text-[10px] mt-3 leading-snug">
            Update card · switch plan · view invoices · pause or cancel — all in your Stripe portal.
          </p>
        )}
      </div>
      {cancelError && (
        <div className="flex items-center gap-2 mb-4 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {cancelError}
        </div>
      )}

      {/* Invite Friends — hidden until referral system is set up */}
      {/* <InviteFriendsCard /> */}

      {/* Notification Time */}
      <div className="velum-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-accent" />
            <div>
              <p className="text-foreground text-sm font-sans font-medium">Daily Reminder</p>
              <p className="text-muted-foreground text-xs mt-0.5">Get reminded to practice</p>
            </div>
          </div>
          <input
            type="time"
            defaultValue={(profile as any)?.reminder_time?.substring(0, 5) || "08:00"}
            onChange={async (e) => {
              if (!user) return;
              const { error } = await supabase
                .from("profiles")
                .update({ reminder_time: e.target.value + ":00" } as any)
                .eq("id", user.id);
              if (!error) toast.success("Reminder time updated");
            }}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-foreground text-sm font-sans focus:outline-none focus:border-accent/40"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { v: completedTracks.length, l: "Sessions", i: "◎" },
          { v: `${currentStreak}d`, l: "Current Streak", i: "✦" },
          { v: totalMinutes, l: "Minutes Practiced", i: "⟳" },
          { v: avgReduction !== null ? `${Math.round((avgReduction / 10) * 100)}%` : "—", l: "Avg Stress ↓", i: "△" },
        ].map((x) => (
          <div key={x.l} className="velum-card p-4">
            <span className="text-lg mb-2 block">{x.i}</span>
            <div className="text-display text-2xl mb-1">{x.v}</div>
            <div className="text-muted-foreground text-xs">{x.l}</div>
          </div>
        ))}
      </div>

      {/* Tool sessions stats */}
      {(sudsStats || checkinCount > 0) && (
        <div className="velum-card p-5 mb-6">
          <p className="text-ui text-xs tracking-wide uppercase mb-4">Tool Session Stats</p>
          <div className="grid grid-cols-2 gap-3">
            {checkinCount > 0 && (
              <div className="bg-surface-light rounded-xl p-3 text-center">
                <Zap className="w-4 h-4 text-accent mx-auto mb-1" />
                <p className="text-display text-2xl">{checkinCount}</p>
                <p className="text-muted-foreground text-xs">Check-ins</p>
              </div>
            )}
            {sudsStats && (
              <>
                <div className="bg-surface-light rounded-xl p-3 text-center">
                  <span className="text-lg block mb-1">△</span>
                  <p className="text-display text-2xl">{sudsStats.count}</p>
                  <p className="text-muted-foreground text-xs">Tool sessions</p>
                </div>
                <div className="bg-surface-light rounded-xl p-3 text-center col-span-2">
                  <p className="text-display text-3xl text-accent">−{sudsStats.avgReduction}</p>
                  <p className="text-muted-foreground text-xs mt-1">Average SUDS reduction per session</p>
                </div>
                {sudsStats.bestTool && (
                  <div className="bg-surface-light rounded-xl p-3 col-span-2 flex items-center gap-3">
                    <span className="text-accent text-lg">✦</span>
                    <div>
                      <p className="text-foreground text-sm font-sans font-medium capitalize">{sudsStats.bestTool}</p>
                      <p className="text-muted-foreground text-xs">Most used tool</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Nervous System Score Dashboard */}
      <NervousSystemScore />

      {/* Category breakdown */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="velum-card p-5 mb-8">
          <p className="text-ui text-xs tracking-wide uppercase mb-4">Practice Breakdown</p>
          <div className="space-y-3">
            {Object.entries(categoryCounts).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-4">
                <span className="text-muted-foreground text-xs w-24">{categoryLabels[cat] || cat}</span>
                <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent/60 rounded-full" style={{ width: `${(count / completedTracks.length) * 100}%` }} />
                </div>
                <span className="text-muted-foreground text-xs w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account management */}
      <div className="velum-card p-5 mb-6">
        <p className="text-ui text-xs tracking-wide uppercase mb-4">Account</p>
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (!user?.email) return;
              const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) toast.error(error.message);
              else toast.success("Password reset email sent to " + user.email);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent/40 transition-colors text-left"
          >
            <span className="text-foreground text-sm font-sans">Change password</span>
            <span className="text-muted-foreground text-xs">Send reset email →</span>
          </button>
          <a
            href={`mailto:hello@govelum.com?subject=Account%20deletion%20request&body=Please%20delete%20my%20account.%0A%0AEmail%3A%20${encodeURIComponent(user?.email || "")}`}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-destructive/40 transition-colors text-left"
          >
            <span className="text-destructive/90 text-sm font-sans">Delete my account</span>
            <span className="text-muted-foreground text-xs">Email request →</span>
          </a>
        </div>
      </div>

      {/* Completed sessions */}
      <div className="mb-8">
        <p className="text-ui text-xs tracking-wide uppercase mb-4">Completed Sessions</p>
        {completedTracks.length > 0 ? (
          <div className="space-y-2">
            {completedTracks.slice(0, 20).map((p: any) => (
              <Link
                key={p.id}
                to={`/player?trackId=${p.track_id}`}
                className="velum-card-flat p-3 flex items-center gap-3 hover:border-accent/20 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm truncate">{p.track?.title}</p>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider mt-0.5">{categoryLabels[p.track?.category] || p.track?.category}</p>
                </div>
                <span className="text-muted-foreground text-xs">{p.completed_date}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="velum-card p-6 text-center">
            <p className="text-muted-foreground text-sm">No sessions completed yet. Start your first practice today.</p>
            <Link to="/library" className="text-accent text-sm mt-3 inline-block">
              Browse the Library →
            </Link>
          </div>
        )}
      </div>

      {/* Contact / support footer */}
      <div className="text-center pb-4 pt-2">
        <p className="text-muted-foreground text-xs">
          Need help? <a href="mailto:hello@govelum.com" className="text-accent hover:underline">hello@govelum.com</a>
        </p>
        {/* TODO: Help / FAQ section — build later */}
      </div>
    </div>
  );
}

const BACKING_TRACK_URL = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/backing-tracks/Binaural%20Loop%201.wav";
const PROGRAM_DAYS = 21;

function CustomTracksSection() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [listensByTrack, setListensByTrack] = useState<Record<string, Set<string>>>({});
  const playingCount = useRef(0);
  const [bgVol, setBgVol] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_bg_vol") || "0.22");
    return isNaN(v) ? 0.22 : v;
  });
  const [voiceRate] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("velum_voice_rate") || "0.95");
    return isNaN(v) ? 0.95 : v;
  });

  // Web Audio API for the backing loop — decoded into memory once, loops perfectly.
  // HTMLAudioElement loop attribute is unreliable for streamed MP3s.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);

  const ensureBackingLoaded = async () => {
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
    await ensureBackingLoaded();
    const ctx = audioCtxRef.current;
    const buf = bufferRef.current;
    const gain = gainRef.current;
    if (!ctx || !buf || !gain) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (sourceRef.current) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(gain);
    src.start();
    sourceRef.current = src;
  };

  const stopBacking = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopBacking();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = bgVol;
    localStorage.setItem("velum_bg_vol", String(bgVol));
  }, [bgVol]);

  const handleVoicePlay = (e?: React.SyntheticEvent<HTMLAudioElement>) => {
    playingCount.current += 1;
    startBacking();
    if (e?.currentTarget) e.currentTarget.playbackRate = voiceRate;
  };
  const handleVoicePause = () => {
    playingCount.current = Math.max(0, playingCount.current - 1);
    if (playingCount.current === 0) stopBacking();
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("custom_tracks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTracks(data);
        const urls: Record<string, string> = {};
        for (const t of data as any[]) {
          if (!t.audio_url) continue;
          const { data: s } = await supabase.storage
            .from("custom-tracks")
            .createSignedUrl(t.audio_url, 3600);
          if (s?.signedUrl) urls[t.id] = s.signedUrl;
        }
        setSignedUrls(urls);
        // Pull all listen records for these tracks
        const trackIds = (data as any[]).map((t) => t.id);
        if (trackIds.length > 0) {
          const { data: listens } = await supabase
            .from("custom_track_listens" as any)
            .select("track_id, listened_date")
            .in("track_id", trackIds);
          const byTrack: Record<string, Set<string>> = {};
          (listens || []).forEach((l: any) => {
            if (!byTrack[l.track_id]) byTrack[l.track_id] = new Set();
            byTrack[l.track_id].add(l.listened_date);
          });
          setListensByTrack(byTrack);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  // Listen tracking: record when audio plays past 30 sec
  const recordedRef = useRef<Set<string>>(new Set());
  const handleVoiceTimeUpdate = async (trackId: string, e: React.SyntheticEvent<HTMLAudioElement>) => {
    const t = e.currentTarget.currentTime;
    const todayKey = trackId + ":" + new Date().toISOString().slice(0, 10);
    if (t < 30 || recordedRef.current.has(todayKey)) return;
    recordedRef.current.add(todayKey);
    await supabase.rpc("record_track_listen" as any, { p_track_id: trackId, p_seconds: Math.round(t) });
    // Update local state so progress dot fills immediately
    setListensByTrack((prev) => {
      const cp = { ...prev };
      const set = new Set(cp[trackId] || []);
      set.add(new Date().toISOString().slice(0, 10));
      cp[trackId] = set;
      return cp;
    });
  };

  if (loading) return null;
  if (tracks.length === 0) return null;

  return (
    <div className="velum-card p-6 mb-6 border border-accent/40 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent shadow-lg shadow-accent/5">
      <div className="flex items-center gap-2.5 mb-1">
        <Sparkles className="w-5 h-5 text-accent" />
        <p className="text-ui text-[10px] tracking-[2px] uppercase text-accent">My Audio Library</p>
      </div>
      <h2 className="text-display text-2xl mb-4">Your Custom Tracks</h2>
      <div className="space-y-3">
        {tracks.map((t: any) => {
          const daysListened = listensByTrack[t.id]?.size || 0;
          const created = t.created_at ? new Date(t.created_at) : new Date();
          const today = new Date(); today.setHours(0,0,0,0);
          const cd = new Date(created); cd.setHours(0,0,0,0);
          const dayInProgram = Math.min(PROGRAM_DAYS, Math.floor((today.getTime() - cd.getTime()) / 86400000) + 1);
          const todayKey = new Date().toISOString().slice(0, 10);
          const listenedToday = listensByTrack[t.id]?.has(todayKey);
          return (
            <div key={t.id} className="bg-card rounded-xl p-4 border border-accent/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-foreground text-base font-serif font-light leading-tight">{t.title}</p>
                  {t.issue_summary && (
                    <p className="text-muted-foreground text-xs mt-1 italic">{t.issue_summary}</p>
                  )}
                </div>
                <span className="text-accent text-[10px] uppercase tracking-wider shrink-0 font-sans font-medium">
                  {t.duration_sec ? `${Math.round(t.duration_sec / 60)} min` : "—"}
                </span>
              </div>
              {signedUrls[t.id] ? (
                <audio
                  controls
                  src={signedUrls[t.id]}
                  className="w-full"
                  preload="none"
                  style={{ height: 40 }}
                  onPlay={handleVoicePlay}
                  onPause={handleVoicePause}
                  onEnded={handleVoicePause}
                  onTimeUpdate={(e) => handleVoiceTimeUpdate(t.id, e)}
                />
              ) : (
                <p className="text-muted-foreground text-xs">Audio unavailable</p>
              )}
              {/* 21-day progress meter */}
              <div className="mt-3 pt-3 border-t border-accent/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                    Day {Math.min(dayInProgram, PROGRAM_DAYS)} of {PROGRAM_DAYS}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${listenedToday ? "text-accent" : "text-muted-foreground"}`}>
                    {listenedToday ? "✓ Listened today" : daysListened > 0 ? `${daysListened} day${daysListened === 1 ? "" : "s"} listened` : "Start today"}
                  </span>
                </div>
                <div className="flex gap-[3px]">
                  {Array.from({ length: PROGRAM_DAYS }).map((_, i) => {
                    const dayDate = new Date(cd);
                    dayDate.setDate(cd.getDate() + i);
                    const dayKey = dayDate.toISOString().slice(0, 10);
                    const listened = listensByTrack[t.id]?.has(dayKey);
                    const isPast = dayDate < today;
                    const isToday = dayKey === todayKey;
                    return (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          listened
                            ? "bg-accent"
                            : isToday
                              ? "bg-accent/30 ring-1 ring-accent/40"
                              : isPast
                                ? "bg-destructive/20"
                                : "bg-muted-foreground/15"
                        }`}
                        title={`${dayKey}${listened ? " · listened" : isToday ? " · today" : isPast ? " · missed" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-accent/15">
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
        <span className="text-muted-foreground text-[10px] min-w-[30px] text-right">{Math.round(bgVol * 200)}%</span>
      </div>
      <p className="text-muted-foreground text-[10px] tracking-wide mt-3 text-center italic">
        Listen daily for 21 days for the full effect.
      </p>
    </div>
  );
}

function InviteFriendsCard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<{ invited: number; credited: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const code = (profile as any)?.referral_code as string | undefined;
  const creditMonths = (profile as any)?.referral_credit_months as number | undefined;

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", profile.id);
      if (data) {
        setStats({
          invited: data.length,
          credited: data.filter((r: any) => r.status === "credited").length,
        });
      }
    })();
  }, [profile?.id]);

  if (!code) return null;

  const link = `https://govelum.com?ref=${code}`;
  const shareText = `I've been using Velum to regulate my nervous system — breathwork, tapping, somatic tools. You get 1 free month on me: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Try Velum", text: shareText, url: link });
        return;
      } catch {}
    }
    copy();
  };

  return (
    <div className="velum-card p-5 mb-6 border border-accent/30 bg-accent/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
          <Gift className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-foreground text-sm font-sans font-medium">Invite friends — you both get 1 month</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">Every friend who subscribes adds a free month to your account.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 bg-background border border-accent/20 rounded-lg px-3 py-2">
        <span className="text-foreground text-xs font-sans flex-1 truncate">{link}</span>
        <button onClick={copy} className="text-accent text-[11px] font-sans font-medium tracking-wide hover:text-accent/80 flex items-center gap-1">
          {copied ? (<><Check className="w-3 h-3" />Copied</>) : (<><Copy className="w-3 h-3" />Copy</>)}
        </button>
      </div>

      <button
        onClick={share}
        className="w-full gold-gradient text-primary-foreground text-sm font-sans font-semibold rounded-lg py-2.5 mb-3"
      >
        Share
      </button>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-accent/10">
        <div className="text-center">
          <p className="text-foreground text-lg font-serif">{stats?.invited ?? 0}</p>
          <p className="text-muted-foreground text-[10px] font-sans tracking-wide uppercase mt-0.5">Invited</p>
        </div>
        <div className="text-center">
          <p className="text-foreground text-lg font-serif">{stats?.credited ?? 0}</p>
          <p className="text-muted-foreground text-[10px] font-sans tracking-wide uppercase mt-0.5">Subscribed</p>
        </div>
        <div className="text-center">
          <p className="text-accent text-lg font-serif">{creditMonths ?? 0}</p>
          <p className="text-muted-foreground text-[10px] font-sans tracking-wide uppercase mt-0.5">Free months</p>
        </div>
      </div>
    </div>
  );
}
