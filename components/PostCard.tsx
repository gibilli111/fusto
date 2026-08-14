"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { timeAgo } from "@/lib/time";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Avatar from "./Avatar";
import type { FeedPost } from "@/lib/types";

export default function PostCard({
  post,
  onDeleted,
}: {
  post: FeedPost;
  onDeleted?: (id: string) => void;
}) {
  const { session } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const isOwn = session?.userId === post.user_id;

  async function handleDelete() {
    if (!session || deleting) return;
    if (!window.confirm("Eliminare questa foto?")) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_post", {
      p_token: session.token,
      p_post_id: post.id,
    });
    setDeleting(false);
    if (!error) onDeleted?.(post.id);
  }

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
        {isOwn && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Elimina post"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-lg leading-none text-white disabled:opacity-50"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Link href={`/u/${encodeURIComponent(post.nickname)}`}>
            <Avatar
              url={post.avatar_url}
              color={post.avatar_color}
              initial={post.nickname.charAt(0)}
              size={32}
            />
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
