create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  unique(sender_id, receiver_id),
  check (sender_id <> receiver_id)
);

alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.friend_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friend_requests'
      and policyname = 'friend requests readable by sender or receiver'
  ) then
    create policy "friend requests readable by sender or receiver"
    on public.friend_requests
    for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friend_requests'
      and policyname = 'users can send friend requests'
  ) then
    create policy "users can send friend requests"
    on public.friend_requests
    for insert
    with check (auth.uid() = sender_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friend_requests'
      and policyname = 'receiver can update friend request'
  ) then
    create policy "receiver can update friend request"
    on public.friend_requests
    for update
    using (auth.uid() = receiver_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'friends'
      and policyname = 'accepted friend request participants can add reciprocal links'
  ) then
    create policy "accepted friend request participants can add reciprocal links"
    on public.friends
    for insert
    with check (
      exists (
        select 1
        from public.friend_requests fr
        where fr.status = 'accepted'
          and auth.uid() in (fr.sender_id, fr.receiver_id)
          and (
            (fr.sender_id = user_id and fr.receiver_id = friend_id)
            or (fr.sender_id = friend_id and fr.receiver_id = user_id)
          )
      )
    );
  end if;

end $$;

create or replace function public.is_admin_user(check_user_id uuid) returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (
      select p.is_admin
      from public.profiles p
      where p.id = check_user_id
      limit 1
    ),
    false
  );
$$;

grant execute on function public.is_admin_user(uuid) to authenticated;

update public.profiles
set is_admin = true
where id in (
  select id
  from auth.users
  where email = 'donnykimkr@gmail.com'
);

drop policy if exists "admins can update profiles admin status" on public.profiles;

create policy "admins can update profiles admin status"
on public.profiles
for update
using (public.is_admin_user(auth.uid()))
with check (true);
