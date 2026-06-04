// The Redesigning Reality Workshop — live $45 workshop at /redesigning-workshop.
// Copy is Jordan's verbatim (June 3 2026 revision). Pure black-on-white brand.

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

        {/* HEADLINE / TAGLINE */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-3">
          Why your next level “strategy” might not be a strategy at all
        </h1>
        <p style={serif} className="text-[28px] md:text-[36px] italic text-neutral-700 mb-10 leading-[1.1]">
          — but an upgrade in identity
        </p>

        {/* INTRO */}
        <p className="mb-6">
          <strong>The Redesigning Reality Workshop</strong> — 2 hours, live.
        </p>

        <p className="mb-6">
          A workshop to snap you out of your survival identity, overwrite the BS (belief systems) keeping you from your potential, and dismantle your current idea of what's possible.
        </p>

        <p className="mb-6">
          The premise is simple, and a little uncomfortable: you have no idea what's actually possible for you. The only two things in the way are your perception of who you are, and your model of what "reality" is allowed to be.
        </p>

        <p className="mb-6">
          In two hours you'll learn to drop beneath the conscious mind and rewrite the scripts silently running your life — identity-level change at the subconscious level, where it actually holds.
        </p>

        <p className="mb-6">
          Because however much free will you feel you have, ~95% of your daily thoughts, feelings and behaviours run on a subconscious program. Until you get into the operating system, you're stuck with slow-lane tools like motivation and willpower — the two things that vanish exactly when you need them.
        </p>

        <p className="mb-6">
          Everyone tells you to chase your next level. Nobody tells you that chasing it from your current self-concept is like flooring a supercar that's jammed in first gear.
        </p>

        <p className="mb-10">
          When you learn to think, feel and decide from the identity of your future self, the heavy lifting is already done — underneath, before you ever take action.
        </p>

        {/* CTA top */}
        <CTAButton />

        {/* Inside Redesigning Reality */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">Inside Redesigning Reality</h2>
        <ul className="list-disc pl-5 mb-10 space-y-3">
          <li>How to find the hidden nervous-system "set points" that act like a thermostat — yanking you back into the familiar the moment things get big</li>
          <li>How to set goals so large they disturb you (and the people around you) — and then watch yourself actually hit them</li>
          <li>The illusion of self-sabotage, and how to arrive at your next level without the urge to blow it all up</li>
          <li>How to pair self-hypnosis with "Identity Statements" that create immediate, lasting change at the nervous-system level</li>
          <li>Why throwing out 70% of what you do every day is what makes room for the magic</li>
          <li>How to flip off the "Survival Switch" in your brain and act from your Creative Identity instead</li>
          <li>How to find and dismantle your "Ceiling of Perceived Possibility" — and finally break through it with the One Big Leap (OBL) Method™</li>
        </ul>

        {/* You'll Also Walk Away With */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">You'll Also Walk Away With</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>The Redesigning Reality Workbook</li>
          <li>Morning & Evening "Identity Installation" hypnosis audios</li>
          <li>Lifetime access to the workshop recording</li>
        </ul>

        {/* This Is For You If */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This Is For You If</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>You're an entrepreneur, founder or creator who knows your results are downstream of your identity and inner world — and you're ready to move fast</li>
          <li>You've scratched the surface of "mindset" work (ew) but keep hitting the same invisible ceiling the moment things start going well</li>
          <li>You're willing to take real action, live, in the room</li>
          <li>You're ready to "slow down to speed up" and set your hustle identity down for a bit (you can always pick it back up later… if you actually want it)</li>
        </ul>

        {/* The Details */}
        <div className="border-t border-neutral-200 pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The Details</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;Saturday, June 13 · 10am–12pm PT</p>
          <p className="mb-1.5">💻&nbsp;&nbsp;Live on Zoom — link sent 72 hours before</p>
          <p className="mb-1.5">🎁&nbsp;&nbsp;Lifetime replay + Identity Installation audios included</p>
          <p>💰&nbsp;&nbsp;$45 USD · one-time</p>
        </div>

        {/* Final CTA — sits above guarantee so the close lands then the safety net */}
        <CTAButton />

        {/* GUARANTEE */}
        <div className="border border-black/15 bg-neutral-50 rounded-lg p-6 my-10">
          <p className="text-[12px] tracking-[0.24em] uppercase text-black font-semibold mb-3">
            The Guarantee
          </p>
          <p className="mb-0">
            Show up for the full workshop, do the workbook, and if you still feel it wasn't worth your $45 — I'll ship your money right back, no hard feelings.
          </p>
        </div>

        <p className="text-[15px] text-neutral-600 italic mt-10">
          Questions? Email <a href="mailto:hello@govelum.com" className="text-black underline underline-offset-2">hello@govelum.com</a>
        </p>

      </article>
    </div>
  );
}
