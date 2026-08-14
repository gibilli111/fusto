-- Patch: pgcrypto vive nello schema "extensions" su Supabase, non "public".
-- Incolla ed esegui questo blocco intero nello SQL Editor di Supabase.
-- Sostituisce solo le funzioni, non tocca tabelle/dati già presenti.

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

create or replace function verify_session(p_token text)
returns table (user_id uuid, nickname text, avatar_color text)
language sql security definer set search_path = public, extensions as $$
  select u.id, u.nickname, u.avatar_color
  from sessions s join users u on u.id = s.user_id
  where s.token = p_token;
$$;

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
