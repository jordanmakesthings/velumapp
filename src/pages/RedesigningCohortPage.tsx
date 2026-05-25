const FULL_PAY = "https://buy.stripe.com/3cIcN60BJ8ay6sa7bI7ss05";
const SPLIT_PAY = "https://buy.stripe.com/dRm7sM4RZ62q7we53A7ss06";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

export default function RedesigningCohortPage() {
  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          7 of 10 founding spots remaining · Starts Thursday, June 18
        </p>

        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          Redesigning Reality
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          A Journey Through Identity &amp; Self-Concept
        </p>

        <p className="mb-6">
          Starting June 18th, I'm working with a small group to{" "}
          <strong>redesign their reality from the inside out</strong> — to stop being a passenger in
          their own life and become the architect of it. A life that feels deeply connected,
          meaningful, and most of all… authentic to you.
        </p>

        <p className="mb-3 font-semibold">The premise of Redesigning Reality is built on two principles:</p>
        <ol className="list-decimal pl-5 mb-10 space-y-2">
          <li>Your dream life is built, not stumbled upon.</li>
          <li>
            External results are downstream of internal change. You don't force the outside — you
            rebuild the inside (nervous system, identity, the scripts under the surface), and the
            outside reorganizes around the new you.
          </li>
        </ol>

        <p className="mb-12">
          This is for people who've already done "the work" — the books, the meditations, the retreats,
          the hours of chanting affirmations — but still default to old, familiar behaviours when it
          counts. That's not a lack of knowledge. It's because{" "}
          <strong>identity is what you default to under pressure.</strong>
        </p>

        <h2 style={serif} className="text-[30px] font-semibold mb-5">Here's how we'll do it</h2>
        <div className="space-y-5 mb-12">
          <p><strong className="text-[#b08d57]">Regulate.</strong> You can't architect from survival. You'll learn a range of techniques to get out of fight-or-flight and switch on your brain's "genius centers" — so calm becomes your baseline, not a place you visit.</p>
          <p><strong className="text-[#b08d57]">Rewire.</strong> What perceptions, beliefs, and self-concepts are anchoring you to the past? We bring them to the surface and start re-writing the script.</p>
          <p><strong className="text-[#b08d57]">Become.</strong> We redesign the identity you default to under pressure — and install the version of you your goals require. This isn't about "doing more." It's about becoming someone who doesn't have to try so hard.</p>
          <p><strong className="text-[#b08d57]">Build.</strong> We turn it into a life — architecting your reality and the aligned action that makes it real.</p>
        </div>

        <h2 style={serif} className="text-[30px] mb-4">This is NOT for you if you:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-1.5">
          <li>Want another course to passively consume</li>
          <li>Think manifesting alone will do it, with no inner work or action</li>
          <li>Want a quick hack instead of real reprogramming</li>
        </ul>

        <h2 style={serif} className="text-[30px] mb-4">This IS for you if you:</h2>
        <ul className="list-disc pl-5 mb-12 space-y-1.5">
          <li>Have done the surface work and are hungry to go deep</li>
          <li>Will actually show up and do the work</li>
          <li>Are ready to stop being the passenger and become the architect</li>
        </ul>

        <h2 style={serif} className="text-[30px] mb-4">What you get</h2>
        <ul className="list-disc pl-5 mb-12 space-y-1.5">
          <li>6 live sessions with me (teaching + guided practice + hot seats) — Thursdays, 6 PM PT</li>
          <li>Full Velum platform access for the cohort</li>
          <li>A small, serious group doing it alongside you</li>
          <li>Lifetime recording access</li>
        </ul>

        <h2 style={serif} className="text-[30px] mb-4">The itinerary, week by week</h2>
        <ol className="list-decimal pl-5 mb-12 space-y-1.5">
          <li>Perception of Reality</li>
          <li>Self-Regulation &amp; Emotional Home Base</li>
          <li>Identity &amp; Self-Concept</li>
          <li>Living Beyond Belief</li>
          <li>Life Architecture</li>
          <li>Living as It</li>
        </ol>

        <div className="border-t border-[#e3ddd1] pt-8 mb-10">
          <h2 style={serif} className="text-[30px] mb-4">The details</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;6 Thursdays, 6 PM PT — June 18 → July 23</p>
          <p className="mb-1.5">👥&nbsp;&nbsp;10 founding spots (7 remaining)</p>
          <p>💰&nbsp;&nbsp;$599 in full, or 2 × $300</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={FULL_PAY}
            className="flex-1 text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-8 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
          >
            Claim your spot — $599
          </a>
          <a
            href={SPLIT_PAY}
            className="flex-1 text-center rounded-full border border-[#2a2724]/30 px-8 py-4 text-[15px] font-semibold tracking-wide hover:border-[#b08d57] hover:text-[#b08d57] transition-colors"
          >
            Split it — 2 × $300
          </a>
        </div>

      </article>
    </div>
  );
}
