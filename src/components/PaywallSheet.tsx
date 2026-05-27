import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface PaywallSheetContextType {
  open: () => void;
  close: () => void;
}

const PaywallSheetContext = createContext<PaywallSheetContextType | undefined>(undefined);

export function usePaywall() {
  const ctx = useContext(PaywallSheetContext);
  if (!ctx) throw new Error("usePaywall must be used within PaywallSheetProvider");
  return ctx;
}

export function PaywallSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState<"monthly" | "annual" | "lifetime" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [foundingLeft, setFoundingLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const { data } = await supabase.rpc("founding_lifetime_remaining");
      if (typeof data === "number") setFoundingLeft(data);
    })();
  }, [isOpen]);

  const open = useCallback(() => {
    setError(null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleSubscribe = async (plan: "monthly" | "annual" | "lifetime") => {
    if (!session) { setIsOpen(false); navigate("/signup"); return; }
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, returnUrl: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const isFounding = foundingLeft !== null && foundingLeft > 0;

  return (
    <PaywallSheetContext.Provider value={{ open, close }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="bg-background border-accent/20 rounded-t-3xl px-6 pt-8 pb-10 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-display text-3xl text-center font-light">
              Unlock <span className="italic text-accent">everything.</span>
            </SheetTitle>
            <SheetDescription className="text-center text-muted-foreground text-sm">
              One plan unlocks every practice, course and tool inside Velum.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
            {/* LIFETIME */}
            <div className="relative">
              {isFounding && (
                <span className="absolute -top-2.5 left-4 gold-gradient text-primary-foreground text-[10px] font-sans font-semibold px-2.5 py-0.5 rounded-full tracking-wide z-10">
                  {foundingLeft} remaining
                </span>
              )}
              <button
                onClick={() => handleSubscribe("lifetime")}
                disabled={loading !== null}
                className="velum-card-accent w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
              >
                <div>
                  <p className="text-foreground font-sans font-medium">Lifetime</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Pay once · Every future feature included</p>
                </div>
                <div className="text-right">
                  <p className="text-accent text-2xl font-serif">$199</p>
                  <p className="text-muted-foreground text-xs">one-time</p>
                </div>
              </button>
            </div>

            {/* ANNUAL */}
            <button
              onClick={() => handleSubscribe("annual")}
              disabled={loading !== null}
              className="velum-card w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
            >
              <div>
                <p className="text-foreground font-sans font-medium">Annual</p>
                <p className="text-muted-foreground text-xs mt-0.5">~$8/mo · save 57% vs monthly</p>
              </div>
              <div className="text-right">
                <p className="text-accent text-2xl font-serif">$99</p>
                <p className="text-muted-foreground text-xs">/year</p>
              </div>
            </button>

            {/* MONTHLY */}
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
              className="velum-card w-full p-5 text-left transition-all flex items-center justify-between disabled:opacity-70"
            >
              <div>
                <p className="text-foreground font-sans font-medium">Monthly</p>
                <p className="text-muted-foreground text-xs mt-0.5">Charged today · Cancel anytime</p>
              </div>
              <div className="text-right">
                <p className="text-accent text-2xl font-serif">$19</p>
                <p className="text-muted-foreground text-xs">/month</p>
              </div>
            </button>

            {loading && (
              <div className="flex justify-center mt-2">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center mt-2">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}

            <button
              onClick={close}
              className="text-muted-foreground text-xs font-sans mt-4 self-center hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </PaywallSheetContext.Provider>
  );
}
