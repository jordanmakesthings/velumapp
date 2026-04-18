import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" });

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

  console.log("[create-checkout] incoming", { plan, returnUrl, hasEmail: !!customerEmail });

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[create-checkout] STRIPE_SECRET_KEY not set in Vercel env");
    return res.status(500).json({ error: "Server config: STRIPE_SECRET_KEY missing" });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    console.error("[create-checkout] bad plan or missing price env", { plan, availablePrices: Object.keys(PRICE_IDS).filter(k => !!PRICE_IDS[k]) });
    return res.status(400).json({ error: `Invalid plan: ${plan}. Price env var likely missing in Vercel.` });
  }

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

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[create-checkout] stripe error", {
      plan,
      priceId,
      type: err?.type,
      code: err?.code,
      message: err?.message,
      raw: err?.raw?.message,
    });
    return res.status(500).json({ error: err?.message ?? "Checkout failed", type: err?.type, code: err?.code });
  }
}
