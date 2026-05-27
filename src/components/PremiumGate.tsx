import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePaywall } from "@/components/PaywallSheet";

interface PremiumGateProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Wraps a page. If the user has access, renders children.
 * Otherwise renders a preview state with a single "Unlock Premium" CTA
 * that opens the global PaywallSheet.
 */
export function PremiumGate({ title, description, children }: PremiumGateProps) {
  const { hasAccess } = useAuth();
  const { open } = usePaywall();

  if (hasAccess) return <>{children}</>;

  return (
    <div className="min-h-screen w-full bg-radial-subtle flex items-center justify-center px-6 py-16">
      <div className="velum-card max-w-md w-full p-8 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/30">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-eyebrow text-accent mb-3">Premium</p>
          <h1 className="text-display text-3xl font-light leading-tight mb-3">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm font-sans leading-relaxed mb-7 max-w-sm mx-auto">
              {description}
            </p>
          )}
          <button
            onClick={open}
            className="inline-flex items-center gap-2 rounded-full gold-gradient text-primary-foreground px-6 py-3.5 text-sm font-sans font-semibold tracking-wide active:scale-[0.98] transition-transform shadow-[0_0_30px_rgba(201,168,76,0.25)]"
          >
            <Sparkles className="w-4 h-4" />
            Unlock Premium · from $8/mo
          </button>
          <p className="text-muted-foreground/60 text-[11px] font-sans mt-4">
            Lifetime · Annual · Monthly
          </p>
        </div>
      </div>
    </div>
  );
}
