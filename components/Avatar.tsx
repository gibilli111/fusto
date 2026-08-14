export default function Avatar({
  url,
  color,
  initial,
  size,
}: {
  url: string | null;
  color: string;
  initial: string;
  size: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- badge piccolo a dimensione fissa, l'immagine è già compressa lato client
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
    >
      {initial.toUpperCase()}
    </span>
  );
}
