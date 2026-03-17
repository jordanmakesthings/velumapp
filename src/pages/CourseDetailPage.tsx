import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Check, Crown, Lock } from "lucide-react";

const MOCK_COURSES: Record<string, {
  title: string;
  description: string;
  tracks: { id: string; title: string; duration: number; completed: boolean; isPremium: boolean }[];
}> = {
  c1: {
    title: "Foundations of Calm",
    description: "A 7-day introduction to nervous system regulation. Learn the fundamentals of breathwork, meditation, and somatic awareness.",
    tracks: [
      { id: "1", title: "Welcome & Intention Setting", duration: 8, completed: false, isPremium: false },
      { id: "2", title: "The Nervous System Explained", duration: 12, completed: false, isPremium: true },
      { id: "3", title: "Your First Breathwork Session", duration: 10, completed: false, isPremium: true },
      { id: "4", title: "Body Scan Meditation", duration: 15, completed: false, isPremium: true },
      { id: "5", title: "Introduction to Tapping", duration: 12, completed: false, isPremium: true },
      { id: "6", title: "Stress Response & Recovery", duration: 18, completed: false, isPremium: true },
      { id: "7", title: "Integration & Moving Forward", duration: 10, completed: false, isPremium: true },
    ],
  },
  c2: {
    title: "Stress Mastery",
    description: "Deep dive into stress management techniques. Build resilience and learn to regulate your nervous system under pressure.",
    tracks: [
      { id: "8", title: "Understanding Your Stress", duration: 15, completed: false, isPremium: true },
      { id: "9", title: "The Physiology of Stress", duration: 20, completed: false, isPremium: true },
      { id: "10", title: "Rapid Reset Techniques", duration: 8, completed: false, isPremium: true },
    ],
  },
  c3: {
    title: "Sleep Protocol",
    description: "Transform your relationship with sleep through guided practices designed to calm your nervous system before bed.",
    tracks: [
      { id: "11", title: "Evening Wind-Down", duration: 12, completed: false, isPremium: true },
      { id: "12", title: "Deep Sleep Meditation", duration: 25, completed: false, isPremium: true },
      { id: "13", title: "Sleep Breathwork", duration: 15, completed: false, isPremium: true },
    ],
  },
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = MOCK_COURSES[id || "c1"] || MOCK_COURSES["c1"];
  const completedCount = course.tracks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-48 bg-surface-light">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 lg:px-8 -mt-8 relative z-10 max-w-2xl mx-auto pb-8">
        <h1 className="text-display text-3xl mb-2">{course.title}</h1>
        <p className="text-ui text-sm mb-6">{course.description}</p>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full gold-gradient rounded-full"
              style={{ width: `${(completedCount / course.tracks.length) * 100}%` }}
            />
          </div>
          <span className="text-ui text-xs font-sans tabular-nums">
            {completedCount}/{course.tracks.length} sessions
          </span>
        </div>

        {/* Track list */}
        <div className="flex flex-col gap-2">
          {course.tracks.map((track, index) => (
            <Link
              key={track.id}
              to={`/player?trackId=${track.id}`}
              className="velum-card p-4 flex items-center gap-4 group"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium shrink-0 ${
                track.completed
                  ? "gold-gradient text-primary-foreground"
                  : "bg-surface-light text-muted-foreground"
              }`}>
                {track.completed ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-sans truncate">{track.title}</p>
                <p className="text-ui text-xs">{track.duration} min</p>
              </div>
              <div className="flex items-center gap-2">
                {track.isPremium && <Crown className="w-3.5 h-3.5 text-accent" />}
                <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3.5 h-3.5 text-foreground ml-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
