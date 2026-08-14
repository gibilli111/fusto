"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import exifr from "exifr";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { compressImage } from "@/lib/image";
import { reverseGeocode } from "@/lib/geocode";

export default function NewPost() {
  const { session } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [birra, setBirra] = useState("");
  const [luogo, setLuogo] = useState("");
  const [beerOptions, setBeerOptions] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("beers")
      .select("name")
      .order("name")
      .then(({ data }) => setBeerOptions((data ?? []).map((b) => b.name as string)));
  }, []);

  async function detectLocation(selected: File) {
    setLocating(true);
    try {
      const gps = await exifr.gps(selected).catch(() => null);
      let coords: { lat: number; lon: number } | null = gps
        ? { lat: gps.latitude, lon: gps.longitude }
        : null;

      if (!coords && typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 8000 },
          );
        });
      }

      if (coords) {
        const place = await reverseGeocode(coords.lat, coords.lon);
        if (place) setLuogo(place);
      }
    } finally {
      setLocating(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    void detectLocation(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !session) return;
    setSubmitting(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const path = `${session.userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("beer-photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("beer-photos").getPublicUrl(path);

      const { error: rpcError } = await supabase.rpc("create_post", {
        p_token: session.token,
        p_photo_url: urlData.publicUrl,
        p_birra: birra.trim() || null,
        p_luogo: luogo.trim() || null,
      });
      if (rpcError) throw rpcError;

      router.push("/");
      router.refresh();
    } catch {
      setError("Non sono riuscito a pubblicare, riprova.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-2xl text-muted"
          aria-label="Indietro"
          type="button"
        >
          ←
        </button>
        <h1 className="font-display text-xl font-semibold text-foreground">Nuova birra</h1>
      </div>

      {!previewUrl && (
        <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-card-border bg-card py-20 text-center">
          <span className="text-5xl">📸</span>
          <span className="text-lg font-medium text-foreground">Scatta la foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {previewUrl && (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- anteprima locale da blob URL */}
          <img
            src={previewUrl}
            alt="Anteprima"
            className="aspect-square w-full rounded-2xl object-cover"
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="birra" className="text-sm text-muted">
              Che birra è? (opzionale)
            </label>
            <input
              id="birra"
              list="beer-options"
              value={birra}
              onChange={(e) => setBirra(e.target.value)}
              placeholder="Es. Ichnusa"
              className="rounded-xl border border-card-border bg-card px-4 py-3 text-foreground outline-none focus:border-accent"
            />
            <datalist id="beer-options">
              {beerOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="luogo" className="text-sm text-muted">
              Dove? {locating && "(sto cercando…)"}
            </label>
            <input
              id="luogo"
              value={luogo}
              onChange={(e) => setLuogo(e.target.value)}
              placeholder="Es. Bar Centrale"
              className="rounded-xl border border-card-border bg-card px-4 py-3 text-foreground outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-auto w-full rounded-full bg-accent px-5 py-3 text-lg font-medium text-accent-foreground disabled:opacity-50"
          >
            {submitting ? "Pubblico…" : "Pubblica"}
          </button>
        </form>
      )}
    </main>
  );
}
