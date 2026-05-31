// The Sunday Session — weekly group breathwork at /sunday-session
// First 4 sessions free, then $20/session or $60/mo membership.
// Set BOOKING_URL to a Cal.com event URL once Jordan creates the recurring event.

const BOOKING_URL = "https://cal.com/jordanoelrich/sunday-session";

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function ReserveButton() {
  return (
    <a
      href={BOOKING_URL}
      className="not-prose inline-block w-full sm:w-auto text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-10 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
    >
      Reserve Your Spot — Free
    </a>
  );
}

export default function SundaySessionPage() {
  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Eyebrow */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          Live every Sunday · Free for the first month
        </p>

        {/* Headline */}
        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          The Sunday Session
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          A weekly breathwork journey, together.
        </p>

        {/* Lead */}
        <p className="mb-6 text-[19px] leading-[1.6]">
          Every Sunday, a small group of us gather on Zoom and breathe for an hour.
        </p>
        <p className="mb-10 text-[19px] leading-[1.6]">
          You leave lighter than you arrived. Sometimes you cry. Sometimes you laugh. Sometimes both in the same breath. Whatever happens, your nervous system gets a real reset before the week begins.
        </p>

        {/* CTA top */}
        <ReserveButton />

        {/* What happens */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mt-14 mb-4">What happens in the hour:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li>5 minutes of arriving — quick check-in, intention setting</li>
          <li>45 minutes of guided breathwork, music, presence</li>
          <li>10 minutes of integration, sharing if you want to, no pressure if you don't</li>
        </ul>

        <p className="mb-10">
          You don't need any experience. You don't need to be "good at" anything. You just need a quiet space, headphones, and an hour.
        </p>

        {/* When + how */}
        <div className="border-t border-[#e3ddd1] pt-8 mb-10">
          <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">The details:</h2>
          <p className="mb-1.5">📅&nbsp;&nbsp;Every Sunday, 10am PT (60 min)</p>
          <p className="mb-1.5">💻&nbsp;&nbsp;On Zoom — link sent after you reserve</p>
          <p className="mb-1.5">🎁&nbsp;&nbsp;Free for the first 4 Sundays</p>
          <p>💰&nbsp;&nbsp;After: $20 per session, or $60/month for unlimited</p>
        </div>

        {/* Final CTA */}
        <ReserveButton />

        <p className="text-[15px] text-[#6f675c] italic mt-10">
          Questions? Email <a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a>
        </p>

      </article>
    </div>
  );
}
