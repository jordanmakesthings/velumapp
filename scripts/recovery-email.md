# Recovery Email — Abandoned Checkout Cohort

**Audience:** profiles with `stripe_customer_id` set + no active/trialing subscription
**Goal:** convert them to `/trial-free` (no card, instant access)
**Send from:** jordan@govelum.com (personal, not no-reply)

---

## Subject line options (test 2)

A. `our checkout broke last week — here's a free 14 days to make up for it`
B. `quick note: I owe you a trial`

(A is more specific, B is more curious. I'd lead with A.)

---

## Preview text

`No card. No catch. Just type your email and you're in.`

---

## Body

Hey {{firstName}} —

Jordan here, founder of Velum.

I'm writing because you tried to start a trial last week and our Stripe checkout was broken. I didn't catch it for almost 48 hours. That's on me.

To make it right, I'm comping you **14 days free** — no card required, no catch. Just sign in with the email you used and you're in:

→ [Start your free 14 days]({{trialFreeLink}})

(That link drops you straight into your account. If it asks you to create one, use the same email — your existing profile will pick it up.)

Once you're in, the wedge is the **custom rewiring track generator**. You tell it what you want to rewire (money guilt, anxiety spiral, sleep, whatever), it writes a personalized Ericksonian hypnosis script in your voice and renders it to audio in about 90 seconds. That's the thing nobody else has, and it's what people seem to come back for.

If it's not your thing, no harm done — you don't get charged at the end of the trial unless you choose to.

Sorry again for the mess.

— Jordan
Founder, Velum
{{appUrl}}

---

## Loops setup

- **Trigger:** Manual campaign (one-time send)
- **Audience filter:** `userGroup` is `free` AND `stripeCustomerId` is not empty
  - (After backfill ran, the 23 abandoned-checkout users should match this)
- **Merge tag:** `trialFreeLink` = `https://app.govelum.com/trial-free?email={{email}}`
  - You'll want to update `/trial-free` AuthPage to pre-fill the email param if it's there — small QoL touch
- **Send time:** Tuesday 10am their local time (highest open rates for cold-ish B2C wellness)

## Followup if they open but don't click (D+3)

Subject: `did the link work?`

Body:
> Quick check — wanted to make sure that trial link actually went through for you. If it didn't, just reply to this email and I'll get you set up manually. — Jordan

(Plain text. One sentence. Reply rates on these are 8-12%.)
