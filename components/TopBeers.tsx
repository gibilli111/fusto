import type { TopBeer } from "@/lib/types";

export default function TopBeers({ beers, title }: { beers: TopBeer[]; title?: string }) {
  if (beers.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      )}
      <div className="flex flex-col gap-1.5">
        {beers.map((beer) => (
          <div key={beer.name} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-sm text-foreground">{beer.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-border">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${beer.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
