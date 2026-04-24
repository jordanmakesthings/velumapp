import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

type Phase = "loading" | "voice" | "chat" | "confirm" | "generating" | "done" | "cooldown" | "error";

interface VoiceOption {
  key: string;
  name: string;
  gender: "M" | "F";
  blurb: string;
}

const VOICES: VoiceOption[] = [
  { key: "jordan",  name: "Jordan",  gender: "M", blurb: "The founder's voice" },
  { key: "theo",    name: "Theo",    gender: "M", blurb: "Soft, conversational" },
  { key: "solomon", name: "Solomon", gender: "M", blurb: "Deep, grounding" },
  { key: "almee",   name: "Almee",   gender: "F", blurb: "Warm, gentle" },
  { key: "rhythm",  name: "Rhythm",  gender: "F", blurb: "Smooth, steady" },
  { key: "nicole",  name: "Nicole",  gender: "F", blurb: "Calm, measured" },
];

const COOLDOWN_DAYS = 30;

const DIAG_SYSTEM = `You are an Ericksonian hypnotherapist conducting a quiet, curious intake interview for Velum, a nervous system regulation app. You speak softly, with patience and presence.

Goal: in 6-12 conversational turns, surface the user's most pressing belief, narrative, or pattern.

Method:
- Layer questions: surface complaint → emotional charge → underlying belief → somatic location → desired state.
- Don't lead. Use open questions ("what comes up when…", "where do you feel that…", "what would change if…").
- Use the user's own words back to them. Notice what they avoid.
- Don't interpret out loud. Don't suggest solutions. Just listen.
- Keep your replies very short — usually one sentence. Often just the next question.
- Never use motivational clichés or therapy-speak. No "I hear you," no "that's valid."

Stop conditions: stop asking once you have enough to write a 12-minute hypnosis script. Usually 6-12 turns total. Hard cap at 14.

When you have enough, send a single message containing ONLY this JSON (no preamble, no markdown fences):
{
  "ready": true,
  "issue": "1-line user-facing summary of the surface complaint",
  "belief": "the underlying belief in their words if possible",
  "narrative": "the story they're telling themselves",
  "somatic": "where/how it shows up in the body, in their words",
  "desired_state": "what they said they want instead",
  "modality_notes": "details that should shape the script — sensitivities, metaphors they used, what calmed them",
  "first_name": "their name if mentioned, else null"
}

Until you're ready, just keep the conversation going.`;

export default function CustomTrackPage() {
  const navigate = useNavigate();
  const { user, profile, hasAccess, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [unlocksIn, setUnlocksIn] = useState<number>(0);
  const [extraCredits, setExtraCredits] = useState<number>(0);
  const [voice, setVoice] = useState<string>("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedTrackId, setGeneratedTrackId] = useState<string>("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Initial load: check cooldown + voice preference ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!hasAccess) {
      navigate("/premium");
      return;
    }
    (async () => {
      const { data: lastTrack } = await supabase
        .from("custom_tracks" as any)
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: prof } = await supabase
        .from("profiles")
        .select("voice_preference, extra_track_credits")
        .eq("id", user.id)
        .maybeSingle();
      const credits = ((prof as any)?.extra_track_credits as number | null) ?? 0;
      setExtraCredits(credits);
      const pref = ((prof as any)?.voice_preference as string | null) || "jordan";
      setVoice(pref);
      if (lastTrack) {
        const ageDays = (Date.now() - new Date((lastTrack as any).created_at).getTime()) / 86400000;
        if (ageDays < COOLDOWN_DAYS && credits <= 0) {
          setUnlocksIn(Math.ceil(COOLDOWN_DAYS - ageDays));
          setPhase("cooldown");
          return;
        }
      }
      setPhase("voice");
    })();
  }, [authLoading, user, hasAccess, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, phase]);

  // ── Voice picker → start chat ──
  const pickVoiceAndContinue = async (k: string) => {
    setVoice(k);
    if (user) {
      await supabase.from("profiles").update({ voice_preference: k } as any).eq("id", user.id);
    }
    setChat([{ role: "assistant", content: "What's been on your mind lately?" }]);
    setPhase("chat");
  };

  // ── Send chat message → call Claude via edge function (re-uses existing pattern with API key) ──
  // For prod we'd ideally wrap THIS in a small edge function too, but for MVP we use a public Anthropic
  // proxy via the existing api in Hypnosis Lab pattern. To keep secrets server-side, we route through
  // the supabase edge function `chat-diagnostic` if available — fall back to this simple call.
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setChatInput("");
    setChatBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("diagnostic-chat", {
        body: { messages: next, system: DIAG_SYSTEM },
      });
      if (error) throw error;
      const reply = (data?.reply || "").trim();
      const stripped = reply.replace(/^```json|```$/g, "").trim();
      let parsed: any = null;
      if (stripped.startsWith("{")) {
        try {
          const j = JSON.parse(stripped);
          if (j?.ready === true) parsed = j;
        } catch {}
      }
      if (parsed) {
        setDiagnosis(parsed);
        setPhase("confirm");
      } else {
        setChat([...next, { role: "assistant", content: reply }]);
      }
    } catch (e: any) {
      toast.error("Chat error: " + (e.message || e));
    }
    setChatBusy(false);
  };

  // ── Confirm diagnosis → call generate-custom-track edge function ──
  const generate = async () => {
    if (!diagnosis || !voice) return;
    setPhase("generating");
    try {
      const { data, error } = await supabase.functions.invoke("generate-custom-track", {
        body: {
          diagnosis,
          voice,
          title: diagnosis.issue ? diagnosis.issue.slice(0, 60) : "Custom track",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      setGeneratedTrackId(data.track_id);
      setPhase("done");
    } catch (e: any) {
      setErrorMsg(e.message || String(e));
      setPhase("error");
    }
  };

  const summary = useMemo(() => {
    if (!diagnosis) return "";
    const parts: string[] = [];
    if (diagnosis.issue) parts.push(diagnosis.issue);
    if (diagnosis.belief) parts.push(`The story underneath: "${diagnosis.belief}".`);
    if (diagnosis.somatic) parts.push(`In your body, it shows up as ${diagnosis.somatic}.`);
    if (diagnosis.desired_state) parts.push(`What you said you want instead: ${diagnosis.desired_state}.`);
    return parts.join(" ");
  }, [diagnosis]);

  return (
    <div className="min-h-screen bg-radial-subtle font-sans flex flex-col">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] tracking-[2px] uppercase">Custom Track</span>
        </div>
        <div className="w-12" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 max-w-2xl mx-auto w-full">
        {phase === "loading" && <Loader2 className="w-6 h-6 animate-spin text-accent" />}

        {phase === "cooldown" && (
          <div className="text-center max-w-md">
            <Lock className="w-8 h-8 text-accent mx-auto mb-4 opacity-70" />
            <h1 className="text-display text-3xl mb-3">Your next track is on its way.</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              You unlock one custom track every 30 days. Yours unlocks in <span className="text-accent font-medium">{unlocksIn} days</span>.
            </p>
            <p className="text-muted-foreground text-xs italic mb-8">
              Want one sooner? Pick up an extra below.
            </p>
            <a
              href="https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block gold-gradient text-primary-foreground rounded-xl px-6 py-3 text-sm font-sans font-bold tracking-wide"
            >
              Buy an extra track · $9
            </a>
          </div>
        )}

        {phase === "voice" && (
          <div className="w-full">
            <div className="text-center mb-8">
              <h1 className="text-display text-3xl mb-2">Pick your voice</h1>
              <p className="text-muted-foreground text-sm">This is who'll guide you. You can change it anytime.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VOICES.map((v) => {
                const sel = voice === v.key;
                return (
                  <button
                    key={v.key}
                    onClick={() => pickVoiceAndContinue(v.key)}
                    className={`velum-card p-4 text-left transition-all ${sel ? "border-accent/60 bg-accent/5" : "hover:border-accent/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] tracking-wider uppercase text-accent">{v.gender}</span>
                      {v.key === "jordan" && (
                        <span className="text-[9px] tracking-wider uppercase text-muted-foreground bg-muted-foreground/15 px-1.5 py-0.5 rounded">Founder</span>
                      )}
                    </div>
                    <div className="text-foreground text-base font-serif font-light">{v.name}</div>
                    <div className="text-muted-foreground text-[11px] mt-1 italic">{v.blurb}</div>
                  </button>
                );
              })}
            </div>
            {extraCredits > 0 && (
              <p className="text-center text-accent text-xs mt-6">You have {extraCredits} extra track{extraCredits === 1 ? "" : "s"} ready to use.</p>
            )}
          </div>
        )}

        {phase === "chat" && (
          <div className="w-full flex flex-col h-[70vh]">
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-card border border-border text-foreground font-serif italic text-base"
                      : "bg-accent/15 border border-accent/30 text-foreground ml-auto"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatBusy && (
                <div className="text-muted-foreground text-xs italic">listening…</div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Type whatever comes up…"
                rows={2}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:border-accent/50"
                style={{ fontSize: "16px" }}
                disabled={chatBusy}
              />
              <button
                onClick={sendChat}
                disabled={chatBusy || !chatInput.trim()}
                className="gold-gradient text-primary-foreground rounded-xl px-5 text-xs font-sans font-bold tracking-wide disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {phase === "confirm" && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-display text-2xl mb-4">Here's what I'm hearing.</h1>
            <div className="bg-card border border-accent/20 rounded-2xl p-5 mb-6 text-left">
              <p className="text-foreground text-base font-serif font-light leading-relaxed">{summary}</p>
            </div>
            <p className="text-muted-foreground text-xs italic mb-6">Sound right?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setChat([
                    ...chat,
                    { role: "assistant", content: "Tell me what feels off — what would you change or add?" },
                  ]);
                  setDiagnosis(null);
                  setPhase("chat");
                }}
                className="flex-1 border border-border rounded-xl py-3 text-foreground text-sm hover:border-accent/40"
              >
                Refine
              </button>
              <button
                onClick={generate}
                className="flex-1 gold-gradient text-primary-foreground rounded-xl py-3 text-sm font-sans font-bold tracking-wide flex items-center justify-center gap-2"
              >
                Generate <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {phase === "generating" && (
          <div className="text-center max-w-md">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-4 animate-pulse" />
            <h1 className="text-display text-2xl mb-3">Writing your track…</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This takes about a minute. We're writing the script, then voicing it. Stay on this screen.
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mt-8" />
          </div>
        )}

        {phase === "done" && (
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4 text-accent opacity-80">✦</div>
            <h1 className="text-display text-3xl mb-3">Your track is ready.</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 italic">
              Listen daily for 21 days for the full effect.
            </p>
            <Link
              to="/profile"
              className="inline-block gold-gradient text-primary-foreground rounded-xl px-8 py-3 text-sm font-sans font-bold tracking-wide"
            >
              Listen now
            </Link>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center max-w-md">
            <h1 className="text-display text-2xl mb-3">Something didn't land.</h1>
            <p className="text-destructive text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => setPhase("voice")}
              className="border border-border rounded-xl px-5 py-2.5 text-foreground text-sm hover:border-accent/40"
            >
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
