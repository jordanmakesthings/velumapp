interface DiagramProps {
  activePoint?: string;
  size?: number;
}

// Coordinates within a 180×290 viewBox (face + upper body)
const FACE_BODY_POINTS: Record<string, { cx: number; cy: number; label: string; description: string }> = {
  "Top of Head":  { cx: 90,  cy: 24,  label: "TH", description: "Crown of the head" },
  "Eyebrow":      { cx: 56,  cy: 54,  label: "EB", description: "Inner edge of brow" },
  "Side of Eye":  { cx: 140, cy: 64,  label: "SE", description: "Temple, beside eye" },
  "Under Eye":    { cx: 116, cy: 80,  label: "UE", description: "Below eye on cheekbone" },
  "Under Nose":   { cx: 90,  cy: 103, label: "UN", description: "Between nose and lip" },
  "Chin":         { cx: 90,  cy: 124, label: "CH", description: "Centre of chin" },
  "Collarbone":   { cx: 58,  cy: 168, label: "CB", description: "Below collarbone, either side" },
  "Under Arm":    { cx: 152, cy: 207, label: "UA", description: "4 inches below armpit" },
};

// Coordinates within a 160×180 viewBox (hand — karate chop view)
const HAND_POINTS: Record<string, { cx: number; cy: number; label: string; description: string }> = {
  "Karate Chop":  { cx: 22,  cy: 95,  label: "KC", description: "Side of hand, below pinky" },
  "Gamut Point":  { cx: 108, cy: 68,  label: "GP", description: "Back of hand, between ring & pinky knuckles" },
};

// Finger point positions in a 160×200 viewBox (palm facing up)
const FINGER_POINTS: Record<string, { cx: number; cy: number; label: string; description: string }> = {
  "Thumb":         { cx: 22,  cy: 90,  label: "TH", description: "Outside edge, base of nail" },
  "Index Finger":  { cx: 54,  cy: 22,  label: "IF", description: "Inside edge, base of nail — Anger" },
  "Middle Finger": { cx: 82,  cy: 16,  label: "MF", description: "Inside edge, base of nail — Shame" },
  "Ring Finger":   { cx: 108, cy: 20,  label: "RF", description: "Inside edge, base of nail — Grief" },
  "Pinky Finger":  { cx: 134, cy: 32,  label: "PF", description: "Inside edge, base of nail — Pretense" },
};

export function FaceBodyDiagram({ activePoint, size = 180 }: DiagramProps) {
  const scale = size / 180;
  const h = 290 * scale;

  return (
    <svg
      viewBox="0 0 180 290"
      width={size}
      height={h}
      className="select-none"
    >
      {/* Head circle */}
      <circle cx="90" cy="82" r="57" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Subtle eye outlines */}
      <ellipse cx="70" cy="74" rx="9" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />
      <ellipse cx="110" cy="74" rx="9" ry="6" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />

      {/* Nose */}
      <path d="M 90 88 L 84 104 Q 90 107 96 104 Z" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />

      {/* Neck */}
      <line x1="74" y1="136" x2="72" y2="158" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <line x1="106" y1="136" x2="108" y2="158" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Shoulders */}
      <path d="M 72 158 Q 44 164 24 182" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <path d="M 108 158 Q 136 164 156 182" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Torso sides */}
      <line x1="24" y1="182" x2="30" y2="285" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <line x1="156" y1="182" x2="150" y2="285" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Tapping points */}
      {Object.entries(FACE_BODY_POINTS).map(([name, pos]) => {
        const isActive = activePoint === name;
        return (
          <g key={name}>
            {/* Pulse ring on active */}
            {isActive && (
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-accent animate-ping opacity-40"
              />
            )}
            {/* Dot */}
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r={isActive ? 7 : 5}
              className={isActive ? "fill-accent" : "fill-foreground/25"}
            />
            {/* Label */}
            <text
              x={pos.cx}
              y={pos.cy + (isActive ? 18 : 16)}
              textAnchor="middle"
              fontSize={isActive ? "8" : "7"}
              className={isActive ? "fill-accent font-medium" : "fill-foreground/35"}
              fontFamily="sans-serif"
            >
              {pos.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HandDiagram({ activePoint, size = 160 }: DiagramProps) {
  const scale = size / 160;
  const h = 180 * scale;

  return (
    <svg
      viewBox="0 0 160 180"
      width={size}
      height={h}
      className="select-none"
    >
      {/* Hand outline — karate chop view (side of hand visible) */}
      {/* Palm */}
      <rect x="40" y="60" width="80" height="90" rx="12" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Fingers (4 visible stubs at top) */}
      <rect x="48" y="30" width="14" height="34" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="66" y="22" width="14" height="40" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="84" y="24" width="14" height="38" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="102" y="30" width="14" height="32" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Thumb */}
      <ellipse cx="34" cy="75" rx="10" ry="18" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Knuckle lines on back of hand (gamut area) */}
      <path d="M 68 62 Q 90 58 112 62" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-foreground/10" />

      {/* Points */}
      {Object.entries(HAND_POINTS).map(([name, pos]) => {
        const isActive = activePoint === name;
        return (
          <g key={name}>
            {isActive && (
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-accent animate-ping opacity-40"
              />
            )}
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r={isActive ? 7 : 5}
              className={isActive ? "fill-accent" : "fill-foreground/25"}
            />
            <text
              x={pos.cx + (name === "Karate Chop" ? 14 : 0)}
              y={pos.cy + (name === "Karate Chop" ? 1 : 18)}
              textAnchor={name === "Karate Chop" ? "start" : "middle"}
              fontSize={isActive ? "8" : "7"}
              className={isActive ? "fill-accent" : "fill-foreground/35"}
              fontFamily="sans-serif"
            >
              {pos.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function FingerPointDiagram({ activePoint, size = 160 }: DiagramProps) {
  const scale = size / 160;
  const h = 200 * scale;

  return (
    <svg
      viewBox="0 0 160 200"
      width={size}
      height={h}
      className="select-none"
    >
      {/* Palm (front view) */}
      <rect x="28" y="100" width="104" height="90" rx="14" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Fingers */}
      <rect x="36" y="52" width="18" height="52" rx="9" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="58" y="26" width="18" height="78" rx="9" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="80" y="20" width="18" height="82" rx="9" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />
      <rect x="102" y="26" width="16" height="76" rx="8" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Thumb */}
      <ellipse cx="22" cy="110" rx="11" ry="22" transform="rotate(-20 22 110)" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-foreground/15" />

      {/* Points */}
      {Object.entries(FINGER_POINTS).map(([name, pos]) => {
        const isActive = activePoint === name;
        return (
          <g key={name}>
            {isActive && (
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-accent animate-ping opacity-40"
              />
            )}
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r={isActive ? 6 : 4}
              className={isActive ? "fill-accent" : "fill-foreground/25"}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Full reference guide — all points with descriptions
export function TappingGuide() {
  const sections = [
    {
      title: "Standard Sequence",
      subtitle: "Use in all rounds",
      points: [
        { name: "Karate Chop", abbr: "KC", desc: "Side of hand, below pinky — for setup statements" },
        { name: "Eyebrow", abbr: "EB", desc: "Inner edge of eyebrow, above nose bridge" },
        { name: "Side of Eye", abbr: "SE", desc: "Temple, on the bone beside the outer eye" },
        { name: "Under Eye", abbr: "UE", desc: "Below the eye on the top of cheekbone" },
        { name: "Under Nose", abbr: "UN", desc: "Between the bottom of the nose and upper lip" },
        { name: "Chin", abbr: "CH", desc: "Centre of chin, in the crease below lower lip" },
        { name: "Collarbone", abbr: "CB", desc: "One inch below collarbone, either side" },
        { name: "Under Arm", abbr: "UA", desc: "4 inches below armpit, side of torso" },
        { name: "Top of Head", abbr: "TH", desc: "Crown of head, tap with all four fingers" },
      ],
    },
    {
      title: "Finger Points",
      subtitle: "For specific emotions",
      points: [
        { name: "Thumb", abbr: "TH", desc: "Outside edge, base of nail — worry, overthinking" },
        { name: "Index Finger", abbr: "IF", desc: "Inside edge, base of nail — anger, frustration" },
        { name: "Middle Finger", abbr: "MF", desc: "Inside edge, base of nail — shame, regret" },
        { name: "Ring Finger", abbr: "RF", desc: "Inside edge, base of nail — grief, sadness" },
        { name: "Pinky Finger", abbr: "PF", desc: "Inside edge, base of nail — pretense, people-pleasing" },
      ],
    },
    {
      title: "Gamut Point",
      subtitle: "For high intensity or stuck progress",
      points: [
        { name: "Gamut Point", abbr: "GP", desc: "Back of hand, between ring and pinky knuckles. Use with 9 gamut procedure." },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex gap-6 justify-center pt-2">
        <FaceBodyDiagram size={140} />
        <div className="flex flex-col gap-3 justify-center">
          <HandDiagram size={120} />
          <FingerPointDiagram size={120} />
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">{section.title}</p>
          <p className="text-[10px] text-muted-foreground/50 mb-3">{section.subtitle}</p>
          <div className="space-y-2">
            {section.points.map((p) => (
              <div key={p.name} className="flex items-start gap-3">
                <span className="text-[10px] font-sans font-medium text-accent w-6 pt-0.5 shrink-0">{p.abbr}</span>
                <div>
                  <span className="text-sm text-foreground font-sans">{p.name}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-card rounded-xl p-4 mt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">9 Gamut Procedure</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
          Tap continuously on the gamut point while performing each step:
        </p>
        <ol className="space-y-1">
          {[
            "Close eyes", "Open eyes", "Eyes hard down right (head still)",
            "Eyes hard down left (head still)", "Roll eyes clockwise",
            "Roll eyes counter-clockwise", "Hum 2 seconds of any tune",
            "Count rapidly: 1, 2, 3, 4, 5", "Hum 2 seconds again",
          ].map((step, i) => (
            <li key={i} className="text-[11px] text-foreground/70 flex gap-2">
              <span className="text-accent/60 w-4 shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export { FACE_BODY_POINTS, HAND_POINTS, FINGER_POINTS };
