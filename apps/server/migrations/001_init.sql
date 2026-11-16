-- Grundschema. Katalog und Preise sind für alle Nutzer gleich und werden vom
-- Abgleich geschrieben. Nutzerdaten liegen getrennt und sind nach Nutzer aufgeteilt.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table sets (
  id            text primary key,
  name          text not null,
  series        text,
  language      text not null default 'english',
  release_date  date,
  card_count    integer not null default 0,
  image_url     text,
  updated_at    timestamptz not null default now()
);

create table cards (
  id                text primary key,
  set_id            text not null references sets (id) on delete cascade,
  name              text not null,
  number            text,
  -- Führende Zahl der Kartennummer, damit 2 vor 10 sortiert.
  number_sort       integer,
  rarity            text,
  image_url         text,
  market_price_usd  numeric(12, 2),
  low_price_usd     numeric(12, 2),
  market_price_eur  numeric(12, 2),
  price_updated_at  timestamptz,
  updated_at        timestamptz not null default now()
);

create index cards_set_order_idx on cards (set_id, number_sort nulls last, number, id);
create index cards_name_trgm_idx on cards using gin (lower(name) gin_trgm_ops);

create table card_printings (
  card_id           text not null references cards (id) on delete cascade,
  printing          text not null,
  market_price_usd  numeric(12, 2),
  low_price_usd     numeric(12, 2),
  primary key (card_id, printing)
);

-- Ein Preisstand pro Karte und Tag. Nach Monat aufgeteilt: Abfragen lesen nur
-- die Monate, die sie brauchen, und alte Monate lassen sich als Ganzes entfernen.
create table price_history (
  card_id           text not null,
  day               date not null,
  market_price_usd  numeric(12, 2),
  market_price_eur  numeric(12, 2),
  primary key (card_id, day)
) partition by range (day);

create or replace function ensure_price_history_partition(for_day date) returns void
language plpgsql as $$
declare
  month_start date := date_trunc('month', for_day)::date;
  month_end   date := (date_trunc('month', for_day) + interval '1 month')::date;
  part_name   text := 'price_history_' || to_char(month_start, 'YYYY_MM');
begin
  execute format(
    'create table if not exists %I partition of price_history for values from (%L) to (%L)',
    part_name, month_start, month_end
  );
end;
$$;

create table users (
  id          uuid primary key default gen_random_uuid(),
  -- SHA-256 des Geräte-Tokens. Das Token selbst wird nie gespeichert.
  token_hash  bytea not null unique,
  created_at  timestamptz not null default now()
);

-- Die größte Tabelle. Jede Abfrage beginnt mit user_id, deshalb ist sie nach
-- user_id in 16 Teile gestreut: Indizes bleiben klein, Pflege läuft je Teil.
create table collection_items (
  user_id   uuid not null references users (id) on delete cascade,
  card_id   text not null references cards (id) on delete cascade,
  printing  text not null default '',
  quantity  integer not null check (quantity > 0),
  source    text not null default 'manual' check (source in ('scan', 'manual')),
  added_at  timestamptz not null default now(),
  primary key (user_id, card_id, printing)
) partition by hash (user_id);

do $$
begin
  for i in 0..15 loop
    execute format(
      'create table collection_items_p%s partition of collection_items for values with (modulus 16, remainder %s)',
      i, i
    );
  end loop;
end;
$$;

create table sync_runs (
  id            bigserial primary key,
  mode          text not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running' check (status in ('running', 'ok', 'partial', 'failed')),
  sets_synced   integer not null default 0,
  cards_synced  integer not null default 0,
  credits_used  integer not null default 0,
  note          text
);

create table meta (
  key    text primary key,
  value  text not null
);

insert into meta (key, value) values ('catalog_version', '0');
