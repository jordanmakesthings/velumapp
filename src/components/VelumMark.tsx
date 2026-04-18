type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Velum wordmark with gold underline — the brand signature for page headers
 * and surfaces that need a touch of Velum identity.
 */
export default function VelumMark({ size = "md", className = "" }: Props) {
  const sizes = {
    sm: { text: "text-[10px] tracking-[5px]", line: "w-8" },
    md: { text: "text-[11px] tracking-[6px]", line: "w-10" },
    lg: { text: "text-[13px] tracking-[8px]", line: "w-12" },
  };
  const s = sizes[size];
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <span className={`text-accent font-sans font-medium uppercase mb-1 ${s.text}`}>Velum</span>
      <span className={`h-[1px] gold-underline ${s.line}`} />
    </div>
  );
}
