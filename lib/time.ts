export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "adesso";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minut${min === 1 ? "o" : "i"} fa`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} or${hours === 1 ? "a" : "e"} fa`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} giorn${days === 1 ? "o" : "i"} fa`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} settiman${weeks === 1 ? "a" : "e"} fa`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mes${months === 1 ? "e" : "i"} fa`;

  const years = Math.floor(days / 365);
  return `${years} ann${years === 1 ? "o" : "i"} fa`;
}
