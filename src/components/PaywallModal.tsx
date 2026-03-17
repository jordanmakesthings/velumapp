import { useNavigate } from "react-router-dom";
import { Crown, Check, X } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  "Full meditation & breathwork library",
  "EFT tapping sessions",
  "Mastery classes",
  "Progress tracking & insights",
];

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative velum-card w-full max-w-md mx-4 mb-4 sm:mb-0 p-6 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <Crown className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-foreground font-serif text-lg">Unlock Full Access</h3>
            <p className="text-ui text-xs">Premium content awaits</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-accent" />
              <span className="text-foreground text-sm font-sans">{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onClose(); navigate("/premium"); }}
          className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-sans font-medium text-sm active:scale-[0.98] transition-transform"
        >
          Start Free Trial
        </button>

        <p className="text-center text-muted-foreground text-[10px] font-sans mt-3">
          7-day free trial, then $29/month
        </p>
      </div>
    </div>
  );
}
