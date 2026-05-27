// Generate Six-Pillars-of-Wealth Quest cover artwork via fal.ai Flux Pro Ultra,
// upload to Supabase `track-covers` bucket under `wealth-quest/`. Mirrors the
// aesthetic of scripts/generate-covers.ts (painterly, deep emerald + gold, no
// figures/text/symbols) so the Quest covers feel native to the existing library.
//
// 6 pillars × 4 atmospheric variants (golden hour / dawn mist / deep night /
// storm clearing) = 24 candidates. Cherry-pick the strongest in admin and
// assign to the courses_v2 lesson rows.
//
// Usage:
//   FAL_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=yyy npx tsx scripts/generate-pillar-covers.ts
//
// Re-runnable safely (overwrites). Cost ~$1.50 for the full batch.

import { createClient } from "@supabase/supabase-js";

const FAL_KEY = process.env.FAL_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://etghaosktmxloqivquvu.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FAL_KEY) { console.error("Missing FAL_KEY env var."); process.exit(1); }
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var."); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const ATMOSPHERES: Record<string, string> = {
  "01-golden-hour": "low golden hour light, warm radiance pooling, long soft shadows",
  "02-dawn-mist":   "early dawn mist, pale gold breaking through fog, ethereal stillness",
  "03-deep-night":  "deep night with faint gold lanterns or starlight, intimate dark velvet",
  "04-storm-clear": "moments after a storm, gold light cutting through breaking clouds, dramatic",
};

const PILLARS: { slug: string; core: string }[] = [
  { slug: "1-earn",
    core: "Painterly wide slow deep stream flowing toward the viewer, gold light shimmering across the water's surface, deep emerald banks rising on either side, current carrying everything downstream effortlessly, contemplative, dreamlike, oil painting texture" },

  { slug: "2-keep",
    core: "Painterly four ancient stone vessels arranged in a quiet courtyard, each one whole and steady, each catching a slightly different angle of warm gold light, deep emerald shadow filling the spaces between, atmospheric mist, contemplative, dreamlike, oil painting texture" },

  { slug: "3-spend",
    core: "Painterly cascade of golden light pouring through a tall stone archway into a deep emerald forest beyond, abundant soft fall of radiance, generous and unhurried, dreamlike, atmospheric, oil painting texture" },

  { slug: "4-multiply",
    core: "Painterly ancient enormous tree, glowing gold branches multiplying outward into deep emerald canopy in a quiet fractal pattern, every branch alive with soft gold light, vast, dreamlike, atmospheric, oil painting texture" },

  { slug: "5-enjoy",
    core: "Painterly low golden sun pouring across a perfectly still emerald lake, warm reflections doubling on the water, peaceful and unguarded, contemplative, dreamlike, oil painting texture" },

  { slug: "6-circulate",
    core: "Painterly wide river bending in a graceful circular curve, gold light tracing the current back around to its own source, deep emerald forest enclosing the loop, eternal flow, dreamlike, atmospheric, oil painting texture" },
];

const NEGATIVE = "text, letters, words, watermark, logo, signature, people, faces, hands, body, figures, animals, symbols, coins, money, dollar signs, low quality, blurry, distorted, ugly, oversaturated, neon";

async function generateOne(prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE,
      aspect_ratio: "1:1",
      num_images: 1,
      output_format: "jpeg",
      safety_tolerance: "5",
      enable_safety_checker: false,
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`no image url in response: ${JSON.stringify(data).slice(0, 300)}`);
  const img = await fetch(url);
  return new Uint8Array(await img.arrayBuffer());
}

async function uploadOne(path: string, bytes: Uint8Array) {
  const { error } = await supabase.storage.from("track-covers").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(`upload ${path}: ${error.message}`);
}

async function main() {
  const tasks: { path: string; prompt: string }[] = [];
  for (const pillar of PILLARS) {
    for (const [atmoSlug, atmo] of Object.entries(ATMOSPHERES)) {
      tasks.push({
        path: `wealth-quest/${pillar.slug}-${atmoSlug}.jpg`,
        prompt: `${pillar.core}, ${atmo}`,
      });
    }
  }
  console.log(`→ generating ${tasks.length} pillar covers...`);
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const start = Date.now();
    try {
      const bytes = await generateOne(t.prompt);
      await uploadOne(t.path, bytes);
      console.log(`  ✓ [${i + 1}/${tasks.length}] ${t.path} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    } catch (e: any) {
      console.error(`  ✗ [${i + 1}/${tasks.length}] ${t.path} — ${e.message}`);
    }
  }
  console.log("done. browse them in Supabase Dashboard → Storage → track-covers/wealth-quest/");
}

main().catch((e) => { console.error(e); process.exit(1); });
