import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronUp, ChevronDown, Film, Plus, Upload, X, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Music = "silent" | "rain" | "forest" | "fire" | "waves";

interface VisionRow {
  id: string;
  user_id: string;
  name: string;
  image_urls: string[];
  affirmations: string[];
  music_track: Music | null;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

const MUSIC_OPTIONS: { key: Music; label: string }[] = [
  { key: "silent", label: "Silent" },
  { key: "rain", label: "Rain" },
  { key: "forest", label: "Forest" },
  { key: "fire", label: "Fire" },
  { key: "waves", label: "Waves" },
];

const DURATION_OPTIONS = [3, 5, 10];

const BUCKET = "vision-images";

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function VisionLabPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const id = params.get("id");

  // Either index mode or editor mode
  if (!id) return <VisionIndex userId={user?.id} navigate={navigate} />;
  return <VisionEditor key={id} userId={user?.id} idParam={id} navigate={navigate} />;
}

/* ---------------- INDEX ---------------- */

function VisionIndex({ userId, navigate }: { userId?: string; navigate: ReturnType<typeof useNavigate> }) {
  const [visions, setVisions] = useState<VisionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("visions" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setVisions((data || []) as unknown as VisionRow[]);
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div className="min-h-screen bg-radial-subtle font-sans safe-area-pt">
      <div className="max-w-[640px] mx-auto px-5 pt-10 pb-32 w-full">
        <button
          onClick={() => navigate("/home")}
          className="-ml-1 mb-3 inline-flex items-center gap-1 text-muted-foreground/70 hover:text-accent text-xs tracking-wide transition-colors"
          aria-label="Back to home"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <h1 className="text-display text-4xl mb-1.5">Vision Lab</h1>
        <p className="text-ui text-xs tracking-[0.05em] mb-6">Install your future self.</p>

        <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
          Build a personal Vision — your images, your affirmations, your music.
          Watch it twice a day. Let your subconscious do the rest.
        </p>

        {loading && (
          <div className="text-muted-foreground/60 text-sm">Loading…</div>
        )}

        {!loading && visions.length === 0 && (
          <div className="velum-card p-8 text-center border-accent/30">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/30">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-display text-2xl mb-2">Your first Vision</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Upload images that pull on your future. Add affirmations in your own voice. Press play.
            </p>
            <Link
              to="/vision?id=NEW"
              className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-6 py-3.5 text-sm font-sans font-semibold tracking-wide active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" /> Build your first Vision
            </Link>
          </div>
        )}

        {!loading && visions.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {visions.map((v) => {
                const cover = v.image_urls?.[0];
                return (
                  <Link
                    key={v.id}
                    to={`/vision/play?id=${v.id}`}
                    className="velum-card relative overflow-hidden group p-0 h-44"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={v.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="relative h-full p-4 flex flex-col justify-end text-white">
                      <p className="text-display text-xl leading-tight mb-1">{v.name}</p>
                      <p className="text-[11px] tracking-wide opacity-80">
                        {v.image_urls?.length || 0} images · {v.duration_minutes} min
                      </p>
                    </div>
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/vision?id=${v.id}`);
                      }}
                      className="absolute bottom-3 right-3 text-[10px] tracking-wide uppercase text-white/80 hover:text-accent bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/15"
                    >
                      Edit
                    </button>
                  </Link>
                );
              })}
            </div>

            <Link
              to="/vision?id=NEW"
              className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-6 py-3 text-sm font-sans font-semibold tracking-wide active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" /> New Vision
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- EDITOR ---------------- */

function VisionEditor({
  userId,
  idParam,
  navigate,
}: {
  userId?: string;
  idParam: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isNew = idParam === "NEW";
  const [visionId, setVisionId] = useState<string | null>(isNew ? null : idParam);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [affirmationsText, setAffirmationsText] = useState("");
  const [music, setMusic] = useState<Music>("silent");
  const [duration, setDuration] = useState<number>(5);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Stable temp id for storage path before save
  const tempIdRef = useRef<string>(crypto.randomUUID());
  const folderId = visionId || tempIdRef.current;

  // Load existing vision
  useEffect(() => {
    if (isNew || !userId) return;
    (async () => {
      const { data } = await supabase
        .from("visions" as any)
        .select("*")
        .eq("id", idParam)
        .maybeSingle();
      if (data) {
        const v = data as unknown as VisionRow;
        setName(v.name);
        setImages(v.image_urls || []);
        setAffirmationsText((v.affirmations || []).join("\n"));
        setMusic((v.music_track as Music) || "silent");
        setDuration(v.duration_minutes || 5);
      }
      setLoading(false);
    })();
  }, [idParam, isNew, userId]);

  const affirmations = useMemo(
    () =>
      affirmationsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20),
    [affirmationsText]
  );

  async function handleFiles(files: FileList | File[]) {
    if (!userId) return;
    const fileArr = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(f.type)
    );
    const remaining = 30 - images.length;
    const toUpload = fileArr.slice(0, Math.max(0, remaining));
    if (toUpload.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];
    for (const file of toUpload) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${folderId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (!error) {
        newUrls.push(publicUrl(path));
      }
    }
    setImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    if (!userId) return;
    if (!name.trim()) {
      alert("Give your Vision a name.");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      name: name.trim(),
      image_urls: images,
      affirmations,
      music_track: music === "silent" ? null : music,
      duration_minutes: duration,
      updated_at: new Date().toISOString(),
    };
    let savedId = visionId;
    if (visionId) {
      const { error } = await supabase
        .from("visions" as any)
        .update(payload)
        .eq("id", visionId);
      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("visions" as any)
        .insert(payload)
        .select("id")
        .maybeSingle();
      if (error || !data) {
        alert(error?.message || "Couldn't save vision.");
        setSaving(false);
        return;
      }
      savedId = (data as any).id as string;
      setVisionId(savedId);
    }
    setSaving(false);
    if (savedId) navigate(`/vision/play?id=${savedId}`);
  }

  async function handleDelete() {
    if (!visionId) return;
    if (!confirm("Delete this Vision? This can't be undone.")) return;
    await supabase.from("visions" as any).delete().eq("id", visionId);
    navigate("/vision");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-radial-subtle font-sans safe-area-pt flex items-center justify-center">
        <p className="text-muted-foreground/60 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-subtle font-sans safe-area-pt">
      <div className="max-w-[640px] mx-auto px-5 pt-10 pb-32 w-full">
        <button
          onClick={() => navigate("/vision")}
          className="-ml-1 mb-3 inline-flex items-center gap-1 text-muted-foreground/70 hover:text-accent text-xs tracking-wide transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Vision Lab</span>
        </button>

        <h1 className="text-display text-4xl mb-1.5">
          {isNew ? "New Vision" : "Edit Vision"}
        </h1>
        <p className="text-ui text-xs tracking-[0.05em] mb-7">Compose your future self.</p>

        {/* Name */}
        <div className="mb-6">
          <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50 mb-2">Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wealth Vision, My Future Self"
            className="w-full bg-background/80 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Images */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50">Images</p>
            <p className="text-[10px] text-muted-foreground/40">{images.length} / 30</p>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`velum-card cursor-pointer border-dashed transition-colors ${
              dragging ? "border-accent bg-accent/5" : "border-foreground/15"
            } p-6 text-center mb-3`}
          >
            <Upload className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-sm text-foreground">
              {uploading ? "Uploading…" : "Tap or drag images here"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WebP · up to 30</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, idx) => (
                <div
                  key={url + idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-foreground/10 group"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveImage(idx, -1)}
                      className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveImage(idx, 1)}
                      className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="absolute top-1 left-1 text-[10px] text-white bg-black/60 rounded px-1.5 py-0.5">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Affirmations */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50">Affirmations</p>
            <p className="text-[10px] text-muted-foreground/40">{affirmations.length} / 20</p>
          </div>
          <textarea
            value={affirmationsText}
            onChange={(e) => setAffirmationsText(e.target.value)}
            placeholder={"I am the version of me I committed to becoming.\nMoney flows to me with ease.\nMy body is strong, my mind is clear."}
            className="w-full h-40 bg-background/80 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 text-foreground placeholder:text-muted-foreground/40 resize-none"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1.5">One affirmation per line.</p>
        </div>

        {/* Music */}
        <div className="mb-6">
          <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50 mb-2">Music</p>
          <div className="flex flex-wrap gap-2">
            {MUSIC_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMusic(opt.key)}
                className={`px-4 py-2 rounded-full text-xs font-sans tracking-wide border transition-all ${
                  music === opt.key
                    ? "gold-gradient text-primary-foreground border-transparent"
                    : "border-foreground/15 text-muted-foreground hover:border-accent/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground/50 mb-2">Duration</p>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-5 py-2 rounded-full text-xs font-sans tracking-wide border transition-all ${
                  duration === d
                    ? "gold-gradient text-primary-foreground border-transparent"
                    : "border-foreground/15 text-muted-foreground hover:border-accent/40"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || !name.trim() || images.length === 0}
          className="w-full gold-gradient text-primary-foreground rounded-[14px] py-[18px] text-base font-extrabold font-sans tracking-[0.02em] disabled:opacity-40 transition-opacity"
        >
          {saving ? "Saving…" : "Save & Play"}
        </motion.button>

        {!isNew && visionId && (
          <button
            onClick={handleDelete}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-red-400 text-xs tracking-wide transition-colors py-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Vision
          </button>
        )}
      </div>
    </div>
  );
}
