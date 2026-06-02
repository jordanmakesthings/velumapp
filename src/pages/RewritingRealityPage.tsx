// Rewriting Reality — live $45 workshop sales page at /rewriting-reality.
// Low-ticket entry point into the offer ladder: workshop → cohort → small-group MRR → $20K 1:1.
// Built June 2 2026 under Jordan's "Jord" identity / locked direction (project_jordan_business_v3).
// Replace REPLACE_WITH_STRIPE_LINK below after creating the $45 USD payment link in Stripe.

const PAY_URL = "https://buy.stripe.com/REPLACE_WITH_STRIPE_LINK";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function CTAButton() {
  return (
    <a
      href={PAY_URL}
      className="not-prose inline-block w-full sm:w-auto text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-10 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
    >
      Save Your Seat — $45 USD
    </a>
  );
}

export default function RewritingRealityPage() {
  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Eyebrow */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          Live · Saturday June 7 · 10am PT · 2 hours
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          Rewriting Reality
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          A 2-hour live workshop to drop the survival self — and act from the identity underneath.
        </p>

        {/* Opening — the actual thesis */}
        <p className="mb-6">
          Most entrepreneurs run themselves into the ground chasing the next milestone <em>from</em> survival — adrenaline, urgency, "I have to make this work or else." They get there, briefly, then revert.
        </p>

        <p className="mb-6">
          The fix isn't more discipline. It's not better strategy. It's not a new morning routine.
        </p>

        <p className="mb-6">
          It's installing the identity statements that let you stop performing the survival version of yourself — and start acting <strong>FROM</strong> the version of you that's already underneath. The version that creates from interest, not need.
        </p>

        <p className="mb-10">
          In two hours, I'll teach you exactly how I do this for myself — and how you can run the protocol daily after the workshop is over.
        </p>

        {/* CTA top */}
        <CTAButton />

        {/* What we'll do */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">What we'll do in the 2 hours:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>The fastest self-induction I know — the 5-step protocol I use daily to drop into trance in under 3 minutes</li>
          <li>How to write identity statements that actually hold (most affirmations fail because they're written from the wrong layer of self)</li>
          <li>A live group hypnosis session where you install your first set of statements with me guiding you</li>
          <li>The "FROM not TO" framework — the difference between chasing your dreams from survival vs. moving from the new identity, with practical examples</li>
          <li>Q&A — your specific patterns, your specific blocks</li>
        </ul>

        {/* What you walk away with */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">What you walk away with:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>A repeatable daily practice you can run anywhere in 10-15 minutes</li>
          <li>Your first set of identity statements, written and installed</li>
          <li>The recording of the entire session, yours forever</li>
          <li>A 20-minute audio of the live hypnosis I lead so you can re-run it whenever</li>
        </ul>

        {/* Who it's for */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This is for you if you:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>Are an entrepreneur, founder, or operator who knows the inner game is the bottleneck</li>
          <li>Have done the surface work (books, courses, retreats) and want the actual mechanism, not more theory</li>
          <li>Are willing to be in trance with a small group of humans for an hour</li>
          <li>Can show up live on June 7 — or are okay with the replay if life happens</li>
        </ul>

        {/* DETAILS */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;Saturday, June 7 · 10am–12pm PT</p>
          <p className="mb-1.5">💻&nbsp;&nbsp;Live on Zoom — link sent after you register</p>
          <p className="mb-1.5">🎁&nbsp;&nbsp;Replay + 20-min hypnosis audio included</p>
          <p>💰&nbsp;&nbsp;$45 USD · one-time</p>
        </div>

        {/* CTA mid */}
        <CTAButton />

        {/* What comes after — soft cohort/coaching mention */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">If you want to go deeper:</h2>
        <p className="mb-6">
          The workshop is the entry point. If what we do on June 7 resonates, the next step is the 6-week <strong>Redesigning Reality cohort</strong> — same methodology, deeper integration, small group, live for 90 minutes a week. You'll get the link at the end of the workshop.
        </p>
        <p className="mb-10">
          No pressure either way. The workshop stands on its own.
        </p>

        {/* Bio */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">Who I am:</h2>
        <p className="mb-6">
          I'm Jordan. I built Velum (the breathwork and meditation app), and I've spent the last decade studying hypnosis, breathwork, NLP, and identity work — most recently going deep on the Mike Mandel Hypnosis Academy curriculum.
        </p>
        <p className="mb-10">
          What I teach is the synthesis: how to use breath and trance to drop the survival self at the nervous-system level, and how to install the identity that runs your life when you're not bracing. Most of what I've learned came from years of doing it on myself, badly and then slowly less badly. This workshop is the 2-hour version.
        </p>

        {/* Final CTA */}
        <CTAButton />

        <p className="text-[15px] text-[#6f675c] italic mt-10">
          Questions? Email <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a>
        </p>

      </article>
    </div>
  );
}
