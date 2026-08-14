"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";
import TopBeers from "@/components/TopBeers";
import Fab from "@/components/Fab";
import type { FeedPost, TopBeer } from "@/lib/types";

export default function Home() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [topBeers, setTopBeers] = useState<TopBeer[]>([]);

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

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-28 pt-6">
      <header className="flex items-center gap-2">
        <span className="text-3xl">🍺</span>
        <h1 className="font-display text-2xl font-semibold text-foreground">Fusto</h1>
      </header>

      <TopBeers beers={topBeers} title="Le più loggate dal gruppo" />

      {posts === null && <p className="py-12 text-center text-muted">Carico il feed…</p>}

      {posts?.length === 0 && (
        <p className="py-12 text-center text-muted">
          Ancora nessuna birra qui. Sii il primo a caricarne una 🍻
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
