import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/time";
import type { FeedPost } from "@/lib/types";

export default function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
      <div className="relative aspect-square w-full bg-card-border">
        <Image
          src={post.photo_url}
          alt={post.birra ?? `Birra di ${post.nickname}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 480px"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${encodeURIComponent(post.nickname)}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: post.avatar_color }}
          >
            {post.nickname.charAt(0).toUpperCase()}
          </Link>
          <Link href={`/u/${encodeURIComponent(post.nickname)}`} className="font-medium text-foreground">
            {post.nickname}
          </Link>
          <span className="ml-auto shrink-0 text-sm text-muted">{timeAgo(post.created_at)}</span>
        </div>
        {(post.birra || post.luogo) && (
          <div className="flex flex-wrap gap-2 text-sm">
            {post.birra && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">🍺 {post.birra}</span>
            )}
            {post.luogo && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">📍 {post.luogo}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
