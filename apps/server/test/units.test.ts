import { describe, expect, it } from 'vitest';

import { cardXp, rarityTier, scoreTrack } from '../src/domain/xp.js';
import { asIsoDate, asNumber, mapCard, mapSet, pick } from '../src/sources/pokemon-price-tracker.js';
import { csvRecords, exportPrintingRows, parseCsvLine } from '../src/sources/ppt-export.js';
import type { SourceSet } from '../src/sources/price-source.js';
import { numberSort } from '../src/sync/store.js';

const set: SourceSet = {
  id: 's1', name: 'Set Eins', series: null, language: 'english', releaseDate: null, cardCount: null, imageUrl: null,
};

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of source) out.push(item);
  return out;
}

async function* chunks(...parts: string[]) {
  for (const part of parts) yield part;
}

describe('Zuordnung der Quelldaten', () => {
  it('liest verschachtelte und flache Feldnamen', () => {
    expect(pick({ a: { b: 3 } }, ['x', 'a.b'])).toBe(3);
    expect(pick({ a: '' }, ['a', 'b'])).toBeUndefined();
    expect(asNumber('$1,234.50')).toBe(1234.5);
    expect(asNumber('')).toBeNull();
    expect(asIsoDate('2024-05-10T00:00:00.000Z')).toBe('2024-05-10');
    expect(asIsoDate('kein Datum')).toBeNull();
  });

  it('bildet ein Set ab und erzeugt eine ID aus dem Namen, wenn keine geliefert wird', () => {
    expect(mapSet({ name: 'Scarlet & Violet', releaseDate: '2023-03-31', cardCount: 258 }, 'english')).toMatchObject({
      id: 'scarlet-violet', releaseDate: '2023-03-31', cardCount: 258, language: 'english',
    });
    expect(mapSet({ id: 'abc' }, 'english')).toBeNull();
  });

  it('bildet eine Karte mit verschachtelten Preisen und Varianten ab', () => {
    const card = mapCard(
      {
        tcgPlayerId: 490294, name: 'Karte A', cardNumber: '4/102', rarity: 'Holo Rare',
        imageCdnUrl: 'https://example.com/a.png',
        prices: {
          market: 12.5, low: 9,
          variants: {
            Holofoil: { 'Near Mint': { price: 12.5 }, Damaged: { price: 3 } },
            'Reverse Holofoil': { marketPrice: '20.10' },
          },
        },
      },
      set,
    );
    expect(card).toMatchObject({
      id: '490294', setId: 's1', number: '4/102', marketPriceUsd: 12.5, lowPriceUsd: 9,
      imageUrl: 'https://example.com/a.png',
    });
    expect(card?.printings).toEqual([
      { printing: 'Holofoil', marketPriceUsd: 12.5, lowPriceUsd: null },
      { printing: 'Reverse Holofoil', marketPriceUsd: 20.1, lowPriceUsd: null },
    ]);
  });

  it('überspringt Karten ohne ID oder Namen', () => {
    expect(mapCard({ name: 'ohne ID' }, set)).toBeNull();
    expect(mapCard({ id: 'x' }, set)).toBeNull();
  });

  it('sortiert Kartennummern nach ihrer führenden Zahl', () => {
    expect(numberSort('4/102')).toBe(4);
    expect(numberSort('102')).toBe(102);
    expect(numberSort('SWSH001')).toBeNull();
    expect(numberSort(null)).toBeNull();
  });
});

describe('CSV-Export', () => {
  it('zerlegt Zeilen mit Anführungszeichen und Kommas', () => {
    expect(parseCsvLine('1,"Karte, die ""zitiert""",x')).toEqual(['1', 'Karte, die "zitiert"', 'x']);
    expect(parseCsvLine('a,,')).toEqual(['a', '', '']);
  });

  it('setzt Datensätze über Blockgrenzen und Zeilenumbrüche in Feldern zusammen', async () => {
    const records = await collect(csvRecords(chunks('a,b\r\n1,"zwei\nZei', 'len"\r\n3,', '4')));
    expect(records).toEqual([['a', 'b'], ['1', 'zwei\nZeilen'], ['3', '4']]);
  });

  it('liest die Spalten des Exports "printings"', async () => {
    const csv =
      'tcgPlayerId,name,setName,setId,cardNumber,rarity,language,printing,marketPrice,lowPrice,sellers,lastPriceUpdate\n' +
      '100,Karte A,Set Eins,s1,1/10,Common,English,Normal,0.25,0.10,12,2026-11-16T06:00:00Z\n' +
      ',ohne ID,Set Eins,s1,2/10,Common,English,Normal,1,1,1,\n';
    const rows = await collect(exportPrintingRows(chunks(csv)));
    expect(rows).toEqual([
      {
        cardId: '100', name: 'Karte A', setId: 's1', setName: 'Set Eins', number: '1/10', rarity: 'Common',
        language: 'english', printing: 'Normal', marketPriceUsd: 0.25, lowPriceUsd: 0.1,
        priceUpdatedAt: '2026-11-16T06:00:00.000Z',
      },
    ]);
  });

  it('lehnt einen Export ohne Pflichtspalten ab', async () => {
    await expect(collect(exportPrintingRows(chunks('foo,bar\n1,2\n')))).rejects.toThrow(/tcgPlayerId/);
  });
});

describe('Sammelscore', () => {
  it('ordnet Seltenheiten den sechs Stufen zu', () => {
    expect(rarityTier('Common')).toBe('common');
    expect(rarityTier('Uncommon')).toBe('uncommon');
    expect(rarityTier('Rare')).toBe('rare');
    expect(rarityTier('Holo Rare')).toBe('holo');
    expect(rarityTier('Ultra Rare')).toBe('ultra');
    expect(rarityTier('Special Illustration Rare')).toBe('secret');
    expect(rarityTier(null)).toBe('common');
  });

  it('gibt für weitere Varianten die Hälfte', () => {
    expect(cardXp('Common', 1)).toBe(5);
    expect(cardXp('Common', 2)).toBe(8);
    expect(cardXp('Holo Rare', 3)).toBe(80);
    expect(cardXp('Secret Rare', 2)).toBe(225);
    expect(cardXp('Rare', 0)).toBe(0);
  });

  it('beginnt Stufe n bei 50 × n²', () => {
    expect(scoreTrack(0)).toEqual({ xp: 0, level: 1, levelStartXp: 0, nextLevelXp: 200 });
    expect(scoreTrack(199).level).toBe(1);
    expect(scoreTrack(200)).toEqual({ xp: 200, level: 2, levelStartXp: 200, nextLevelXp: 450 });
    expect(scoreTrack(5000).level).toBe(10);
  });
});
