// One-off: regenerate the two cover slugs that came back with artist watermarks
// (05-horizon, 13-window). Same fal.ai pipeline as scripts/generate-covers.ts,
// just the targeted re-runs. Cost ~$0.12.
//
// Usage:
//   FAL_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=yyy npx tsx scripts/regen-watermarked-covers.ts

import { createClient } from "@supabase/supabase-js";

const FAL_KEY = process.env.FAL_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://etghaosktmxloqivquvu.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FAL_KEY) { console.error("Missing FAL_KEY env var."); process.exit(1); }
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var."); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PROMPTS: { slug: string; prompt: string }[] = [
  { slug: "05-horizon", prompt: "Painterly distant horizon at golden hour, dark emerald foreground silhouette, infinite sky in pale gold and warm grey, contemplative, vast, oil painting brushwork" },
  { slug: "13-window",  prompt: "Painterly view through a dark window, warm golden light beyond, deep emerald interior, contemplative, intimate, cinematic, oil painting brushwork" },
];

const NEGATIVE = "text, letters, words, watermark, logo, signature, artist mark, signed, people, faces, hands, body, figures, animals, symbols, low quality, blurry, distorted, ugly, oversaturated, neon";

async function generateOne(prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt, negative_prompt: NEGATIVE,
      aspect_ratio: "1:1", num_images: 1, output_format: "jpeg",
      safety_tolerance: "5", enable_safety_checker: false,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`no image url: ${JSON.stringify(data).slice(0, 300)}`);
  const img = await fetch(url);
  return new Uint8Array(await img.arrayBuffer());
}

async function main() {
  for (const { slug, prompt } of PROMPTS) {
    const start = Date.now();
    const bytes = await generateOne(prompt);
    const { error } = await supabase.storage.from("track-covers").upload(`${slug}.jpg`, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) { console.error(`✗ ${slug}: ${error.message}`); continue; }
    console.log(`✓ ${slug}.jpg (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  }
  console.log("\nDone. Both covers replaced — re-add to COVER_SLUGS in TrackCover.tsx if you want them back in the random pool.");
}

main().catch((e) => { console.error(e); process.exit(1); });
