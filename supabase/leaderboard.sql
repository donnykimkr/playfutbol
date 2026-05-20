create extension if not exists pgcrypto;

create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  score integer not null,
  gems integer not null default 0,
  level integer not null default 1,
  created_at timestamptz default now(),
  constraint leaderboard_nickname_length check (char_length(nickname) between 2 and 16),
  constraint leaderboard_positive_score check (score > 0),
  constraint leaderboard_nonnegative_gems check (gems >= 0),
  constraint leaderboard_positive_level check (level > 0)
);

alter table leaderboard enable row level security;

drop policy if exists "Anyone can read leaderboard" on leaderboard;
create policy "Anyone can read leaderboard"
on leaderboard
for select
using (true);

drop policy if exists "Anyone can submit leaderboard scores" on leaderboard;
create policy "Anyone can submit leaderboard scores"
on leaderboard
for insert
with check (
  char_length(nickname) between 2 and 16
  and score > 0
  and gems >= 0
  and level > 0
);

create index if not exists leaderboard_score_idx
on leaderboard (score desc, created_at asc);
