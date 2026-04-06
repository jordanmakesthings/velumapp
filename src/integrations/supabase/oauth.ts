import { supabase } from "./client";

export async function signInWithOAuth(provider: "google" | "apple") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { error: error ?? null };
}
