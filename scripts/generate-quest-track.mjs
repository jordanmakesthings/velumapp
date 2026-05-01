#!/usr/bin/env node
// Generates a Quest track by calling the deployed `generate-custom-track` edge
// function with a hand-written script. Requires your own user JWT (the function
// uses verify_jwt: true and inserts the row into your account).
//
// Usage:
//   1. Open https://app.govelum.com while logged in.
//   2. DevTools → Application → Local Storage → find the key starting with
//      "sb-etghaosktmxloqivquvu-auth-token". Copy the `access_token` field
//      from the JSON value.
//   3. Run:  JWT="paste-token-here" node scripts/generate-quest-track.mjs week-1-earn
//
// The script is read from scripts/quest-tracks/<slug>.txt
// Generation takes ~90 seconds. Track will appear in your /audios library.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://etghaosktmxloqivquvu.supabase.co";
const FN = "generate-custom-track";

const TRACK_PRESETS = {
  "week-1-earn": {
    title: "Already Wealthy — Pillar 1: Earn",
    voice: "theo",
    file: "quest-tracks/week-1-earn.txt",
  },
  // Weeks 2-6 plug in here as we write them
};

async function main() {
  const slug = process.argv[2];
  const jwt = process.env.JWT;

  if (!slug || !TRACK_PRESETS[slug]) {
    console.error(`Usage: JWT="..." node scripts/generate-quest-track.mjs <slug>`);
    console.error(`Available slugs: ${Object.keys(TRACK_PRESETS).join(", ")}`);
    process.exit(1);
  }
  if (!jwt) {
    console.error("Missing JWT env var. Grab it from devtools → localStorage → sb-...-auth-token.access_token");
    process.exit(1);
  }

  const preset = TRACK_PRESETS[slug];
  const scriptPath = join(__dirname, preset.file);
  const script_text = (await readFile(scriptPath, "utf8")).trim();

  console.log(`→ ${preset.title}`);
  console.log(`  voice: ${preset.voice}`);
  console.log(`  script: ${script_text.split(/\s+/).length} words`);
  console.log(`  generating (~90s, longer with countdowns)…`);

  const start = Date.now();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${FN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      script_text,
      voice: preset.voice,
      title: preset.title,
      diagnosis: { issue: "wealth quest week 1: earn" },
    }),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.error) {
    console.error(`✗ failed in ${elapsed}s — ${res.status}`);
    console.error(body);
    process.exit(1);
  }

  console.log(`✓ done in ${elapsed}s`);
  console.log(`  track_id: ${body.track_id}`);
  console.log(`  audio: ${body.audio_path}`);
  console.log(`  duration: ${Math.round(body.duration_sec / 60 * 10) / 10} min`);
  console.log(`\nOpen /audios in Velum to listen.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
