import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoCircle from "@/assets/logo-circle.png";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[400px] w-full text-center"
      >
        <img src={logoCircle} alt="Velum" className="w-[64px] h-[64px] object-contain mx-auto mb-4" />
        <p className="text-accent text-[11px] font-sans font-medium tracking-[4px] uppercase mb-4">Velum</p>
        <div className="w-12 h-px bg-accent/70 mx-auto mb-8" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
          className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-accent text-2xl">✓</span>
        </motion.div>

        <h1 className="text-display text-4xl italic mb-3">You're in.</h1>
        <p className="text-muted-foreground text-[15px] font-sans font-light leading-relaxed mb-10">
          Welcome to Velum. Your journey toward mastery begins now.
        </p>

        <button
          onClick={() => navigate("/home-setup")}
          className="w-full h-14 rounded-full gold-gradient text-primary-foreground text-[15px] font-sans font-bold tracking-wide active:scale-[0.98] transition-transform mb-4"
        >
          Set Up Your App →
        </button>

        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground text-sm font-sans text-center w-full p-2 hover:text-foreground transition-colors"
        >
          Skip to home
        </button>
      </motion.div>
    </div>
  );
}
