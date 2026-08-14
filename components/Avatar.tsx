import Image from "next/image";

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
      <span
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <Image src={url} alt="" fill className="object-cover" sizes={`${size}px`} />
      </span>
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
