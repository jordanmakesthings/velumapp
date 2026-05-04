// Track cover storehouse helpers. Wraps the public.pick_cover_by_tags
// Postgres function so React/edge code can ask "given these tags, give me
// the best matching cover from the storehouse" without needing to know
// the SQL or build matching logic in TS.
//
// Storehouse table: public.track_covers (20 brand-consistent covers seeded)
// Each cover has theme tags. Picker returns the cover with most tag overlap,
// random tiebreak.

import { supabase } from "@/integrations/supabase/client";

export interface TrackCover {
  id: string;
  name: string;
  url: string;
  tags: string[];
  mood: string | null;
  collection_palette: string | null;
}

// Pick the best-matching cover URL for a given set of theme tags.
// Returns null if the storehouse is empty or the call fails (caller should
// have a fallback).
export async function pickCoverForTags(tags: string[]): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("pick_cover_by_tags", { p_tags: tags });
    if (error || !data) return null;
    return typeof data === "string" ? data : null;
  } catch {
    return null;
  }
}

// Get the full storehouse — useful for admin tooling, cover pickers, etc.
export async function listAllCovers(): Promise<TrackCover[]> {
  const { data, error } = await supabase
    .from("track_covers")
    .select("*")
    .order("name");
  if (error || !data) return [];
  return data as TrackCover[];
}

// Convenience: derive tags from a track's title + description + existing tags.
// Cheap heuristic — splits into lowercase tokens and filters common stopwords.
// Use this when you don't have explicit tags but want to seed from text.
const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","at","for","with","is",
  "are","was","were","be","been","being","this","that","these","those","i","you",
  "your","my","we","our","it","its","as","by","from","about","into","through",
]);

export function deriveTagsFromText(...texts: Array<string | null | undefined>): string[] {
  const merged = texts.filter(Boolean).join(" ").toLowerCase();
  const tokens = merged.match(/[a-z][a-z-]{2,}/g) || [];
  return Array.from(new Set(tokens.filter((t) => !STOPWORDS.has(t))));
}
