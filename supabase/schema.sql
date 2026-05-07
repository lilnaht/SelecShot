create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text default 'free',
  created_at timestamptz default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'uploading', 'processing', 'done', 'failed')),
  total_files int default 0,
  dark_count int default 0,
  bright_count int default 0,
  blurred_count int default 0,
  good_count int default 0,
  zip_path text,
  error_message text,
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists public.analysis_files (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  original_filename text,
  storage_path text,
  preview_path text,
  category text check (category is null or category in ('dark', 'bright', 'blurred', 'good')),
  brightness_score numeric,
  blur_score numeric,
  created_at timestamptz default now()
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists analyses_user_created_idx on public.analyses(user_id, created_at desc);
create index if not exists analyses_user_status_idx on public.analyses(user_id, status);
create index if not exists analysis_files_analysis_idx on public.analysis_files(analysis_id);
create index if not exists analysis_files_user_category_idx on public.analysis_files(user_id, category);

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_files enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Analyses are readable by owner" on public.analyses;
create policy "Analyses are readable by owner"
on public.analyses for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Analyses are insertable by owner" on public.analyses;
create policy "Analyses are insertable by owner"
on public.analyses for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Analyses are updatable by owner" on public.analyses;
create policy "Analyses are updatable by owner"
on public.analyses for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Files are readable by owner" on public.analysis_files;
create policy "Files are readable by owner"
on public.analysis_files for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Files are insertable by owner" on public.analysis_files;
create policy "Files are insertable by owner"
on public.analysis_files for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.analyses
    where analyses.id = analysis_files.analysis_id
      and analyses.user_id = (select auth.uid())
  )
  and storage_path like (
    'uploads/' || (select auth.uid())::text || '/' || analysis_id::text || '/originals/%'
  )
);

drop policy if exists "Files are updatable by owner" on public.analysis_files;
create policy "Files are updatable by owner"
on public.analysis_files for update
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.analyses
    where analyses.id = analysis_files.analysis_id
      and analyses.user_id = (select auth.uid())
  )
  and (
    storage_path is null
    or storage_path like (
      'uploads/' || (select auth.uid())::text || '/' || analysis_id::text || '/originals/%'
    )
  )
);

insert into storage.buckets (id, name, public)
values ('framesort', 'framesort', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their originals" on storage.objects;
create policy "Users can upload their originals"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'framesort'
  and (storage.foldername(name))[1] = 'uploads'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

drop policy if exists "Users can read their own stored files" on storage.objects;
create policy "Users can read their own stored files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'framesort'
  and (
    (
      (storage.foldername(name))[1] = 'uploads'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
    or (
      (storage.foldername(name))[1] = 'analyses'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
);

drop policy if exists "Users can update their own analysis artifacts" on storage.objects;
create policy "Users can update their own analysis artifacts"
on storage.objects for update
to authenticated
using (
  bucket_id = 'framesort'
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id = 'framesort'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
