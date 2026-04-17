import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const FREE_DAILY_LIMIT = 1;
const PAID_DAILY_LIMIT = 3;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TAPPING_POINTS = [
  "Eyebrow", "Side of Eye", "Under Eye", "Under Nose",
  "Chin", "Collarbone", "Under Arm", "Top of Head",
];

const BRAND = `You are a Level 2 certified EFT (Emotional Freedom Techniques) practitioner generating personalised tapping phrases.
Voice: warm, direct, grounded. Speak in first person as the client.
Phrases must be 4–8 words maximum — SHORT anchor phrases, not sentences.
Round 1 phrases: raw, honest acknowledgment of the feeling.
Round 2 phrases: mixed — some acknowledgment, some opening to possibility.
Round 3+ phrases: more openness, gentle shift.
Never toxic positivity. Stay real.`;

async function callClaude(system: string, user: string, apiKey: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Anthropic API error: ${r.status}`);
  const d = await r.json();
  return d.content?.[0]?.text ?? "";
}

function parseJSON(raw: string) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const match = clean.match(/[\[{][\s\S]*[\]}]/);
  if (match) return JSON.parse(match[0]);
  return JSON.parse(clean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  // ── Auth + rate limiting ──
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Invalid session" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan, tapping_daily_count, tapping_daily_date")
    .eq("id", user.id)
    .single();

  const isPaid = profile?.subscription_status === "active" || profile?.subscription_plan === "lifetime";
  const limit = isPaid ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = profile?.tapping_daily_date?.slice(0, 10);
  const count = lastDate === today ? (profile?.tapping_daily_count ?? 0) : 0;

  if (count >= limit) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    const hoursLeft = Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000);
    const resetMsg = hoursLeft <= 1 ? "in less than an hour" : `in ${hoursLeft} hours`;
    return res.status(429).json({
      error: isPaid
        ? `You've had ${limit} sessions today. Your limit resets ${resetMsg}.`
        : `You've used your free session for today. It resets ${resetMsg} — or upgrade for ${PAID_DAILY_LIMIT} sessions a day.`,
      limit, used: count, isPaid, resetsIn: hoursLeft,
    });
  }

  const { action, path, issue, body_location, suds, aspects, round_number,
          positive_belief, resistance } = req.body ?? {};

  try {
    let result: object;

    // ── SETUP STATEMENTS ──
    if (action === "setup") {
      const bodyPart = body_location ? `, and I feel it in my ${body_location}` : "";
      const sudsStr = suds !== undefined ? `, and it's a ${suds} out of 10` : "";
      const aspectsStr = aspects ? ` Specific aspects: ${aspects}.` : "";

      const prompt = `Generate exactly 3 EFT karate chop setup statements for this person.
Issue: "${issue}"${bodyPart}${sudsStr}.${aspectsStr}

Statement 1 (full): "Even though I [feel/am experiencing] ${issue}${bodyPart}${sudsStr}, I deeply and completely love and accept myself."
Statement 2 (condensed): A shorter variation acknowledging the feeling.
Statement 3 (condensed variation): Use specific aspects if provided, or another angle.

Return ONLY valid JSON array of 3 strings. No preamble.
Example: ["Even though I feel...", "Even though...", "Even though..."]`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      const statements = parseJSON(raw) as string[];

      result = { statements };

    // ── TAPPING ROUND ──
    } else if (action === "round") {
      const roundNum = round_number ?? 1;
      const bodyPart = body_location ? ` in my ${body_location}` : "";
      const sudsStr = suds !== undefined ? ` (currently ${suds}/10)` : "";
      const aspectsStr = aspects ? `\nAdditional aspects: ${aspects}` : "";
      const pathNote = path === "positive"
        ? "This is a positive intention session — the person wants to feel more of this but has resistance."
        : "";

      const prompt = `Generate EFT reminder phrases for round ${roundNum} of an 8-point tapping sequence.
${pathNote}
Issue: "${issue}"${bodyPart}${sudsStr}.${aspectsStr}

Round guidance:
- Round 1: Raw, honest acknowledgment. Name the feeling directly.
- Round 2: Mixed — some acknowledgment, some openness ("even though... I'm open to...")
- Round 3+: More openness, gentle positive reframe.

Generate exactly 8 phrases, one for each point in order: ${TAPPING_POINTS.join(", ")}.
Each phrase: 4–8 words MAX. First person. No quotes needed.

Return ONLY a valid JSON array of 8 strings. No preamble.`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      const phrases = parseJSON(raw) as string[];
      result = { phrases };

    // ── POSITIVE SHIFT ROUND ──
    } else if (action === "positive_round") {
      const roundNum = round_number ?? 1;
      const res_level = resistance ?? 5;

      const prompt = `Generate EFT tapping phrases for a positive belief installation round.
Desired belief/feeling: "${positive_belief}"
Resistance level: ${res_level}/10 (10 = can't believe it at all, 0 = fully believe it).
Round: ${roundNum}

Round 1: Acknowledge the resistance while opening to the possibility.
  e.g. "Even though this feels hard to believe...", "Opening to this possibility..."
Round 2+: Lean more into the positive — installing the belief.
  e.g. "I am open to feeling this...", "Choosing ${positive_belief}..."

Generate exactly 8 phrases for: ${TAPPING_POINTS.join(", ")}.
Each phrase: 4–8 words MAX. First person.

Return ONLY a valid JSON array of 8 strings. No preamble.`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      const phrases = parseJSON(raw) as string[];
      result = { phrases };

    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    // Increment daily counter
    await supabase.from("profiles").update({
      tapping_daily_count: count + 1,
      tapping_daily_date: today,
    }).eq("id", user.id);

    return res.status(200).json(result);

  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Unknown error" });
  }
}
