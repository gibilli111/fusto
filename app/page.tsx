"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import TopBeers from "@/components/TopBeers";
import Avatar from "@/components/Avatar";
import Fab from "@/components/Fab";
import type { FeedPost, TopBeer } from "@/lib/types";

export default function Home() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [topBeers, setTopBeers] = useState<TopBeer[]>([]);
  const [ownAvatarUrl, setOwnAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("feed_posts")
      .select("*")
      .limit(50)
      .then(({ data }) => setPosts((data as FeedPost[]) ?? []));

    supabase
      .from("top_beers")
      .select("*")
      .then(({ data }) => setTopBeers((data as TopBeer[]) ?? []));
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("public_profiles")
      .select("avatar_url")
      .eq("id", session.userId)
      .maybeSingle()
      .then(({ data }) => setOwnAvatarUrl(data?.avatar_url ?? null));
  }, [session]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-28 pt-6">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <svg viewBox="0 0 100 120" width="20" height="24" className="text-red" aria-hidden="true">
            <path
              d="M15 10 h55 v90 a10 10 0 0 1 -10 10 h-35 a10 10 0 0 1 -10 -10 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
            />
            <path
              d="M70 30 h8 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
            />
          </svg>
          <h1 className="font-display text-2xl font-black uppercase tracking-wide text-foreground">
            Fusto
          </h1>
        </div>

        {session && (
          <Link href={`/u/${encodeURIComponent(session.nickname)}`} aria-label="Il mio profilo">
            <Avatar
              url={ownAvatarUrl}
              color={session.avatarColor}
              initial={session.nickname.charAt(0)}
              size={34}
            />
          </Link>
        )}
      </header>

      <TopBeers beers={topBeers} title="Le più loggate dal gruppo" />

      {posts === null && <p className="py-12 text-center text-muted">Carico il feed…</p>}

      {posts?.length === 0 && (
        <p className="py-12 text-center text-muted">
          Ancora nessuna birra qui. Sii il primo a caricarne una.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={(id) => setPosts((prev) => prev?.filter((p) => p.id !== id) ?? prev)}
          />
        ))}
      </div>

      <Fab />
    </main>
  );
}
