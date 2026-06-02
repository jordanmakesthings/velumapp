// Post-checkout thank-you page for the Rewriting Reality workshop.
// Lives at /rewriting-reality/thanks — set this as the success URL on the Stripe Payment Link.
// Swap MEETING_URL once Jordan has Zoom Pro or Cal Video meeting set up.

const MEETING_URL = "https://zoom.us/REPLACE_WITH_MEETING_URL";
const WORKSHOP_DATETIME_ISO = "20260607T100000/20260607T120000"; // for calendar add links
const WORKSHOP_TITLE = "Rewriting Reality Workshop with Jordan";
const WORKSHOP_DETAILS = "Live 2-hour workshop. Drop the survival self, install identity statements in trance, leave acting FROM not TO. Meeting link: " + MEETING_URL;

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

function calendarLinks() {
  const title = encodeURIComponent(WORKSHOP_TITLE);
  const details = encodeURIComponent(WORKSHOP_DETAILS);
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${WORKSHOP_DATETIME_ISO}&details=${details}&ctz=America/Los_Angeles`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&startdt=2026-06-07T10:00:00-07:00&enddt=2026-06-07T12:00:00-07:00`;
  // ICS as a data URL — works for Apple Calendar / any ICS-aware app
  const ics = `BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${title}%0ADTSTART:20260607T170000Z%0ADTEND:20260607T190000Z%0ADESCRIPTION:${details}%0AEND:VEVENT%0AEND:VCALENDAR`;
  const apple = `data:text/calendar;charset=utf-8,${ics}`;
  return { google, outlook, apple };
}

export default function RewritingRealityThanksPage() {
  const cal = calendarLinks();

  return (
    <div className="min-h-screen w-full bg-[#f7f4ee] text-[#2a2724]">
      <article className="mx-auto w-full max-w-[660px] px-6 py-16 lg:py-24 text-[17px] leading-[1.7]">

        {/* Confirmation */}
        <p className="text-[12px] tracking-[0.28em] uppercase text-[#b08d57] font-semibold mb-6">
          Payment confirmed · You're in
        </p>

        <h1 style={serif} className="text-[40px] md:text-[52px] leading-[1.05] mb-1">
          See you Saturday.
        </h1>
        <p style={serif} className="text-[22px] md:text-[26px] italic text-[#6f675c] mb-10">
          A few details so you're ready.
        </p>

        {/* The link card — most important thing on the page */}
        <div className="border border-[#b08d57]/40 bg-[#fbf8f1] rounded-lg p-6 mb-10">
          <p className="text-[12px] tracking-[0.24em] uppercase text-[#b08d57] font-semibold mb-3">
            The workshop
          </p>
          <p className="mb-1.5"><strong>📅 Saturday, June 7</strong></p>
          <p className="mb-1.5"><strong>🕙 10:00am – 12:00pm PT</strong></p>
          <p className="mb-5"><strong>💻 Zoom link below — same link every session</strong></p>
          <a
            href={MEETING_URL}
            className="not-prose inline-block w-full sm:w-auto text-center rounded-full bg-[#2a2724] text-[#f7f4ee] px-10 py-4 text-[15px] font-semibold tracking-wide hover:bg-[#b08d57] transition-colors"
          >
            Join the workshop →
          </a>
          <p className="text-[13px] text-[#6f675c] italic mt-4 mb-0">
            Bookmark this link. I'll also email it to you with a reminder before the session.
          </p>
        </div>

        {/* Add to calendar */}
        <h2 style={serif} className="text-[24px] md:text-[26px] mb-3">Add to your calendar</h2>
        <div className="flex flex-wrap gap-3 mb-12">
          <a href={cal.google} target="_blank" rel="noopener" className="rounded-full border border-[#2a2724]/30 px-5 py-2.5 text-[13px] font-medium hover:border-[#b08d57] hover:text-[#b08d57] transition-colors">Google Calendar</a>
          <a href={cal.apple} download="rewriting-reality.ics" className="rounded-full border border-[#2a2724]/30 px-5 py-2.5 text-[13px] font-medium hover:border-[#b08d57] hover:text-[#b08d57] transition-colors">Apple Calendar</a>
          <a href={cal.outlook} target="_blank" rel="noopener" className="rounded-full border border-[#2a2724]/30 px-5 py-2.5 text-[13px] font-medium hover:border-[#b08d57] hover:text-[#b08d57] transition-colors">Outlook</a>
        </div>

        {/* How to prepare */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">How to show up:</h2>
        <ul className="list-disc pl-5 mb-10 space-y-2">
          <li><strong>Quiet space</strong> — ideally a room you can close the door on for two hours</li>
          <li><strong>Headphones</strong> — better audio = deeper trance</li>
          <li><strong>Notebook + pen</strong> — you'll be writing identity statements live</li>
          <li><strong>Water</strong> — breath and trance work dehydrates faster than you'd think</li>
          <li><strong>Don't eat heavy beforehand</strong> — lighter body, deeper drop</li>
        </ul>

        {/* What we'll cover */}
        <h2 style={serif} className="text-[26px] md:text-[28px] mb-4">What we're doing in the 2 hours:</h2>
        <ol className="list-decimal pl-5 mb-10 space-y-2">
          <li>The 5-step self-induction protocol — I'll teach it, then we'll run it together</li>
          <li>Writing identity statements that actually hold (not affirmations that bounce off)</li>
          <li>A live group hypnosis session — your first install</li>
          <li>The FROM not TO framework with real examples</li>
          <li>Q&A on your specific patterns</li>
        </ol>

        <p className="mb-10">
          The recording + a 20-minute take-home hypnosis audio will be emailed to you within 48 hours after the workshop ends.
        </p>

        {/* Closing */}
        <div className="border-t border-[#e3ddd1] pt-8">
          <p className="italic text-[#6f675c] mb-3">If anything comes up between now and Saturday — questions, life happening, you can't make it — just email me.</p>
          <p className="mb-1"><a href="mailto:hello@govelum.com" className="text-[#b08d57] underline underline-offset-2">hello@govelum.com</a></p>
          <p className="mb-1 mt-6">See you Saturday,</p>
          <p style={serif} className="text-[22px] italic">Jordan</p>
        </div>

      </article>
    </div>
  );
}
