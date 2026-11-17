-- Katalog von TCGdex, Preise von Pokemon Price Tracker.
--
-- Die Katalog-Tabellen (sets, cards) füllt der TCGdex-Abgleich. Die Set-Liste
-- von Pokemon Price Tracker braucht der Preisabgleich nur, um Sets mit ihrer
-- Größe nachzuschlagen; sie liegt deshalb getrennt und erzeugt keine Karten.
create table if not exists price_sets (
  id          text primary key,
  name        text not null,
  language    text not null,
  card_count  integer not null default 0,
  updated_at  timestamptz not null default now()
);

-- Der Scanner sucht Karten über die gelesene Nummer.
create index if not exists cards_number_sort_idx on cards (number_sort);
