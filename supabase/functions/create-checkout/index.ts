import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS = {
  monthly: "price_1TC9J5Lv0dyfXaxONNpQ9wHV",
  lifetime: "price_1TC9JLLv0dyfXaxOM4HC5j8l",
};

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

    const { plan, promoCode, returnUrl } = await req.json();
    if (!plan || !["monthly", "lifetime"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Verify the stored customer ID actually exists in Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        console.warn(`Stored customer ${customerId} not found in Stripe, will create new one`);
        customerId = null;
      }
    }

    if (!customerId) {
      // Check if customer exists by email first
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

      const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      allow_promotion_codes: true,
      success_url: "https://app.govelum.com",
      cancel_url: `${returnUrl || "https://velumapp.lovable.app"}/premium`,
      metadata: { supabase_user_id: userId, plan },
      line_items: [{ price: priceId, quantity: 1 }],
    };

    if (plan === "monthly") {
      sessionParams.mode = "subscription";
      sessionParams.subscription_data = {
        trial_period_days: 7,
        metadata: { supabase_user_id: userId },
      };
    } else {
      sessionParams.mode = "payment";
    }

    if (promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
        if (promotionCodes.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }];
        }
      } catch (e) {
        console.warn("Promo code lookup failed:", e);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
