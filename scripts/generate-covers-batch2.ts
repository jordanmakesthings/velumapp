// Batch 2 — 20 MORE painterly cover backgrounds, themed to the 8 goals so the
// auto-matcher and Goals cover picker have richer, more relevant art.
//
// Same aesthetic as scripts/generate-covers.ts (deep emerald + gold, painterly,
// no text/people/symbols). Generates via fal.ai Flux Pro Ultra, uploads to the
// `track-covers` bucket, AND seeds the `track_covers` storehouse with theme tags
// + mood (the original script skipped that step — this one does both).
//
// Usage:
//   FAL_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=yyy npx tsx scripts/generate-covers-batch2.ts
//
// Re-runnable safely (overwrites image + upserts storehouse row by name).
// Cost ~$1.50 for the batch.

import { createClient } from "@supabase/supabase-js";

const FAL_KEY = process.env.FAL_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://etghaosktmxloqivquvu.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FAL_KEY) { console.error("Missing FAL_KEY env var. Get one at https://fal.ai/dashboard/keys"); process.exit(1); }
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Supabase → Settings → API."); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface CoverDef { slug: string; goal: string; mood: string; tags: string[]; prompt: string; }

const PROMPTS: CoverDef[] = [
  // ── CALM ──────────────────────────────────────────────────────────────────
  { slug: "21-still-dusk-water", goal: "calm", mood: "flowing", tags: ["calm","stillness","peace","water","dusk","reflection","ease","quiet","settle"],
    prompt: "Painterly perfectly still lake at dusk, soft gold light pooling on the glassy surface, deep emerald shoreline in shadow, profound quiet, contemplative, dreamlike, oil painting texture" },
  { slug: "22-fog-valley", goal: "calm", mood: "soft", tags: ["calm","soften","release","fog","valley","gentle","quiet","spacious","settle"],
    prompt: "Painterly soft fog settling over a deep emerald valley at first light, pale gold haze, hushed and slow, contemplative, atmospheric, dreamlike, oil painting texture" },

  // ── SLEEP ─────────────────────────────────────────────────────────────────
  { slug: "23-moonlit-lake", goal: "sleep", mood: "lunar", tags: ["sleep","night","rest","moon","dream","quiet","receptive","still","nocturne"],
    prompt: "Painterly full moon over a still emerald lake at deep night, soft gold reflection trailing across the water, velvet dark sky, restful, dreamlike, cinematic, oil painting texture" },
  { slug: "24-starfield-night", goal: "sleep", mood: "lunar", tags: ["sleep","night","dream","stars","vast","rest","quiet","cosmos","drift"],
    prompt: "Painterly vast starfield over a dark emerald horizon, faint gold constellations, deep velvet night, peaceful and infinite, dreamlike, atmospheric, oil painting texture" },
  { slug: "25-velvet-night", goal: "sleep", mood: "deep", tags: ["sleep","rest","dark","cocoon","night","deep","quiet","surrender","drift"],
    prompt: "Painterly deep velvet darkness with a single soft gold glow dissolving into emerald shadow, womb-like, restful, intimate, abstract, oil painting texture" },

  // ── ENERGY / MORNING ────────────────────────────────────────────────────────
  { slug: "26-sunrise-break", goal: "energy", mood: "activating", tags: ["energy","morning","sunrise","awaken","vitality","dawn","begin","light","rise"],
    prompt: "Painterly sunrise breaking over a deep emerald ridge, warm gold light flooding upward, fresh and awakening, vast, dreamlike, cinematic, oil painting texture" },
  { slug: "27-first-light-trees", goal: "energy", mood: "activating", tags: ["energy","morning","awaken","forest","light","fresh","begin","vitality","dawn"],
    prompt: "Painterly first morning light streaming through tall emerald trees, golden shafts and fresh mist, alive and awakening, atmospheric depth, oil painting texture" },
  { slug: "28-golden-field-dawn", goal: "energy", mood: "activating", tags: ["energy","morning","field","dawn","vitality","open","fresh","gold","rise"],
    prompt: "Painterly open field at dawn, golden grasses catching first light, deep emerald treeline beyond, expansive and energizing, dreamlike, oil painting texture" },

  // ── FOCUS ─────────────────────────────────────────────────────────────────
  { slug: "29-still-point-pool", goal: "focus", mood: "centering", tags: ["focus","center","clarity","still","single","point","concentration","clear","calm"],
    prompt: "Painterly single still circular pool reflecting one point of gold light, deep emerald surround, minimal and centered, contemplative, oil painting texture" },
  { slug: "30-clear-minimal-horizon", goal: "focus", mood: "centering", tags: ["focus","clarity","clear","horizon","simple","direction","calm","precision","center"],
    prompt: "Painterly clean minimal horizon line, deep emerald below and soft gold sky above, uncluttered and clear, serene, contemplative, oil painting texture" },

  // ── CONFIDENCE / IDENTITY ───────────────────────────────────────────────────
  { slug: "31-standing-mountain", goal: "confidence", mood: "grounded", tags: ["confidence","strength","identity","mountain","stable","enduring","solid","stand","self"],
    prompt: "Painterly single great mountain standing in golden light, deep emerald foothills, immovable and dignified, vast, contemplative, oil painting texture" },
  { slug: "32-rooted-oak", goal: "confidence", mood: "grounded", tags: ["confidence","identity","rooted","strength","tree","ancient","self","ground","enduring"],
    prompt: "Painterly ancient solitary oak with deep roots, gold light on its canopy, deep emerald field, strong and self-possessed, dreamlike, oil painting texture" },

  // ── MONEY / ABUNDANCE ───────────────────────────────────────────────────────
  { slug: "33-golden-harvest", goal: "money", mood: "expansive", tags: ["money","abundance","wealth","harvest","prosperity","earn","plenty","gold","grow"],
    prompt: "Painterly abundant golden harvest field heavy with ripe grain glowing in warm light, deep emerald borders, prosperous and full, dreamlike, oil painting texture" },
  { slug: "34-river-of-gold", goal: "money", mood: "flowing", tags: ["money","abundance","flow","wealth","circulate","prosperity","gold","river","earn"],
    prompt: "Painterly wide river shimmering with gold light flowing toward the viewer, deep emerald banks, endless effortless flow, abundant, dreamlike, oil painting texture" },
  { slug: "35-abundant-cascade", goal: "money", mood: "expansive", tags: ["money","abundance","multiply","wealth","cascade","plenty","gold","prosperity","grow"],
    prompt: "Painterly cascade of golden light pouring down through a lush deep emerald grove, generous and overflowing, abundant, atmospheric, oil painting texture" },

  // ── HEAL / RELEASE ──────────────────────────────────────────────────────────
  { slug: "36-rain-after-storm", goal: "heal", mood: "cathartic", tags: ["heal","release","cleanse","rain","clearing","renewal","let-go","wash","soften"],
    prompt: "Painterly gentle rain clearing after a storm, gold light breaking through parting clouds over deep emerald hills, washed clean, cathartic, dreamlike, oil painting texture" },
  { slug: "37-dawn-clearing", goal: "heal", mood: "soft", tags: ["heal","renewal","release","dawn","clearing","soft","gentle","recovery","new"],
    prompt: "Painterly quiet forest clearing at soft dawn, tender gold light, deep emerald canopy, peaceful recovery, gentle, contemplative, oil painting texture" },
  { slug: "38-stream-over-stones", goal: "heal", mood: "flowing", tags: ["heal","release","flow","stream","stones","soothe","let-go","gentle","cleanse"],
    prompt: "Painterly gentle stream flowing over smooth stones, soft gold light on the water, deep emerald moss, soothing and unhurried, dreamlike, oil painting texture" },

  // ── CREATE THE FUTURE ───────────────────────────────────────────────────────
  { slug: "39-open-road-horizon", goal: "future", mood: "directional", tags: ["future","vision","path","direction","possibility","horizon","forward","journey","become"],
    prompt: "Painterly open path winding toward a luminous gold horizon through a deep emerald landscape, full of possibility, expansive, dreamlike, cinematic, oil painting texture" },
  { slug: "40-dawn-vista", goal: "future", mood: "expansive", tags: ["future","vision","possibility","dawn","vista","expansion","horizon","become","hope"],
    prompt: "Painterly vast dawn vista opening over distant deep emerald ranges, infinite soft gold sky, full of promise, contemplative, atmospheric, oil painting texture" },
];

const NEGATIVE = "text, letters, words, watermark, logo, signature, people, faces, hands, body, figures, animals, symbols, coins, money, dollar signs, low quality, blurry, distorted, ugly, oversaturated, neon";

async function generateOne(prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1-ultra", {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt, negative_prompt: NEGATIVE, aspect_ratio: "1:1",
      num_images: 1, output_format: "jpeg", enable_safety_checker: true, safety_tolerance: "5",
    }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error(`no image url: ${JSON.stringify(data).slice(0, 200)}`);
  const img = await fetch(url);
  return new Uint8Array(await img.arrayBuffer());
}

async function main() {
  console.log(`→ generating ${PROMPTS.length} goal-themed covers...`);
  let ok = 0, fail = 0;
  for (let i = 0; i < PROMPTS.length; i++) {
    const c = PROMPTS[i];
    const tag = `[${i + 1}/${PROMPTS.length}] ${c.slug} (${c.goal})`;
    try {
      const bytes = await generateOne(c.prompt);
      const path = `${c.slug}.jpg`;
      const up = await supabase.storage.from("track-covers").upload(path, bytes, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw new Error(`upload: ${up.error.message}`);
      const url = `${SUPABASE_URL}/storage/v1/object/public/track-covers/${path}`;
      // Seed the storehouse so it's instantly usable in Studio + auto-match + Goals picker.
      const seed = await supabase.from("track_covers").upsert(
        { name: c.slug, url, tags: [...c.tags, c.goal], mood: c.mood },
        { onConflict: "name" }
      );
      if (seed.error) throw new Error(`storehouse: ${seed.error.message}`);
      console.log(`  ✓ ${tag}`);
      ok++;
    } catch (e: any) {
      console.error(`  ✗ ${tag} — ${e.message}`);
      fail++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed. New art is live in the Thumbnail Studio + auto-matcher.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
