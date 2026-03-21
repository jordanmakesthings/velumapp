import { motion } from "framer-motion";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[400px] w-full text-center"
      >
        <h1 className="text-display text-4xl italic mb-10">Welcome to Velum.</h1>

        <a
          href="https://buy.stripe.com/28E28s1FNfD04k267E7ss02"
          className="inline-block w-full h-14 leading-[56px] rounded-full gold-gradient text-primary-foreground text-[15px] font-sans font-bold tracking-wide active:scale-[0.98] transition-transform"
        >
          Start My Free Trial
        </a>
      </motion.div>
    </div>
  );
}
