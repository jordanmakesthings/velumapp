// The Redesigning Reality Workshop — live $45 workshop at /redesigning-workshop.
// Low-ticket entry point into the offer ladder: workshop → cohort → small-group MRR → $20K 1:1.
// Copy is Jordan's verbatim (June 2 2026). Pure black-on-white brand. No cream, no gold.

const PAY_URL = "https://buy.stripe.com/00w3cw5W32QedUC7bI7ss0a";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function CTAButton() {
  return (
    <a
      href={PAY_URL}
      className="not-prose inline-block w-full sm:w-auto text-center rounded-full bg-black text-white px-10 py-4 text-[15px] font-semibold tracking-wide hover:bg-neutral-700 transition-colors"
    >
      Save Your Seat — $45 USD
    </a>
  );
}

export default function RedesigningWorkshopPage() {
  return (
    <div className="min-h-screen w-full bg-white text-black">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Eyebrow */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-black font-semibold mb-6">
          Live · Saturday June 13 · 10am PT · 2 hours
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-8">
          The Redesigning Reality Workshop
        </h1>

        {/* Opening — Jordan's verbatim copy */}
        <p style={serif} className="text-[20px] md:text-[22px] italic text-neutral-700 mb-8 leading-[1.5]">
          A 2-hour live workshop designed to snap you out of your survival identity, overwrite the BS (belief systems) that keep you from actualizing your potential, and dismantle your current perception of what you think is possible.
        </p>

        <p className="mb-6">
          This workshop is built upon the principle that you have absolutely no clue what's possible for you, and the only thing standing in your way is a) your current perception of self and b) your model of what feels like "reality".
        </p>

        <p className="mb-6">
          Redesigning Reality is going to teach you how to go beneath the conscious mind and rewrite the scripts silently running your life to make identity-level changes in the subconscious mind.
        </p>

        <p className="mb-6">
          As much free will as you feel like you have, 95% of your daily thoughts, feelings and behaviours are being driven by a subconscious program. If you can't enter the operating system, you'll still rely on slow-lane methods like motivation and willpower (neither of which are there when you need them).
        </p>

        <p className="mb-6">
          While everybody tells you to move towards your next level, they don't tell you that moving towards it from your current self-concept is like driving a supercar that's jammed in first gear.
        </p>

        <p className="mb-10">
          When you learn to think, feel and make decisions FROM the identity of your future self, the heavy lifting has already been done on a subconscious level.
        </p>

        {/* CTA top */}
        <CTAButton />

        {/* What we cover */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">In Redesigning Reality we cover:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-3">
          <li>How to find your hidden nervous system "set points" that act like a thermostat — pulling you back into the familiarity trap when it matters most</li>
          <li>How to set goals and targets so big they disturb you and others around you — and actually watch yourself achieve them.</li>
          <li>The illusion of self-sabotage and how to land into your next level without feeling the need to blow it up.</li>
          <li>How to combine self-hypnosis with "Identity Statements" that produce immediate, lasting changes on a nervous system level.</li>
          <li>Why taking 70% of what you do on a daily basis and throwing them in the garbage makes room for magic</li>
          <li>How to toggle off the "Survival Switch" in your brain and take action from your Creative Identity</li>
          <li>How to identify and dismantle your current "Ceiling of Perceived Possibility" and finally break past it with the OBL Method</li>
        </ul>

        {/* Plus you'll walk away with */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">Plus you'll walk away with:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>The Redesigning Reality Workbook</li>
          <li>Morning & Evening "Identity Upgrade" Hypnosis Audios</li>
          <li>Lifetime access to the Redesigning Reality workshop recording</li>
        </ul>

        {/* This is for you if */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This is for you if:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>You're an entrepreneur, founder or creator who knows your results are downstream of your identity and inner world, and are ready to level up fast</li>
          <li>You've scratched the surface with "mindset" work (ew) but keep hitting the same invisible ceilings when things start going well</li>
          <li>You are willing to take powerful action in a live event setting</li>
          <li>You're ready to "slow down to speed up" and set down your hustle identity temporarily (you can always pick it back up after if you need…)</li>
        </ul>

        {/* DETAILS — kept */}
        <div className="border-t border-neutral-200 pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;Saturday, June 13 · 10am–12pm PT</p>
          <p className="mb-1.5">💻&nbsp;&nbsp;Live on Zoom — link sent 72 hours before the workshop</p>
          <p className="mb-1.5">🎁&nbsp;&nbsp;Replay + 20-min hypnosis audio included</p>
          <p>💰&nbsp;&nbsp;$45 USD · one-time</p>
        </div>

        {/* Final CTA — sits above guarantee so the close lands then the safety net */}
        <CTAButton />

        {/* GUARANTEE */}
        <div className="border border-black/15 bg-neutral-50 rounded-lg p-6 my-10">
          <p className="text-[12px] tracking-[0.24em] uppercase text-black font-semibold mb-3">
            Guarantee
          </p>
          <p className="mb-0">
            If you show up for the full workshop, complete the workbook, and feel like it was not worth your $45 — I'll happily ship your money right back to you.
          </p>
        </div>

        <p className="text-[15px] text-neutral-600 italic mt-10">
          Questions? Email <a href="mailto:hello@govelum.com" className="text-black underline underline-offset-2">hello@govelum.com</a>
        </p>

      </article>
    </div>
  );
}
