create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (category in ('Characters','Props','Environment','Product Design','Architecture','Other')),
  short_description text not null default '',
  description text not null default '',
  cover_path text,
  images jsonb not null default '[]'::jsonb,
  tools text[] not null default '{}',
  year integer check (year is null or year between 1900 and 2200),
  model_path text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artist_profile (
  id integer primary key check (id = 1),
  name text not null default 'MUXTAR',
  subtitle text not null default '3D ARTIST / DIGITAL ART',
  tagline text not null default 'Crafting digital objects, characters and worlds.',
  bio text not null default '',
  specialization text not null default '',
  skills text[] not null default '{}',
  software text[] not null default '{}',
  interests text[] not null default '{}',
  email text not null default '',
  artstation text not null default '',
  behance text not null default '',
  instagram text not null default '',
  other_links jsonb not null default '[]'::jsonb,
  hero_image_path text,
  show_about boolean not null default true,
  show_contact boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.artist_profile enable row level security;

create policy "Public can view published projects" on public.projects
  for select to anon, authenticated using (published or (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'));
create policy "Admins can insert projects" on public.projects
  for insert to authenticated with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
create policy "Admins can update projects" on public.projects
  for update to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
create policy "Admins can delete projects" on public.projects
  for delete to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

create policy "Public can read artist profile" on public.artist_profile
  for select to anon, authenticated using (true);
create policy "Admins can insert artist profile" on public.artist_profile
  for insert to authenticated with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
create policy "Admins can update artist profile" on public.artist_profile
  for update to authenticated using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant select on public.artist_profile to anon, authenticated;
grant insert, update on public.artist_profile to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-media', 'portfolio-media', true, 12582912, array['image/jpeg','image/png','image/webp','image/avif','image/gif']),
  ('portfolio-models', 'portfolio-models', true, 52428800, array['model/gltf-binary','model/gltf+json','application/octet-stream'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view portfolio media" on storage.objects
  for select to anon, authenticated using (bucket_id in ('portfolio-media','portfolio-models'));
create policy "Admins can upload portfolio files" on storage.objects
  for insert to authenticated with check (bucket_id in ('portfolio-media','portfolio-models') and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
create policy "Admins can update portfolio files" on storage.objects
  for update to authenticated using (bucket_id in ('portfolio-media','portfolio-models') and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') with check (bucket_id in ('portfolio-media','portfolio-models') and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
create policy "Admins can delete portfolio files" on storage.objects
  for delete to authenticated using (bucket_id in ('portfolio-media','portfolio-models') and auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
