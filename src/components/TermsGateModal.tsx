import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onAccept: () => void | Promise<void>;
};

export default function TermsGateModal({ onAccept }: Props) {
  const [accepting, setAccepting] = useState(false);

  const handle = async () => {
    if (accepting) return;
    setAccepting(true);
    try { await onAccept(); } finally { setAccepting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="velum-card-accent w-full max-w-md p-8 md:p-10 text-center relative"
      >
        <div className="mb-6">
          <p className="text-accent text-[11px] font-sans font-medium tracking-[8px] uppercase mb-1">Velum</p>
          <div className="w-10 h-[1px] gold-underline mx-auto" />
        </div>

        <p className="text-eyebrow mb-3">Before we begin</p>
        <h2 className="text-display text-[2rem] leading-[1.1] mb-4">
          We'll only ask you<br /><span className="italic text-accent">this once.</span>
        </h2>

        <div className="text-left bg-black/25 border border-accent/15 rounded-xl p-5 mb-6 text-muted-foreground text-[13px] leading-relaxed font-sans">
          <p className="mb-3">
            Velum is a <span className="text-foreground">wellness and educational tool.</span> The practices,
            meditations, breathwork, tapping, and journaling inside are designed to support nervous system
            regulation and self-awareness.
          </p>
          <p className="mb-3">
            Velum is <span className="text-foreground">not a substitute</span> for medical, psychiatric,
            or psychological treatment. If you're experiencing a mental health crisis, please contact a licensed
            professional or emergency services.
          </p>
          <p>
            By tapping <span className="text-accent">I understand</span> below, you acknowledge this and agree
            to our <a href="/terms" target="_blank" className="text-accent underline underline-offset-2">Terms</a> and <a href="/privacy" target="_blank" className="text-accent underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>

        <button
          onClick={handle}
          disabled={accepting}
          className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50 shadow-[0_0_30px_rgba(201,168,76,0.25)]"
        >
          {accepting ? "Saving…" : "I understand →"}
        </button>
      </motion.div>
    </div>
  );
}
