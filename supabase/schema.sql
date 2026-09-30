-- Resume Forge database. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again: it only creates what is missing and replaces functions.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Resumes (one row per resume; users can have many)
-- ---------------------------------------------------------------------
create table if not exists public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null default 'My resume' check (char_length(title) <= 200),
  data        jsonb not null default '{}'::jsonb,
  settings    jsonb not null default '{}'::jsonb,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint resumes_data_size check (pg_column_size(data) < 600000)
);
create index if not exists resumes_user_updated on public.resumes (user_id, updated_at desc);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists resumes_touch on public.resumes;
create trigger resumes_touch before update on public.resumes
for each row execute function public.touch_updated_at();

-- Max 50 resumes per account (stops abuse of free storage)
create or replace function public.limit_resumes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.resumes where user_id = new.user_id) >= 50 then
    raise exception 'You can keep up to 50 resumes. Delete an old one first.';
  end if;
  return new;
end $$;
drop trigger if exists resumes_limit on public.resumes;
create trigger resumes_limit before insert on public.resumes
for each row execute function public.limit_resumes();

alter table public.resumes enable row level security;
drop policy if exists "own resumes: read"   on public.resumes;
drop policy if exists "own resumes: insert" on public.resumes;
drop policy if exists "own resumes: update" on public.resumes;
drop policy if exists "own resumes: delete" on public.resumes;
create policy "own resumes: read"   on public.resumes for select using (auth.uid() = user_id);
create policy "own resumes: insert" on public.resumes for insert with check (auth.uid() = user_id);
create policy "own resumes: update" on public.resumes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own resumes: delete" on public.resumes for delete using (auth.uid() = user_id);

-- Public share links: anyone with the exact id can read a resume the owner
-- marked as public. There is deliberately no way to LIST public resumes.
create or replace function public.get_public_resume(p_id uuid)
returns table (id uuid, title text, data jsonb, settings jsonb, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.title, r.data, r.settings, r.updated_at
  from public.resumes r where r.id = p_id and r.is_public = true
$$;
revoke all on function public.get_public_resume(uuid) from public;
grant execute on function public.get_public_resume(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- AI fair-use allowance (credits per user per UTC day + a global daily cap)
-- ---------------------------------------------------------------------
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default ((now() at time zone 'utc')::date),
  used    int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "own usage: read" on public.ai_usage;
create policy "own usage: read" on public.ai_usage for select using (auth.uid() = user_id);

-- These functions are called ONLY by the website's server (Cloudflare function)
-- with the service-role key, so visitors can't reset their own counters.
drop function if exists public.consume_ai_credit(int, int, int);
drop function if exists public.refund_ai_credit(int);
drop function if exists public.get_ai_usage(int);

create or replace function public.consume_ai_credit(p_user uuid, p_cost int, p_limit int, p_global_limit int)
returns json language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'utc')::date;
  total int;
  new_used int;
begin
  if p_user is null then return json_build_object('allowed', false, 'reason', 'auth'); end if;
  if p_cost is null or p_cost < 1 or p_cost > 10 then return json_build_object('allowed', false, 'reason', 'bad_cost'); end if;
  if p_global_limit > 0 then
    select coalesce(sum(used), 0) into total from public.ai_usage where day = today;
    if total + p_cost > p_global_limit then return json_build_object('allowed', false, 'reason', 'global'); end if;
  end if;
  insert into public.ai_usage as u (user_id, day, used) values (p_user, today, p_cost)
  on conflict (user_id, day) do update set used = u.used + p_cost
    where u.used + p_cost <= p_limit
  returning u.used into new_used;
  if new_used is null then
    select used into new_used from public.ai_usage where user_id = p_user and day = today;
    return json_build_object('allowed', false, 'reason', 'limit', 'used', coalesce(new_used, p_limit));
  end if;
  if new_used > p_limit then
    update public.ai_usage set used = used - p_cost where user_id = p_user and day = today;
    return json_build_object('allowed', false, 'reason', 'limit', 'used', new_used - p_cost);
  end if;
  return json_build_object('allowed', true, 'used', new_used);
end $$;

create or replace function public.refund_ai_credit(p_user uuid, p_cost int)
returns json language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'utc')::date; new_used int;
begin
  if p_user is null or p_cost is null or p_cost < 1 or p_cost > 10 then return json_build_object('used', null); end if;
  update public.ai_usage set used = greatest(0, used - p_cost) where user_id = p_user and day = today returning used into new_used;
  return json_build_object('used', new_used);
end $$;

create or replace function public.get_ai_usage(p_user uuid, p_limit int)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('used', coalesce((select used from public.ai_usage where user_id = p_user and day = (now() at time zone 'utc')::date), 0), 'limit', p_limit)
$$;

revoke all on function public.consume_ai_credit(uuid, int, int, int) from public, anon, authenticated;
revoke all on function public.refund_ai_credit(uuid, int) from public, anon, authenticated;
revoke all on function public.get_ai_usage(uuid, int) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, int, int, int) to service_role;
grant execute on function public.refund_ai_credit(uuid, int) to service_role;
grant execute on function public.get_ai_usage(uuid, int) to service_role;

-- Keep old AI usage rows small: delete anything older than 60 days (run occasionally,
-- or schedule it with Supabase cron):
--   delete from public.ai_usage where day < (now() at time zone 'utc')::date - 60;
