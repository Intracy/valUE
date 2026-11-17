import type { Db } from '../db/pool.js';
import type { PriceSource } from '../sources/price-source.js';
import { bumpCatalogVersion, upsertGrades } from './store.js';

/**
 * Populationsbericht (wie viele Exemplare einer Karte mit welcher Note
 * gegradet sind). Kostet 2 Credits je Karte; deshalb zuerst die Karten, die
 * Nutzer besitzen oder beobachten, und davon die wertvollsten. Ein Bericht gilt
 * eine Woche.
 */
export async function runPopulationSync(
  db: Db,
  source: PriceSource,
  options: { maxCards: number; language: string; log?: (message: string) => void },
): Promise<{ cards: number; creditsUsed: number; notes: string[] }> {
  const log = options.log ?? (() => undefined);
  const result = { cards: 0, creditsUsed: 0, notes: [] as string[] };
  if (!source.fetchPopulation || options.maxCards <= 0) return result;

  const due = await db.query<{ id: string }>(
    `select c.id
     from cards c
     join sets s on s.id = c.set_id
     where s.language = $2
       and (exists (select 1 from collection_items ci where ci.card_id = c.id)
            or exists (select 1 from favorites f where f.card_id = c.id))
       and not exists (
         select 1 from card_grades g
         where g.card_id = c.id and g.population is not null and g.updated_at > now() - interval '7 days'
       )
     order by coalesce(c.market_price_usd, 0) desc
     limit $1`,
    [options.maxCards, options.language],
  );

  const ids = due.rows.map((row) => row.id);
  for (let start = 0; start < ids.length; start += 50) {
    const batch = ids.slice(start, start + 50);
    try {
      const { grades, credits } = await source.fetchPopulation(batch, options.language);
      result.creditsUsed += credits.consumed;
      await upsertGrades(
        db,
        [...grades].flatMap(([cardId, list]) => list.map((grade) => ({ cardId, ...grade }))),
      );
      result.cards += grades.size;
      log(`Population: ${result.cards} von ${ids.length} Karten.`);
    } catch (error) {
      // 403 heißt meist: Tarif ohne Populationsbericht. Dann nicht weiter versuchen.
      result.notes.push((error as Error).message);
      break;
    }
  }
  if (result.cards > 0) await bumpCatalogVersion(db, `population-${Date.now()}`);
  return result;
}
