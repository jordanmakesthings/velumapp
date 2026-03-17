import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import logoLotus from "@/assets/logo-lotus.jpg";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-md"
      >
        <motion.img
          src={logoLotus}
          alt="Velum"
          className="w-16 h-16 rounded-2xl object-cover mx-auto mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-display text-4xl mb-4">Welcome to Velum</h1>
          <p className="text-ui text-sm leading-relaxed mb-12">
            Your nervous system regulation journey begins now. Take a deep breath — you're exactly where you need to be.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Enter Velum
          </button>
        </motion.div>
      </motion.div>

      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,_hsl(42,53%,54%)_0%,_transparent_70%)] opacity-[0.07] animate-pulse" />
      </div>
    </div>
  );
}
