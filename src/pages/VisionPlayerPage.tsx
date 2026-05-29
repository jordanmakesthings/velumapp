import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Music = "silent" | "rain" | "forest" | "fire" | "waves";

const AMBIENT_URLS: Record<Music, string | null> = {
  silent: null,
  rain: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-rain.mp3",
  forest: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-forest.mp3",
  fire: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-fire.mp3",
  waves: "https://etghaosktmxloqivquvu.supabase.co/storage/v1/object/public/audio/ambient-waves.mp3",
};

interface VisionRow {
  id: string;
  name: string;
  image_urls: string[];
  affirmations: string[];
  music_track: Music | null;
  duration_minutes: number;
}

const AFFIRMATION_INTERVAL_MS = 9000; // ~9s per affirmation

export default function VisionPlayerPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");

  const [vision, setVision] = useState<VisionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [affIdx, setAffIdx] = useState(0);
  const [progress, setProgress] = useState(0); // 0-1
  const [showChrome, setShowChrome] = useState(true);
  const [finished, setFinished] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const totalMsRef = useRef<number>(0);
  const chromeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load vision
  useEffect(() => {
    if (!id) {
      navigate("/vision");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("visions" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) {
        navigate("/vision");
        return;
      }
      setVision(data as unknown as VisionRow);
      setLoading(false);
    })();
  }, [id, navigate]);

  // Begin playback
  useEffect(() => {
    if (!vision) return;
    const images = vision.image_urls || [];
    if (images.length === 0) {
      navigate(`/vision?id=${vision.id}`);
      return;
    }

    totalMsRef.current = vision.duration_minutes * 60 * 1000;
    const perImageMs = totalMsRef.current / images.length;

    // Audio
    const music = vision.music_track as Music | null;
    const url = music ? AMBIENT_URLS[music] : null;
    if (url) {
      const a = new Audio(url);
      a.loop = true;
      a.volume = 0.4;
      audioRef.current = a;
      a.play().catch(() => {});
    }

    startRef.current = performance.now();

    // Image cycle (timeouts so they can be cleared cleanly)
    const imageTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < images.length; i++) {
      imageTimers.push(setTimeout(() => setImgIdx(i), perImageMs * i));
    }

    // Affirmation cycle
    const affs = vision.affirmations || [];
    const affTimer = affs.length > 0 ? setInterval(() => {
      setAffIdx((p) => (p + 1) % affs.length);
    }, AFFIRMATION_INTERVAL_MS) : null;

    // Progress + auto-exit
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const p = Math.min(elapsed / totalMsRef.current, 1);
      setProgress(p);
      if (elapsed >= totalMsRef.current) {
        setFinished(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      imageTimers.forEach(clearTimeout);
      if (affTimer) clearInterval(affTimer);
      cancelAnimationFrame(rafRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vision]);

  // On finish — flash and exit
  useEffect(() => {
    if (!finished) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const t = setTimeout(() => navigate("/vision"), 1800);
    return () => clearTimeout(t);
  }, [finished, navigate]);

  // Chrome auto-hide
  useEffect(() => {
    if (!showChrome) return;
    chromeTimerRef.current && clearTimeout(chromeTimerRef.current);
    chromeTimerRef.current = setTimeout(() => setShowChrome(false), 3000);
    return () => {
      chromeTimerRef.current && clearTimeout(chromeTimerRef.current);
    };
  }, [showChrome]);

  function handleScreenTap() {
    setShowChrome(true);
  }

  if (loading || !vision) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading…</p>
      </div>
    );
  }

  const images = vision.image_urls || [];
  const affs = vision.affirmations || [];
  const currentImg = images[imgIdx];
  const currentAff = affs[affIdx];

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onClick={handleScreenTap}
    >
      {/* Image layer with Ken Burns */}
      <AnimatePresence mode="sync">
        <motion.div
          key={imgIdx}
          initial={{ opacity: 0, scale: 1.0 }}
          animate={{ opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: (totalMsRef.current / Math.max(images.length, 1)) / 1000, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          <img
            src={currentImg}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Dark vignette for caption legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Affirmation overlay */}
      {currentAff && (
        <div className="absolute inset-x-0 bottom-0 pb-[15%] px-8 flex justify-center pointer-events-none z-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${affIdx}-${currentAff}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="text-display italic text-white text-center text-2xl md:text-4xl leading-snug max-w-2xl"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.65), 0 0 8px rgba(0,0,0,0.5)" }}
            >
              {currentAff}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {/* Progress bar */}
      <AnimatePresence>
        {showChrome && !finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20"
          >
            <div
              className="h-full gold-gradient transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close button */}
      <AnimatePresence>
        {showChrome && !finished && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/vision");
            }}
            className="absolute z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white/90 flex items-center justify-center hover:bg-black/70 transition-colors"
            style={{
              top: "calc(env(safe-area-inset-top) + 1rem)",
              right: "1rem",
            }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Finish flash */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center z-40"
          >
            <p className="text-display italic text-white/80 text-3xl">Saved.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
