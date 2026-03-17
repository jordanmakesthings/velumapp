import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, Sparkles, Wind, Zap, GraduationCap, Feather, BookOpen, Crown, Check, Play } from "lucide-react";

type Tab = "sessions" | "favorites" | "courses" | "mastery" | "journal";

const TABS: { key: Tab; label: string }[] = [
  { key: "sessions", label: "Sessions" },
  { key: "favorites", label: "Favorites" },
  { key: "courses", label: "Courses" },
  { key: "mastery", label: "Mastery" },
  { key: "journal", label: "Journal" },
];

const CATEGORIES = [
  { key: "meditation", label: "Meditation", icon: Sparkles, count: 12 },
  { key: "rapid_resets", label: "Rapid Resets", icon: Zap, count: 6 },
  { key: "breathwork", label: "Breathwork", icon: Wind, count: 8 },
  { key: "tapping", label: "Tapping", icon: Heart, count: 10 },
  { key: "journaling", label: "Journaling", icon: Feather, count: 5 },
  { key: "mastery", label: "Mastery Classes", icon: GraduationCap, count: 4 },
];

// Mock track data
const MOCK_TRACKS = [
  { id: "1", title: "Morning Calm", category: "meditation", duration: 10, isPremium: false, isCompleted: false },
  { id: "2", title: "Stress Dissolve", category: "meditation", duration: 15, isPremium: true, isCompleted: false },
  { id: "3", title: "Deep Presence", category: "meditation", duration: 20, isPremium: true, isCompleted: true },
  { id: "4", title: "Anxiety Release", category: "tapping", duration: 12, isPremium: false, isCompleted: false },
  { id: "5", title: "Confidence Boost", category: "tapping", duration: 15, isPremium: true, isCompleted: false },
  { id: "6", title: "Box Breathing Guide", category: "breathwork", duration: 8, isPremium: false, isCompleted: true },
  { id: "7", title: "Energy Activation", category: "rapid_resets", duration: 5, isPremium: false, isCompleted: false },
  { id: "8", title: "2-Minute Reset", category: "rapid_resets", duration: 2, isPremium: false, isCompleted: false },
  { id: "9", title: "Sleep Journey", category: "meditation", duration: 25, isPremium: true, isCompleted: false },
  { id: "10", title: "Body Scan Release", category: "tapping", duration: 18, isPremium: true, isCompleted: false },
];

const MOCK_COURSES = [
  { id: "c1", title: "Foundations of Calm", description: "A 7-day introduction to nervous system regulation", trackCount: 7, completedCount: 0, isPremium: true },
  { id: "c2", title: "Stress Mastery", description: "Deep dive into stress management techniques", trackCount: 10, completedCount: 0, isPremium: true },
  { id: "c3", title: "Sleep Protocol", description: "Transform your relationship with sleep", trackCount: 5, completedCount: 0, isPremium: true },
];

const MOCK_MASTERY = [
  { id: "m1", title: "The Science of Breath", duration: 45, isPremium: true },
  { id: "m2", title: "Vagus Nerve Activation", duration: 38, isPremium: true },
  { id: "m3", title: "Emotional Regulation Deep Dive", duration: 52, isPremium: true },
  { id: "m4", title: "Somatic Release Techniques", duration: 40, isPremium: true },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTracks = MOCK_TRACKS.filter((t) => {
    if (selectedCategory && t.category !== selectedCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-6">Library</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedCategory(null); setSearch(""); }}
            className={`px-4 py-2 rounded-full text-xs font-sans font-medium tracking-wide whitespace-nowrap transition-all ${
              activeTab === key
                ? "gold-gradient text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {!selectedCategory ? (
            /* Category grid */
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className="velum-card p-5 flex flex-col gap-3 text-left group"
                >
                  <Icon className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-foreground text-sm font-sans font-medium">{label}</p>
                    <p className="text-ui text-xs">{count} sessions</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Track list */
            <>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-accent text-xs font-sans mb-4 inline-block"
              >
                ← All categories
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTracks.map((track) => (
                  <Link
                    key={track.id}
                    to={`/player?trackId=${track.id}`}
                    className="velum-card overflow-hidden group"
                  >
                    <div className="aspect-video bg-surface-light relative">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                          <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      {track.isPremium && (
                        <div className="absolute top-2 right-2">
                          <Crown className="w-3.5 h-3.5 text-accent" />
                        </div>
                      )}
                      {track.isCompleted && (
                        <div className="absolute top-2 left-2 w-5 h-5 rounded-full gold-gradient flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex items-start justify-between">
                      <div>
                        <p className="text-foreground text-sm font-sans">{track.title}</p>
                        <p className="text-ui text-xs mt-1">{track.duration} min</p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); }}
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <div className="velum-card p-12 text-center">
          <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-serif text-lg mb-2">No favorites yet</p>
          <p className="text-ui text-sm">Tap the heart icon on any session to save it here.</p>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <div className="flex flex-col gap-4">
          {MOCK_COURSES.map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="velum-card overflow-hidden group"
            >
              <div className="h-32 bg-surface-light relative">
                {course.isPremium && (
                  <div className="absolute top-3 right-3">
                    <Crown className="w-4 h-4 text-accent" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-foreground font-serif text-lg mb-1">{course.title}</h3>
                <p className="text-ui text-xs mb-4">{course.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                    <div
                      className="h-full gold-gradient rounded-full transition-all"
                      style={{ width: `${(course.completedCount / course.trackCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-ui text-[10px] font-sans tabular-nums">
                    {course.completedCount}/{course.trackCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Mastery Tab */}
      {activeTab === "mastery" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOCK_MASTERY.map((mc) => (
            <Link
              key={mc.id}
              to={`/mastery-player?id=${mc.id}`}
              className="velum-card overflow-hidden group"
            >
              <div className="aspect-video bg-surface-light relative">
                {mc.isPremium && (
                  <div className="absolute top-2 right-2">
                    <Crown className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-foreground text-sm font-sans">{mc.title}</p>
                <p className="text-ui text-xs mt-1">{mc.duration} min</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === "journal" && (
        <div>
          <Link
            to="/journal"
            className="velum-card p-6 block mb-4 group"
          >
            <p className="text-ui text-xs tracking-wide uppercase mb-2">Today's prompt</p>
            <p className="text-foreground font-serif text-lg mb-3">What does your body need from you today?</p>
            <span className="text-accent text-xs font-sans">Write your reflection →</span>
          </Link>
          <div className="velum-card p-8 text-center">
            <Feather className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Past entries will appear here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
