// Supabase Send Email Hook → Loops Transactional bridge.
// Receives auth email events from Supabase, sends via Loops with the right template.

const LOOPS_API_KEY = Deno.env.get("LOOPS_API_KEY")!;
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";

const TEMPLATE_IDS: Record<string, string> = {
  recovery: "cmo66a7lz0abw0iz1pypgxfow",
  signup: "cmo67wljo1dzh0i05xckxfzm0",
  magiclink: "cmo67vhos0c190i01hpebwzhd",
  email_change: "cmo67xb430csa0iy36sid5tf3",
  email_change_new: "cmo67xb430csa0iy36sid5tf3",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

async function verifySignature(body: string, headers: Headers, secret: string): Promise<boolean> {
  if (!secret) return true;
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !sigHeader) return false;

  const cleaned = secret.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");
  const secretBytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${id}.${timestamp}.${body}`;
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  const provided = sigHeader.split(" ").map((s) => s.split(",")[1]);
  return provided.includes(expected);
}

const APP_BASE_URL = "https://app.govelum.com";

function buildConfirmationUrl(d: Record<string, string>): string {
  const qs = new URLSearchParams({
    token_hash: d.token_hash ?? "",
    type: d.email_action_type ?? "",
    redirect_to: d.redirect_to || APP_BASE_URL,
  }).toString();
  return `${APP_BASE_URL}/auth/confirm?${qs}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.text();
  if (HOOK_SECRET && !(await verifySignature(body, req.headers, HOOK_SECRET))) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { user: { email: string }; email_data: Record<string, string> };
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const type = payload.email_data.email_action_type;
  const templateId = TEMPLATE_IDS[type];
  if (!templateId) {
    console.error("unknown email_action_type", type);
    return new Response(JSON.stringify({ error: `unknown type: ${type}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const confirmationUrl = buildConfirmationUrl(payload.email_data);
  console.log("confirmation_url", { type, site_url: payload.email_data.site_url, redirect_to: payload.email_data.redirect_to, built: confirmationUrl });

  const loopsResp = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOOPS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.user.email,
      transactionalId: templateId,
      dataVariables: { confirmationUrl },
    }),
  });

  if (!loopsResp.ok) {
    const errText = await loopsResp.text();
    console.error("loops send failed", loopsResp.status, errText);
    return new Response(JSON.stringify({ error: "loops send failed", detail: errText }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
