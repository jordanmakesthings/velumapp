import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[stripe-webhook] hit", {
    hasStripeKey: !!stripeKey,
    hasWebhookSecret: !!webhookSecret,
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  });

  if (!stripeKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY missing" });
  if (!webhookSecret) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET missing" });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: "Supabase env vars missing" });

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-04-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sig = req.headers["stripe-signature"] as string;
  const rawBody = await getRawBody(req);

  console.log("[stripe-webhook] verifying", {
    sigPresent: !!sig,
    sigPrefix: sig?.slice(0, 40),
    bodyBytes: rawBody.length,
    bodyPrefix: rawBody.toString("utf8").slice(0, 80),
    secretPrefix: webhookSecret.slice(0, 12),
    secretLength: webhookSecret.length,
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] signature verification failed", err?.message);
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  console.log("[stripe-webhook] event", { type: event.type, id: event.id });

  const resolveUserId = async (
    metadataUserId: string | undefined,
    stripeCustomerId: string | null,
    email: string | null,
  ): Promise<{ userId: string | null; email: string | null }> => {
    if (metadataUserId) {
      const { data } = await supabase.from("profiles").select("id, email").eq("id", metadataUserId).maybeSingle();
      if (data) return { userId: data.id, email: data.email };
    }
    if (stripeCustomerId) {
      const { data } = await supabase.from("profiles").select("id, email").eq("stripe_customer_id", stripeCustomerId).maybeSingle();
      if (data) return { userId: data.id, email: data.email };
    }
    if (email) {
      const { data } = await supabase.from("profiles").select("id, email").eq("email", email).maybeSingle();
      if (data) return { userId: data.id, email: data.email };
    }
    return { userId: null, email: null };
  };

  const updateProfile = async (userId: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) console.error("[stripe-webhook] profile update error", error);
    else console.log("[stripe-webhook] profile updated", { userId, updates });
  };

  // Push userGroup changes to Loops so email segmentation stays in sync with
  // Stripe state. Fire-and-forget — never block the webhook on a Loops failure.
  // Skips silently if LOOPS_API_KEY isn't configured (e.g. local dev).
  const loopsKey = process.env.LOOPS_API_KEY;
  const syncToLoops = async (email: string | null, userGroup: string) => {
    if (!loopsKey || !email) return;
    try {
      const res = await fetch("https://app.loops.so/api/v1/contacts/update", {
        method: "PUT",
        headers: { Authorization: `Bearer ${loopsKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, userGroup, source: "stripe-webhook" }),
      });
      if (!res.ok) console.error("[stripe-webhook] Loops sync failed", email, res.status, (await res.text()).slice(0, 200));
      else console.log("[stripe-webhook] Loops synced", { email, userGroup });
    } catch (e: any) {
      console.error("[stripe-webhook] Loops sync error", e?.message);
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metaUserId = session.metadata?.supabase_user_id;
        const sessionEmail = session.customer_email || session.customer_details?.email || null;
        const { userId, email } = await resolveUserId(metaUserId, session.customer as string, sessionEmail);
        if (!userId) { console.warn("[stripe-webhook] no user found for checkout session", session.id); break; }

        const plan = session.metadata?.plan ?? (session.mode === "payment" ? "lifetime" : "monthly");
        await updateProfile(userId, {
          subscription_status: "active",
          subscription_plan: plan,
          subscription_expires_at: null,
          stripe_customer_id: session.customer as string,
        });
        // Lifetime users are confirmed paid here; subscription users will be
        // updated by the subscription.* webhook with the correct trial/active
        // status, so we only sync to Loops here for one-time payments.
        if (session.mode === "payment") await syncToLoops(email ?? sessionEmail, "lifetime");
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const { userId, email } = await resolveUserId(sub.metadata?.supabase_user_id, sub.customer as string, null);
        if (!userId) break;

        const plan =
          sub.metadata?.plan ||
          (sub.items?.data?.[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly");
        const status = sub.status;
        const expiresAt = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await updateProfile(userId, {
          subscription_status: status,
          subscription_plan: plan,
          subscription_expires_at: expiresAt,
        });

        // Map Stripe status → Loops userGroup
        const userGroup =
          status === "trialing" ? "trial-paid" :
          status === "active"   ? "active" :
          status === "past_due" ? "past-due" :
          status === "canceled" ? "cancelled" :
          status === "incomplete" || status === "incomplete_expired" ? "free" :
          "active";
        await syncToLoops(email, userGroup);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { userId, email } = await resolveUserId(sub.metadata?.supabase_user_id, sub.customer as string, null);
        if (userId) {
          await updateProfile(userId, { subscription_status: "canceled", subscription_plan: null });
          await syncToLoops(email, "cancelled");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const { userId, email } = await resolveUserId(undefined, invoice.customer as string, invoice.customer_email);
        if (userId) {
          await updateProfile(userId, { subscription_status: "past_due" });
          await syncToLoops(email, "past-due");
        }
        break;
      }

      default:
        console.log("[stripe-webhook] unhandled", event.type);
    }
  } catch (err: any) {
    console.error("[stripe-webhook] handler error", err?.message, err?.stack);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
}
