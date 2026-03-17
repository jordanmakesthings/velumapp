import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Sparkles, Wind, Crown, Bell, LogOut, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useMemo } from "react";

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

  const isPremium = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
  const isLifetime = profile?.subscription_plan === "lifetime";
  const isCanceling = profile?.subscription_status === "canceling";

  // Fetch completed progress
  const { data: progress = [] } = useQuery({
    queryKey: ["profileProgress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("completed_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch all tracks for mapping
  const { data: tracks = [] } = useQuery({
    queryKey: ["allTracksProfile"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("*");
      return data || [];
    },
  });

  const trackMap = useMemo(() => {
    const map: Record<string, any> = {};
    tracks.forEach((t: any) => (map[t.id] = t));
    return map;
  }, [tracks]);

  const completedTracks = useMemo(() => 
    progress.filter((p: any) => trackMap[p.track_id]).map((p: any) => ({ ...p, track: trackMap[p.track_id] })),
    [progress, trackMap]
  );

  const totalMinutes = useMemo(() => 
    completedTracks.reduce((sum: number, p: any) => sum + (p.track?.duration_minutes || 0), 0),
    [completedTracks]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTracks.forEach((p: any) => {
      const cat = p.track?.category;
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [completedTracks]);

  // Streak calculation
  const currentStreak = useMemo(() => {
    if (completedTracks.length === 0) return 0;
    const dates = [...new Set(completedTracks.map((p: any) => p.completed_date).filter(Boolean))].sort().reverse();
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    for (const dateStr of dates) {
      const d = new Date(dateStr as string);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0 || diff === 1) { streak++; current = d; }
      else break;
    }
    return streak;
  }, [completedTracks]);

  // Stress chart data
  const stressChartData = useMemo(() => {
    return progress
      .filter((p: any) => p.stress_before != null && p.stress_after != null)
      .slice(0, 10)
      .reverse()
      .map((p: any, i: number) => ({
        session: `${i + 1}`,
        before: p.stress_before,
        after: p.stress_after,
      }));
  }, [progress]);

  // Average stress reduction
  const avgReduction = useMemo(() => {
    const stressData = progress.filter((p: any) => p.stress_before != null && p.stress_after != null);
    if (stressData.length === 0) return null;
    return Math.round(stressData.reduce((sum: number, p: any) => sum + (p.stress_before - p.stress_after), 0) / stressData.length * 10) / 10;
  }, [progress]);

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep access until the end of your billing period.")) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-webhook", {
        body: { action: "cancel" },
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

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-display text-xl">
            {displayName[0]?.toUpperCase() || "V"}
          </div>
          <div>
            <h1 className="text-display text-2xl">{displayName}</h1>
            <p className="text-muted-foreground text-xs">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Subscription management */}
      {isPremium && !isLifetime && (
        <div className="velum-card p-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-foreground text-sm font-sans font-medium">
              {cancelSuccess || isCanceling ? "Subscription canceling" : `${profile?.subscription_plan ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1) : "Premium"} plan`}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {cancelSuccess || isCanceling ? "Access continues until end of billing period" : "Active"}
            </p>
          </div>
          {!cancelSuccess && !isCanceling && (
            <button
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors"
            >
              {canceling ? "Canceling..." : "Cancel plan"}
            </button>
          )}
        </div>
      )}
      {cancelError && (
        <div className="flex items-center gap-2 mb-4 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5" />
          {cancelError}
        </div>
      )}

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

      {/* Stress Chart */}
      {stressChartData.length >= 2 && (
        <div className="velum-card p-5 mb-8">
          <p className="text-ui text-xs tracking-wide uppercase mb-4">Stress Tracker</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stressChartData}>
                <XAxis dataKey="session" tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background: "hsl(156,51%,12%)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px", fontSize: 12 }} />
                <Line type="monotone" dataKey="before" stroke="hsl(156,13%,49%)" strokeWidth={1.5} dot={{ r: 3 }} name="Before" />
                <Line type="monotone" dataKey="after" stroke="hsl(42,53%,54%)" strokeWidth={2} dot={{ r: 3 }} name="After" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

      {/* Upgrade CTA (if not premium) */}
      {!isPremium && (
        <Link to="/premium" className="velum-card p-5 flex items-center justify-between mb-8 group">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-accent" />
            <div>
              <p className="text-foreground text-sm font-sans font-medium">Upgrade to Premium</p>
              <p className="text-ui text-xs">Unlock the full library</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
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

      {/* Blueprint link */}
      <Link to="/blueprint" className="velum-card p-4 flex items-center justify-between mb-4 group">
        <span className="text-foreground text-sm font-sans">Your Blueprint</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
    </div>
  );
}
