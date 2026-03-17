import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, Sparkles, Wind, Crown, Bell, LogOut, ChevronRight, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const MOCK_STRESS_DATA = [
  { session: "1", before: 7, after: 4 },
  { session: "2", before: 8, after: 5 },
  { session: "3", before: 6, after: 3 },
  { session: "4", before: 7, after: 3 },
  { session: "5", before: 5, after: 2 },
  { session: "6", before: 8, after: 4 },
  { session: "7", before: 6, after: 2 },
];

const CATEGORY_STATS = [
  { label: "Meditation", count: 0 },
  { label: "Breathwork", count: 0 },
  { label: "Tapping", count: 0 },
  { label: "Rapid Resets", count: 0 },
  { label: "Journaling", count: 0 },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [remindersOn, setRemindersOn] = useState(false);

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
      <h1 className="text-display text-3xl mb-1">Hi, {displayName}</h1>
      <p className="text-ui text-sm mb-8">{user?.email}</p>

      {/* Stats */}
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

      {/* Upgrade */}
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

      {/* Stress Chart */}
      <div className="velum-card p-5 mb-8">
        <p className="text-ui text-xs tracking-wide uppercase mb-4">Stress Tracker</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_STRESS_DATA}>
              <XAxis dataKey="session" tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(156,13%,49%)" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: "hsl(156,51%,12%)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px", fontSize: 12 }} />
              <Line type="monotone" dataKey="before" stroke="hsl(156,13%,49%)" strokeWidth={1.5} dot={{ r: 3 }} name="Before" />
              <Line type="monotone" dataKey="after" stroke="hsl(42,53%,54%)" strokeWidth={2} dot={{ r: 3 }} name="After" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="velum-card p-5 mb-8">
        <p className="text-ui text-xs tracking-wide uppercase mb-4">Category Breakdown</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_STATS.map(({ label, count }) => (
            <div key={label} className="velum-card-flat px-3 py-1.5 flex items-center gap-2">
              <span className="text-foreground text-xs font-sans">{label}</span>
              <span className="text-accent text-xs font-sans font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="velum-card-flat p-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground text-sm font-sans">Push reminders</span>
        </div>
        <button
          onClick={() => setRemindersOn(!remindersOn)}
          className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-200 ${
            remindersOn ? "bg-accent" : "bg-surface-light"
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-foreground transition-transform duration-200 ${
            remindersOn ? "translate-x-5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Blueprint link */}
      <Link to="/blueprint" className="velum-card p-4 flex items-center justify-between mb-4 group">
        <span className="text-foreground text-sm font-sans">Your Blueprint</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full velum-card-flat p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors mt-4"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-sans">Sign out</span>
      </button>
    </div>
  );
}
