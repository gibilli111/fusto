import Link from "next/link";

export default function Fab() {
  return (
    <Link
      href="/new"
      aria-label="Nuova birra"
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-md bg-red text-3xl leading-none text-on-accent shadow-lg transition-transform active:scale-95"
    >
      +
    </Link>
  );
}
