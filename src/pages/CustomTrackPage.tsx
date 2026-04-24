import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowLeft, ArrowRight, Loader2, Lock, Play, Pause } from "lucide-react";
import { toast } from "sonner";

type Phase = "loading" | "voice" | "chat" | "confirm" | "generating" | "done" | "cooldown" | "error";

function buildStripeLink(base: string, userId?: string, email?: string | null): string {
  if (!userId) return base;
  const params = new URLSearchParams();
  params.set("client_reference_id", userId);
  if (email) params.set("prefilled_email", email);
  return `${base}?${params.toString()}`;
}

function GeneratingScreen() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 0.25), 250);
    return () => clearInterval(t);
  }, []);
  let stage = "Writing your script…";
  if (elapsed > 25) stage = "Voicing it now…";
  if (elapsed > 90) stage = "Stitching it together…";
  if (elapsed > 150) stage = "Almost there — the longer takes are usually the best ones.";

  // Eased progress: fills smoothly from 0 → 92% over ~150s, holds at 95% after.
  // The actual "done" transition is handled by the parent (component unmounts).
  const targetSec = 150;
  const rawPct = Math.min(elapsed / targetSec, 1);
  // ease-out so it slows as it approaches the cap (feels less like it's stalled)
  const easedPct = 1 - Math.pow(1 - rawPct, 2);
  const pct = Math.min(95, easedPct * 92 + (elapsed > targetSec ? 3 : 0));

  const m = Math.floor(elapsed / 60);
  const s = Math.floor(elapsed % 60);

  return (
    <div className="text-center max-w-md w-full">
      <Sparkles className="w-8 h-8 text-accent mx-auto mb-5 animate-pulse" />
      <h1 className="text-display text-2xl mb-3">{stage}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        Crafting the words, then voicing them. Stay on this screen — don't refresh.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm mx-auto">
        <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full gold-gradient rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2.5 text-[10px] tracking-wider uppercase font-sans text-muted-foreground/70">
          <span>{Math.round(pct)}%</span>
          <span>{m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`}</span>
        </div>
      </div>
    </div>
  );
}

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

const DIAG_SYSTEM = `You are an Ericksonian hypnotherapist + outcome coach conducting a precision intake to surface the user's DESIRED OUTCOME — the specific, felt, embodied picture of what they actually want.

You speak softly. One question at a time. Use the user's EXACT words verbatim ("utilization") — never paraphrase.

This is not a problem-solving session. This is a clarity session focused on what they want. Even when the user opens with a problem, gently pivot them toward what they want INSTEAD.

══════════════════════════════════
TURN 1 — OPEN (always exactly this):
"What would you love to be true for you right now?"

If they answer with a problem ("I'm stuck", "I'm anxious", "I keep procrastinating"), reflect once and pivot to the outcome:

"[their phrase]." — When that's no longer running you, what's there instead?

Then proceed.

══════════════════════════════════
LAYERS — fire each ONCE, skip if volunteered, hard cap 9 turns

D1 ✓ OPEN (already done)
D2 SPECIFY — make it concrete. Vague answers ("happiness", "success", "freedom") need a follow-up. ("What does [their word] look like, specifically?" / "Say more — what would that mean for your day-to-day?")
D3 PICTURE — paint the vivid moment ("Paint me a moment when this is true. Where are you, what's happening?" / "Pick one scene that captures it." / "If I could film it, what would I see?")
D4 SENSORY — see / hear / feel ("In that moment, what would you see, hear, feel?" / "What's the texture of being in it?")
D5 IDENTITY — who they are when it's theirs ("Who are you in that moment? What's different about you?" / "What does this say is possible for you?")
D6 BODY — the felt pull ("Where in your body do you feel the pull toward this?" / "What does the wanting feel like — sharp, warm, tight, expansive?")
D7 ALREADY TRUE (Ericksonian seed — most important) — find the fragment that's already real ("What's the smallest version of this that's already true today, even a glimpse?" / "When have you had a taste of this?" / "Even five percent — when have you felt it?")
D8 EDGE — gentle naming, not deep digging ("What's the voice that says you can't have this?" / "What's between you and this right now?")

══════════════════════════════════
HARD RULES

- Stay anchored on what they WANT. Even D8 (the edge) is one beat of naming, not a problem-mining excursion.
- Use the user's EXACT WORDS verbatim everywhere.
- ONE question per reply. NEVER more than two sentences.
- VARY phrasing. Never repeat a question type in different words.
- NO therapy-speak: no "I hear you," "that sounds hard," "thank you for sharing," "that's valid."
- NO leading. NO interpretations. NO solutions.
- Hard cap 9 turns. Most intakes finish in 6-8.

══════════════════════════════════
ONE MID-CHAT MICRO-REFLECTION — exactly ONCE between turn 4 and turn 7, drop a single short reflection using the user's exact words on its own line BEFORE the next question.

Format:
"[their phrase]."

[next question]

Example:
"Already worthy. Already enough."

When you're in that moment, what's loudest in your body?

══════════════════════════════════
WHEN READY, send ONLY this JSON (no preamble, no markdown fences):

{
  "ready": true,
  "title": "2-4 word evocative track name hinting at the desired outcome — NOT a description of any problem (examples: 'The Open Door', 'Already Enough', 'Coming Home', 'Worthy of Receiving', 'The Steady Yes')",
  "desired_outcome": "1-line summary of what they want, in their exact words",
  "picture": "the vivid scene they painted in D3",
  "sensory": "what they'd see/hear/feel from D4",
  "identity": "who they become when it's true (D5)",
  "somatic_pull": "where + how they feel the wanting in their body (D6)",
  "already_true": "the fragment that already exists (D7) — the Ericksonian seed for the central metaphor",
  "edge": "the inner doubt or voice naming what's in the way (D8)",
  "modality_notes": "AT LEAST 3 verbatim phrases the script should echo back as anchors throughout",
  "first_name": "their name if mentioned, else null"
}

Until ready, keep moving through the layers.`;

export default function CustomTrackPage() {
  const navigate = useNavigate();
  const { user, profile, hasAccess, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [unlocksIn, setUnlocksIn] = useState<number>(0);
  const [extraCredits, setExtraCredits] = useState<number>(0);
  const [voice, setVoice] = useState<string>("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [diagnosis, setDiagnosis] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("velum_pending_diagnosis");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedTrackId, setGeneratedTrackId] = useState<string>("");
  const [chatBusy, setChatBusy] = useState(false);
  const [previewing, setPreviewing] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState<string>("");
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
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
        .select("voice_preference, extra_track_credits, unlimited_tracks")
        .eq("id", user.id)
        .maybeSingle();
      const credits = ((prof as any)?.extra_track_credits as number | null) ?? 0;
      const unlimited = !!((prof as any)?.unlimited_tracks);
      setExtraCredits(credits);
      const pref = ((prof as any)?.voice_preference as string | null) || "jordan";
      setVoice(pref);
      if (!unlimited && lastTrack) {
        const ageDays = (Date.now() - new Date((lastTrack as any).created_at).getTime()) / 86400000;
        if (ageDays < COOLDOWN_DAYS && credits <= 0) {
          setUnlocksIn(Math.ceil(COOLDOWN_DAYS - ageDays));
          setPhase("cooldown");
          return;
        }
      }
      // If a diagnosis was cached from an earlier failed attempt, jump straight to confirm
      if (diagnosis) {
        setPhase("confirm");
        return;
      }
      setPhase("voice");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, hasAccess, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, phase]);

  // ── Voice preview ──
  const playPreview = async (k: string) => {
    if (previewing === k && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewing("");
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewLoading(k);
    try {
      const { data, error } = await supabase.functions.invoke("voice-preview", { body: { voice: k } });
      if (error) throw error;
      if (!data?.url) throw new Error("No preview URL returned");
      const a = new Audio(data.url);
      a.addEventListener("ended", () => setPreviewing(""));
      previewAudioRef.current = a;
      await a.play();
      setPreviewing(k);
    } catch (e: any) {
      toast.error("Preview unavailable: " + (e.message || e));
    }
    setPreviewLoading("");
  };

  // ── Voice picker → start chat ──
  const pickVoiceAndContinue = async (k: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewing("");
    }
    setVoice(k);
    if (user) {
      await supabase.from("profiles").update({ voice_preference: k } as any).eq("id", user.id);
    }
    setChat([{ role: "assistant", content: "What would you love to be true for you right now?" }]);
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
        try { localStorage.setItem("velum_pending_diagnosis", JSON.stringify(parsed)); } catch {}
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
          title: diagnosis.title || (diagnosis.desired_outcome ? diagnosis.desired_outcome.slice(0, 40) : (diagnosis.issue ? diagnosis.issue.slice(0, 40) : "Custom track")),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      setGeneratedTrackId(data.track_id);
      // Successful generation — clear the cached diagnosis
      try { localStorage.removeItem("velum_pending_diagnosis"); } catch {}
      setPhase("done");
    } catch (e: any) {
      setErrorMsg(e.message || String(e));
      setPhase("error");
    }
  };

  const summary = useMemo(() => {
    if (!diagnosis) return "";
    const parts: string[] = [];
    // Prefer the new desired-outcome-first fields, fall back to old shape for any legacy chats.
    if (diagnosis.desired_outcome) parts.push(`What you want: ${diagnosis.desired_outcome}.`);
    else if (diagnosis.issue) parts.push(diagnosis.issue);
    if (diagnosis.picture) parts.push(`The moment you painted: ${diagnosis.picture}.`);
    if (diagnosis.identity) parts.push(`Who you become there: ${diagnosis.identity}.`);
    if (diagnosis.somatic_pull) parts.push(`In your body, the pull lives in ${diagnosis.somatic_pull}.`);
    else if (diagnosis.somatic) parts.push(`In your body: ${diagnosis.somatic}.`);
    if (diagnosis.already_true) parts.push(`A glimpse of it already true: ${diagnosis.already_true}.`);
    if (diagnosis.edge) parts.push(`The edge: ${diagnosis.edge}.`);
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
            <Link
              to="/audios"
              className="inline-block gold-gradient text-primary-foreground rounded-xl px-6 py-3 text-sm font-sans font-bold tracking-wide"
            >
              Listen to your tracks
            </Link>
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
                const isPlaying = previewing === v.key;
                const isLoading = previewLoading === v.key;
                return (
                  <div
                    key={v.key}
                    className={`velum-card p-4 transition-all flex flex-col ${sel ? "border-accent/60 bg-accent/5" : "hover:border-accent/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] tracking-wider uppercase text-accent">{v.gender}</span>
                        {v.key === "jordan" && (
                          <span className="text-[9px] tracking-wider uppercase text-muted-foreground bg-muted-foreground/15 px-1.5 py-0.5 rounded">Founder</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); playPreview(v.key); }}
                        className="w-7 h-7 rounded-full border border-accent/30 bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
                        title={isPlaying ? "Pause preview" : "Play preview"}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                      </button>
                    </div>
                    <div className="text-foreground text-base font-serif font-light">{v.name}</div>
                    <div className="text-muted-foreground text-[11px] mt-1 italic mb-3">{v.blurb}</div>
                    <button
                      onClick={() => pickVoiceAndContinue(v.key)}
                      className={`mt-auto text-[10px] tracking-[2px] uppercase rounded-md py-2 transition-all ${sel ? "gold-gradient text-primary-foreground font-semibold" : "border border-border text-muted-foreground hover:text-foreground hover:border-accent/40"}`}
                    >
                      Use this voice →
                    </button>
                  </div>
                );
              })}
            </div>
            {extraCredits > 0 && (
              <p className="text-center text-accent text-xs mt-6">You have {extraCredits} extra track{extraCredits === 1 ? "" : "s"} ready to use.</p>
            )}
          </div>
        )}

        {phase === "chat" && (
          <div className="w-full flex flex-col h-[78vh]">
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col justify-end space-y-4 mb-4">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[92%] p-5 rounded-2xl leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-card border border-border text-foreground font-serif italic text-[20px]"
                      : "bg-accent/15 border border-accent/30 text-foreground ml-auto text-[17px]"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatBusy && (
                <div className="text-muted-foreground text-sm italic">listening…</div>
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
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3.5 text-foreground resize-none focus:outline-none focus:border-accent/50"
                style={{ fontSize: "17px" }}
                disabled={chatBusy}
              />
              <button
                onClick={sendChat}
                disabled={chatBusy || !chatInput.trim()}
                className="gold-gradient text-primary-foreground rounded-xl px-6 text-xs font-sans font-bold tracking-wide disabled:opacity-40"
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

        {phase === "generating" && <GeneratingScreen />}

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
            <p className="text-destructive text-sm mb-2 break-words">{errorMsg}</p>
            <p className="text-muted-foreground text-xs italic mb-6">
              Your conversation was saved — tap below to try again without re-doing the chat.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={generate}
                disabled={!diagnosis}
                className="gold-gradient text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-sans font-bold disabled:opacity-40"
              >
                Retry generation
              </button>
              <button
                onClick={() => {
                  try { localStorage.removeItem("velum_pending_diagnosis"); } catch {}
                  setDiagnosis(null);
                  setChat([{ role: "assistant", content: "What would you love to be true for you right now?" }]);
                  setPhase("chat");
                }}
                className="border border-border rounded-xl px-5 py-2.5 text-foreground text-sm hover:border-accent/40"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
