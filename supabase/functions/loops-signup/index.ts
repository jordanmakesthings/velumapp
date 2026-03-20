import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const loopsKey = Deno.env.get("LOOPS_API_KEY");
    if (!loopsKey) {
      console.error("LOOPS_API_KEY not configured");
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${loopsKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        firstName: firstName || "",
        userGroup: "trial",
        source: "velum-app",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Loops API error:", res.status, text);
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("loops-signup error:", err);
    return new Response(JSON.stringify({ success: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
