create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

alter table public.community_posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_posts'
      and policyname = 'community posts readable'
  ) then
    create policy "community posts readable"
    on public.community_posts
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_posts'
      and policyname = 'authenticated users can create posts'
  ) then
    create policy "authenticated users can create posts"
    on public.community_posts
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_posts'
      and policyname = 'users can update own posts'
  ) then
    create policy "users can update own posts"
    on public.community_posts
    for update
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_posts'
      and policyname = 'users can delete own posts'
  ) then
    create policy "users can delete own posts"
    on public.community_posts
    for delete
    using (auth.uid() = user_id);
  end if;
end $$;
