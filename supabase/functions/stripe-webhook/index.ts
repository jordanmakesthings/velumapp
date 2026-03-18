import Stripe from "stripe";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) {
        return new Response("Missing stripe-signature", { status: 400 });
      }
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const updateSubscription = async (userId: string, status: string, plan: string | null, expiresAt: string | null) => {
      await supabaseAdmin.from("profiles").update({
        subscription_status: status,
        subscription_plan: plan,
        subscription_expires_at: expiresAt,
      }).eq("id", userId);
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (!userId) break;

        if (plan === "lifetime") {
          await updateSubscription(userId, "active", "lifetime", null);
        } else if (session.subscription) {
          // Subscription — will be handled by subscription events
          await updateSubscription(userId, "trialing", "monthly", null);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) {
          // Try to find user by customer ID
          const { data } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", sub.customer as string)
            .single();
          if (data) {
            const status = sub.status === "trialing" ? "trialing" : sub.status === "active" ? "active" : sub.status;
            await updateSubscription(data.id, status, "monthly",
              sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null);
          }
        } else {
          const status = sub.status === "trialing" ? "trialing" : sub.status === "active" ? "active" : sub.status;
          await updateSubscription(userId, status, "monthly",
            sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", sub.customer as string)
          .single();
        if (data) {
          await updateSubscription(data.id, "canceled", null, null);
        }
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
