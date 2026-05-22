// Canonical goal taxonomy — the cross-cutting "why you'd pick this" layer that
// spans every format. Replaces the old category×theme subcategory matrix.
// One source of truth for the admin tagger, the decision-tree finder, and browse.

const COVER_BASE = "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/track-covers/";

export interface Goal {
  slug: string;   // stored in tracks.goals[]
  label: string;  // full label
  short: string;  // chip / compact label
  cover: string;  // painterly cover used as the goal card background
}

export const GOALS: Goal[] = [
  { slug: "calm",       label: "Calm & Anxiety",       short: "Calm",       cover: COVER_BASE + "02-water.jpg" },
  { slug: "sleep",      label: "Sleep",                short: "Sleep",      cover: COVER_BASE + "20-moon.jpg" },
  { slug: "energy",     label: "Morning & Energy",     short: "Energy",     cover: COVER_BASE + "09-flame.jpg" },
  { slug: "focus",      label: "Focus",                short: "Focus",      cover: COVER_BASE + "17-orb.jpg" },
  { slug: "confidence", label: "Confidence & Identity",short: "Confidence", cover: COVER_BASE + "16-mountains.jpg" },
  { slug: "money",      label: "Abundance & Money",    short: "Money",      cover: COVER_BASE + "12-cosmic.jpg" },
  { slug: "heal",       label: "Heal & Release",       short: "Heal",       cover: COVER_BASE + "18-rain.jpg" },
  { slug: "future",     label: "Create the Future",    short: "Future",     cover: COVER_BASE + "05-horizon.jpg" },
];

export const GOAL_BY_SLUG: Record<string, Goal> = Object.fromEntries(GOALS.map((g) => [g.slug, g]));

export function goalLabel(slug: string): string {
  return GOAL_BY_SLUG[slug]?.label ?? slug;
}

// Live goals from the DB (admin-managed), falling back to the static set above
// so the app still renders if the table is empty or the fetch fails.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGoals(): Goal[] {
  const { data } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals" as any).select("*").order("order_index");
      if (error || !data?.length) return null;
      return data as unknown as Goal[];
    },
    staleTime: 60_000,
  });
  return data ?? GOALS;
}
