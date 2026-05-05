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
                  We'll email it to you and you can listen here right after. No
                  spam — just occasional notes from Jordan, the founder.
                </p>
              </form>
            </>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-5 font-sans font-medium">
                Yours · Headphones in
              </p>
              <h1 className="font-serif text-3xl md:text-4xl leading-tight mb-3 text-[#F2EFE7]">
                {TRACK_TITLE}
              </h1>
              <p className="text-sm text-[#c8c4bb] leading-relaxed mb-8 font-sans">
                10 minutes. Eyes closed if you can. Don't try to "do" anything —
                Ericksonian hypnosis is permissive, not directive. Just listen.
              </p>

              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6 mb-8" ref={audioRef}>
                <audio src={FREE_TRACK_URL} controls preload="auto" className="w-full" />
                <a
                  href={FREE_TRACK_URL}
                  download="velum-money-pillars-1-earn.wav"
                  className="text-[11px] tracking-[0.2em] uppercase text-[#9aaea3] hover:text-[#C9A84C] mt-4 inline-block font-sans"
                >
                  Download the file →
                </a>
              </div>

              <div className="bg-gradient-to-br from-[#0F2F26] to-[#1a4a3a] border border-[#C9A84C]/20 rounded-xl p-6">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A84C] mb-3 font-sans font-medium">
                  When you're ready for more
                </p>
                <h2 className="font-serif text-2xl mb-3 text-[#F2EFE7] leading-tight">
                  Generate your own custom hypnosis track for whatever's
                  actually stuck.
                </h2>
                <p className="text-sm text-[#c8c4bb] leading-relaxed mb-5 font-sans">
                  Money guilt, sleep, anxiety, relationship spirals, whatever.
                  Tell us, and an AI writes you a personalized Ericksonian
                  hypnosis script and renders it to audio in 90 seconds. Free
                  7-day trial. No card required.
                </p>
                <a
                  href={`/trial-free?email=${encodeURIComponent(email)}&utm_source=lead-magnet&utm_medium=referral&utm_campaign=free-track`}
                  className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#0d0d0d] rounded px-5 py-3 font-sans font-semibold tracking-[0.18em] uppercase text-xs hover:opacity-90 transition-opacity"
                >
                  Start your free trial →
                </a>
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
