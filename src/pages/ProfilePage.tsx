import { Flame, Sparkles, Wind } from "lucide-react";

export default function ProfilePage() {
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
        <p className="text-foreground font-serif text-lg mb-3">Sign in to track your progress.</p>
        <button className="px-8 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
          Sign in
        </button>
      </div>
    </div>
  );
}
