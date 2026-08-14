import Link from "next/link";

export default function Fab() {
  return (
    <Link
      href="/new"
      aria-label="Nuova birra"
      className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl text-accent-foreground shadow-lg transition-transform active:scale-95"
    >
      +
    </Link>
  );
}
