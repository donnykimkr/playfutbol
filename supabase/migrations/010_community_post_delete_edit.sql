alter table public.community_posts
  add column if not exists updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete community images'
  ) then
    create policy "Users can delete community images"
    on storage.objects
    for delete
    using (
      bucket_id = 'community-images'
      and auth.role() = 'authenticated'
    );
  end if;
end $$;

notify pgrst, 'reload schema';
