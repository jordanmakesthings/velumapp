import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, Trash2, Users, Settings, BookOpen, GraduationCap, Feather, Music } from "lucide-react";

type AdminTab = "content" | "courses" | "mastery" | "users" | "settings" | "prompts";

const ADMIN_TABS: { key: AdminTab; label: string; icon: typeof Music }[] = [
  { key: "content", label: "Content", icon: Music },
  { key: "courses", label: "Courses", icon: BookOpen },
  { key: "mastery", label: "Mastery", icon: GraduationCap },
  { key: "users", label: "Users", icon: Users },
  { key: "prompts", label: "Prompts", icon: Feather },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("content");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-accent/10">
        <button onClick={() => navigate("/")} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-display text-xl">Admin Panel</h1>
      </div>

      <div className="flex">
        {/* Sidebar tabs */}
        <div className="hidden lg:flex flex-col w-48 border-r border-accent/10 min-h-[calc(100vh-57px)] py-4 px-3">
          {ADMIN_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all mb-1 ${
                activeTab === key
                  ? "text-foreground bg-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Mobile tabs */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 py-3 border-b border-accent/10 w-full">
          {ADMIN_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all ${
                activeTab === key
                  ? "gold-gradient text-primary-foreground"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-4xl">
        {/* Content Tab */}
        {activeTab === "content" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Tracks</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                <Plus className="w-4 h-4" /> Add Track
              </button>
            </div>

            {/* Upload form placeholder */}
            <div className="velum-card p-6 mb-6">
              <p className="text-ui text-xs tracking-wide uppercase mb-4">Upload New Track</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input placeholder="Title" className="bg-surface-light rounded-lg px-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30" />
                <select className="bg-surface-light rounded-lg px-4 py-3 text-foreground text-sm font-sans focus:outline-none focus:ring-1 focus:ring-accent/30">
                  <option value="">Category</option>
                  <option value="meditation">Meditation</option>
                  <option value="breathwork">Breathwork</option>
                  <option value="tapping">Tapping</option>
                  <option value="rapid_resets">Rapid Resets</option>
                  <option value="journaling">Journaling</option>
                </select>
              </div>
              <textarea placeholder="Description" className="w-full bg-surface-light rounded-lg px-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-accent/30 mb-4" />
              <div className="flex gap-4 mb-4">
                <input type="number" placeholder="Duration (min)" className="w-32 bg-surface-light rounded-lg px-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30" />
                <label className="flex items-center gap-2 text-foreground text-sm font-sans">
                  <input type="checkbox" className="accent-accent" /> Premium
                </label>
                <label className="flex items-center gap-2 text-foreground text-sm font-sans">
                  <input type="checkbox" className="accent-accent" /> Featured
                </label>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-light text-foreground text-sm font-sans hover:bg-surface transition-colors">
                  <Upload className="w-4 h-4" /> Audio file
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-light text-foreground text-sm font-sans hover:bg-surface transition-colors">
                  <Upload className="w-4 h-4" /> Thumbnail
                </button>
              </div>
            </div>

            {/* Track list */}
            <div className="velum-card p-4">
              <p className="text-muted-foreground text-sm text-center py-8">
                Connect to Lovable Cloud to manage tracks.
              </p>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Courses</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            </div>
            <div className="velum-card p-4">
              <p className="text-muted-foreground text-sm text-center py-8">
                Connect to Lovable Cloud to manage courses.
              </p>
            </div>
          </div>
        )}

        {/* Mastery Tab */}
        {activeTab === "mastery" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Mastery Classes</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium">
                <Plus className="w-4 h-4" /> Add Class
              </button>
            </div>
            <div className="velum-card p-4">
              <p className="text-muted-foreground text-sm text-center py-8">
                Connect to Lovable Cloud to manage mastery classes.
              </p>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-display text-2xl mb-6">Users</h2>
            <div className="velum-card p-4">
              <p className="text-muted-foreground text-sm text-center py-8">
                Connect to Lovable Cloud to manage users.
              </p>
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === "prompts" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-2xl">Journaling Prompts</h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium">
                <Plus className="w-4 h-4" /> Add Prompt
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                "What does your body need from you today?",
                "What are you holding onto that no longer serves you?",
                "Describe a moment this week when you felt most like yourself.",
                "What would you do today if you weren't afraid?",
                "What pattern keeps showing up in your life that you're ready to release?",
              ].map((prompt, i) => (
                <div key={i} className="velum-card p-4 flex items-start justify-between gap-4">
                  <p className="text-foreground text-sm font-sans">{prompt}</p>
                  <button className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <h2 className="text-display text-2xl mb-6">Settings</h2>
            <div className="velum-card p-6">
              <p className="text-ui text-xs tracking-wide uppercase mb-4">App Configuration</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-foreground text-sm font-sans block mb-2">Owner Email</label>
                  <input placeholder="admin@velum.app" className="w-full bg-surface-light rounded-lg px-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30" />
                </div>
                <button className="self-start px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
