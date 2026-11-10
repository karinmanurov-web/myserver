-- Vocabulary Room: shared public library + private per-user progress
-- Run this in Supabase SQL Editor. Never put the service_role key in the website.

create extension if not exists pgcrypto;

create table if not exists public.vocabulary_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  language_code text not null default 'hy',
  owner_id uuid references auth.users(id) on delete set null,
  visibility text not null default 'pending'
    check (visibility in ('private', 'pending', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.vocabulary_modules(id) on delete cascade,
  position integer not null,
  prompt_ru text not null,
  answers text[] not null,
  created_at timestamptz not null default now(),
  unique (module_id, position),
  check (cardinality(answers) > 0)
);

create table if not exists public.vocabulary_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.vocabulary_words(id) on delete cascade,
  correct_count integer not null default 0,
  mistake_count integer not null default 0,
  mastered boolean not null default false,
  last_seen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

create table if not exists public.vocabulary_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.vocabulary_modules(id) on delete cascade,
  session_state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create index if not exists vocabulary_words_module_position
  on public.vocabulary_words(module_id, position);
create index if not exists vocabulary_modules_visibility
  on public.vocabulary_modules(visibility);

alter table public.vocabulary_modules enable row level security;
alter table public.vocabulary_words enable row level security;
alter table public.vocabulary_progress enable row level security;
alter table public.vocabulary_sessions enable row level security;

-- Public visitors can read published modules and their words.
create policy "Public can read published vocabulary modules"
on public.vocabulary_modules for select
using (visibility = 'public' or owner_id = auth.uid());

create policy "Public can read words in published modules or own drafts"
on public.vocabulary_words for select
using (
  exists (
    select 1 from public.vocabulary_modules m
    where m.id = module_id
      and (m.visibility = 'public' or m.owner_id = auth.uid())
  )
);

-- Signed-in users can create private/pending modules, never publish directly.
create policy "Users can create own vocabulary modules"
on public.vocabulary_modules for insert to authenticated
with check (owner_id = auth.uid() and visibility in ('private', 'pending'));

create policy "Users can update own unpublished vocabulary modules"
on public.vocabulary_modules for update to authenticated
using (owner_id = auth.uid() and visibility in ('private', 'pending'))
with check (owner_id = auth.uid() and visibility in ('private', 'pending'));

create policy "Users can delete own unpublished vocabulary modules"
on public.vocabulary_modules for delete to authenticated
using (owner_id = auth.uid() and visibility in ('private', 'pending'));

create policy "Users can add words to own unpublished modules"
on public.vocabulary_words for insert to authenticated
with check (
  exists (
    select 1 from public.vocabulary_modules m
    where m.id = module_id and m.owner_id = auth.uid()
      and m.visibility in ('private', 'pending')
  )
);

create policy "Users can update words in own unpublished modules"
on public.vocabulary_words for update to authenticated
using (
  exists (
    select 1 from public.vocabulary_modules m
    where m.id = module_id and m.owner_id = auth.uid()
      and m.visibility in ('private', 'pending')
  )
)
with check (
  exists (
    select 1 from public.vocabulary_modules m
    where m.id = module_id and m.owner_id = auth.uid()
      and m.visibility in ('private', 'pending')
  )
);

create policy "Users can delete words in own unpublished modules"
on public.vocabulary_words for delete to authenticated
using (
  exists (
    select 1 from public.vocabulary_modules m
    where m.id = module_id and m.owner_id = auth.uid()
      and m.visibility in ('private', 'pending')
  )
);

-- Personal learning data is strictly private to its owner.
create policy "Users manage only their own word progress"
on public.vocabulary_progress for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users manage only their own saved sessions"
on public.vocabulary_sessions for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Note: promotion from pending to public is an owner/admin action performed
-- through a trusted server or the Supabase dashboard, never from browser code.
