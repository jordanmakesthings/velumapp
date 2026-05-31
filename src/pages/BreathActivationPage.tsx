// Breath Activation — 1:1 sales page at /breath-activation
// Launch price $97 today (urgency), $197 starting next week.
// Set BOOKING_URL to a Cal.com event URL once Jordan creates it
// (cal.com/jordanoelrich/breath-activation with Stripe + Zoom + Google Calendar wired).

const BOOKING_URL = "https://cal.com/jordanoelrich/breath-activation";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function BookButton() {
  return (
    <a
      href={BOOKING_URL}
      className="not-prose inline-block w-full sm:w-auto text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-10 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
    >
      Book Your Session — $97 (launch price)
    </a>
  );
}

export default function BreathActivationPage() {
  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Eyebrow */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          Launch week · $97 today · $197 starting next week
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          Breath Activation
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          One hour. One breath journey. Designed for you, in real time.
        </p>

        {/* Bio / positioning — verbatim from Jordan's breakthrough */}
        <p className="mb-6 text-[19px] leading-[1.6]">
          You come to me with something you think you want.
        </p>
        <p className="mb-6 text-[19px] leading-[1.6]">
          I put you in touch with the feeling you're actually after.
        </p>
        <p className="mb-10 text-[19px] leading-[1.6]">
          You cry tears of joy, and we laugh and high-five.
        </p>

        {/* CTA top */}
        <BookButton />

        {/* What it is */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">What this actually is:</h2>
        <p className="mb-6">
          60 minutes with me, live on Zoom. We talk for a few minutes about what's actually going on for you — not the surface version, the real one. Then I lead you through a custom breathwork journey designed specifically for what came up in our conversation.
        </p>
        <p className="mb-6">
          No script. No 10-step protocol. Just breath, presence, and whatever wants to move through you when it finally has permission to.
        </p>
        <p className="mb-10">
          You leave in a different state than you arrived. That's the whole promise.
        </p>

        {/* What you walk away with */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">What you walk away with:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>An embodied state shift — the kind you can't get from an app or a book</li>
          <li>A custom 10-minute breathwork audio I record just for you, delivered within 48 hours</li>
          <li>The recording of our session, so you can return to it whenever you need</li>
          <li>A simple practice you can do daily to maintain what we open</li>
        </ul>

        {/* Who it's for */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">This is for you if:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>You're carrying something you can't quite name and you're tired of trying to think your way out</li>
          <li>You've done meditation, journaling, therapy, courses — and you still feel like you're holding your breath</li>
          <li>You want to feel something real, not just understand something intellectually</li>
          <li>You're open to crying, laughing, both, neither — whatever shows up</li>
        </ul>

        {/* The price thing */}
        <div className="border border-[#b08d57]/40 bg-[#fbf8f1] rounded-lg p-6 my-10">
          <p className="text-[12px] tracking-[0.24em] uppercase text-[#b08d57] font-semibold mb-3">
            Launch pricing
          </p>
          <p className="mb-3">
            $97 today only. Starting next week, the price is $197. Same session, same audio, same everything — just rewarding the people who move first.
          </p>
          <p className="text-[15px] text-[#6f675c] italic">
            If you book at $97 and your session is scheduled for next week or later, you still get the launch price. Lock it in now, do it when you're ready.
          </p>
        </div>

        {/* CTA mid */}
        <BookButton />

        {/* About */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">Who I am:</h2>
        <p className="mb-6">
          I'm Jordan. I built Velum (the app you're probably on right now), I've spent the last decade learning breathwork, hypnosis, somatic work, and identity work, and I've recently realized I'm done trying to be a coach who installs new identities in people. I'd rather sit with you, breathe with you, and help you remember what you already are.
        </p>
        <p className="mb-10">
          This is the work I want to do. The breathwork is the work I've always come back to. Glad you're here.
        </p>

        {/* Final CTA */}
        <BookButton />

        <p className="text-[15px] text-[#6f675c] italic mt-10">
          Questions? Email me directly: <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a>
        </p>

      </article>
    </div>
  );
}
