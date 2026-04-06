const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert EFT (Emotional Freedom Techniques) practitioner.
Generate a complete, personalized EFT tapping script based on the user's issue.

The script MUST follow this exact JSON structure:
{
  "title": "short descriptive title for this script (max 8 words)",
  "setup_statements": [
    "Even though [specific issue], I deeply and completely accept myself.",
    "Even though [specific issue with slight variation], I choose to accept how I feel.",
    "Even though [specific issue with another variation], I am open to releasing this now."
  ],
  "rounds": [
    {
      "label": "Round 1 – Acknowledging",
      "points": [
        { "point": "Eyebrow", "phrase": "..." },
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
        { "point": "Eyebrow", "phrase": "..." },
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
        { "point": "Eyebrow", "phrase": "..." },
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
  "closing": "A brief 2-3 sentence closing affirmation/integration statement."
}

Rules:
- Round 1: honest, specific phrases that acknowledge the negative emotion/feeling as it is
- Round 2: transitional — beginning to shift, introducing possibility, "even though... I'm open to..."
- Round 3: positive, empowering, future-oriented phrases
- All phrases should be 5-12 words, first person, present tense
- Be specific to the user's exact situation — not generic
- Phrases should feel emotionally real, not toxic-positive
- Return ONLY valid JSON, no markdown, no explanation`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured in Supabase secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { issue, intensity, emotion_type } = await req.json();

    if (!issue || issue.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Please describe your issue" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = [
      `Issue: ${issue.trim()}`,
      intensity ? `Intensity: ${intensity}/10` : null,
      emotion_type ? `Primary emotion: ${emotion_type}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? "";

    // Validate it's JSON
    let script;
    try {
      script = JSON.parse(raw);
    } catch {
      throw new Error("Model returned invalid JSON");
    }

    return new Response(JSON.stringify({ script }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
