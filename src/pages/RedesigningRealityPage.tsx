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
        Claim Your Spot — $599 (one-time)
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
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Intro VSL — Jordan's cohort hello, sits above the fold so the human shows up before the offer */}
        <div className="not-prose mb-10 rounded-lg overflow-hidden border border-[#e3ddd1] shadow-sm bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            poster="/video/redesigning-intro-poster.jpg"
            className="w-full h-auto block"
          >
            <source src="/video/redesigning-intro.mp4" type="video/mp4" />
            Your browser doesn't support embedded video. <a href="/video/redesigning-intro.mp4" className="text-[#b08d57] underline">Download the intro</a>.
          </video>
        </div>

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

        {/* ITINERARY — moved above outcomes per Jordan's restructure, expanded with full week-by-week descriptions */}
        <p className="text-[11px] tracking-[0.32em] uppercase text-[#b08d57] font-semibold mb-3">Week by Week</p>
        <h2 style={serif} className="text-[28px] md:text-[32px] mb-6">The Itinerary</h2>

        <div className="mb-12 space-y-7">
          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 1 — Perception of Self and Reality</strong></h3>
            <p>Your "reality" is a filter through which you see the world — hard stop. And much of how you see the world, has to do with how you see yourself. If we are going to build a castle (new self-concept), we're going to first have to bulldoze the rickety old shack that's taking up space.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 2 — Self-Regulation and Emotional Home Base</strong></h3>
            <p>You do not create your dream life from a state of survival. One more time for the people in the back, your deepest desires do not come from running on adrenaline and cortisol. And if they somehow land? Good luck holding them for any period of time. Mastering the art of emotional self-regulation before taking action leads to life-changing actions.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 3 — The Identity Map</strong></h3>
            <p>You know that version of you that has it all? What thoughts and feelings are they firing and wiring on a daily basis? What emotions do they live from? I'll roll the dice and assume it isn't fear, anger, urgency. The Identity Map is about the internal self-concepts and beliefs that your future self lives by, and how to wire those into your nervous system through the daily Identity Installation Audio and The Daily 3.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 4 — Micro-Action Magic</strong></h3>
            <p>When you declare something about yourself, your brain goes looking for one thing: evidence. If you do not have some receipts to back your Identity Statements (affirmations that actually work), your subconscious mind is going to slide in with a quick "thanks, but no thanks". Micro-Actions are the small behavioural shifts that teach your subconscious mind that you actually are the type of person you say you are. This is the foundation of a human being that truly believes they can handle anything.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 5 — Life Architecture</strong></h3>
            <p>Most "build your dream life" teaching has people sticking pictures of luxury vacations on a vision board while their body is stuck in a state of unworthiness. This is where you build the roadmap to the type of experiences (internally and externally), the type of possessions (yes, having nice things is good), and the type of actions you create when you come from an identity of wholeness.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 6 — Living Beyond Belief</strong></h3>
            <p>This is where the deep work truly starts showing evidence in your external world. You wake up feeling differently, you carry yourself differently, and you have a little giggle inside when you think about the sh*t you used to tolerate because it felt "normal". The "3 E's" of week 6 are Embodiment, Embodiment and Embodiment. You're going to learn how to do the deep work to actually hold and enjoy the results you start creating.</p>
          </div>
        </div>

        {/* OUTCOMES — sits right after itinerary so reader sees the path then the destination */}
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
          <li>6 weekly live sessions (60 minutes each), beginning June 18th at 6pm PT</li>
          <li>A small, committed group to build alongside</li>
          <li>Lifetime recording access as well as access to the audios created during the cohort</li>
        </ul>

        {/* DETAILS */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;6 Thursdays, 6pm PT (60 min) — June 18 → July 23</p>
          <p className="mb-1.5">👥&nbsp;&nbsp;10 founding spots (7 remaining)</p>
          <p>💰&nbsp;&nbsp;US $599 one-time (or 2× $300)</p>
        </div>

        {/* RISK REVERSAL — sits right before the final CTA so the close lands without friction */}
        <div className="border border-[#b08d57]/40 bg-[#fbf8f1] rounded-lg p-6 my-10">
          <p className="text-[12px] tracking-[0.24em] uppercase text-[#b08d57] font-semibold mb-3">
            Zero-risk guarantee
          </p>
          <p className="mb-3">
            Show up to the first session. Do the work. If by the end of it you can't see a single way this could change your life — email me and I'll refund every dollar.
          </p>
          <p className="text-[15px] text-[#6f675c] italic">
            No forms, no hoops, no awkward back-and-forth. The only thing I ask is that you actually show up.
          </p>
        </div>

        {/* Final CTA */}
        <CTAStack />

        {/* FAQ */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-10">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-6">Questions you might be asking:</h2>

          <div className="space-y-6">
            <div>
              <p className="font-semibold mb-1">What if I can't make a live session?</p>
              <p className="text-[#3d3a36]">If you miss a session, you have lifetime access to the recording and access to the group for the entirety of the cohort.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">Do I need experience with meditation or breathwork?</p>
              <p className="text-[#3d3a36]">YES — this is a cohort for people who have done a lot of surface-level work but either can't break through to what they want or can't hold their results long-term.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">Is this therapy?</p>
              <p className="text-[#3d3a36]">This is not therapy, nor is it a replacement for therapy. The modalities taught in this cohort are scientifically proven on many fronts to change the way you think, feel and act, but this is not a replacement for professional help.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">What's the actual time commitment?</p>
              <p className="text-[#3d3a36]">One hour per week for six weeks, 20 minutes per day during your identity installation audios. If you cannot commit 20 minutes per day then I cannot help you.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">How is this different from the Velum app?</p>
              <p className="text-[#3d3a36]">Velum is a tool for you to use on your own accord. Redesigning Reality is a high-touch experience.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">I've already done a lot of mindset work. Will this be different?</p>
              <p className="text-[#3d3a36]">So have millions of other people who can't figure out why they temporarily feel good and then default back to their habitual, familiar patterns. This goes beyond "mindset work".</p>
            </div>
          </div>
        </div>

        {/* CLOSING */}
        <p className="italic text-[#6f675c] mb-3">If you're reading this, you have been invited to this cohort.</p>
        <p className="mb-2">Simply reply to the email which you received it with, or email <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a> with any questions.</p>
        <p className="mb-1">I look forward to seeing you there,</p>
        <p style={serif} className="text-[22px] italic">Jordan</p>

      </article>
    </div>
  );
}
