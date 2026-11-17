-- Erweiterungen aus dem Design-Moodboard: Element je Karte, Preise und
-- Population nach Grading, Beobachtungsliste und Anzeigename.

-- Element (Energietyp) der Karte, normiert: fire, water, grass, lightning,
-- psychic, fighting, darkness, metal, dragon, fairy, colorless. Null, wenn die
-- Quelle keins nennt (etwa bei Trainer- und Energiekarten).
alter table cards add column if not exists element text;
create index if not exists cards_set_element_idx on cards (set_id, element);

-- Preis und Population je Grading-Firma und Note. Eine Zeile je Karte, Firma
-- und Note ("10", "9.5", "9"). Preis aus Verkäufen (eBay), Population aus dem
-- Populationsbericht; beides darf fehlen.
create table if not exists card_grades (
  card_id     text not null references cards (id) on delete cascade,
  grader      text not null check (grader in ('PSA', 'CGC', 'BGS', 'SGC')),
  grade       text not null,
  price_usd   numeric(12, 2),
  population  integer,
  updated_at  timestamptz not null default now(),
  primary key (card_id, grader, grade)
);

-- Beobachtete Karten ("Herz" in der Kartenansicht).
create table if not exists favorites (
  user_id     uuid not null references users (id) on delete cascade,
  card_id     text not null references cards (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table users add column if not exists display_name text;

-- Marktbewegungen vergleichen alle Karten an zwei Tagen. Der Index auf den Tag
-- erspart dabei das Lesen ganzer Monats-Teile.
create index if not exists price_history_day_idx on price_history (day);
