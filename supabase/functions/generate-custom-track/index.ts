// Velum · generate-custom-track
// Server-side: takes a user's diagnosis JSON + chosen voice → generates Ericksonian script via
// Claude → synthesizes audio via ElevenLabs → uploads to private storage → inserts custom_tracks row.
// Enforces the 30-day cooldown unless the user has extra credits.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VOICE_ROSTER: Record<string, string> = {
  jordan: "ZsKLSeq0zeFC3Yye7BrH",
  theo: "UmQN7jS1Ee8B1czsUtQh",
  solomon: "PTX7PgQRJRPEzGT9exN9",
  almee: "zA6D7RyKdc2EClouEMkP",
  rhythm: "7AvtJrjTNyBhBxEvNPIZ",
  nicole: "gc5LArFpEOmYx9nYmK9l",
};

const COOLDOWN_DAYS = 30;
const TARGET_WORDS = 1300;

const SCRIPT_SYSTEM = `You write Ericksonian hypnosis scripts for Velum.

Voice: quiet, deliberate, low-affect. Slow pace. Permissive language. NO direct commands. NO "you will" — use "you may," "perhaps," "you might find yourself…"

Output a complete script of approximately ${TARGET_WORDS} words spoken at a slow hypnotic pace (~130 wpm = 9-12 minutes audio).

Structure (do NOT label sections in output, just write the flowing script):

1. Arrival (~10%) — invite them to settle. Body cues. Eye fixation or closure. Permission to make any small adjustments. Notice the breath without changing it.
2. Induction (~20%) — progressive relaxation OR eye fixation OR confusion technique. Use 3-7-12 word patterns. Embed the user's first name 1-2 times if available. Include 2-3 silent pauses written as: [pause: 5 seconds] inline.
3. Deepening (~15%) — staircase, descending elevator, drifting, or counting down 10→1 with embedded suggestions. Reference the user's somatic location naturally.
4. Core work (~35%) — Ericksonian metaphor that addresses the belief WITHOUT naming it. Stories about other people, nature, processes that mirror the shift you want. Embed indirect suggestions inside the metaphor: "and as the river finds its way around the stone, you may begin to notice…" Touch the desired state 3-4 times through different angles.
5. Integration (~12%) — let the work settle. "And whatever is true for you in this moment can stay with you, in whatever way is right for you." Permissive close.
6. Return (~8%) — gentle re-orient. Count up 1→5. Open eyes. Carry the work forward.

Hard rules:
- NEVER use the words "deep sleep" or "unconscious" — clinical and dated.
- NEVER use motivational clichés ("you've got this," "believe in yourself").
- NEVER name the diagnosis directly — Ericksonian work is INDIRECT.
- NEVER use "imagine that" — replace with "you may notice…" / "perhaps you'll find…"
- Include 4-6 [pause: N seconds] markers inline. Pauses of 3-15 seconds.
- Mark embedded commands with *asterisks* (these will be voiced with subtle emphasis).
- Use the user's somatic words verbatim where natural.

Output ONLY the script text. No title. No preamble. No notes after.`;

function scriptToSsml(text: string): string {
  // Convert explicit [pause: N seconds] markers
  let s = text.replace(/\[pause:\s*(\d+(?:\.\d+)?)\s*seconds?\]/gi, (_, n) => `<break time="${n}s"/>`);
  // Insert a small micro-pause after sentence-ending punctuation to slow pacing.
  // Doesn't add meaningful length but breaks ElevenLabs' rush-through behavior.
  s = s.replace(/([.!?])(\s+)/g, '$1<break time="0.6s"/>$2');
  // Slightly longer pause after commas at the end of clauses
  s = s.replace(/(,)(\s+)/g, '$1<break time="0.25s"/>$2');
  return s;
}

function slugify(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    if (!elevenKey) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    // Parse body
    const { diagnosis, voice, title } = await req.json();
    if (!diagnosis || typeof diagnosis !== "object") return json({ error: "diagnosis JSON required" }, 400);
    if (!voice || !VOICE_ROSTER[voice as string]) return json({ error: "Invalid voice" }, 400);
    const voiceId = VOICE_ROSTER[voice as string];

    // Service-role client for cooldown check + DB writes
    const admin = createClient(supabaseUrl, serviceKey);

    // Cooldown / credits gate
    // Check unlimited flag first (admin / founder bypass)
    const { data: profileFlags } = await admin
      .from("profiles")
      .select("unlimited_tracks, extra_track_credits")
      .eq("id", user.id)
      .maybeSingle();
    const unlimited = !!(profileFlags?.unlimited_tracks);

    const { data: lastTrack } = await admin
      .from("custom_tracks")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let consumedCredit = false;
    if (!unlimited && lastTrack) {
      const ageMs = Date.now() - new Date(lastTrack.created_at as string).getTime();
      const ageDays = ageMs / 86400000;
      if (ageDays < COOLDOWN_DAYS) {
        const credits = (profileFlags?.extra_track_credits as number | null) ?? 0;
        if (credits <= 0) {
          return json({
            error: "cooldown",
            message: `Next free track unlocks in ${Math.ceil(COOLDOWN_DAYS - ageDays)} days. Buy an extra to skip the wait.`,
            unlocks_in_days: Math.ceil(COOLDOWN_DAYS - ageDays),
          }, 429);
        }
        consumedCredit = true;
      }
    }

    // 1. Generate script via Claude
    const userMsg = `Diagnosis JSON:\n${JSON.stringify(diagnosis, null, 2)}\n\nUser first name to embed: ${diagnosis.first_name || "(none — use no name)"}\n\nWrite the full Ericksonian hypnosis script now.`;
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SCRIPT_SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!claudeRes.ok) {
      const t = await claudeRes.text();
      return json({ error: "Script generation failed", detail: t.slice(0, 400) }, 502);
    }
    const claudeData = await claudeRes.json();
    const scriptText = (claudeData.content?.[0]?.text || "").trim();
    if (!scriptText) return json({ error: "Empty script returned" }, 502);

    // 2. Synthesize audio via ElevenLabs
    // Chunk the script at paragraph breaks for consistent pacing.
    // ElevenLabs drifts (speeds up) on long single-shot inputs ~10+ min.
    // Synthesizing in chunks of 1-2 min each avoids the drift entirely.
    const chunkScript = (txt: string): string[] => {
      // Split at double newlines (paragraph breaks). Then group small paragraphs.
      const paras = txt.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      const chunks: string[] = [];
      let cur = "";
      const TARGET = 1500; // bigger chunks = fewer API calls = under timeout // ~30-50 sec of audio per chunk
      for (const p of paras) {
        if (!cur) { cur = p; continue; }
        if ((cur.length + p.length + 2) <= TARGET) {
          cur = cur + "\n\n" + p;
        } else {
          chunks.push(cur);
          cur = p;
        }
      }
      if (cur) chunks.push(cur);
      return chunks;
    };
    const chunks = chunkScript(scriptText);
    const audioParts: Uint8Array[] = [];
    for (const chunk of chunks) {
      const ssmlChunk = scriptToSsml(chunk);
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({
            text: ssmlChunk,
            model_id: "eleven_multilingual_v2", // most consistent on slow trance content
            voice_settings: { stability: 0.92, similarity_boost: 0.78, style: 0, use_speaker_boost: true, speed: 0.72 },
          }),
        },
      );
      if (!ttsRes.ok) {
        const t = await ttsRes.text();
        return json({ error: "Audio synthesis failed", detail: t.slice(0, 400), failed_chunk: chunks.indexOf(chunk) }, 502);
      }
      audioParts.push(new Uint8Array(await ttsRes.arrayBuffer()));
    }
    // Concat all MP3 buffers — works for ElevenLabs constant-bitrate MP3 output
    const totalLen = audioParts.reduce((s, b) => s + b.byteLength, 0);
    const audioBuf = new Uint8Array(totalLen);
    let off = 0;
    for (const part of audioParts) { audioBuf.set(part, off); off += part.byteLength; }

    // 3. Upload to storage at <user_id>/<timestamp>-<title-slug>.mp3
    const finalTitle = (title && String(title).trim()) || (diagnosis.issue ? String(diagnosis.issue).slice(0, 60) : "Custom track");
    const fname = `${user.id}/${Date.now()}-${slugify(finalTitle)}.mp3`;
    const { error: upErr } = await admin.storage.from("custom-tracks").upload(fname, audioBuf, {
      contentType: "audio/mpeg",
      upsert: false,
    });
    if (upErr) return json({ error: "Upload failed", detail: upErr.message }, 502);

    // 4. Insert custom_tracks row
    const wordCount = scriptText.split(/\s+/).filter(Boolean).length;
    const durSec = Math.round((wordCount / 130) * 60);
    const { data: inserted, error: insErr } = await admin
      .from("custom_tracks")
      .insert({
        user_id: user.id,
        title: finalTitle,
        modality: "hypnosis",
        issue_summary: diagnosis.issue || null,
        script_text: scriptText,
        audio_url: fname,
        duration_sec: durSec,
      })
      .select()
      .single();
    if (insErr) return json({ error: "DB insert failed", detail: insErr.message }, 500);

    // 5. Decrement credit if used
    if (consumedCredit) {
      await admin.rpc("decrement_extra_track_credits", { uid: user.id }).catch(() => {});
    }

    return json({
      ok: true,
      track_id: inserted.id,
      audio_path: fname,
      duration_sec: durSec,
      title: finalTitle,
      consumed_credit: consumedCredit,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
