import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OneSignal not configured" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Get current hour (UTC) to match users whose reminder_time is now
    const nowUTC = new Date();
    const currentHour = String(nowUTC.getUTCHours()).padStart(2, "0");
    const currentMinute = String(nowUTC.getUTCMinutes()).padStart(2, "0");
    const windowStart = `${currentHour}:${currentMinute}:00`;

    // Get users with onesignal_player_id and reminder_time matching this window (±30 min)
    // For simplicity, we match the hour
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, onesignal_player_id, reminder_time")
      .not("onesignal_player_id", "is", null)
      .neq("onesignal_player_id", "");

    if (profilesError) {
      throw new Error(`Profile fetch error: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to users whose reminder hour matches current UTC hour
    const targetProfiles = profiles.filter((p: any) => {
      const reminderHour = (p.reminder_time || "08:00:00").substring(0, 2);
      return reminderHour === currentHour;
    });

    if (targetProfiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which users have NOT completed a session today
    const userIds = targetProfiles.map((p: any) => p.id);
    const { data: todayProgress } = await supabase
      .from("user_progress")
      .select("user_id")
      .eq("completed", true)
      .eq("completed_date", today)
      .in("user_id", userIds);

    const completedUserIds = new Set(
      (todayProgress || []).map((p: any) => p.user_id)
    );

    const eligiblePlayerIds = targetProfiles
      .filter((p: any) => !completedUserIds.has(p.id))
      .map((p: any) => p.onesignal_player_id);

    if (eligiblePlayerIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notification via OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: eligiblePlayerIds,
        contents: { en: "Your practice is waiting." },
        headings: { en: "Velum" },
        url: "/library",
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        `OneSignal API error [${response.status}]: ${JSON.stringify(result)}`
      );
    }

    return new Response(
      JSON.stringify({ sent: eligiblePlayerIds.length, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("daily-reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
