"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import BeerMug from "@/components/BeerMug";

type Profile = { id: string; nickname: string; avatar_color: string; created_at: string };
type LevelRow = { level: number; beers_in_current_level: number };
type ProfilePost = { id: string; photo_url: string };

export default function ProfilePage() {
  const params = useParams<{ nickname: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [levelRow, setLevelRow] = useState<LevelRow | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: profileData } = await supabase
        .from("public_profiles")
        .select("*")
        .ilike("nickname", params.nickname)
        .maybeSingle();

      if (cancelled) return;
      setProfile(profileData ?? null);
      if (!profileData) return;

      const [{ data: level }, { data: postRows }] = await Promise.all([
        supabase
          .from("profile_levels")
          .select("level, beers_in_current_level")
          .eq("user_id", profileData.id)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("id, photo_url")
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setLevelRow(level ?? { level: 0, beers_in_current_level: 0 });
      setPosts(postRows ?? []);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.nickname]);

  if (profile === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <span className="animate-bounce text-4xl">🍺</span>
      </main>
    );
  }

  if (profile === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-foreground">Profilo non trovato.</p>
        <Link href="/" className="text-accent underline">
          Torna al feed
        </Link>
      </main>
    );
  }

  const isOwnProfile = session?.userId === profile.id;
  const level = levelRow?.level ?? 0;
  const beersInLevel = levelRow?.beers_in_current_level ?? 0;
  const total = level * 10 + beersInLevel;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/" className="text-2xl text-muted" aria-label="Torna al feed">
        ←
      </Link>

      <div className="flex flex-col items-center gap-3 text-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
          style={{ backgroundColor: profile.avatar_color }}
        >
          {profile.nickname.charAt(0).toUpperCase()}
        </span>
        <h1 className="font-display text-2xl font-semibold text-foreground">{profile.nickname}</h1>

        <BeerMug level={level} fillPercent={beersInLevel * 10} />

        {isOwnProfile && <p className="text-sm text-muted">{total} birre in totale</p>}
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {posts.map((post) => (
            <div key={post.id} className="relative aspect-square overflow-hidden rounded-lg bg-card-border">
              <Image src={post.photo_url} alt="" fill className="object-cover" sizes="200px" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">Nessuna foto ancora.</p>
      )}
    </main>
  );
}
