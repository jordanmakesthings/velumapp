import velumLotus from "@/assets/brand/velum-lotus.png";
import velumLockup from "@/assets/brand/velum-lockup.png";

type Variant = "lotus" | "lockup";

type Props = {
  variant?: Variant;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

/**
 * Velum brand mark — uses the real lotus logo assets.
 * - "lotus" = just the symbol
 * - "lockup" = lotus + VELUM wordmark beneath
 */
export default function VelumMark({ variant = "lotus", size = "md", className = "" }: Props) {
  const src = variant === "lotus" ? velumLotus : velumLockup;
  const lotusSizes: Record<string, string> = { xs: "w-5", sm: "w-7", md: "w-10", lg: "w-14", xl: "w-20" };
  const lockupSizes: Record<string, string> = { xs: "w-14", sm: "w-20", md: "w-28", lg: "w-36", xl: "w-48" };
  const sz = variant === "lotus" ? lotusSizes[size] : lockupSizes[size];
  return (
    <img src={src} alt="Velum" className={`${sz} h-auto object-contain ${className}`} draggable={false} />
  );
}
