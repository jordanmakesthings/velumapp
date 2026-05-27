import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) return res.status(500).json({ error: "STRIPE_SECRET_KEY not set" });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: "Supabase env vars missing" });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice("Bearer ".length);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const userId = userData.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  const customerId = profile?.stripe_customer_id as string | undefined;
  if (!customerId) return res.status(400).json({ error: "No Stripe customer found" });

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
    maxNetworkRetries: 0,
    timeout: 15000,
    httpClient: Stripe.createFetchHttpClient(),
  });

  const { returnUrl } = (req.body ?? {}) as { returnUrl?: string };
  const origin = returnUrl || "https://app.govelum.com/profile";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin,
    });
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[create-portal-session] stripe error", {
      type: err?.type,
      code: err?.code,
      message: err?.message,
      rawMessage: err?.raw?.message,
    });
    return res.status(500).json({
      error: err?.raw?.message ?? err?.message ?? "Portal session failed",
    });
  }
}
