# CLAUDE.md

Guida per Claude Code su questo repository.

## Progetto

**Fusto** — webapp per un gruppo di amici: si fa una foto ogni volta che si beve una birra e la si carica in un feed condiviso. Accesso senza login complicato (nickname + PIN), profilo pubblico con un boccale che si riempie a livelli, classifica globale delle birre più loggate.

Design: sfondo bianco/nero editoriale con accenti rosso/blu/verde (card a bordo sinistro colorato in stile KPI, niente pill arrotondate), font Barlow Condensed (numeri grandi, titoli) + IBM Plex Sans (corpo). Tema scuro alternativo verde bottiglia/ottone da pub anglo-irlandese, disponibile ma non predefinito. Il boccale del profilo è renderizzato in Canvas (vetro con manico, schiuma, condensa) e risponde al giroscopio del telefono.

## Stack

- **Frontend**: Next.js (App Router, TypeScript) + Tailwind CSS, PWA installabile
- **Backend**: Supabase (Postgres + Storage), piano free
- **Hosting**: Vercel (piano free), collegato a GitHub per deploy automatico su push
- **Costo**: zero — nessun piano a pagamento

## Comandi

```bash
npm run dev      # sviluppo locale
npm run build    # build produzione
npm run lint     # lint
```

## Autenticazione

Nessuna vera sessione server. Al primo accesso l'utente sceglie un nickname + PIN a 4 cifre:
- nickname libero → crea account, PIN hashato in Postgres (pgcrypto), token salvato in `localStorage` del dispositivo
- nickname già preso → richiede il PIN per "reclamarlo" su quel dispositivo

Le funzioni `create_user` / `verify_user` sono RPC Postgres `SECURITY DEFINER` (vedi `supabase/schema.sql`), chiamate dal client con la anon key.

## Modello dati (Supabase)

- `users`: id, nickname, pin_hash, colore_avatar, created_at
- `posts`: id, user_id, photo_url, birra (opzionale), luogo (opzionale), created_at
- `beers`: id, name — lista suggerimenti per l'autocomplete, pre-seedata con birre comuni + arricchita dagli utenti quando ne scrivono una nuova

## Funzionalità chiave

- **Feed**: unica vista principale, cronologico, card foto + nickname + tempo relativo + birra/luogo opzionali
- **Nuovo post**: cattura foto da fotocamera nativa → estrazione posizione da EXIF, fallback su Geolocation API del browser se assente → campi birra (autocomplete) e luogo modificabili
- **Profilo** (`/u/[nickname]`, pubblico): boccale animato che si riempie ogni 10 birre e si ricarica a "livello" successivo — il livello è pubblico, il conteggio esatto è visibile solo al proprietario loggato
- **Classifica birre**: top 3 birre/marche più citate su tutti i post del gruppo, aggregata e anonima

## Sync Rules

Nessuna regola di sync speciale: repository singolo, nessun mirroring tra cartelle.

## Git Workflow

Mai push diretto su `main`. Sempre:

1. Branch: `git checkout -b feat/...` o `fix/...`
2. Commit
3. Push branch: `git push -u origin <branch>`
4. PR: `gh pr create`

## Note

Per usare lo skill "UI UX Pro Max" (database di stili/palette/font per il design) in questo repo:

```bash
npx ui-ux-pro-max-cli init --ai claude
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
