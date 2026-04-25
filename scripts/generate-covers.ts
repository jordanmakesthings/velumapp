// One-time script: generate ~20 atmospheric cover backgrounds via fal.ai Flux,
// upload to Supabase `track-covers` bucket. Re-runnable safely (overwrites).
//
// Usage:
//   FAL_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=yyy npx tsx scripts/generate-covers.ts
//
// Or with the env file already loaded:
//   npx tsx scripts/generate-covers.ts

import { createClient } from "@supabase/supabase-js";

const FAL_KEY = process.env.FAL_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://etghaosktmxloqivquvu.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FAL_KEY) {
  console.error("Missing FAL_KEY env var. Get one at https://fal.ai/dashboard/keys");
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Get from Supabase Settings → API.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 20 prompts — all on-brand: deep emerald, gold, painterly, atmospheric,
// no people, no text, no symbols. Each maps to a different mood/metaphor.
const PROMPTS: { slug: string; prompt: string }[] = [
  { slug: "01-doorway",     prompt: "Painterly atmospheric arched doorway, soft golden light spilling through, deep emerald green forest interior, dreamlike, cinematic, ethereal mist, ultra-detailed brushwork" },
  { slug: "02-water",       prompt: "Painterly still dark water at dusk, soft gold reflections, deep emerald and obsidian palette, misty horizon, contemplative, painterly soft brushstrokes" },
  { slug: "03-candle",      prompt: "Painterly single candle flame in deep darkness, warm gold halo, surrounding shadow with hints of emerald velvet, intimate, contemplative, oil painting texture" },
  { slug: "04-forest",      prompt: "Painterly dense ancient forest at dawn, shafts of golden light through dark emerald canopy, atmospheric mist, dreamlike, cinematic depth" },
  { slug: "05-horizon",     prompt: "Painterly distant horizon at golden hour, dark emerald foreground silhouette, infinite sky in pale gold and warm grey, contemplative, vast" },
  { slug: "06-cloth",       prompt: "Painterly draped emerald velvet fabric, gold thread highlights, soft folds catching warm light, dark background, luxurious, intimate, oil painting texture" },
  { slug: "07-sky",         prompt: "Painterly twilight sky in deep emerald and antique gold, swirling clouds, ethereal cosmic light, dreamlike, abstract atmospheric" },
  { slug: "08-stone",       prompt: "Painterly weathered stone archway in dark forest, soft gold light filtering through, moss and ferns in deep emerald, ancient, contemplative" },
  { slug: "09-flame",       prompt: "Painterly flickering ember in darkness, warm gold and amber tones, surrounded by deep emerald shadow, intimate, abstract, oil painting" },
  { slug: "10-mist",        prompt: "Painterly heavy mist over dark water, golden sun barely visible, deep emerald shore in shadow, contemplative, mysterious, atmospheric" },
  { slug: "11-leaves",      prompt: "Painterly close-up of emerald leaves catching golden light, soft focus, dreamlike, oil painting texture, intimate atmospheric" },
  { slug: "12-cosmic",      prompt: "Painterly cosmic nebula in deep emerald and antique gold, swirling, vast, dreamlike, ethereal, painterly atmospheric" },
  { slug: "13-window",      prompt: "Painterly view through a dark window, warm golden light beyond, deep emerald interior, contemplative, intimate, cinematic" },
  { slug: "14-path",        prompt: "Painterly winding path through dark emerald forest, soft golden light at the end, atmospheric mist, dreamlike, contemplative" },
  { slug: "15-feather",     prompt: "Painterly single feather floating in dark space, gold light catching its edge, deep emerald background, ethereal, abstract, oil painting" },
  { slug: "16-mountains",   prompt: "Painterly distant misty mountains at golden hour, dark emerald foreground, soft gold sky, vast, contemplative, atmospheric" },
  { slug: "17-orb",         prompt: "Painterly luminous golden orb suspended in deep emerald mist, ethereal, dreamlike, abstract, atmospheric, cinematic" },
  { slug: "18-rain",        prompt: "Painterly soft rain on dark emerald leaves, gold light filtering through, intimate, contemplative, oil painting texture" },
  { slug: "19-cave",        prompt: "Painterly cave opening to golden sunlight, dark emerald rock walls, mysterious, contemplative, atmospheric depth" },
  { slug: "20-moon",        prompt: "Painterly full moon over still emerald lake, golden reflection on water, deep night sky, dreamlike, contemplative, cinematic" },
];

const NEGATIVE = "text, letters, words, watermark, logo, signature, people, faces, hands, body, figures, animals, symbols, low quality, blurry, distorted, ugly, oversaturated, neon";

async function generateOne(prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE,
      aspect_ratio: "1:1",
      num_images: 1,
      output_format: "jpeg",
      enable_safety_checker: true,
      safety_tolerance: "2",
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fal.ai HTTP ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error(`No image URL in response: ${JSON.stringify(json).slice(0, 300)}`);

  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);
  return new Uint8Array(await imgRes.arrayBuffer());
}

async function uploadCover(slug: string, bytes: Uint8Array) {
  const path = `${slug}.jpg`;
  const { error } = await supabase.storage.from("track-covers").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);
  return path;
}

async function main() {
  console.log(`Generating ${PROMPTS.length} cover backgrounds…`);
  let success = 0;
  let failed = 0;
  for (let i = 0; i < PROMPTS.length; i++) {
    const { slug, prompt } = PROMPTS[i];
    process.stdout.write(`  [${i + 1}/${PROMPTS.length}] ${slug}… `);
    try {
      const bytes = await generateOne(prompt);
      const path = await uploadCover(slug, bytes);
      console.log(`✓ uploaded (${(bytes.byteLength / 1024).toFixed(0)} KB) → ${path}`);
      success++;
    } catch (err: any) {
      console.log(`✗ ${err.message}`);
      failed++;
    }
    // brief pacing to be polite to fal.ai
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
  console.log(`Public URL pattern:`);
  console.log(`  ${SUPABASE_URL}/storage/v1/object/public/track-covers/<slug>.jpg`);
}

main().catch((e) => { console.error(e); process.exit(1); });
