import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("order_index");
      return data || [];
    },
  });

  const { data: coursesV2 = [] } = useQuery({
    queryKey: ["coursesV2"],
    queryFn: async () => {
      const { data } = await supabase.from("courses_v2").select("*").eq("is_published", true).order("order_index");
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["courseProgressAll", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["allCourseTracks"],
    queryFn: async () => {
      const { data } = await supabase.from("tracks").select("id, course_id").not("course_id", "is", null);
      return data || [];
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lessonProgressAll", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("lesson_progress").select("*").eq("user_id", user.id).eq("completed", true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["allLessons"],
    queryFn: async () => {
      const { data } = await supabase.from("lessons").select("id, course_id");
      return data || [];
    },
  });

  const searched = searchQuery
    ? courses.filter((c: any) => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : courses;

  const v2Searched = searchQuery
    ? coursesV2.filter((c: any) => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : coursesV2;

  // Show all courses together — no free/premium separation
  const allCourses = searched;

  const getTrackCount = (courseId: string) => tracks.filter((t: any) => t.course_id === courseId).length;
  const getCompletedCount = (courseId: string) => {
    const courseTrackIds = tracks.filter((t: any) => t.course_id === courseId).map((t: any) => t.id);
    return progress.filter((p: any) => courseTrackIds.includes(p.track_id)).length;
  };

  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <p className="text-accent/50 text-[10px] font-sans tracking-[2.5px] uppercase mb-2">Programs</p>
      <h1 className="text-display text-3xl mb-2">Courses</h1>
      <p className="text-ui text-sm mb-6">Structured transformation, at your pace.</p>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="velum-card overflow-hidden animate-pulse">
              <div className="h-36 bg-surface-light" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-48 rounded bg-surface-light" />
                <div className="h-3 w-32 rounded bg-surface-light" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* CourseV2 cards */}
          {v2Searched.length > 0 && (
            <section className="mb-10">
              <p className="text-accent text-[10px] font-sans tracking-[2.5px] uppercase mb-4">Courses</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {v2Searched.map((course: any) => {
                  const courseLessons = lessons.filter((l: any) => l.course_id === course.id);
                  const completedLessons = lessonProgress.filter((p: any) => p.course_id === course.id).length;
                  return (
                    <Link key={course.id} to={`/course-v2?courseId=${course.id}`} className="velum-card overflow-hidden group">
                      <div className="h-36 bg-surface-light relative">
                        {course.cover_image_url ? (
                          <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(42,53%,54%,0.1)_0%,_transparent_60%)]" />
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-foreground font-serif text-lg mb-1">{course.title}</h3>
                        <p className="text-ui text-xs mb-4">{course.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                            <div className="h-full gold-gradient rounded-full" style={{ width: `${courseLessons.length ? (completedLessons / courseLessons.length) * 100 : 0}%` }} />
                          </div>
                          <span className="text-ui text-[10px] font-sans tabular-nums">{completedLessons}/{courseLessons.length}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* All courses */}
          {allCourses.length > 0 && (
            <section className="mb-10">
              <p className="text-accent text-[10px] font-sans tracking-[2.5px] uppercase mb-4">Programs</p>
              <div className="flex flex-col gap-4">
                {allCourses.map((course: any) => {
                  const trackCount = getTrackCount(course.id);
                  const completedCount = getCompletedCount(course.id);
                  return (
                    <CourseCard key={course.id} course={course} trackCount={trackCount} completedCount={completedCount} />
                  );
                })}
              </div>
            </section>
          )}

          {searched.length === 0 && v2Searched.length === 0 && (
            <div className="text-center py-16">
              <p className="text-ui text-sm">No courses found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseCard({ course, trackCount, completedCount }: { course: any; trackCount: number; completedCount: number }) {
  return (
    <Link to={`/course/${course.id}`} className="velum-card overflow-hidden group">
      <div className="h-36 bg-surface-light relative">
        {(course.cover_image_url || course.thumbnail_url) ? (
          <img src={course.cover_image_url || course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(42,53%,54%,0.1)_0%,_transparent_60%)]" />
        )}
        
      </div>
      <div className="p-5">
        <h3 className="text-foreground font-serif text-lg mb-1">{course.title}</h3>
        <p className="text-ui text-xs mb-4">{course.description}</p>
        {trackCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div className="h-full gold-gradient rounded-full transition-all" style={{ width: `${(completedCount / trackCount) * 100}%` }} />
            </div>
            <span className="text-ui text-[10px] font-sans tabular-nums">{completedCount}/{trackCount}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
