// Redesigning Reality cohort sales letter — public route at /redesigning-reality.
// Copy is Jordan's verbatim (no word changes). Structural improvements applied:
//   1. Date conflict fixed at the top (was 6/11, now 6/18)
//   2. Spot count formatting cleaned ("10 7" → "7 of 10")
//   3. Outcomes section moved ABOVE the framework (peak-desire first)
//   4. CTAs surfaced 3 times (top, mid-page after outcomes, bottom) + sticky bottom bar on mobile
//   5. Visual hierarchy: italics on philosophical lines, bold on framework headers,
//      small-caps for section labels
//
// Paper aesthetic (cream + serif) matches the existing /redesigning-cohort page
// so anyone moving between the two reads them as the same brand voice.

const FULL_PAY = "https://buy.stripe.com/3cIcN60BJ8ay6sa7bI7ss05";
const SPLIT_PAY = "https://buy.stripe.com/dRm7sM4RZ62q7we53A7ss06";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function CTAStack({ id }: { id?: string }) {
  return (
    <div id={id} className="not-prose flex flex-col sm:flex-row gap-3 my-10">
      <a
        href={FULL_PAY}
        className="flex-1 text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-8 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
      >
        Claim Your Spot — $600
      </a>
      <a
        href={SPLIT_PAY}
        className="flex-1 text-center rounded-full border border-[#2a2724]/30 px-8 py-4 text-[15px] font-semibold tracking-wide hover:border-[#b08d57] hover:text-[#b08d57] transition-colors"
      >
        Split it — 2 × $300
      </a>
    </div>
  );
}

export default function RedesigningRealityPage() {
  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 pb-32 lg:pb-24 text-[17px] leading-[1.7]">

        {/* Eyebrow — date conflict fixed (was 6/11 in the original), spot count cleaned */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          7 of 10 founding spots remaining · Session 1 begins 6/18
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          Redesigning Reality
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          A Journey to Rewriting Identity and Self-Concept.
        </p>

        {/* Opening */}
        <p className="mb-6">
          Starting June 18th, I'm working with a small group (10 people) on rewriting their reality from the inside out, on the levels that govern our most important decisions on a day to day basis — <strong>identity and self-concept</strong>.
        </p>

        <p className="mb-6">
          Every time you think of something you want, or come up against taking a life-changing action, an image flashes across the screen of your mind that reminds you of the person you see yourself to be. This "image" creates a feeling, and that feeling drives forward movement or paralysis. <em>Change the image, change the feeling, change the actions. Change the actions, and you change your life</em> (we are what we repeatedly do).
        </p>

        <p className="mb-6">
          Identity pierces through motivation and willpower, and shows up for you even on the days you do not feel like it. Identity, in fact, can create the results of your dreams without needing to "work on your limiting beliefs".
        </p>

        <p className="mb-6">
          This isn't about having or getting things, though that will be a by-product, it's about <strong>becoming the type of person who would attract those things naturally</strong>.
        </p>

        <p className="mb-3 font-semibold">The premise of Redesigning Reality this is built on two principles:</p>
        <ol className="list-decimal pl-5 mb-10 space-y-2">
          <li><em>Your dream life is built, not stumbled upon.</em></li>
          <li>
            <em>External results are downstream of internal change.</em> You don't force the outside — you rebuild the inside (nervous system, identity, the scripts under the surface) and the outside reorganizes around the new you.
          </li>
        </ol>

        <p className="mb-10">
          This is for people who've already done "the work" in the form of books, meditations, retreats and hours of chanting affirmations, but still default to old, familiar behaviours when it counts. This isn't due to a lack of knowledge, it's because <strong>identity is what you default to under pressure</strong>.
        </p>

        {/* OUTCOMES — moved above framework so reader sees the dream first */}
        <p className="text-[11px] tracking-[0.32em] uppercase text-[#b08d57] font-semibold mb-3">After Six Weeks</p>
        <h2 style={serif} className="text-[28px] md:text-[32px] mb-5">You'll walk away with…</h2>
        <ul className="list-disc pl-5 mb-10 space-y-3">
          <li><strong>Identity-level changes</strong> made on a subconscious level through mental rehearsal, journaling, and "becoming" the person you know you are capable of becoming through micro-actions (not affirmations that rest in your conscious mind).</li>
          <li>A <strong>clear picture of what your "Redesigned Reality" looks like</strong>, and actually having a roadmap to create it.</li>
          <li>Your <strong>"daily three"</strong> micro-actions that build evidence (what your brain is always searching for) that say "I am the type of person I say that I am".</li>
          <li>A newfound sense of <strong>confidence and certainty</strong> in your ability to navigate uncertainty, generate more joy and money, and create from a place of wholeness instead of lack (the personal development industry thrives on keeping you on the "fixing" hamsterwheel, and it's time to get off).</li>
        </ul>

        {/* First CTA placement — peak-desire moment, right after outcomes */}
        <CTAStack />

        {/* HOW WE'LL DO IT */}
        <p className="text-[11px] tracking-[0.32em] uppercase text-[#b08d57] font-semibold mb-3">The Process</p>
        <h2 style={serif} className="text-[28px] md:text-[32px] mb-5">Here's how we'll do it…</h2>

        <p className="mb-5">
          <strong>First, we Regulate.</strong> You can't architect from survival. You'll learn a multitude of techniques to get you out of fight-or-flight and turn on your brain's "genius centers" — so calm is your baseline, not a place you visit.
        </p>
        <p className="mb-5">
          <strong>Then, we Rewire.</strong> What are the current perceptions, beliefs and self-concepts that are holding you anchored to the past? We bring them to the surface and begin to re-write the script.
        </p>
        <p className="mb-5">
          <strong>Then, we Become.</strong> We redesign the identity you default to under pressure — and install the version of you your goals require. This is not a process of "doing more" it's about installing an identity of someone who doesn't have to try so hard.
        </p>
        <p className="mb-10">
          <strong>Then, we Build.</strong> We turn it into a life — architecting your reality and the aligned action that makes it real. You're going to have to trim out a lot of things that don't fit your desired future, but it will be worth it.
        </p>

        {/* FIT */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This is for you if you:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>Have done the surface work and are ready to go deep</li>
          <li>Will actually show up and do the work (a horse can be led to water, but only the horse can decide to drink)</li>
          <li>Can hold yourself accountable in between weekly sessions to do your "Daily Three" as well as your Morning and Evening "Identity Installation" audios.</li>
        </ul>

        {/* WHAT YOU GET */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">What you get:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>6 live sessions each week, beginning June 18th at 6pm PT</li>
          <li>A small, committed group to build alongside</li>
          <li>Lifetime recording access as well as access to the audios created during the cohort</li>
        </ul>

        {/* ITINERARY */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The Itinerary:</h2>
        <ol className="list-decimal pl-5 mb-10 space-y-2">
          <li>Week 1 — Perception of Self and Reality</li>
          <li>Week 2 — Self-Regulation and Emotional Home Base</li>
          <li>Week 3 — The Identity Map</li>
          <li>Week 4 — Micro-Action Magic</li>
          <li>Week 5 — Life Architecture</li>
          <li>Week 6 — Living Beyond Belief</li>
        </ol>

        {/* DETAILS */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;6 Thursdays, 6pm PT — June 18 → July 23</p>
          <p className="mb-1.5">👥&nbsp;&nbsp;10 founding spots (7 remaining)</p>
          <p>💰&nbsp;&nbsp;US $600 (or 2× $300)</p>
        </div>

        {/* Final CTA */}
        <CTAStack />

        {/* CLOSING */}
        <p className="italic text-[#6f675c] mb-3">If you're reading this, you have been invited to this cohort.</p>
        <p className="mb-2">Simply reply to the email which you received it with, or email <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a> with any questions.</p>
        <p className="mb-1">I look forward to seeing you there,</p>
        <p style={serif} className="text-[22px] italic">Jordan</p>

      </article>

      {/* Sticky CTA bar — only visible on mobile when the inline CTAs aren't on screen */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#f7f4ee] border-t border-[#e3ddd1] px-4 py-3 lg:hidden">
        <div className="flex gap-2 max-w-[660px] mx-auto">
          <a
            href={FULL_PAY}
            className="flex-1 text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-4 py-3 text-[13px] font-semibold tracking-wide"
          >
            Claim — $600
          </a>
          <a
            href={SPLIT_PAY}
            className="flex-1 text-center rounded-full border border-[#2a2724]/30 px-4 py-3 text-[13px] font-semibold tracking-wide"
          >
            Split 2 × $300
          </a>
        </div>
      </div>
    </div>
  );
}
