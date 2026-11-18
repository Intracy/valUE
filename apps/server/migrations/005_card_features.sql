-- Merkmale für den Scanner: Lebenspunkte, Illustrator und die Namen von Attacken
-- und Fähigkeiten. Der Scanner vergleicht sie mit dem gelesenen Kartentext, wenn
-- Name, Nummer und Bild allein nicht eindeutig sind (etwa bei Neuauflagen mit
-- gleichem Artwork wie Bisaflor aus Base Set und Base Set 2).
alter table cards add column if not exists hp integer;
alter table cards add column if not exists illustrator text;
alter table cards add column if not exists card_text text;

-- TCG Pocket ist ein reines Digitalspiel; diese Karten gibt es nicht gedruckt.
-- Der Katalogabgleich lädt sie nicht mehr.
delete from sets where series ilike '%pocket%';

-- Vorhandene TCGdex-Sets beim nächsten Katalogabgleich neu laden, damit die
-- Merkmale auch für bereits geladene Karten gefüllt werden.
update sets set updated_at = '2000-01-01' where id ~ '^(en|de|ja)-';
