/**
 * Shared data hooks for Velum.
 *
 * All React Query cache keys are defined here so every page shares the same
 * cache entries. Never inline a Supabase query directly in a page — use or
 * extend these hooks instead.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Row types derived from the generated Database type
// ---------------------------------------------------------------------------
export type Track = Database["public"]["Tables"]["tracks"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseV2 = Database["public"]["Tables"]["courses_v2"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type MasteryClass = Database["public"]["Tables"]["mastery_classes"]["Row"];
export type MasteryClassResponse = Database["public"]["Tables"]["mastery_class_responses"]["Row"];
export type UserProgress = Database["public"]["Tables"]["user_progress"]["Row"];
export type Favorite = Database["public"]["Tables"]["favorites"]["Row"];
export type Subcategory = Database["public"]["Tables"]["subcategories"]["Row"];
export type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];
export type DailyReflection = Database["public"]["Tables"]["daily_reflections"]["Row"];
export type JournalingPrompt = Database["public"]["Tables"]["journaling_prompts"]["Row"];
export type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// ---------------------------------------------------------------------------
// Cache keys — single source of truth
// ---------------------------------------------------------------------------
export const QUERY_KEYS = {
  tracks: ["tracks"] as const,
  track: (id: string) => ["tracks", id] as const,
  courses: ["courses"] as const,
  coursesV2: (publishedOnly = false) => ["courses_v2", { publishedOnly }] as const,
  courseLessons: (courseId: string) => ["lessons", courseId] as const,
  allLessonCounts: (ids: string[]) => ["lessons", "counts", ids] as const,
  masteryClasses: ["mastery_classes"] as const,
  masteryClass: (id: string) => ["mastery_classes", id] as const,
  subcategories: ["subcategories"] as const,
  userProgress: (userId: string | undefined) => ["user_progress", userId] as const,
  favorites: (userId: string | undefined) => ["favorites", userId] as const,
  journalEntries: (userId: string | undefined) => ["journal_entries", userId] as const,
  lessonProgress: (userId: string | undefined) => ["lesson_progress", userId] as const,
} as const;

// ---------------------------------------------------------------------------
// Content hooks
// ---------------------------------------------------------------------------

export function useTracks() {
  return useQuery({
    queryKey: QUERY_KEYS.tracks,
    queryFn: async () => {
      const { data, error } = await supabase.from("tracks").select("*").order("order_index");
      if (error) throw error;
      return (data ?? []) as Track[];
    },
  });
}

export function useTrack(trackId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.track(trackId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", trackId!)
        .single();
      if (error) throw error;
      return data as Track;
    },
    enabled: !!trackId,
  });
}

export function useCourses() {
  return useQuery({
    queryKey: QUERY_KEYS.courses,
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("order_index");
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });
}

export function useCoursesV2(publishedOnly = false) {
  return useQuery({
    queryKey: QUERY_KEYS.coursesV2(publishedOnly),
    queryFn: async () => {
      let q = supabase.from("courses_v2").select("*").order("order_index");
      if (publishedOnly) q = q.eq("is_published", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CourseV2[];
    },
  });
}

export function useCourseLessons(courseId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.courseLessons(courseId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Lesson[];
    },
    enabled: !!courseId,
  });
}

export function useMasteryClasses() {
  return useQuery({
    queryKey: QUERY_KEYS.masteryClasses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mastery_classes")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as MasteryClass[];
    },
  });
}

export function useMasteryClass(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.masteryClass(id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mastery_classes")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as MasteryClass;
    },
    enabled: !!id,
  });
}

export function useSubcategories() {
  return useQuery({
    queryKey: QUERY_KEYS.subcategories,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Subcategory[];
    },
  });
}

// ---------------------------------------------------------------------------
// User data hooks
// ---------------------------------------------------------------------------

export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.userProgress(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId!)
        .eq("completed", true)
        .order("completed_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserProgress[];
    },
    enabled: !!userId,
  });
}

export function useFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.favorites(userId),
    queryFn: async () => {
      if (!userId) return [] as Favorite[];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as Favorite[];
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ trackId, favorites }: { trackId: string; favorites: Favorite[] }) => {
      if (!userId) return;
      const existing = favorites.find((f) => f.track_id === trackId);
      if (existing) {
        const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, track_id: trackId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites(userId) });
    },
  });
}

export function useLessonProgress(userId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.lessonProgress(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId!)
        .eq("completed", true);
      if (error) throw error;
      return (data ?? []) as LessonProgress[];
    },
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// Derived helpers (pure functions — no hooks)
// ---------------------------------------------------------------------------

/** Set of completed track IDs from user progress */
export function completedTrackIds(progress: UserProgress[]): Set<string> {
  return new Set(progress.map((p) => p.track_id));
}

/** Set of favorited track IDs */
export function favoritedTrackIds(favorites: Favorite[]): Set<string> {
  return new Set(favorites.map((f) => f.track_id));
}

/** Calculate current streak from progress records */
export function calculateStreak(progress: UserProgress[]): number {
  const dates = new Set(progress.map((p) => p.completed_date).filter(Boolean));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (dates.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/** Calculate average stress reduction percentage */
export function calcStressReductionPct(progress: UserProgress[]): number | null {
  const sessions = progress.filter(
    (p) => p.stress_before != null && p.stress_after != null
  );
  if (sessions.length === 0) return null;
  const avgBefore = sessions.reduce((s, p) => s + (p.stress_before ?? 0), 0) / sessions.length;
  const avgAfter = sessions.reduce((s, p) => s + (p.stress_after ?? 0), 0) / sessions.length;
  if (avgBefore === 0) return null;
  return Math.round(((avgBefore - avgAfter) / avgBefore) * 100);
}
