-- profiles (mirrors auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now() not null
);
alter table profiles enable row level security;
create policy "users can read own profile" on profiles for select using (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- wiki_pages
create table wiki_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  aliases text[] default '{}',
  summary text default '',
  body text default '',
  key_points text[] default '{}',
  examples text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table wiki_pages enable row level security;
create policy "users can crud own pages" on wiki_pages for all using (auth.uid() = user_id);

-- page_links
create table page_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_page_id uuid not null references wiki_pages(id) on delete cascade,
  target_page_id uuid not null references wiki_pages(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('related_to','prerequisite_for','extends','contradicts','example_of','similar_to')),
  relationship_reason text default '',
  created_at timestamptz default now() not null,
  unique(source_page_id, target_page_id)
);
alter table page_links enable row level security;
create policy "users can crud own links" on page_links for all using (auth.uid() = user_id);

-- sources
create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_id uuid references wiki_pages(id) on delete set null,
  source_type text not null,
  source_name text not null,
  uploaded_at timestamptz default now() not null,
  excerpt text default '',
  file_reference text default ''
);
alter table sources enable row level security;
create policy "users can crud own sources" on sources for all using (auth.uid() = user_id);

-- auto-update updated_at on wiki_pages
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger wiki_pages_updated_at
  before update on wiki_pages
  for each row execute function update_updated_at();

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
