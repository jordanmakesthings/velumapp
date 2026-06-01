// Redesigning Reality cohort sales letter — public route at /redesigning-reality.
// REPOSITIONED June 1 2026: shift from "install a new identity" to "drop the survival self
// so what's underneath has room to emerge." Aligns with Jordan's non-duality lineage
// (Mooji, Robert Adams, the May-30 breathwork breakthrough) and the actual lived experience
// he's now teaching from — rather than the identity-installation framing of the original.
// Same URL, same Stripe links, same dates. Copy reflects the new mechanism.

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

        {/* Intro VSL — currently pitches the older "install identity" framing.
            Jordan to re-record under the new "drop survival" positioning when ready. */}
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

        {/* Eyebrow */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          5 of 10 founding spots remaining · Session 1 begins 6/18
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          Redesigning Reality
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          How to get out of the survival self — and back into the creative aliveness underneath.
        </p>

        {/* Opening — new thesis */}
        <p className="mb-6">
          Most of what passes for "becoming a better version of yourself" is actually just adding more layers on top of the version that's already running the show. More discipline. More affirmations. More strategies. More identity work. All of it laid on top of a nervous system stuck in survival — and a self that was built, originally, to keep you safe.
        </p>

        <p className="mb-6">
          This cohort isn't about installing a new version of you.
        </p>

        <p className="mb-6">
          It's about <strong>dropping the survival version that's running the show</strong> — so the version of you that was already here, underneath, finally has room to come back online.
        </p>

        <p className="mb-6">
          That underneath-version is the one with the creativity, the spaciousness, the play, the trust. The one that knew how to make things from interest instead of from need. The one that didn't have to brace for everything. It's not a future self you have to become. It's the actual self you stopped being able to access when life taught you to grip.
        </p>

        <p className="mb-10">
          Six weeks isn't enough time to "rewire your identity." But it's plenty of time to stop performing the survival version of yourself — and let what's underneath start showing up in your work, your relationships, your money, your art.
        </p>

        <p className="mb-3 font-semibold">The premise this cohort is built on:</p>
        <ol className="list-decimal pl-5 mb-10 space-y-2">
          <li><em>You don't need a new self. You need to drop the one you've been performing.</em></li>
          <li><em>Survival creates from lack. Aliveness creates from interest.</em> The work isn't building a different you — it's getting out of the way of who's already here.</li>
        </ol>

        <p className="mb-10">
          This is for people who've already done "the work" in the form of books, meditations, retreats and hours of chanting affirmations, and they can name every principle out loud — and still default to the same old patterns when it actually matters. Not because they're broken or undisciplined. Because <strong>they've been trying to install a new self on top of one that won't let go.</strong>
        </p>

        {/* ITINERARY — rewritten under the new positioning */}
        <p className="text-[11px] tracking-[0.32em] uppercase text-[#b08d57] font-semibold mb-3">Week by Week</p>
        <h2 style={serif} className="text-[28px] md:text-[32px] mb-6">The Itinerary</h2>

        <div className="mb-12 space-y-7">
          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 1 — How You Got Here</strong></h3>
            <p>We look at the survival self honestly. Where it came from. What it taught you. What it cost. We don't make it the enemy — it kept you alive. We just see it clearly enough to stop being run by it.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 2 — Regulation as the Doorway</strong></h3>
            <p>You cannot drop survival from inside survival. This week is the practical breathwork, the body, the presence — the daily work of getting underneath the nervous system enough to actually see what's happening. Without this, every other week is theory.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 3 — What's Underneath</strong></h3>
            <p>The version of you that existed before survival took over is still here. Not a future self. Not a higher self. Not someone you have to become. Just the version that was already here. Meeting them again — through hypnosis, breath, and direct experience.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 4 — Letting Go of the Performance</strong></h3>
            <p>The grip. The rehearsing. The constant subtle effort of being a certain way for the world. We look at where it lives in your body, what it's costing you, and the actual practice of putting it down — over and over, until it stops grabbing back.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 5 — Creating from Aliveness, Not Lack</strong></h3>
            <p>When the survival self runs the show, you create from need. From underneath, you create from interest, play, curiosity. What that actually looks like in real life — your work, your money, your relationships, your art. The practical mechanics of operating from a different floor.</p>
          </div>

          <div>
            <h3 style={serif} className="text-[20px] md:text-[22px] mb-2"><strong>Week 6 — Living Forward</strong></h3>
            <p>How to hold what's opened once the cohort ends. The daily practice that keeps you out of survival's grip. The signs you're slipping back. The grace of returning. By the end of week 6, you have the tools to do this work for the rest of your life without me.</p>
          </div>
        </div>

        {/* OUTCOMES */}
        <p className="text-[11px] tracking-[0.32em] uppercase text-[#b08d57] font-semibold mb-3">After Six Weeks</p>
        <h2 style={serif} className="text-[28px] md:text-[32px] mb-5">You'll walk away with…</h2>
        <ul className="list-disc pl-5 mb-10 space-y-3">
          <li>A clear, embodied recognition of when you're operating from survival vs. when you're not — so you stop confusing the two.</li>
          <li>The <strong>daily breathwork and self-hypnosis practices</strong> that let you drop out of survival in minutes, not months.</li>
          <li>Lifetime recordings of every session, plus the audios created during the cohort.</li>
          <li>A small group of humans walking the same path who you can return to — for the cohort and beyond.</li>
          <li>The end of "I should be doing more inner work" — because you'll know what the actual work is, and you'll be doing it daily without needing to be reminded.</li>
        </ul>

        {/* First CTA placement */}
        <CTAStack />

        {/* FIT */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This is for you if you:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>Have done the surface work and can name every principle — and you know that hasn't been enough</li>
          <li>Are tired of trying to <em>become</em> — you want to let go of who you've been pretending to be</li>
          <li>Will actually show up to a 60-minute call once a week and 20 minutes of practice a day for six weeks</li>
        </ul>

        {/* WHAT YOU GET */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">What you get:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>6 weekly live sessions (60 minutes each), beginning June 18th at 6pm PT</li>
          <li>A small, committed group to walk it with</li>
          <li>Lifetime recording access plus the audios created during the cohort</li>
        </ul>

        {/* DETAILS */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-6">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;6 Thursdays, 6pm PT (60 min) — June 18 → July 23</p>
          <p className="mb-1.5">👥&nbsp;&nbsp;10 founding spots (5 remaining)</p>
          <p>💰&nbsp;&nbsp;US $599 one-time (or 2× $300)</p>
        </div>

        {/* RISK REVERSAL */}
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
              <p className="text-[#3d3a36]">One hour per week for six weeks, 20 minutes per day of practice. If you cannot commit 20 minutes per day then I cannot help you.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">How is this different from the Velum app?</p>
              <p className="text-[#3d3a36]">Velum is a tool for you to use on your own accord. Redesigning Reality is a high-touch experience.</p>
            </div>

            <div>
              <p className="font-semibold mb-1">I've already done a lot of mindset work. Will this be different?</p>
              <p className="text-[#3d3a36]">Most mindset work fails because it's trying to install a new self on top of one that won't let go. We do the opposite — drop the survival self first, then let new behavior emerge naturally from what's underneath. Same principles, opposite mechanism. That's why it sticks.</p>
            </div>
          </div>
        </div>

        {/* CLOSING */}
        <p className="italic text-[#6f675c] mb-3">If you're reading this, you're being invited in.</p>
        <p className="mb-2">Reply to the email you received this in, or write to <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a> with any questions.</p>
        <p className="mb-1">See you there,</p>
        <p style={serif} className="text-[22px] italic">Jordan</p>

      </article>
    </div>
  );
}
