"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Step = "nickname" | "pin-new" | "pin-existing";

export default function Onboarding() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("nickname");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleNicknameSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length === 0) return;
    setError(null);
    setSubmitting(true);

    const { data, error: lookupError } = await supabase
      .from("public_profiles")
      .select("id")
      .ilike("nickname", trimmed)
      .maybeSingle();

    setSubmitting(false);
    if (lookupError) {
      setError("Qualcosa è andato storto, riprova.");
      return;
    }
    setStep(data ? "pin-existing" : "pin-new");
  }

  async function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("Il PIN deve essere di 4 cifre.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const rpcName = step === "pin-new" ? "create_user" : "claim_nickname";
    const { data, error: rpcError } = await supabase
      .rpc(rpcName, { p_nickname: nickname.trim(), p_pin: pin })
      .single();

    setSubmitting(false);
    if (rpcError || !data) {
      if (rpcError?.message.includes("invalid_pin")) {
        setError("PIN sbagliato, riprova.");
      } else if (rpcError?.message.includes("nickname_taken")) {
        setError("Nel frattempo qualcuno ha preso questo nickname, scegline un altro.");
        setStep("nickname");
      } else {
        setError("Qualcosa è andato storto, riprova.");
      }
      setPin("");
      return;
    }

    const row = data as { user_id: string; token: string; avatar_color: string };
    login({
      token: row.token,
      userId: row.user_id,
      nickname: nickname.trim(),
      avatarColor: row.avatar_color,
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-6xl">🍺</span>
      <h1 className="font-display text-3xl font-semibold text-foreground">Fusto</h1>

      {step === "nickname" && (
        <form onSubmit={handleNicknameSubmit} className="flex w-full max-w-xs flex-col gap-3">
          <label className="text-left text-sm text-muted" htmlFor="nickname">
            Come ti chiami?
          </label>
          <input
            id="nickname"
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
            placeholder="Il tuo nickname"
            className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-lg text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting || nickname.trim().length === 0}
            className="w-full rounded-full bg-accent px-5 py-3 text-lg font-medium text-accent-foreground disabled:opacity-50"
          >
            Continua
          </button>
        </form>
      )}

      {(step === "pin-new" || step === "pin-existing") && (
        <form onSubmit={handlePinSubmit} className="flex w-full max-w-xs flex-col gap-3">
          <p className="text-sm text-muted">
            {step === "pin-new"
              ? `Ciao ${nickname}! Scegli un PIN a 4 cifre per proteggere il tuo nome.`
              : `Bentornato ${nickname}, inserisci il tuo PIN.`}
          </p>
          <input
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-center text-3xl tracking-[0.5em] text-foreground outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting || pin.length !== 4}
            className="w-full rounded-full bg-accent px-5 py-3 text-lg font-medium text-accent-foreground disabled:opacity-50"
          >
            {step === "pin-new" ? "Crea il mio profilo" : "Entra"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("nickname");
              setPin("");
              setError(null);
            }}
            className="text-sm text-muted underline"
          >
            Non sono {nickname}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
