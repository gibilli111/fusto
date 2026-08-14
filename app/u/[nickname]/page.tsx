"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/image";
import BeerMug from "@/components/BeerMug";
import Avatar from "@/components/Avatar";
import TopBeers from "@/components/TopBeers";
import type { TopBeer } from "@/lib/types";

type Profile = {
  id: string;
  nickname: string;
  avatar_color: string;
  avatar_url: string | null;
  created_at: string;
};
type LevelRow = { level: number; beers_in_current_level: number };
type ProfilePost = { id: string; photo_url: string };

export default function ProfilePage() {
  const params = useParams<{ nickname: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [levelRow, setLevelRow] = useState<LevelRow | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [topBeers, setTopBeers] = useState<TopBeer[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

      const [{ data: level }, { data: postRows }, { data: beerRows }] = await Promise.all([
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
        supabase.rpc("top_beers_for_user", { p_user_id: profileData.id }),
      ]);

      if (cancelled) return;
      setLevelRow(level ?? { level: 0, beers_in_current_level: 0 });
      setPosts(postRows ?? []);
      setTopBeers((beerRows as TopBeer[]) ?? []);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.nickname]);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploadingAvatar(true);
    try {
      const blob = await compressImage(file, 400, 0.85);
      const path = `${session.userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: rpcError } = await supabase.rpc("update_avatar", {
        p_token: session.token,
        p_avatar_url: urlData.publicUrl,
      });
      if (rpcError) throw rpcError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: urlData.publicUrl } : prev));
    } catch {
      // upload/aggiornamento fallito: l'avatar resta quello di prima
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!session) return;
    if (!window.confirm("Eliminare questa foto?")) return;
    const { error } = await supabase.rpc("delete_post", {
      p_token: session.token,
      p_post_id: id,
    });
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (profile === undefined) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <svg viewBox="0 0 100 120" width="36" height="43" className="animate-bounce text-red" aria-hidden="true">
          <path
            d="M15 10 h55 v90 a10 10 0 0 1 -10 10 h-35 a10 10 0 0 1 -10 -10 z"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
          />
          <path
            d="M70 30 h8 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
          />
        </svg>
      </main>
    );
  }

  if (profile === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-foreground">Profilo non trovato.</p>
        <Link href="/" className="text-red underline">
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
        {isOwnProfile ? (
          <label className="relative cursor-pointer">
            <Avatar
              url={profile.avatar_url}
              color={profile.avatar_color}
              initial={profile.nickname.charAt(0)}
              size={64}
            />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-red text-xs text-on-accent">
              {uploadingAvatar ? "…" : "＋"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
        ) : (
          <Avatar
            url={profile.avatar_url}
            color={profile.avatar_color}
            initial={profile.nickname.charAt(0)}
            size={64}
          />
        )}

        <h1 className="font-display text-2xl font-black uppercase tracking-wide text-foreground">
          {profile.nickname}
        </h1>

        <BeerMug fillPercent={beersInLevel * 10} />

        <div className={`grid w-full gap-2 ${isOwnProfile ? "max-w-[220px] grid-cols-2" : "max-w-[110px] grid-cols-1"}`}>
          <div className="border border-l-[3px] border-card-border border-l-red bg-card px-3 py-2 text-left">
            <div className="font-display text-3xl font-black leading-none tabular-nums text-foreground">
              {level}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Livello</div>
          </div>
          {isOwnProfile && (
            <div className="border border-l-[3px] border-card-border border-l-blue bg-card px-3 py-2 text-left">
              <div className="font-display text-3xl font-black leading-none tabular-nums text-foreground">
                {total}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">Birre totali</div>
            </div>
          )}
        </div>
      </div>

      <TopBeers beers={topBeers} title={isOwnProfile ? "Le tue birre preferite" : "Le sue birre preferite"} />

      {posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {posts.map((post) => (
            <div key={post.id} className="group relative aspect-square overflow-hidden rounded-md bg-card-border">
              <Image src={post.photo_url} alt="" fill className="object-cover" sizes="200px" />
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.id)}
                  aria-label="Elimina post"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-sm leading-none text-white"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">Nessuna foto ancora.</p>
      )}
    </main>
  );
}
