alter table public.community_posts
  add column if not exists image_url text;

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table public.community_replies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_replies'
      and policyname = 'community replies readable'
  ) then
    create policy "community replies readable"
    on public.community_replies
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_replies'
      and policyname = 'authenticated users can create replies'
  ) then
    create policy "authenticated users can create replies"
    on public.community_replies
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_replies'
      and policyname = 'users can update own replies'
  ) then
    create policy "users can update own replies"
    on public.community_replies
    for update
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_replies'
      and policyname = 'users can delete own replies'
  ) then
    create policy "users can delete own replies"
    on public.community_replies
    for delete
    using (auth.uid() = user_id);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Community images are publicly accessible'
  ) then
    create policy "Community images are publicly accessible"
    on storage.objects
    for select
    using (bucket_id = 'community-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload community images'
  ) then
    create policy "Users can upload community images"
    on storage.objects
    for insert
    with check (
      bucket_id = 'community-images'
      and auth.role() = 'authenticated'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update community images'
  ) then
    create policy "Users can update community images"
    on storage.objects
    for update
    using (
      bucket_id = 'community-images'
      and auth.role() = 'authenticated'
    );
  end if;
end $$;
