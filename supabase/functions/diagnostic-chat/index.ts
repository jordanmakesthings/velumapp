// Velum · diagnostic-chat
// Server-side proxy to Anthropic. Keeps API key out of browser. Used by the in-app diagnostic chat.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { messages, system } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) return json({ error: "messages array required" }, 400);
    if (!system || typeof system !== "string") return json({ error: "system prompt required" }, 400);
    if (messages.length > 60) return json({ error: "chat too long" }, 400);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system, messages }),
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ error: "Claude error", detail: t.slice(0, 400) }, 502);
    }
    const d = await r.json();
    const reply = d.content?.[0]?.text || "";
    return json({ reply });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
