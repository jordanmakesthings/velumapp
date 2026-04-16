import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function updateUser(email: string, updates: Record<string, unknown>) {
  await supabase.from("profiles").update(updates).eq("email", email);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await getRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email || session.customer_details?.email;
        if (!email) break;
        const plan = session.metadata?.plan ?? "monthly";
        if (session.mode === "payment") {
          // Lifetime
          await updateUser(email, {
            subscription_status: "active",
            subscription_plan: "lifetime",
            trial_ends_at: null,
          });
        } else {
          // Monthly or annual subscription
          await updateUser(email, {
            subscription_status: "active",
            subscription_plan: plan,
            trial_ends_at: null,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;
        const status = sub.status === "active" ? "active"
          : sub.status === "past_due" ? "past_due"
          : sub.status === "canceled" ? "canceled"
          : sub.status;
        await updateUser(email, { subscription_status: status });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const email = await getEmailFromCustomer(sub.customer as string);
        if (!email) break;
        await updateUser(email, {
          subscription_status: "canceled",
          subscription_plan: null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (!email) break;
        await updateUser(email, { subscription_status: "past_due" });
        break;
      }
    }
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ received: true });
}

async function getEmailFromCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    return customer.email ?? null;
  } catch {
    return null;
  }
}
