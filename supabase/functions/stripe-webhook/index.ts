import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) return new Response("Missing stripe-signature", { status: 400 });
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const updateSubscription = async (
      userId: string,
      status: string,
      plan: string | null,
      expiresAt: string | null,
    ) => {
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: status,
          subscription_plan: plan,
          subscription_expires_at: expiresAt,
        })
        .eq("id", userId);
    };

    // Credit referrer with 1 free month when their referred user first becomes paid.
    // Idempotent — only credits once per referred user (status transitions signed_up -> credited).
    const creditReferrerIfEligible = async (referredUserId: string) => {
      const { data: r } = await supabaseAdmin
        .from("referrals")
        .select("id, referrer_id, status")
        .eq("referred_id", referredUserId)
        .maybeSingle();
      if (!r || r.status === "credited") return;

      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("referral_credit_months")
        .eq("id", r.referrer_id)
        .single();
      const current = referrer?.referral_credit_months ?? 0;

      await supabaseAdmin
        .from("profiles")
        .update({ referral_credit_months: current + 1 })
        .eq("id", r.referrer_id);

      await supabaseAdmin
        .from("referrals")
        .update({
          status: "credited",
          subscribed_at: new Date().toISOString(),
          credited_at: new Date().toISOString(),
        })
        .eq("id", r.id);
    };

    const resolveUserId = async (
      metadataUserId: string | undefined,
      stripeCustomerId: string,
    ): Promise<string | null> => {
      if (metadataUserId) return metadataUserId;
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();
      return data?.id ?? null;
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;

        // Handle Custom Track add-on Payment Link ($9 one-time).
        // Identified by metadata.product === "custom_track_addon" OR by client_reference_id (user id).
        const isAddon =
          session.mode === "payment" &&
          (session.metadata?.product === "custom_track_addon" ||
            session.metadata?.plan === "custom_track_addon");
        if (isAddon) {
          const targetUserId = userId || session.client_reference_id;
          if (targetUserId) {
            await supabaseAdmin.rpc("increment_extra_track_credits", { uid: targetUserId, add: 1 });
          }
          break;
        }

        if (!userId) break;
        if (plan === "lifetime") {
          await updateSubscription(userId, "active", "lifetime", null);
          await creditReferrerIfEligible(userId);
        } else if (session.subscription && (plan === "monthly" || plan === "annual")) {
          await updateSubscription(userId, "active", plan, null);
          await creditReferrerIfEligible(userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.metadata?.supabase_user_id, sub.customer as string);
        if (!userId) break;

        const plan =
          sub.metadata?.plan ||
          (sub.items?.data?.[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly");
        const status = sub.status === "active" ? "active" : sub.status;
        const expiresAt = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await updateSubscription(userId, status, plan, expiresAt);
        if (status === "active" || status === "trialing") {
          await creditReferrerIfEligible(userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.metadata?.supabase_user_id, sub.customer as string);
        if (userId) await updateSubscription(userId, "canceled", null, null);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
