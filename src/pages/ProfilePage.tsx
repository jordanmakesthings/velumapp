import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Wind, LogOut, CheckCircle2, AlertCircle, Bell, Camera, Edit2, X, Check } from "lucide-react";
import { useState, useMemo, useRef } from "react";
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
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.full_name || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const hasAccess = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
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
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: {},
      });
      if (error) throw error;
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
          <div className="relative group">
            <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-display text-xl overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase() || "V"
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Camera className="w-5 h-5 text-foreground" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {uploadingAvatar && <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center"><div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}
          </div>
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
          {hasAccess && !isLifetime && !cancelSuccess && !isCanceling && (
            <button
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors"
            >
              {canceling ? "Canceling..." : "Cancel plan"}
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
      </div>
      {cancelError && (
        <div className="flex items-center gap-2 mb-4 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {cancelError}
        </div>
      )}

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
    </div>
  );
}
