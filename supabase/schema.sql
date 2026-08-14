-- Fusto — schema Supabase
-- Da eseguire una volta nel SQL editor del progetto Supabase (Database > SQL Editor).

create extension if not exists pgcrypto;

-- ============================================================
-- USERS
-- ============================================================
-- Nessuna vera sessione server: l'accesso è nickname + PIN a 4 cifre.
-- pin_hash non è mai leggibile da anon: si accede solo tramite le
-- funzioni create_user/claim_nickname qui sotto (SECURITY DEFINER).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  pin_hash text not null,
  avatar_color text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_nickname_lower_idx on users (lower(nickname));

alter table users enable row level security;
-- Nessuna policy anon sulla tabella base: pin_hash resta protetto.
-- I dati pubblici (nickname, colore, data iscrizione) passano dalla view sotto.

create or replace view public_profiles as
  select id, nickname, avatar_color, created_at from users;

grant select on public_profiles to anon;

-- ============================================================
-- SESSIONS
-- ============================================================
-- Il token è quello salvato in localStorage sul dispositivo: prova
-- che il dispositivo "è" quel nickname, senza dover reinserire il PIN.

create table if not exists sessions (
  token text primary key default encode(gen_random_bytes(32), 'hex'),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table sessions enable row level security;
-- Nessuna policy anon: le sessioni si creano/verificano solo via RPC.

-- ============================================================
-- BEERS (suggerimenti autocomplete)
-- ============================================================

create table if not exists beers (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create unique index if not exists beers_name_lower_idx on beers (lower(name));

alter table beers enable row level security;

create policy "beers are publicly readable" on beers
  for select to anon using (true);

create policy "anyone can suggest a new beer" on beers
  for insert to anon with check (true);

-- ============================================================
-- POSTS
-- ============================================================

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  photo_url text not null,
  birra text,
  luogo text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on posts (created_at desc);
create index if not exists posts_user_id_idx on posts (user_id);

alter table posts enable row level security;

create policy "posts are publicly readable" on posts
  for select to anon using (true);
-- Nessuna policy anon di insert diretto: si passa da create_post (RPC),
-- che valida il token di sessione prima di scrivere.

-- ============================================================
-- FUNZIONI RPC (SECURITY DEFINER)
-- ============================================================
-- search_path include "extensions" perché su Supabase pgcrypto
-- (gen_salt/crypt/gen_random_bytes) vive in quello schema, non in public.

-- Sceglie un colore avatar pseudo-casuale dalla palette del tema.
create or replace function pick_avatar_color() returns text
language sql as $$
  select (array[
    '#D97706', '#B45309', '#92400E', '#C2410C', '#A16207', '#854D0E', '#EA580C'
  ])[1 + floor(random() * 7)::int];
$$;

-- Crea un nuovo utente. Fallisce se il nickname è già preso
-- (il client, in quel caso, deve chiamare claim_nickname).
create or replace function create_user(p_nickname text, p_pin text)
returns table (user_id uuid, token text, avatar_color text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user_id uuid;
  v_avatar_color text;
  v_token text;
begin
  if p_nickname is null or length(trim(p_nickname)) = 0 then
    raise exception 'nickname_required';
  end if;
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'invalid_pin_format';
  end if;
  if exists (select 1 from users where lower(nickname) = lower(p_nickname)) then
    raise exception 'nickname_taken';
  end if;

  v_avatar_color := pick_avatar_color();

  insert into users (nickname, pin_hash, avatar_color)
  values (trim(p_nickname), crypt(p_pin, gen_salt('bf')), v_avatar_color)
  returning id into v_user_id;

  insert into sessions (user_id) values (v_user_id) returning sessions.token into v_token;

  return query select v_user_id, v_token, v_avatar_color;
end;
$$;

grant execute on function create_user(text, text) to anon;

-- Reclama un nickname già esistente su un nuovo dispositivo, dato il PIN corretto.
create or replace function claim_nickname(p_nickname text, p_pin text)
returns table (user_id uuid, token text, avatar_color text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user users%rowtype;
  v_token text;
begin
  select * into v_user from users where lower(nickname) = lower(p_nickname);

  if not found then
    raise exception 'nickname_not_found';
  end if;
  if v_user.pin_hash != crypt(p_pin, v_user.pin_hash) then
    raise exception 'invalid_pin';
  end if;

  insert into sessions (user_id) values (v_user.id) returning sessions.token into v_token;

  return query select v_user.id, v_token, v_user.avatar_color;
end;
$$;

grant execute on function claim_nickname(text, text) to anon;

-- Verifica che un token di sessione salvato sul dispositivo sia ancora valido.
create or replace function verify_session(p_token text)
returns table (user_id uuid, nickname text, avatar_color text)
language sql security definer set search_path = public, extensions as $$
  select u.id, u.nickname, u.avatar_color
  from sessions s join users u on u.id = s.user_id
  where s.token = p_token;
$$;

grant execute on function verify_session(text) to anon;

-- Pubblica un post, validando il token invece di fidarsi di un user_id
-- passato direttamente dal client.
create or replace function create_post(
  p_token text, p_photo_url text, p_birra text default null, p_luogo text default null
)
returns table (id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user_id uuid;
  v_post_id uuid;
  v_created_at timestamptz;
begin
  select user_id into v_user_id from sessions where token = p_token;
  if v_user_id is null then
    raise exception 'invalid_session';
  end if;
  if p_photo_url is null or length(trim(p_photo_url)) = 0 then
    raise exception 'photo_required';
  end if;

  if p_birra is not null and length(trim(p_birra)) > 0 then
    insert into beers (name) values (trim(p_birra))
    on conflict (lower(name)) do nothing;
  end if;

  insert into posts (user_id, photo_url, birra, luogo)
  values (v_user_id, p_photo_url, nullif(trim(p_birra), ''), nullif(trim(p_luogo), ''))
  returning posts.id, posts.created_at into v_post_id, v_created_at;

  return query select v_post_id, v_created_at;
end;
$$;

grant execute on function create_post(text, text, text, text) to anon;

-- Statistiche profilo: livello pubblico (ogni 10 birre) + percentuale di
-- riempimento del boccale corrente. Il conteggio esatto NON è incluso qui:
-- lo calcola il client solo quando il proprietario guarda il proprio profilo
-- (i post sono comunque una tabella pubblica, quindi questa è una scelta di
-- interfaccia — "non mostrato agli altri" — non un limite crittografico).
create or replace view profile_levels as
  select
    user_id,
    count(*) as total_for_level_calc,
    floor(count(*) / 10.0)::int as level,
    (count(*) % 10) as beers_in_current_level
  from posts
  group by user_id;

grant select on profile_levels to anon;

-- Feed: post pubblici già uniti al nickname/colore di chi li ha caricati.
create or replace view feed_posts as
  select
    p.id, p.photo_url, p.birra, p.luogo, p.created_at,
    u.nickname, u.avatar_color
  from posts p
  join users u on u.id = p.user_id
  order by p.created_at desc;

grant select on feed_posts to anon;

-- Top 3 birre più loggate nel gruppo, aggregate e anonime.
create or replace view top_beers as
  select
    (array_agg(birra order by created_at))[1] as name,
    count(*) as total
  from posts
  where birra is not null
  group by lower(birra)
  order by count(*) desc
  limit 3;

grant select on top_beers to anon;

-- ============================================================
-- STORAGE — bucket foto birre
-- ============================================================

insert into storage.buckets (id, name, public)
values ('beer-photos', 'beer-photos', true)
on conflict (id) do nothing;

create policy "beer photos are publicly readable"
  on storage.objects for select to anon
  using (bucket_id = 'beer-photos');

create policy "anyone can upload a beer photo"
  on storage.objects for insert to anon
  with check (bucket_id = 'beer-photos');

-- ============================================================
-- SEED — birre comuni pre-caricate per l'autocomplete
-- ============================================================

insert into beers (name) values
  ('Ichnusa'), ('Peroni'), ('Moretti'), ('Menabrea'), ('Forst'), ('Dreher'),
  ('Nastro Azzurro'), ('Poretti'), ('Raffo'), ('Splügen'), ('Theresianer'),
  ('Baladin'), ('Birra del Borgo'), ('11 Paralleli'),
  ('Heineken'), ('Corona'), ('Guinness'), ('Becks'), ('Tennent''s'),
  ('Carlsberg'), ('Amstel'), ('Paulaner'), ('Leffe'), ('Erdinger'),
  ('Duvel'), ('Chimay'),
  ('Lager'), ('Pilsner'), ('IPA'), ('APA'), ('Weiss'), ('Stout'), ('Porter'),
  ('Bock'), ('Tripel'), ('Saison'), ('Pale Ale'), ('Bionda'), ('Rossa'),
  ('Ambrata'), ('Scura'), ('Doppio Malto')
on conflict (lower(name)) do nothing;
