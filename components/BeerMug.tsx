export default function BeerMug({
  level,
  fillPercent,
}: {
  level: number;
  fillPercent: number;
}) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const fillHeight = (clamped / 100) * 90;
  const fillY = 100 - fillHeight;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 120" className="h-32 w-28" aria-hidden>
        <defs>
          <clipPath id="mugClip">
            <path d="M15 10 h55 v90 a10 10 0 0 1 -10 10 h-35 a10 10 0 0 1 -10 -10 z" />
          </clipPath>
        </defs>

        <g clipPath="url(#mugClip)">
          <rect x="15" y={fillY} width="55" height={fillHeight} fill="#e8940f" className="transition-all duration-700 ease-out" />
          {clamped > 4 && (
            <rect x="15" y={fillY} width="55" height="6" fill="#fff7ea" opacity="0.85" />
          )}
        </g>

        <path
          d="M15 10 h55 v90 a10 10 0 0 1 -10 10 h-35 a10 10 0 0 1 -10 -10 z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-card-border"
        />
        <path
          d="M70 30 h8 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-card-border"
        />
      </svg>
      <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
        Livello {level} 🍺
      </span>
    </div>
  );
}
