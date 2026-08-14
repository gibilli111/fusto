import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Non blocca la build/dev senza credenziali: le chiamate falliranno a
  // runtime finché non copi .env.local.example in .env.local e lo compili.
  console.warn(
    "Supabase non configurato: copia .env.local.example in .env.local e compilalo.",
  );
}

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key",
);
