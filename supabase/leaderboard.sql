create extension if not exists pgcrypto;

create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  score integer not null,
  goals_scored integer not null default 0,
  result text not null default 'draw',
  gems integer not null default 0,
  level integer not null default 1,
  created_at timestamptz default now(),
  constraint leaderboard_nickname_length check (char_length(nickname) between 2 and 16),
  constraint leaderboard_positive_score check (score > 0),
  constraint leaderboard_nonnegative_goals check (goals_scored >= 0),
  constraint leaderboard_valid_result check (result in ('win', 'lose', 'draw')),
  constraint leaderboard_nonnegative_gems check (gems >= 0),
  constraint leaderboard_positive_level check (level > 0)
);

alter table leaderboard
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table leaderboard
add column if not exists goals_scored integer not null default 0;

alter table leaderboard
add column if not exists result text not null default 'draw';

alter table leaderboard
drop constraint if exists leaderboard_nonnegative_goals;

alter table leaderboard
add constraint leaderboard_nonnegative_goals check (goals_scored >= 0);

alter table leaderboard
drop constraint if exists leaderboard_valid_result;

alter table leaderboard
add constraint leaderboard_valid_result check (result in ('win', 'lose', 'draw'));

alter table leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on leaderboard;
create policy "Anyone can read leaderboard"
on leaderboard
for select
using (true);

drop policy if exists "Anyone can submit leaderboard scores" on leaderboard;
drop policy if exists "Authenticated users can submit their own scores" on leaderboard;
create policy "Authenticated users can submit their own scores"
on leaderboard
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and char_length(nickname) between 2 and 16
  and score > 0
  and goals_scored >= 0
  and result in ('win', 'lose', 'draw')
  and gems >= 0
  and level > 0
);

create index if not exists leaderboard_score_idx
on leaderboard (score desc, created_at asc);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  game_id text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_username_length check (char_length(username) between 2 and 16),
  constraint profiles_game_id_format check (game_id ~ '^FO-[A-Z0-9]{6}$')
);

create table if not exists match_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz default now(),
  constraint match_requests_not_self check (from_user <> to_user),
  constraint match_requests_valid_status check (status in ('pending', 'accepted', 'declined'))
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  home_user uuid not null references auth.users(id) on delete cascade,
  away_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint matches_not_self check (home_user <> away_user),
  constraint matches_valid_status check (status in ('active', 'finished', 'abandoned'))
);

alter table profiles enable row level security;
alter table match_requests enable row level security;
alter table matches enable row level security;

drop policy if exists "Anyone can read profiles" on profiles;
create policy "Anyone can read profiles"
on profiles for select
using (true);

drop policy if exists "Users can upsert their own profile" on profiles;
create policy "Users can upsert their own profile"
on profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read their match requests" on match_requests;
create policy "Users can read their match requests"
on match_requests for select
to authenticated
using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists "Users can send match requests" on match_requests;
create policy "Users can send match requests"
on match_requests for insert
to authenticated
with check (from_user = auth.uid() and status = 'pending');

drop policy if exists "Receivers can answer match requests" on match_requests;
create policy "Receivers can answer match requests"
on match_requests for update
to authenticated
using (to_user = auth.uid())
with check (to_user = auth.uid() and status in ('accepted', 'declined'));

drop policy if exists "Players can read their matches" on matches;
create policy "Players can read their matches"
on matches for select
to authenticated
using (home_user = auth.uid() or away_user = auth.uid());

drop policy if exists "Receivers can create accepted matches" on matches;
create policy "Receivers can create accepted matches"
on matches for insert
to authenticated
with check (away_user = auth.uid() or home_user = auth.uid());

drop policy if exists "Players can update match state" on matches;
create policy "Players can update match state"
on matches for update
to authenticated
using (home_user = auth.uid() or away_user = auth.uid())
with check (home_user = auth.uid() or away_user = auth.uid());

create index if not exists profiles_game_id_idx on profiles (game_id);
create index if not exists match_requests_to_user_idx on match_requests (to_user, status, created_at desc);
create index if not exists match_requests_from_user_idx on match_requests (from_user, status, created_at desc);
create index if not exists matches_players_idx on matches (home_user, away_user, status);

do $$
begin
  alter publication supabase_realtime add table match_requests;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table matches;
exception
  when duplicate_object then null;
end $$;
