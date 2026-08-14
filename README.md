# Fusto 🍺

Una foto per ogni birra, tra amici. Vedi `CLAUDE.md` per l'architettura completa.

## 1. Crea il progetto Supabase (gratis)

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo progetto (piano free)
2. In **SQL Editor**, incolla ed esegui tutto il contenuto di [`supabase/schema.sql`](./supabase/schema.sql) — crea tabelle, funzioni, viste, il bucket foto e la lista birre pre-caricata
3. In **Project Settings → API**, copia:
   - **Project URL**
   - **anon public key**

## 2. Configura le variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Incolla dentro `.env.local` i due valori copiati da Supabase.

## 3. Avvia in locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000). Su un telefono in rete locale, usa l'IP del PC (es. `http://192.168.1.x:3000`) per testare la fotocamera.

## 4. Metti online (gratis)

1. Crea una repo su GitHub e pusha questo progetto:
   ```bash
   git remote add origin <url-della-tua-repo>
   git push -u origin main
   ```
2. Vai su [vercel.com](https://vercel.com), collega il tuo account GitHub, importa la repo
3. In **Environment Variables** su Vercel, aggiungi le stesse due variabili di `.env.local`
4. Deploy — ogni push su `main` da quel momento rideploya automaticamente

## 5. Usa l'app

Apri l'URL `*.vercel.app` da telefono → "Aggiungi a Home" per installarla come app. Manda il link agli amici: ognuno sceglie nickname + PIN al primo accesso e resta connesso sul proprio telefono.
