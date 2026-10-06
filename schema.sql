-- Tara Royal Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Royal Member',
  referral_code text unique not null default ('TARA-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  referred_by uuid references public.profiles(id),
  coins bigint not null default 0 check (coins >= 0),
  taps bigint not null default 0 check (taps >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_daily_claim date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  target_taps bigint not null
);

insert into public.achievements(id,title,description,target_taps) values
('first_tap','First Royal Tap','Make your first tap',1),
('hundred','Century Club','Reach 100 taps',100),
('five_hundred','Royal Grinder','Reach 500 taps',500),
('thousand','Tara Legend','Reach 1,000 taps',1000)
on conflict (id) do nothing;

create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.daily_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  claim_date date not null,
  reward bigint not null,
  created_at timestamptz not null default now(),
  unique(user_id, claim_date)
);

create table if not exists public.referrals (
  id bigint generated always as identity primary key,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  reward bigint not null default 250,
  created_at timestamptz not null default now(),
  unique(referrer_id, referred_id)
);

alter table public.profiles enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.daily_claims enable row level security;
alter table public.referrals enable row level security;

create policy "profiles own row" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "achievements readable" on public.achievements for select using (true);
create policy "user achievements own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "daily claims own" on public.daily_claims for select using (auth.uid() = user_id);
create policy "referrals own" on public.referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name','Royal Member'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.add_tap(p_amount bigint default 2)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  new_coins bigint;
  new_taps bigint;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_amount < 1 or p_amount > 10 then raise exception 'Invalid tap amount'; end if;

  update public.profiles
  set coins = coins + p_amount,
      taps = taps + 1,
      updated_at = now()
  where id = auth.uid()
  returning coins, taps into new_coins, new_taps;

  insert into public.user_achievements(user_id, achievement_id)
  select auth.uid(), a.id
  from public.achievements a
  where a.target_taps <= new_taps
  on conflict do nothing;

  return json_build_object('coins',new_coins,'taps',new_taps);
end;
$$;

create or replace function public.claim_daily_reward()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  today date := current_date;
  old_claim date;
  current_streak integer;
  reward bigint;
  new_coins bigint;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select last_daily_claim, streak into old_claim, current_streak
  from public.profiles where id = auth.uid() for update;

  if old_claim = today then
    raise exception 'Daily reward already claimed';
  end if;

  if old_claim = today - 1 then
    current_streak := current_streak + 1;
  else
    current_streak := 1;
  end if;

  reward := 100 + current_streak * 25;

  insert into public.daily_claims(user_id, claim_date, reward)
  values(auth.uid(), today, reward);

  update public.profiles
  set coins = coins + reward,
      streak = current_streak,
      last_daily_claim = today,
      updated_at = now()
  where id = auth.uid()
  returning coins into new_coins;

  return json_build_object('reward',reward,'streak',current_streak,'coins',new_coins);
end;
$$;

grant execute on function public.add_tap(bigint) to authenticated;
grant execute on function public.claim_daily_reward() to authenticated;
