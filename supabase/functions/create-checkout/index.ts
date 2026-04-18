import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS = {
  monthly: "price_1TNdHOLv0dyfXaxOb7sXtEEq",           // $19/mo, no trial
  annual: "price_1TNdIWLv0dyfXaxONxmXLkI7",            // $99/yr, 7-day trial
  lifetime_founding: "price_1TNdI3Lv0dyfXaxOCrV1jy1S", // $199 one-time (first 100)
  lifetime: "price_1TNdI3Lv0dyfXaxOCrV1jy1S",          // TODO: create $299 price and swap here when founding sells out
};

const FOUNDING_LIFETIME_CAP = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const { plan, returnUrl } = await req.json();
    if (!plan || !["monthly", "annual", "lifetime"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, referred_by")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as any).deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
      }
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    // Pick price ID — lifetime swaps to regular once 100 founding sold
    let priceId: string;
    if (plan === "lifetime") {
      const { count: soldCount } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_plan", "lifetime");
      const founding = (soldCount ?? 0) < FOUNDING_LIFETIME_CAP;
      priceId = founding ? PRICE_IDS.lifetime_founding : PRICE_IDS.lifetime;
    } else {
      priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    }

    const successBase = returnUrl || "https://app.govelum.com";
    const cancelBase = returnUrl || "https://app.govelum.com";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      success_url: `${successBase}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelBase}/premium`,
      metadata: {
        supabase_user_id: userId,
        plan,
        referred_by: profile?.referred_by ?? "",
      },
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
    };

    if (plan === "annual") {
      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: userId,
          plan,
          referred_by: profile?.referred_by ?? "",
        },
      };
      sessionParams.payment_method_collection = "always";
    } else if (plan === "monthly") {
      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        metadata: {
          supabase_user_id: userId,
          plan,
          referred_by: profile?.referred_by ?? "",
        },
      };
    } else {
      sessionParams.mode = "payment";
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr: unknown) {
      const msg = stripeErr instanceof Error ? stripeErr.message : "";
      if (msg.includes("currencies") || msg.includes("currency")) {
        delete (sessionParams as any).customer;
        (sessionParams as any).customer_email = userEmail;
        session = await stripe.checkout.sessions.create(sessionParams);
      } else {
        throw stripeErr;
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
