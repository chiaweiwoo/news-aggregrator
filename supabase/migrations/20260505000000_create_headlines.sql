create table public.headlines (
  id text not null,
  title_zh text not null,
  title_en text not null,
  thumbnail_url text null,
  published_at timestamp with time zone null,
  channel text null,
  created_at timestamp with time zone null default now(),
  constraint headlines_pkey primary key (id)
) TABLESPACE pg_default;
