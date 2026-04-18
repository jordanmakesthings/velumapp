import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

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

  const { plan, returnUrl, customerEmail } = req.body ?? {};

  const secret = process.env.STRIPE_SECRET_KEY;
  console.log("[create-checkout] incoming", {
    plan,
    returnUrl,
    hasEmail: !!customerEmail,
    secretKeyPrefix: secret ? secret.slice(0, 12) + "…" + secret.slice(-4) : "MISSING",
    secretKeyLength: secret?.length ?? 0,
    monthlyPrice: process.env.STRIPE_PRICE_MONTHLY?.slice(0, 12),
    annualPrice: process.env.STRIPE_PRICE_ANNUAL?.slice(0, 12),
    lifetimePrice: process.env.STRIPE_PRICE_LIFETIME?.slice(0, 12),
  });

  if (!secret) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY not set in Vercel env" });
  }
  if (!secret.startsWith("sk_live_") && !secret.startsWith("sk_test_")) {
    console.error("[create-checkout] key has wrong prefix", secret.slice(0, 8));
    return res.status(500).json({ error: "STRIPE_SECRET_KEY has invalid prefix — should start with sk_live_ or sk_test_" });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    console.error("[create-checkout] bad plan or missing price env", { plan });
    return res.status(400).json({ error: `Invalid plan: ${plan}. Price env var likely missing.` });
  }

  // Lazy init so a bad key gives a clean error above instead of module-load crash.
  // Use fetch HTTP client — Node's https module has been unreliable on Vercel ESM ("type": "module").
  const stripe = new Stripe(secret, {
    apiVersion: "2025-04-30.basil",
    maxNetworkRetries: 0,
    timeout: 15000,
    httpClient: Stripe.createFetchHttpClient(),
  });

  const isLifetime = plan === "lifetime";
  const origin = returnUrl || "https://app.govelum.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? "payment" : "subscription",
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      ...(!isLifetime && {
        subscription_data: { metadata: { plan } },
      }),
      allow_promotion_codes: true,
      success_url: `${origin}/paymentsuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
      metadata: { plan },
    });

    console.log("[create-checkout] success", { sessionId: session.id });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[create-checkout] stripe exception", {
      name: err?.name,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      message: err?.message,
      rawMessage: err?.raw?.message,
      requestId: err?.requestId,
      plan,
      priceId,
    });
    return res.status(500).json({
      error: err?.raw?.message ?? err?.message ?? "Checkout failed",
      type: err?.type,
      code: err?.code,
    });
  }
}
