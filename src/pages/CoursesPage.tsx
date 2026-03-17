import { Link } from "react-router-dom";
import { Crown } from "lucide-react";

const COURSES = [
  {
    id: "c1",
    title: "Foundations of Calm",
    description: "A 7-day introduction to nervous system regulation",
    trackCount: 7,
    completedCount: 0,
    isPremium: true,
  },
  {
    id: "c2",
    title: "Stress Mastery",
    description: "Deep dive into stress management techniques",
    trackCount: 10,
    completedCount: 0,
    isPremium: true,
  },
  {
    id: "c3",
    title: "Sleep Protocol",
    description: "Transform your relationship with sleep",
    trackCount: 5,
    completedCount: 0,
    isPremium: true,
  },
];

export default function CoursesPage() {
  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Courses</h1>
      <p className="text-ui text-sm mb-8">Deep training programs for lasting change.</p>

      <div className="flex flex-col gap-4">
        {COURSES.map((course) => (
          <Link
            key={course.id}
            to={`/course/${course.id}`}
            className="velum-card overflow-hidden group"
          >
            <div className="h-36 bg-surface-light relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(42,53%,54%,0.1)_0%,_transparent_60%)]" />
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
    </div>
  );
}
