import type { TopBeer } from "@/lib/types";

export default function TopBeers({ beers }: { beers: TopBeer[] }) {
  if (beers.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex flex-wrap gap-2">
      {beers.map((beer, i) => (
        <span
          key={beer.name}
          className="flex items-center gap-1 rounded-full border border-card-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          {medals[i]} {beer.name}
        </span>
      ))}
    </div>
  );
}
