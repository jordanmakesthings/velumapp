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

const BRAND = `You are writing personalised EFT tapping phrases for a wellness app.
Voice: warm, direct, grounded, first-person. The user will read these out loud as they tap.

PHRASE RULES (absolutely critical):
- Every phrase MUST be grammatical, complete English. No fragments. No garbled word salad.
- Every phrase reads as something a real human would say about their real feeling.
- 4-9 words per phrase. Short, natural anchor phrases.
- First person, present tense, specific to the issue the user named.
- Do NOT reference numbers, SUDS, ratings, or levels.
- Do NOT say "even though" inside reminder phrases — only in setup statements.
- Do NOT repeat the same phrase twice in a round.

ROUND ARC:
- Round 1: name it. Raw, honest, specific. "This tight worry in my chest." "I'm so sick of feeling this."
- Round 2: mixed. Half still naming it, half opening to possibility. "Still this fear, but maybe I don't have to carry it alone."
- Round 3+: open, softer, emerging. Not forced positivity — realistic possibility. "I'm starting to feel a little more space."

NEVER produce nonsense like "This stomach not of money fear" or "This tight worried feeling inside." If you can't write a grammatical phrase, write a plainer one.`;

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

function fallbackRoundPhrases(issue: string, roundNum: number): string[] {
  const topic = issue.slice(0, 60).replace(/[.!?]+$/, "").toLowerCase();
  if (roundNum === 1) {
    return [
      `This feeling about ${topic}`,
      `I notice it's still here`,
      `Right here in my body`,
      `I'm letting myself feel it`,
      `I don't want to feel this`,
      `This is what's up right now`,
      `I acknowledge this fully`,
      `All of this, right now`,
    ];
  }
  if (roundNum === 2) {
    return [
      `Still feeling this, and that's okay`,
      `Part of me is ready to release`,
      `I can let some of this go`,
      `Opening to something new`,
      `I'm allowed to feel lighter`,
      `This doesn't have to define me`,
      `I'm choosing to soften`,
      `A little more space now`,
    ];
  }
  return [
    `I'm feeling more settled`,
    `My body is softening`,
    `I'm safe right here`,
    `I'm allowed to feel good`,
    `Something is shifting`,
    `I'm grateful for this moment`,
    `I choose to feel ease`,
    `I am okay, right now`,
  ];
}

function ensureEight(phrases: unknown, issue: string, roundNum: number): string[] {
  const arr = Array.isArray(phrases) ? phrases.filter(p => typeof p === "string" && p.trim().length > 0) : [];
  if (arr.length >= 8) return arr.slice(0, 8);
  const pad = fallbackRoundPhrases(issue, roundNum);
  return [...arr, ...pad].slice(0, 8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

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

  const { action, path, issue, body_location, aspects, round_number,
          positive_belief, resistance } = req.body ?? {};

  try {
    let result: object;

    // ── SETUP STATEMENT ──
    // Returns ONE clean karate-chop statement. User will repeat it 3 times.
    // No SUDS / number reference inside the statement text.
    if (action === "setup") {
      const bodyPart = body_location ? ` in my ${body_location}` : "";
      const aspectsStr = aspects ? ` Context the user shared: ${aspects}.` : "";

      const prompt = `Write ONE EFT karate-chop setup statement for this user.
Their issue (verbatim): "${issue}"${aspectsStr}
${body_location ? `They feel it physically ${bodyPart}.` : ""}

Format: "Even though I [acknowledge this feeling + where they feel it, in their own words], I deeply and completely love and accept myself."

Rules:
- Use their language, not generic filler.
- Reference the body location if given.
- Do NOT mention numbers, ratings, SUDS, or "out of 10."
- Grammatical English. Natural. A real human would say this.
- 15-28 words total.

Return ONLY a JSON array with ONE string: ["Even though ..."].
No preamble. No markdown.`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      let statements: string[];
      try {
        const parsed = parseJSON(raw);
        statements = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        statements = [`Even though I'm feeling ${issue}${bodyPart}, I deeply and completely love and accept myself.`];
      }
      if (!statements[0] || typeof statements[0] !== "string") {
        statements = [`Even though I'm feeling ${issue}${bodyPart}, I deeply and completely love and accept myself.`];
      }

      result = { statements: [statements[0]] };

    // ── TAPPING ROUND ──
    } else if (action === "round") {
      const roundNum = round_number ?? 1;
      const bodyPart = body_location ? ` in my ${body_location}` : "";
      const aspectsStr = aspects ? `\nAdditional context: ${aspects}` : "";
      const pathNote = path === "positive"
        ? "This is a positive-intention session — the user wants more of something but has resistance."
        : "";

      const prompt = `Generate 8 EFT reminder phrases for Round ${roundNum} of a tapping sequence.
${pathNote}
User's issue (verbatim): "${issue}"${bodyPart ? ` They feel it${bodyPart}.` : ""}${aspectsStr}

The 8 points in order — ONE phrase per point:
1. Eyebrow
2. Side of Eye
3. Under Eye
4. Under Nose
5. Chin
6. Collarbone
7. Under Arm
8. Top of Head

Round ${roundNum} tone: ${
  roundNum === 1
    ? "raw, honest, name the specific feeling. No softening yet."
    : roundNum === 2
      ? "mixed — still naming the feeling but starting to open. Some phrases acknowledge, some suggest possibility."
      : "softer, emerging openness. Real possibility, not forced positivity."
}

Absolute requirements:
- Every phrase is grammatical, natural English a real human would say aloud.
- 4-9 words each.
- First person, present tense.
- Specific to THIS issue, not generic.
- Do NOT say numbers, ratings, or "out of 10."
- Do NOT use "Even though" — that's for setup, not reminders.
- Do NOT repeat phrases.

Return ONLY a JSON array of exactly 8 strings. No preamble. No markdown.`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      let phrases: string[];
      try {
        phrases = ensureEight(parseJSON(raw), issue, roundNum);
      } catch {
        phrases = fallbackRoundPhrases(issue, roundNum);
      }
      result = { phrases };

    // ── POSITIVE SHIFT ROUND ──
    } else if (action === "positive_round") {
      const roundNum = round_number ?? 1;

      const prompt = `Generate 8 EFT reminder phrases for a positive-belief installation round.
Desired belief/feeling (verbatim): "${positive_belief}"
Round ${roundNum}.

The 8 points in order — ONE phrase per point:
1. Eyebrow
2. Side of Eye
3. Under Eye
4. Under Nose
5. Chin
6. Collarbone
7. Under Arm
8. Top of Head

Round ${roundNum} tone: ${
  roundNum === 1
    ? "acknowledge the resistance while opening. 'Part of me still doesn't believe this.' 'I'm allowed to want this.'"
    : "lean into the positive. The belief feels more real. Embody it."
}

Requirements:
- Grammatical, natural, spoken-aloud English.
- 4-9 words each.
- First person, present tense.
- Specific to their stated belief.
- No numbers, no "out of 10."
- No "even though."
- No repeats.

Return ONLY a JSON array of exactly 8 strings. No preamble.`;

      const raw = await callClaude(BRAND, prompt, apiKey);
      let phrases: string[];
      try {
        phrases = ensureEight(parseJSON(raw), positive_belief ?? "this feeling", roundNum);
      } catch {
        phrases = fallbackRoundPhrases(positive_belief ?? "this feeling", roundNum);
      }
      result = { phrases };

    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    await supabase.from("profiles").update({
      tapping_daily_count: count + 1,
      tapping_daily_date: today,
    }).eq("id", user.id);

    return res.status(200).json(result);

  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Unknown error" });
  }
}
