# Meta Ads Launch Playbook — Velum Cardboard Sign Campaign

**Goal:** Get the cardboard-sign creative running on Facebook + Instagram in 30-45 minutes.

**Pre-flight:** All Meta Pixel code is already wired into Velum's frontend. The only thing waiting on you is the Pixel ID — once you have it, paste it into `index.html` (line 41 area, two spots marked `YOUR_PIXEL_ID`) and you're live.

---

## Step 1 — Create Meta Business Manager (5 min)

URL: https://business.facebook.com

1. Click **"Create Account"**
2. Business name: **Velum** (or "Velum Inc." — match whatever's on Stripe)
3. Your name + work email (jordan@govelum.com)
4. Confirm via email link

You probably already have a personal FB account — Business Manager sits on top of it. You don't need a separate personal account.

---

## Step 2 — Create or claim a Facebook Page for Velum (5 min)

URL: https://www.facebook.com/pages/create

1. Page name: **Velum**
2. Category: **Health/Beauty** or **App Page**
3. Upload Velum logo (use the gold V mark)
4. Cover image: Any of the editorial Velum images you've generated
5. Bio: One line — "Custom subconscious rewiring audios. Free 7-day trial."
6. Add link to govelum.com

Once created, go back to Business Manager → **Accounts → Pages → Add → Add a Page** and pull this Page in.

You don't need to post anything. The Page just needs to exist so ads can attribute to it.

---

## Step 3 — Create Ad Account (3 min)

In Business Manager:
1. **Settings** (gear icon) → **Accounts → Ad Accounts → Add → Create a new ad account**
2. Name: **Velum Ad Account**
3. Time zone: your local
4. Currency: **CAD** (or whatever Stripe is in)
5. Payment method: same card you use for Reddit ads is fine

---

## Step 4 — Create the Pixel (2 min)

In Business Manager:
1. **Events Manager** (in the left sidebar or via Tools)
2. **Connect Data Sources** → **Web** → **Get Started**
3. Pixel name: **Velum Pixel**
4. Website URL: `https://app.govelum.com`
5. Choose **Manual install** (we already have the code wired)
6. **Copy the Pixel ID** (15-16 digit number)

---

## Step 5 — Paste Pixel ID into Velum's code (30 sec)

Open `velumapp/index.html` and find the two `YOUR_PIXEL_ID` placeholders (around line 41-46). Replace both with your actual Pixel ID. Uncomment the two `fbq()` lines.

Then commit + push:
```bash
cd ~/Documents/Business/Velum/velumapp
git add index.html
git commit -m "Wire Meta Pixel ID for Velum ad account"
git push origin main
```

Vercel deploys in ~60 seconds. Pixel is live.

**Verify:** Install the Meta Pixel Helper Chrome extension, visit app.govelum.com, click the extension icon. Should show "Pixel ID: XXX — PageView fired."

---

## Step 6 — Build the Campaign (10 min)

In **Ads Manager** (https://business.facebook.com/adsmanager):

### Campaign level
1. **Create** → choose objective: **Sales** (best for trial conversions)
2. Campaign name: `Velum — Cold Acquisition — May 2026`
3. **Performance goal:** Maximize number of conversions
4. **Buying type:** Auction
5. **Daily budget at campaign level:** turn OFF (set at ad set level instead — gives you more control per creative)
6. Skip Advantage+ for now — manual gives you more control on a small budget

### Ad Set level
1. Ad set name: `Cardboard Sign — 25-55 — N. America`
2. **Conversion location:** Website
3. **Performance goal:** Maximize number of conversions
4. **Pixel:** select Velum Pixel
5. **Conversion event:** **Lead** (start with Lead, not Purchase — same logic as Reddit; you need ~50 events/week to optimize and Purchase is too rare at start)
6. **Daily budget:** **$15-20 CAD**
7. **Schedule:** Run continuously
8. **Audience:**
   - Location: **United States, Canada** (start narrow)
   - Age: **25-55**
   - Gender: **All**
   - Detailed targeting: Add interests like:
     - Meditation
     - Mindfulness
     - Self-improvement
     - Personal development
     - Headspace
     - Calm (app)
     - Hypnosis
     - Joe Dispenza (probably listed as "Author" — try it)
     - Affirmations
9. **Placements:** Manual → Facebook Feed, Instagram Feed, Instagram Reels, Instagram Stories. Skip everything else (Audience Network, Messenger).

### Ad level
1. Ad name: `StreetGuy — Subconscious Sign`
2. **Identity:** Velum Page
3. **Format:** Single image
4. **Creative:** Upload the `streetman1.jpg` (or whichever cardboard-sign image you want to lead with)
5. **Primary text** (the body copy that shows above the image):
```
Most people don't realize their conscious mind only runs about 5% of their reality.

The other 95% — the part actually running the show — never gets touched by meditation, journaling, or affirmations.

Velum is the first app that writes you a custom hypnosis track for the exact pattern you're trying to break. 90 seconds. Free 7-day trial. No card.
```
6. **Headline:** `Custom subconscious rewiring — 7 days free`
7. **Description:** `No card required.`
8. **Website URL:** `https://app.govelum.com/trial-free?utm_source=meta&utm_medium=paid&utm_campaign=streetguy`
9. **CTA button:** **Sign Up** or **Learn More** (test both later, start with Sign Up)

Hit **Publish**.

---

## Step 7 — Wait for Review

Meta reviews ads in **15 min to 24 hours.** Hypnosis-related ads sometimes get flagged for "personal attributes" — if rejected, swap "subconscious" for "subconscious patterns" or "deep practice" in the copy and resubmit.

---

## Step 8 — When Live, Watch These Metrics

Same logic as Reddit:

| First 1,000 impressions | Action |
|---|---|
| CTR ≥ 1.5% | Winner. Scale daily budget 2x. |
| CTR 0.8% – 1.5% | Working. Hold steady. |
| CTR 0.5% – 0.8% | Test new creative or copy. |
| CTR < 0.5% | Kill within 48 hours. |

CPC benchmarks for wellness on Meta: $0.50 - $2.00 in NA.

---

## Step 9 — Add Variations Once the First Ad Has Data

After 2-3 days of data on the first ad:
1. Duplicate the Ad Set
2. Same audience, same budget
3. Swap in a different cardboard sign creative (different person, different headline)
4. Run them simultaneously — Meta auto-allocates to whichever performs

You already have a library of sign images and headlines. Goal: 3-5 active creatives in rotation by week 2.

---

## Common Pitfalls

- **"Special Ad Category" flag:** Don't check any of those (Credit, Employment, Housing, Social Issues). Velum is none of those.
- **Pixel not firing:** If Events Manager shows zero Lead events 2 hours after launching, your Pixel ID is wrong or wasn't deployed. Check the Pixel Helper extension.
- **No spend after 24 hours:** Audience too narrow, or budget too low. Widen interests or bump daily budget to $25.
- **Spending fast but no conversions:** CTR is fine but landing page or trial flow is the problem. Check Lead event firing in Events Manager.

---

## Total estimated cost to learn

- Setup: $0 (just time)
- First 5 days at $15/day: $75
- After 5 days: you'll know if the cardboard creative converts on Meta or not

If it works → scale to $50-100/day. If it doesn't → kill it, keep YouTube as your acquisition engine.
