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
  theo: "UmQN7jS1Ee8B1czsUtQh",
  nicole: "gc5LArFpEOmYx9nYmK9l",
};

const COOLDOWN_DAYS = 30;
const TARGET_WORDS = 1300;
const SAMPLE_RATE = 22050;

// True when a raw chunk contains 3+ number tokens within a 200-char window —
// i.e. a real countdown / count-up, not "five years ago." Mirrors the heuristic
// in protectNumberClusters() so we route the same paragraphs to the silence-splice path.
function isCountdownChunk(raw: string): boolean {
  const re = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\b/gi;
  const positions: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) positions.push(m.index);
  for (let i = 0; i < positions.length; i++) {
    let neighbors = 0;
    for (let j = 0; j < positions.length; j++) {
      if (i !== j && Math.abs(positions[i] - positions[j]) <= 200) neighbors++;
      if (neighbors >= 2) return true;
    }
  }
  return false;
}

// Split a countdown chunk on [pause: N seconds] markers into [text, pauseAfterSec][].
function splitCountdownChunk(raw: string): { text: string; pauseAfter: number }[] {
  const re = /\[pause:\s*(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)?\s*\]/gi;
  const out: { text: string; pauseAfter: number }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const text = raw.slice(last, m.index).trim();
    if (text) out.push({ text, pauseAfter: parseFloat(m[1]) });
    last = m.index + m[0].length;
  }
  const tail = raw.slice(last).trim();
  if (tail) out.push({ text: tail, pauseAfter: 0 });
  return out;
}

// N seconds of digital silence at 22050Hz mono 16-bit PCM.
function silencePcm(seconds: number): Uint8Array {
  const samples = Math.max(0, Math.round(SAMPLE_RATE * seconds));
  return new Uint8Array(samples * 2);
}

const SCRIPT_SYSTEM = `You write Ericksonian hypnosis scripts for Velum.

Voice: quiet, deliberate, low-affect. Slow pace. Permissive language. NO direct commands. NO "you will" — use "you may," "perhaps," "you might find yourself…"

Output a complete script of approximately ${TARGET_WORDS} words spoken at a slow hypnotic pace (~130 wpm = 9-12 minutes audio).

The diagnosis is desired-outcome-shaped. Fields you may receive: desired_outcome, picture (vivid scene), sensory (see/hear/feel), identity (who they become), somatic_pull (body felt-pull), already_true (the fragment already real — USE THIS as the central metaphor seed; it's the strongest Ericksonian leverage point), edge (the inner doubt to dissolve gently), modality_notes (verbatim phrases — echo AT LEAST 3 word-for-word in the script).

Use frequent paragraph breaks (every 50-100 words). Use SHORT sentences — periods give natural pacing.

Structure (do NOT label sections in the output, just write the flowing script):

1. ARRIVAL (~10%) — invite settling. Body cues. Eye fixation or closure. Notice the breath without changing it.
2. INDUCTION (~20%) — pick ONE proven technique and execute it deeply (don't rush). Available induction techniques (rotate across sessions; never use the same one twice in a row when modality_notes hint at recent history):
   (a) Progressive relaxation head-to-toe — name each region (forehead, jaw, shoulders, chest, hands, hips, thighs, calves, feet) with [pause: 3 seconds] between each
   (b) Eye fixation with permissive eyelid heaviness — "the more you try to keep them open, the heavier they want to become"
   (c) Elman-style "open and close eyes, doubling the relaxation each time" sequence — 5-7 cycles
   (d) Breath counting — count breaths from one to ten, with [pause: 4 seconds] between numbers, the body softening on each exhale
   (e) Body scan with weight — feel the weight of each body region sinking into the surface beneath
   (f) Confusion technique (Erickson) — "and as you wonder which hand is heavier, the left or the right, or perhaps neither, or perhaps both…"
   (g) Visualization journey — descending a soft path / floating down a gentle stream / walking down stone steps
   (h) Yes-set — string 5-7 obviously-true statements ("you are sitting… you are breathing… you can hear my voice… and as you read this you may notice…") to build response readiness
Embed the user's first name 1-2 times if known. Include 4-5 silent pauses inline using this exact format: [pause: 5 seconds]. The induction should feel UNHURRIED — over half this section is silence.
3. DEEPENING (~15%) — choose ONE deepening image and stay with it: a staircase, a descending elevator, drifting downward, OR a slow countdown. If you do a countdown, you MUST insert [pause: 2 seconds] between each number to prevent the voice from accelerating, like this: "ten… [pause: 2 seconds] going deeper… [pause: 2 seconds] nine… [pause: 2 seconds] softer still… [pause: 2 seconds] eight…" — never write a bare numeric sequence. Reference somatic_pull naturally between numbers.
4. CORE WORK (~35%) — build the central metaphor from already_true. Story them INTO the picture and identity they described. Embed indirect suggestions inside the metaphor: "and as the river finds its way around the stone, you may begin to notice…" Echo modality_notes verbatim at key moments.
5. INTEGRATION (~12%) — let the work settle. "And whatever is true for you in this moment can stay with you, in whatever way is right for you."
6. RETURN (~8%) — gentle re-orient. A simple count up to five — write it as a flowing sentence ("…one, becoming aware of the room… two, the weight of your body…") not a vertical list of numbers. Open eyes at the end.

HARD RULES:
- ALWAYS 2nd person ("you"). When echoing the user's words verbatim, CONVERT any "I/my/me/mine" to "you/your/yours" so the script never slips into 1st person. Example: user said "I want to feel free" → script says "you want to feel free" or "this wanting to feel free."
- ONE deepening image only. Don't stack multiple counts.
- Numbers ONLY appear in the deepening countdown and the return count-up. NEVER scatter numbers elsewhere.
- NEVER use "deep sleep" or "unconscious."
- NEVER use motivational clichés ("you've got this," "believe in yourself").
- NEVER name the diagnosis directly — Ericksonian work is INDIRECT.
- NEVER use "imagine that" — use "you may notice…" / "perhaps you'll find…"
- NEVER use negation toward the desired outcome ("don't worry" — the subconscious deletes the negator).
- Include 8-12 silent pauses across the script in this exact form: [pause: N seconds] where N is 2-10. Concentrate them in induction + deepening.
- Mark 4-8 embedded commands across the script with *asterisks*.
- Use SHORT sentences for natural pacing.
- VARY sentence length and structure — don't string together repetitive parallel constructions, which causes the voice synthesis to accelerate. Break similar phrasings with ellipses or pause markers.

Output ONLY the script text. No title. No preamble. No notes after. No section labels.`;

function scriptToSsml(text: string): string {
  // Convert pause markers in any common form Claude might write:
  // [pause: 5 seconds], [pause: 5 second], [pause: 5 sec], [pause: 5s], [pause: 5]
  // Also strip any stray instructional brackets like [breath] [silence] that would otherwise be voiced.
  let s = text.replace(/\[pause:\s*(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)?\s*\]/gi, (_, n) => `<break time="${n}s"/>`);
  // Catch other common silence directives the model sometimes invents
  s = s.replace(/\[(?:breath|breathe|silence|long pause|short pause)[^\]]*\]/gi, '<break time="3s"/>');
  // Countdown / count-up safety net — even if Claude forgot the [pause] markers,
  // detect number clusters (3+ within 200 chars = countdown) and force slow prosody +
  // a 2s break after each. Outside countdowns ("after seven days") nothing changes.
  s = protectNumberClusters(s);
  // Cadence racing safety net — when 3+ consecutive short sentences appear without
  // any [pause] marker between them, ElevenLabs multilingual_v2 starts accelerating
  // ("speeds up for 10 seconds then returns to normal" — the racing window between
  // two paragraph breaks). Force a 1.2s break between each to anchor pacing.
  s = breakRepetitiveCadence(s);
  return s;
}

// Detect runs of 3+ consecutive short sentences (under 90 chars each) without
// intervening <break> tags, and inject a small break between them. This is the
// pattern that makes ElevenLabs race.
function breakRepetitiveCadence(text: string): string {
  // Split on existing breaks to process each "speech segment" independently
  const segments = text.split(/(<break[^>]*\/>)/);
  return segments.map(seg => {
    if (seg.startsWith('<break')) return seg;
    // Within this segment, find runs of short sentences
    // Match each sentence ending with . ! ? … and capture the trailing whitespace
    const sentenceRe = /([^.!?…]*[.!?…]+)(\s*)/g;
    const sentences: { text: string; trail: string }[] = [];
    let m: RegExpExecArray | null;
    let lastIdx = 0;
    while ((m = sentenceRe.exec(seg)) !== null) {
      sentences.push({ text: m[1], trail: m[2] });
      lastIdx = m.index + m[0].length;
    }
    const remainder = seg.slice(lastIdx);
    if (sentences.length < 3) return seg;

    // Walk sentences and detect runs of 3+ short ones
    let out = "";
    let runStart = -1;
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const isShort = s.text.trim().length < 90;
      if (isShort && runStart < 0) runStart = i;
      if (!isShort && runStart >= 0) {
        // Close the run
        flushRun(sentences, runStart, i - 1);
        runStart = -1;
      }
    }
    if (runStart >= 0) flushRun(sentences, runStart, sentences.length - 1);

    function flushRun(arr: { text: string; trail: string }[], start: number, end: number) {
      if (end - start + 1 < 3) return;
      // Inject a small break between every short sentence in the run
      for (let i = start; i < end; i++) {
        arr[i].trail = ' <break time="1.2s"/> ';
      }
    }

    for (const s of sentences) out += s.text + s.trail;
    out += remainder;
    return out;
  }).join('');
}

function protectNumberClusters(text: string): string {
  const tokenRegex = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\b/gi;
  const matches: { idx: number; len: number; word: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = tokenRegex.exec(text)) !== null) {
    matches.push({ idx: m.index, len: m[0].length, word: m[0] });
  }
  // A number is "in a cluster" if it has at least 2 other numbers within 200 chars
  // (so a real countdown — at least 3 numbers — gets protected; "five years ago" doesn't).
  const inCluster = new Set<number>();
  for (let i = 0; i < matches.length; i++) {
    let neighbors = 0;
    for (let j = 0; j < matches.length; j++) {
      if (i === j) continue;
      if (Math.abs(matches[i].idx - matches[j].idx) <= 200) neighbors++;
      if (neighbors >= 2) { inCluster.add(i); break; }
    }
  }
  // Apply replacements right-to-left so earlier indices stay valid
  let out = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    if (!inCluster.has(i)) continue;
    const { idx, len, word } = matches[i];
    const before = out.slice(0, idx);
    const after = out.slice(idx + len);
    const hasBreakSoon = /^[^A-Za-z0-9]{0,30}<break/i.test(after);
    const replacement = hasBreakSoon
      ? `<prosody rate="80%">${word}</prosody>`
      : `<prosody rate="80%">${word}</prosody><break time="2s"/>`;
    out = before + replacement + after;
  }
  return out;
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

    // Parse body. `script_text` is optional — when provided, we skip Claude and
    // synthesize the supplied script directly. Used for hand-crafted Quest tracks
    // where word-level control matters more than per-user personalization.
    const { diagnosis, voice, title, script_text } = await req.json();
    if (!script_text && (!diagnosis || typeof diagnosis !== "object")) {
      return json({ error: "diagnosis JSON or script_text required" }, 400);
    }
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

    // 1. Generate script via Claude (or use the pre-written one if provided)
    let scriptText: string;
    if (script_text && typeof script_text === "string" && script_text.trim().length > 100) {
      scriptText = script_text.trim();
    } else {
      const userMsg = `Diagnosis JSON:\n${JSON.stringify(diagnosis, null, 2)}\n\nUser first name to embed: ${diagnosis.first_name || "(none — use no name)"}\n\nWrite the full Ericksonian hypnosis script now.`;
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
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
      scriptText = (claudeData.content?.[0]?.text || "").trim();
      if (!scriptText) return json({ error: "Empty script returned" }, 502);
    }

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
    // PCM output for lossless concat (MP3 chunk-concat truncates in browsers).
    // 22050Hz mono is plenty for spoken hypnosis and ~1/2 the bytes of 44.1kHz
    // → faster downloads, no timeouts.
    const MIN_AUDIO_BYTES = 4000;
    const VOICE_SETTINGS = { stability: 0.85, similarity_boost: 0.78, style: 0.0, use_speaker_boost: true, speed: 0.82 };

    // One ElevenLabs TTS call with 3 retries. Returns PCM bytes or throws.
    const ttsOnce = async (text: string, previousText?: string, nextText?: string): Promise<Uint8Array> => {
      let lastError = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        const body: Record<string, unknown> = { text, model_id: "eleven_multilingual_v2", voice_settings: VOICE_SETTINGS };
        if (previousText) body.previous_text = previousText;
        if (nextText) body.next_text = nextText;
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=pcm_22050`,
          {
            method: "POST",
            headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/pcm" },
            body: JSON.stringify(body),
          },
        );
        const ct = ttsRes.headers.get("content-type") || "";
        if (!ttsRes.ok) {
          lastError = `HTTP ${ttsRes.status}: ${(await ttsRes.text()).slice(0, 200)}`;
        } else if (!ct.includes("audio") && !ct.includes("octet-stream")) {
          lastError = `Non-audio response (${ct})`;
        } else {
          const candidate = new Uint8Array(await ttsRes.arrayBuffer());
          if (candidate.byteLength < MIN_AUDIO_BYTES) {
            lastError = `Empty/truncated audio (${candidate.byteLength} bytes)`;
          } else {
            return candidate;
          }
        }
        await new Promise(r => setTimeout(r, 600));
      }
      throw new Error(lastError || "TTS failed");
    };

    const stripPause = (s: string) => s.replace(/\[pause:[^\]]*\]/gi, "").replace(/\s+/g, " ").trim();

    // Render a single script chunk to PCM. Countdown chunks are split on [pause:]
    // markers and synthesized in isolation (so list-rhythm conditioning can't leak
    // and make numbers race), then stitched with real PCM silence.
    const renderChunk = async (i: number): Promise<Uint8Array> => {
      const chunk = chunks[i];
      if (isCountdownChunk(chunk)) {
        const segments = splitCountdownChunk(chunk);
        const segPcms: Uint8Array[] = [];
        for (const seg of segments) {
          segPcms.push(await ttsOnce(seg.text));
          if (seg.pauseAfter > 0) segPcms.push(silencePcm(seg.pauseAfter));
        }
        const totalLen = segPcms.reduce((s, b) => s + b.byteLength, 0);
        const merged = new Uint8Array(totalLen);
        let off = 0;
        for (const part of segPcms) { merged.set(part, off); off += part.byteLength; }
        return merged;
      }
      const previousText = i > 0 ? stripPause(chunks[i - 1]).slice(-300) : undefined;
      const nextText = i < chunks.length - 1 ? stripPause(chunks[i + 1]).slice(0, 300) : undefined;
      return await ttsOnce(scriptToSsml(chunk), previousText, nextText);
    };

    // Render chunks with bounded concurrency, preserving order. Synthesizing a
    // 9-12 min track one chunk at a time blew past the 150s function limit (504s);
    // a small pool keeps wall-clock well under it. We trade cross-chunk
    // previous_request_ids conditioning for actually finishing.
    const audioParts: Uint8Array[] = new Array(chunks.length);
    const POOL = 3;
    let nextIdx = 0;
    let synthError = "";
    const worker = async () => {
      while (true) {
        const i = nextIdx++;
        if (i >= chunks.length) return;
        try {
          audioParts[i] = await renderChunk(i);
        } catch (e) {
          if (!synthError) synthError = `chunk ${i}: ${(e as Error).message}`;
          return;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(POOL, chunks.length) }, () => worker()));
    if (synthError) return json({ error: "Audio synthesis failed", detail: synthError }, 502);
    // Concat all PCM chunks — straight byte concatenation, then wrap in a WAV header.
    const pcmLen = audioParts.reduce((s, b) => s + b.byteLength, 0);
    const pcm = new Uint8Array(pcmLen);
    {
      let off = 0;
      for (const part of audioParts) { pcm.set(part, off); off += part.byteLength; }
    }
    // Build WAV header (PCM 16-bit mono @ 44.1kHz)
    const wav = (() => {
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const header = new ArrayBuffer(44);
      const view = new DataView(header);
      const writeStr = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
      writeStr(0, "RIFF");
      view.setUint32(4, 36 + pcm.byteLength, true);
      writeStr(8, "WAVE");
      writeStr(12, "fmt ");
      view.setUint32(16, 16, true);              // PCM chunk size
      view.setUint16(20, 1, true);               // PCM format
      view.setUint16(22, numChannels, true);
      view.setUint32(24, SAMPLE_RATE, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeStr(36, "data");
      view.setUint32(40, pcm.byteLength, true);
      const out = new Uint8Array(44 + pcm.byteLength);
      out.set(new Uint8Array(header), 0);
      out.set(pcm, 44);
      return out;
    })();
    const audioBuf = wav;

    // 3. Upload to storage at <user_id>/<timestamp>-<title-slug>.wav
    const finalTitle = (title && String(title).trim()) || (diagnosis?.issue ? String(diagnosis.issue).slice(0, 60) : "Custom track");
    const fname = `${user.id}/${Date.now()}-${slugify(finalTitle)}.wav`;
    const { error: upErr } = await admin.storage.from("custom-tracks").upload(fname, audioBuf, {
      contentType: "audio/wav",
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
        issue_summary: diagnosis?.issue || null,
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
