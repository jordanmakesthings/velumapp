// Velum · loops-backfill
// One-shot: pushes every profile in Velum to Loops with the correct userGroup
// derived from subscription_status / subscription_plan / trial dates.
// Idempotent — uses Loops PUT /contacts/update which upserts.
//
// Invoke: curl -sS -X POST \
//   -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
//   https://etghaosktmxloqivquvu.supabase.co/functions/v1/loops-backfill

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
}

function deriveUserGroup(p: ProfileRow): string {
  if (p.subscription_plan === "lifetime") return "lifetime";
  if (p.subscription_status === "active") return "active";
  if (p.subscription_status === "trialing") return "trial-paid";
  if (p.subscription_status === "past_due") return "past-due";
  if (p.subscription_status === "canceled" || p.subscription_status === "cancelled") return "cancelled";
  if (p.trial_ends_at && new Date(p.trial_ends_at) > new Date()) return "trial";
  return "free";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const loopsKey = Deno.env.get("LOOPS_API_KEY");

  if (!loopsKey) {
    return new Response(JSON.stringify({ error: "LOOPS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, subscription_status, subscription_plan, trial_started_at, trial_ends_at")
    .order("created_at", { ascending: true });

  if (error || !profiles) {
    return new Response(JSON.stringify({ error: error?.message ?? "no profiles" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary: Record<string, number> = { free: 0, trial: 0, "trial-paid": 0, active: 0, lifetime: 0, "past-due": 0, cancelled: 0 };
  const errors: { email: string; status: number; body: string }[] = [];
  let updated = 0;
  let skipped = 0;

  for (const p of profiles as ProfileRow[]) {
    if (!p.email) { skipped++; continue; }
    const userGroup = deriveUserGroup(p);
    summary[userGroup] = (summary[userGroup] ?? 0) + 1;
    const firstName = (p.full_name || "").split(" ")[0] || "";

    const res = await fetch("https://app.loops.so/api/v1/contacts/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${loopsKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: p.email,
        firstName,
        userGroup,
        source: "velum-app-backfill",
      }),
    });

    if (res.ok) {
      updated++;
    } else {
      const body = await res.text();
      errors.push({ email: p.email, status: res.status, body: body.slice(0, 200) });
      console.error("Loops backfill failed for", p.email, res.status, body);
    }
    // tiny rate-limit cushion
    await new Promise(r => setTimeout(r, 80));
  }

  return new Response(
    JSON.stringify({
      ok: true,
      total: profiles.length,
      updated,
      skipped,
      error_count: errors.length,
      summary_by_userGroup: summary,
      errors: errors.slice(0, 5),
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
