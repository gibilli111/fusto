import type { TopBeer } from "@/lib/types";

const FILL_CLASSES = ["bg-red", "bg-green", "bg-blue"];

export default function TopBeers({ beers, title }: { beers: TopBeer[]; title?: string }) {
  if (beers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {beers.map((beer, i) => (
          <div key={beer.name} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm text-foreground">{beer.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-card-border">
              <div
                className={`h-full rounded-sm ${FILL_CLASSES[i % FILL_CLASSES.length]}`}
                style={{ width: `${beer.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
