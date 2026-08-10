-- Ratneswar Engineering ERP — Supabase one-time setup
-- Run this file in Supabase SQL Editor AFTER `npm run db:deploy`.

-- 1) Keep public.users synced with Supabase Auth users.
-- Reusing the same email after an Auth user was deleted updates the existing ERP
-- profile instead of leaving an orphan or failing user creation.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id text;
  resolved_name text;
begin
  resolved_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  select id into existing_id
  from public.users
  where "authId" = new.id
  limit 1;

  if existing_id is null and new.email is not null then
    select id into existing_id
    from public.users
    where lower(email) = lower(new.email)
    limit 1;
  end if;

  if existing_id is not null then
    update public.users
    set "authId" = new.id,
        email = coalesce(new.email, email),
        name = case when name is null or btrim(name) = '' then resolved_name else name end,
        "isActive" = true,
        "updatedAt" = now()
    where id = existing_id;
  else
    insert into public.users (id, "authId", email, name, role, "isActive", "createdAt", "updatedAt")
    values (
      gen_random_uuid()::text,
      new.id,
      coalesce(new.email, ''),
      resolved_name,
      'ENGINEER',
      true,
      now(),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_new_auth_user();

alter table public.users enable row level security;
drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = "authId");

-- Backfill profiles for Auth users created before this trigger existed.
do $$
declare
  auth_row record;
  existing_id text;
  resolved_name text;
begin
  for auth_row in
    select id, email, raw_user_meta_data
    from auth.users
  loop
    resolved_name := coalesce(
      auth_row.raw_user_meta_data ->> 'name',
      split_part(coalesce(auth_row.email, 'user'), '@', 1)
    );

    select id into existing_id
    from public.users
    where "authId" = auth_row.id
       or (auth_row.email is not null and lower(email) = lower(auth_row.email))
    order by case when "authId" = auth_row.id then 0 else 1 end
    limit 1;

    if existing_id is not null then
      update public.users
      set "authId" = auth_row.id,
          email = coalesce(auth_row.email, email),
          name = case when name is null or btrim(name) = '' then resolved_name else name end,
          "updatedAt" = now()
      where id = existing_id;
    else
      insert into public.users (id, "authId", email, name, role, "isActive", "createdAt", "updatedAt")
      values (
        gen_random_uuid()::text,
        auth_row.id,
        coalesce(auth_row.email, ''),
        resolved_name,
        'ENGINEER',
        true,
        now(),
        now()
      );
    end if;
  end loop;
end;
$$;

-- 2) Private documents bucket. Files are opened using server-generated signed URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Authenticated users upload own documents" on storage.objects;
create policy "Authenticated users upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The application signs reads and performs deletes with the server-only service role.
-- No public SELECT policy is intentionally created.

-- 3) Ensure the singleton company settings row exists.
insert into public.company_settings (
  id, "legalName", gstin, address, phone, email, "signatoryName", "updatedAt"
)
values (
  'singleton',
  'Ratneswar Engineering',
  '24ABKFR8021K1ZZ',
  'Office No. 19, Sanghvi Square Complex, Salarinaka, Rapar–Kutch, Gujarat – 370165',
  '84010 50053 / 78019 56980',
  'ratneswarengineering@gmail.com',
  'Authorised Signatory',
  now()
)
on conflict (id) do nothing;
