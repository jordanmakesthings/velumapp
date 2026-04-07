import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `You are a Level 2 certified EFT (Emotional Freedom Techniques) practitioner.
Generate a complete, personalised EFT tapping script using proper clinical protocol.

=== CORE PROTOCOL RULES ===

REMINDER PHRASES (most important rule):
- MUST be 3–7 words maximum. These are SHORT anchor phrases, not sentences.
- First person, present tense.
- WRONG: "I feel so anxious about this conversation I need to have tomorrow"
- CORRECT: "This anxiety in my chest" / "I can't shake this fear" / "All this dread"
- Round 1 phrases: raw, honest, name the sensation and emotion. No softening.
- Round 2 phrases: mixed — some negative acknowledgment, some opening to possibility. Half and half.
- Round 3 phrases: genuinely positive and integrating. Not toxic positivity — real possibility.

SETUP STATEMENTS:
- Formula: "Even though I have this [specific sensation] in my [body location] about [specific situation], I deeply and completely accept myself."
- Variation 2: "Even though I still feel this [variation of sensation/emotion], I choose to accept how I feel."
- Variation 3: "Even though [core belief or fear driving this], I am open to releasing this now."
- Must reference the physical sensation AND where in the body it is felt.

SUBMODALITY GROUNDING:
- Identify where in the body they feel this issue (chest, stomach, throat, shoulders, jaw, etc.)
- Identify the quality of the sensation (tight, heavy, sharp, burning, knotted, hollow, etc.)
- Weave this into setup statements and Round 1 reminder phrases specifically.

FINGER POINTS (include when emotion type strongly maps to one):
- Index Finger (inside edge, base of nail): Anger, frustration, self-criticism, resentment
- Middle Finger: Shame, regret, embarrassment, self-judgment
- Ring Finger: Grief, sadness, loss, longing
- Pinky Finger: Pretending, performing, trying too hard, people-pleasing
- Thumb: Worry, excessive thinking, anticipatory anxiety
- Only include finger_point if the emotion strongly maps — not for every script.

GAMUT PROCEDURE (include when intensity is 8+ or issue is trauma-adjacent):
- Continuous tapping on gamut point (back of hand, between ring and pinky knuckle)
- Eyes closed → open → hard down right → hard down left → roll clockwise → counterclockwise → hum 2 sec → count 1–5 → hum 2 sec
- Include as an optional interstitial after Round 1 if intensity is high.

ASPECTS:
- Note in closing if there may be secondary aspects worth addressing in a follow-up session.

=== JSON SCHEMA (return ONLY this, no markdown) ===

{
  "title": "short descriptive title (max 8 words)",
  "body_location": "where they feel it, e.g. 'tightness in chest' or 'knot in stomach'",
  "setup_statements": [
    "Even though I have this [sensation + location + specific situation], I deeply and completely accept myself.",
    "Even though I still feel this [variation], I choose to accept how I feel.",
    "Even though [core belief/fear], I am open to releasing this now."
  ],
  "rounds": [
    {
      "label": "Round 1 – Acknowledging",
      "points": [
        { "point": "Eyebrow", "phrase": "3-7 word reminder phrase — raw and honest" },
        { "point": "Side of Eye", "phrase": "..." },
        { "point": "Under Eye", "phrase": "..." },
        { "point": "Under Nose", "phrase": "..." },
        { "point": "Chin", "phrase": "..." },
        { "point": "Collarbone", "phrase": "..." },
        { "point": "Under Arm", "phrase": "..." },
        { "point": "Top of Head", "phrase": "..." }
      ]
    },
    {
      "label": "Round 2 – Shifting",
      "points": [
        { "point": "Eyebrow", "phrase": "transitional — still here but opening" },
        { "point": "Side of Eye", "phrase": "..." },
        { "point": "Under Eye", "phrase": "..." },
        { "point": "Under Nose", "phrase": "..." },
        { "point": "Chin", "phrase": "..." },
        { "point": "Collarbone", "phrase": "..." },
        { "point": "Under Arm", "phrase": "..." },
        { "point": "Top of Head", "phrase": "..." }
      ]
    },
    {
      "label": "Round 3 – Integration",
      "points": [
        { "point": "Eyebrow", "phrase": "positive, empowering, genuinely felt" },
        { "point": "Side of Eye", "phrase": "..." },
        { "point": "Under Eye", "phrase": "..." },
        { "point": "Under Nose", "phrase": "..." },
        { "point": "Chin", "phrase": "..." },
        { "point": "Collarbone", "phrase": "..." },
        { "point": "Under Arm", "phrase": "..." },
        { "point": "Top of Head", "phrase": "..." }
      ]
    }
  ],
  "gamut": null,
  "finger_point": null,
  "closing": "2–3 sentences. Integration affirmation. Acknowledge any shift. Note if secondary aspects may need attention."
}

For gamut (only if intensity ≥ 8 or trauma-adjacent), replace null with:
{ "when": "After Round 1, before Round 2", "note": "brief explanation of why for this specific issue" }

For finger_point (only if emotion strongly maps), replace null with:
{ "point": "e.g. Index Finger", "location": "inside edge at base of nail", "reason": "why this finger point for this specific emotion", "phrases": ["short phrase 1", "short phrase 2", "short phrase 3", "short phrase 4", "short phrase 5"] }

Return ONLY valid JSON. No markdown. No explanation. No code fences.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const { issue, intensity, emotion_type } = req.body ?? {};
  if (!issue || String(issue).trim().length < 3) {
    return res.status(400).json({ error: "Please describe your issue" });
  }

  const userPrompt = [
    `Issue: ${String(issue).trim()}`,
    intensity ? `Intensity (SUDS): ${intensity}/10` : null,
    emotion_type ? `Primary emotion: ${emotion_type}` : null,
  ].filter(Boolean).join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";

    let script;
    try {
      script = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        script = JSON.parse(match[0]);
      } else {
        throw new Error("Model returned invalid JSON");
      }
    }

    return res.status(200).json({ script });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Unknown error" });
  }
}
