-- Scanner: Bild-Fingerabdruck je Katalogkarte und ein Protokoll der Scans.

create table card_fingerprints (
  card_id     text primary key references cards (id) on delete cascade,
  -- Adresse des Bildes, aus dem der Abdruck stammt. Ändert sie sich, wird neu gerechnet.
  image_url   text not null,
  vec         bytea not null,
  created_at  timestamptz not null default now()
);

-- Jeder Scan mit seinen Vorschlägen und der Karte, die der Nutzer bestätigt hat.
-- Daraus lässt sich messen, wie oft die Erkennung richtig liegt. Das Foto selbst
-- wird nicht gespeichert.
create table scans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  outcome         text not null check (outcome in ('match', 'unsure', 'none')),
  candidates      jsonb not null,
  ocr_name        text,
  ocr_number      text,
  duration_ms     integer not null,
  chosen_card_id  text references cards (id) on delete set null,
  -- Platz der bestätigten Karte in der Vorschlagsliste, 0 = erster Vorschlag, null = nicht dabei.
  chosen_rank     integer,
  confirmed_at    timestamptz
);

create index scans_user_idx on scans (user_id, created_at desc);
