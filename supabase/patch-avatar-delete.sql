-- Patch: foto profilo + eliminazione post + classifica birre personale.
-- Incolla ed esegui questo blocco intero nello SQL Editor di Supabase.
-- Non tocca dati esistenti.

alter table users add column if not exists avatar_url text;

-- DROP invece di CREATE OR REPLACE: Postgres non permette di inserire una
-- colonna "in mezzo" (o rinominarla) con REPLACE, solo di aggiungerne in fondo.
drop view if exists public_profiles;
create view public_profiles as
  select id, nickname, avatar_color, avatar_url, created_at from users;
grant select on public_profiles to anon;

drop view if exists feed_posts;
create view feed_posts as
  select
    p.id, p.photo_url, p.birra, p.luogo, p.created_at, p.user_id,
    u.nickname, u.avatar_color, u.avatar_url
  from posts p
  join users u on u.id = p.user_id
  order by p.created_at desc;
grant select on feed_posts to anon;

drop view if exists top_beers;
create view top_beers as
  with counts as (
    select
      (array_agg(birra order by created_at))[1] as name,
      count(*) as total
    from posts
    where birra is not null
    group by lower(birra)
  )
  select name, round(100.0 * total / max(total) over (), 1) as pct
  from counts
  order by total desc
  limit 3;
grant select on top_beers to anon;

create or replace function top_beers_for_user(p_user_id uuid)
returns table (name text, pct numeric)
language sql stable as $$
  with counts as (
    select
      (array_agg(birra order by created_at))[1] as name,
      count(*) as total
    from posts
    where birra is not null and user_id = p_user_id
    group by lower(birra)
  )
  select name, round(100.0 * total / max(total) over (), 1) as pct
  from counts
  order by total desc
  limit 3;
$$;

grant execute on function top_beers_for_user(uuid) to anon;

create or replace function update_avatar(p_token text, p_avatar_url text)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from sessions where token = p_token;
  if v_user_id is null then
    raise exception 'invalid_session';
  end if;
  if p_avatar_url is null or length(trim(p_avatar_url)) = 0 then
    raise exception 'avatar_url_required';
  end if;

  update users set avatar_url = p_avatar_url where id = v_user_id;
end;
$$;

grant execute on function update_avatar(text, text) to anon;

create or replace function delete_post(p_token text, p_post_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user_id uuid;
  v_deleted uuid;
begin
  select user_id into v_user_id from sessions where token = p_token;
  if v_user_id is null then
    raise exception 'invalid_session';
  end if;

  delete from posts where id = p_post_id and user_id = v_user_id
  returning id into v_deleted;

  if v_deleted is null then
    raise exception 'not_found_or_forbidden';
  end if;
end;
$$;

grant execute on function delete_post(text, uuid) to anon;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select to anon
  using (bucket_id = 'avatars');

drop policy if exists "anyone can upload an avatar" on storage.objects;
create policy "anyone can upload an avatar"
  on storage.objects for insert to anon
  with check (bucket_id = 'avatars');
