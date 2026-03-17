import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Gauge, Brain, Eye, Sparkles } from "lucide-react";

// Mock onboarding data (will come from profile later)
const MOCK_BLUEPRINT = {
  name: "Friend",
  goals: ["Stress & anxiety", "Sleep deeper", "More energy & focus"],
  experience: "Some experience",
  stressBaseline: 7,
  emotionalLandscape: "Unsettled",
  vision: "I wake up feeling calm and excited about my day.",
  sessionsCompleted: 0,
  totalSessions: 50,
};

export default function BlueprintPage() {
  const navigate = useNavigate();
  const bp = MOCK_BLUEPRINT;
  const hasData = bp.goals.length > 0;

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Your Blueprint</h1>
      <p className="text-ui text-sm mb-8">Your personalized nervous system map.</p>

      {!hasData ? (
        <div className="velum-card p-8 text-center">
          <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-serif text-lg mb-2">No blueprint yet</p>
          <p className="text-muted-foreground text-sm mb-6">Complete onboarding to generate your personalized blueprint.</p>
          <button
            onClick={() => navigate("/onboarding")}
            className="px-6 py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform"
          >
            Start Onboarding
          </button>
        </div>
      ) : (
        <>
          {/* Goals */}
          <div className="velum-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-accent" />
              <p className="text-ui text-xs tracking-wide uppercase">Your Goals</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {bp.goals.map((goal) => (
                <span key={goal} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-sans">
                  {goal}
                </span>
              ))}
            </div>
          </div>

          {/* Experience & Stress */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="velum-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <p className="text-ui text-xs tracking-wide uppercase">Experience</p>
              </div>
              <p className="text-foreground font-serif text-lg">{bp.experience}</p>
            </div>
            <div className="velum-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-accent" />
                <p className="text-ui text-xs tracking-wide uppercase">Stress Baseline</p>
              </div>
              <p className="text-display text-3xl text-accent">{bp.stressBaseline}</p>
              <p className="text-ui text-xs">/10</p>
            </div>
          </div>

          {/* Emotional landscape */}
          <div className="velum-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-accent" />
              <p className="text-ui text-xs tracking-wide uppercase">Inner Landscape</p>
            </div>
            <p className="text-foreground font-serif text-lg">{bp.emotionalLandscape}</p>
          </div>

          {/* 30-day vision */}
          <div className="velum-card p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-accent" />
              <p className="text-ui text-xs tracking-wide uppercase">30-Day Vision</p>
            </div>
            <p className="text-foreground font-serif text-lg italic">"{bp.vision}"</p>
          </div>

          {/* Progress */}
          <div className="velum-card p-5">
            <p className="text-ui text-xs tracking-wide uppercase mb-3">Progress Toward Goals</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full gold-gradient rounded-full transition-all"
                  style={{ width: `${(bp.sessionsCompleted / bp.totalSessions) * 100}%` }}
                />
              </div>
              <span className="text-ui text-xs font-sans tabular-nums">
                {bp.sessionsCompleted}/{bp.totalSessions}
              </span>
            </div>
            <p className="text-ui text-xs mt-2">Sessions completed</p>
          </div>
        </>
      )}
    </div>
  );
}
