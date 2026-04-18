import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const PRICE_IDS: Record<string, string | undefined> = {
  monthly:  process.env.STRIPE_PRICE_MONTHLY,
  annual:   process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { plan, returnUrl } = req.body ?? {};

  const secret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[create-checkout] incoming", {
    plan,
    returnUrl,
    secretKeyPrefix: secret ? secret.slice(0, 12) + "…" + secret.slice(-4) : "MISSING",
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseAnonKey: !!supabaseAnonKey,
    hasSupabaseServiceKey: !!supabaseServiceKey,
  });

  if (!secret) return res.status(500).json({ error: "STRIPE_SECRET_KEY not set in Vercel env" });
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: "Supabase env vars missing in Vercel" });

  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: `Invalid plan: ${plan}. Price env var likely missing.` });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing Bearer token" });
  }
  const token = authHeader.slice("Bearer ".length);

  // Verify token & get user
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.error("[create-checkout] auth failed", userErr?.message);
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
  const userId = userData.user.id;
  const userEmail = userData.user.email!;

  const stripe = new Stripe(secret, {
    apiVersion: "2025-04-30.basil",
    maxNetworkRetries: 0,
    timeout: 15000,
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Load profile for existing stripe_customer_id
  const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabase;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id as string | null | undefined;

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
    if (supabaseServiceKey) {
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }
  }

  const isLifetime = plan === "lifetime";
  const origin = returnUrl || "https://app.govelum.com";

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isLifetime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(isLifetime
        ? {}
        : {
            subscription_data: {
              ...(plan === "annual" ? { trial_period_days: 7 } : {}),
              metadata: { supabase_user_id: userId, plan },
            },
            ...(plan === "annual" ? { payment_method_collection: "always" } : {}),
          }),
      allow_promotion_codes: true,
      success_url: `${origin}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
      metadata: { supabase_user_id: userId, plan },
    });

    console.log("[create-checkout] success", { sessionId: session.id, userId });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[create-checkout] stripe exception", {
      name: err?.name,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      message: err?.message,
      rawMessage: err?.raw?.message,
    });
    return res.status(500).json({
      error: err?.raw?.message ?? err?.message ?? "Checkout failed",
      type: err?.type,
      code: err?.code,
    });
  }
}
