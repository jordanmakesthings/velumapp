import { useEffect, useRef, useState } from "react";
import { Loader2, Headphones } from "lucide-react";
import VelumMark from "@/components/VelumMark";
import { supabase } from "@/integrations/supabase/client";

// Lead magnet: a free 10-min Ericksonian rewiring track in exchange for an email.
// The point of this page is NOT to sell — it's to capture an email + retargeting
// pixel hit, then deliver real value so the nurture sequence has something to
// build on.
//
// The audio is "The Money Pillars 1: Earn" — universal enough as a cold-traffic
// intro (everyone wants money rewiring) and proves the wedge in one session.

const FREE_TRACK_URL =
  "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/track-media/audio/quests/money-pillars/1-earn.wav";
const TRACK_TITLE = "The Money Pillars · I. Earn";

export default function FreeTrackPage() {
  const [phase, setPhase] = useState<"form" | "thanks">("form");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fire pixels on landing — high-intent retargeting audience
    Promise.all([
      import("@/lib/reddit-pixel").then(({ rdtTrack }) => rdtTrack("ViewContent")),
      import("@/lib/meta-pixel").then(({ fbqTrack }) => fbqTrack("ViewContent")),
    ]).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const utm_source = params.get("utm_source") || "";
      const utm_medium = params.get("utm_medium") || "";
      const utm_campaign = params.get("utm_campaign") || "";

      // Add to Loops with lead-magnet tag
      try {
        await supabase.functions.invoke("loops-leadmagnet", {
          body: {
            email: email.trim().toLowerCase(),
            firstName: firstName.trim(),
            magnet: "free-track",
            utm_source,
            utm_medium,
            utm_campaign,
          },
        });
      } catch {
        // Soft-fail — they still get the audio
      }

      // Fire conversion events on every pixel — Lead is the ad-platform-optimization signal
      try {
        const { rdtTrack } = await import("@/lib/reddit-pixel");
        rdtTrack("Lead", { email: email.trim().toLowerCase() });
      } catch {}
      try {
        const { fbqTrack } = await import("@/lib/meta-pixel");
        fbqTrack("Lead");
      } catch {}

      setPhase("thanks");
      // Auto-scroll to the audio after a beat so the transition feels intentional
      setTimeout(() => {
        audioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (err) {
      setError("Something went wrong. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#F2EFE7] flex flex-col">
      <header className="px-6 py-5 flex items-center gap-3">
        <VelumMark className="w-8 h-8 text-[#C9A84C]" />
        <span className="font-serif tracking-[0.4em] text-sm text-[#F2EFE7]/80">V E L U M</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-xl w-full">
          {phase === "form" ? (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">
                Free · No card required
              </p>
              <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-5 text-[#F2EFE7]">
                A free Ericksonian hypnosis track to rewire the part of your mind
                that runs <em className="text-[#C9A84C] not-italic">95%</em> of your life.
              </h1>
              <p className="text-base md:text-lg text-[#c8c4bb] leading-relaxed mb-8 font-sans">
                Your conscious mind only handles about 5%. The other 95% — the
                subconscious — is what meditation apps, journaling, and willpower
                rarely touch. This track is built for that layer. About 10 minutes.
                Headphones recommended.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#9aaea3] mb-2 font-sans font-medium">
                    First name (optional)
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans"
                    placeholder="What should we call you?"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-[#9aaea3] mb-2 font-sans font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded px-4 py-3 text-base text-[#F2EFE7] focus:border-[#C9A84C] outline-none font-sans"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </div>
                {error && <p className="text-sm text-[#c97c5c]">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9A84C] text-[#0d0d0d] rounded py-4 font-sans font-semibold tracking-[0.18em] uppercase text-xs hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Headphones className="w-4 h-4" />
                      Send me the track
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[#7a8a82] leading-relaxed text-center font-sans">
                  You'll be listening in 5 seconds. No spam — just occasional
                  notes from Jordan, the founder.
                </p>
              </form>
            </>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">
                Welcome · Headphones in
              </p>
              <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3 text-[#F2EFE7]">
                {TRACK_TITLE}
              </h1>
              <p className="text-sm text-[#c8c4bb] leading-relaxed mb-8 font-sans">
                Press play below. About 7-10 minutes. Eyes closed if you can.
                Don't try to "do" anything — just listen.
              </p>

              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6 mb-10" ref={audioRef}>
                <audio src={FREE_TRACK_URL} controls preload="auto" className="w-full" />
                <a
                  href={FREE_TRACK_URL}
                  download="velum-morning-activation.wav"
                  className="text-[11px] tracking-[0.2em] uppercase text-[#9aaea3] hover:text-[#C9A84C] mt-4 inline-block font-sans"
                >
                  Download the file →
                </a>
              </div>

              {/* ═══ OTO BLOCK — Grand Slam Offer architecture ═══ */}
              <div className="border-t border-[#2a2a2a] pt-12 mb-2">

                {/* HOOK */}
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-3 font-sans font-medium">
                  If that just landed for you · keep reading
                </p>
                <h2 className="font-serif text-3xl md:text-4xl mb-5 text-[#F2EFE7] leading-tight">
                  That track took 7 minutes. Imagine what
                  <em className="text-[#C9A84C] not-italic"> a track built specifically for what's stuck </em>
                  could do.
                </h2>

                {/* AGITATION + STORY */}
                <div className="text-base text-[#c8c4bb] leading-relaxed mb-8 font-sans space-y-4">
                  <p>
                    Most people who try meditation, breathwork, journaling — and feel
                    "almost there" but never quite arrive — are missing one piece. The
                    work has to reach the <em className="text-[#F2EFE7] not-italic">subconscious</em>,
                    the 95% of the brain that's actually running the show. Conscious
                    affirmations don't get there. Generic guided meditations don't get there.
                  </p>
                  <p>
                    Velum is the first app that writes you a personalized Ericksonian
                    hypnosis track for the <em className="text-[#F2EFE7] not-italic">specific</em> pattern
                    you want to break. You tell it what's stuck. 90 seconds later you have
                    audio in your voice's frequency, built around your exact words, designed
                    for the layer that needs to change.
                  </p>
                </div>

                {/* THE STACK */}
                <div className="bg-[#0F2F26]/40 border border-[#C9A84C]/15 rounded-xl p-6 mb-8">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">
                    What you get when you join
                  </p>
                  <ul className="space-y-3.5 mb-6">
                    {[
                      ["Custom track generator","Unlimited personalized hypnosis tracks. 90-second turnaround. Yours forever.","$228/yr"],
                      ["The Money Pillars Collection","Six sequenced tracks rewiring your relationship with earning, keeping, spending, multiplying, enjoying, and circulating money.","$79"],
                      ["All future Collections","Sleep · Anxiety · Confidence · Identity. New ones added monthly — all included.","$79+/each"],
                      ["The Velum library","Breathwork (including the Breath Ladder), daily resets, journaling tools.","$49"],
                      ["Locked-in price","Today's price is your price forever — no future increases.","$0"],
                    ].map(([title, desc, value], i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-[#C9A84C] mt-0.5 flex-shrink-0">✓</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans font-semibold text-sm text-[#F2EFE7]">
                            {title}
                            <span className="text-[#9aaea3] font-normal ml-2">· {value} value</span>
                          </p>
                          <p className="text-[13px] text-[#c8c4bb] mt-0.5 leading-snug">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-[#C9A84C]/15 pt-4 flex items-baseline justify-between">
                    <p className="text-sm text-[#9aaea3] font-sans">Total stacked value</p>
                    <p className="font-serif text-2xl text-[#C9A84C] line-through opacity-70">$1,000+</p>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-sm text-[#F2EFE7] font-sans font-semibold">Today, one time</p>
                    <p className="font-serif text-3xl text-[#C9A84C]">$199</p>
                  </div>
                </div>

                {/* GUARANTEE */}
                <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-5 mb-8 flex items-start gap-4">
                  <div className="text-[#C9A84C] text-2xl flex-shrink-0">⌖</div>
                  <div>
                    <p className="font-serif text-lg text-[#F2EFE7] mb-1.5 leading-tight">
                      30-day full refund. No questions, no hoops.
                    </p>
                    <p className="text-[13px] text-[#c8c4bb] leading-relaxed">
                      Listen for 30 days. Generate as many custom tracks as you want.
                      If your nervous system doesn't feel different, email
                      jordan@govelum.com and we refund every cent. The risk is on us.
                    </p>
                  </div>
                </div>

                {/* PRIMARY CTA — LIFETIME */}
                <a
                  href={`/signup?email=${encodeURIComponent(email)}&plan=lifetime&utm_source=lead-magnet&utm_medium=oto&utm_campaign=free-track`}
                  className="block bg-[#C9A84C] text-[#0d0d0d] rounded-xl p-5 mb-3 hover:opacity-95 active:scale-[0.99] transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase font-sans font-bold mb-1.5">
                        Yes — Velum forever
                      </p>
                      <p className="font-serif text-2xl leading-tight">
                        $199 · One time · 30-day guarantee
                      </p>
                    </div>
                    <div className="text-2xl font-serif group-hover:translate-x-1 transition-transform">→</div>
                  </div>
                </a>

                {/* SECONDARY CTA — TRIAL */}
                <a
                  href={`/trial-free?email=${encodeURIComponent(email)}&utm_source=lead-magnet&utm_medium=oto&utm_campaign=free-track`}
                  className="block bg-[#181818] border border-[#2a2a2a] hover:border-[#C9A84C]/40 rounded-xl p-5 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase font-sans font-medium text-[#9aaea3] mb-1.5">
                        Or — try it first, no card
                      </p>
                      <p className="font-serif text-lg text-[#F2EFE7] leading-tight">
                        7 days free · $99/yr after
                      </p>
                    </div>
                    <div className="text-2xl font-serif text-[#9aaea3] group-hover:translate-x-1 transition-transform">→</div>
                  </div>
                </a>

                {/* P.S. */}
                <div className="mt-10 border-t border-[#2a2a2a] pt-8">
                  <p className="text-[11px] tracking-[0.25em] uppercase text-[#9aaea3] mb-3 font-sans font-medium">
                    P.S.
                  </p>
                  <p className="text-sm text-[#c8c4bb] leading-relaxed font-sans">
                    The track you just listened to is one piece. The actual product
                    is the custom-track generator — when you tell Velum what's stuck
                    and it writes you a track built specifically for that. Most people
                    feel the shift on the first one. The 30-day guarantee means trying
                    it costs you nothing. The only thing you're risking is staying
                    where you are.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-[11px] text-[#7a8a82] font-sans">
          Velum · Subconscious rewiring audios · govelum.com
        </p>
      </footer>
    </div>
  );
}
