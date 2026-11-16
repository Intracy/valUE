/**
 * Erfundene Kartenmotive für die Demo-Daten: abstrakte Landschaften als SVG.
 * Sie zeigen keine echte Karte und keine geschützte Figur. Die Bilder werden
 * als data-URL gespeichert, damit die Demo ohne Bild-Server auskommt.
 */

export interface DemoTheme {
  frame: string;
  from: string;
  to: string;
  window: string;
  sky: string;
  accent: string;
  accent2: string;
  ink: string;
}

export const demoThemes: Record<string, DemoTheme> = {
  'demo-aurora': {
    frame: '#1E1B4B',
    from: '#4338CA',
    to: '#0EA5E9',
    window: '#0B1026',
    sky: '#312E81',
    accent: '#A78BFA',
    accent2: '#22D3EE',
    ink: '#FFFFFF',
  },
  'demo-basalt': {
    frame: '#1C1917',
    from: '#44403C',
    to: '#EA580C',
    window: '#1C1917',
    sky: '#7C2D12',
    accent: '#FB923C',
    accent2: '#FCD34D',
    ink: '#FFFFFF',
  },
  'demo-klassik': {
    frame: '#E9D8A6',
    from: '#B45309',
    to: '#F59E0B',
    window: '#FEF3C7',
    sky: '#FDE68A',
    accent: '#92400E',
    accent2: '#D97706',
    ink: '#FFFBEB',
  },
};

/** Kleiner, wiederholbarer Zufall: gleiche Karte, gleiches Motiv. */
function random(seed: number) {
  let state = seed * 2654435761;
  return () => {
    state = (state ^ (state >>> 13)) * 1274126177;
    state ^= state >>> 16;
    return ((state >>> 0) % 10_000) / 10_000;
  };
}

const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);

export function demoCardSvg(options: {
  setId: string;
  number: number;
  total: number;
  name: string;
  rarity: string;
}): string {
  const theme = demoThemes[options.setId] ?? demoThemes['demo-aurora']!;
  const rand = random(options.number * 97 + options.setId.length * 13);
  const holo = /holo|ultra|secret/i.test(options.rarity);
  const symbol = /secret|ultra/i.test(options.rarity) ? '★★' : /rare/i.test(options.rarity) ? '★' : /uncommon/i.test(options.rarity) ? '◆' : '●';

  // Landschaft im Bildfenster: Himmelskörper, zwei Bergketten, ein paar Sterne.
  const sunX = 60 + rand() * 130;
  const sunY = 80 + rand() * 40;
  const sunR = 18 + rand() * 22;
  const ridge = (base: number, height: number) => {
    const points = [`22,196`];
    for (let x = 22; x <= 230; x += 26) points.push(`${x},${Math.round(base - rand() * height)}`);
    points.push('230,196');
    return points.join(' ');
  };
  const stars = Array.from({ length: 7 }, () =>
    `<circle cx="${Math.round(30 + rand() * 192)}" cy="${Math.round(54 + rand() * 50)}" r="${(0.8 + rand() * 1.4).toFixed(1)}" fill="${theme.accent2}" opacity="0.8"/>`,
  ).join('');

  const textLines = [0, 1, 2]
    .map((line) => `<rect x="26" y="${222 + line * 18}" width="${Math.round(120 + rand() * 80)}" height="7" rx="3.5" fill="${theme.ink}" opacity="0.28"/>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 352">
<defs>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.from}"/><stop offset="1" stop-color="${theme.to}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.sky}"/><stop offset="1" stop-color="${theme.window}"/></linearGradient>
<linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0ABFC" stop-opacity="0.45"/><stop offset="0.35" stop-color="#67E8F9" stop-opacity="0.15"/><stop offset="0.65" stop-color="#FDE68A" stop-opacity="0.4"/><stop offset="1" stop-color="#A7F3D0" stop-opacity="0.15"/></linearGradient>
<clipPath id="w"><rect x="22" y="46" width="208" height="150" rx="6"/></clipPath>
</defs>
<rect width="252" height="352" rx="14" fill="${theme.frame}"/>
<rect x="10" y="10" width="232" height="332" rx="9" fill="url(#b)"/>
<text x="24" y="34" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="16" font-weight="700" fill="${theme.ink}">${escapeXml(options.name)}</text>
<g clip-path="url(#w)">
<rect x="22" y="46" width="208" height="150" fill="url(#s)"/>
${stars}
<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${sunR.toFixed(0)}" fill="${theme.accent2}" opacity="0.9"/>
<polygon points="${ridge(170, 60)}" fill="${theme.accent}" opacity="0.55"/>
<polygon points="${ridge(190, 40)}" fill="${theme.frame}" opacity="0.85"/>
${holo ? '<rect x="22" y="46" width="208" height="150" fill="url(#h)"/>' : ''}
</g>
<rect x="22" y="46" width="208" height="150" rx="6" fill="none" stroke="${theme.ink}" stroke-opacity="0.35"/>
${textLines}
<text x="24" y="330" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="12" font-weight="600" fill="${theme.ink}" opacity="0.85">${options.number}/${options.total}</text>
<text x="228" y="330" text-anchor="end" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="13" fill="${theme.ink}" opacity="0.85">${symbol}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
}

/** Erfundene Kartennamen ohne Bezug zu echten Karten oder Figuren. */
export const demoNames = [
  'Nebelhain', 'Funkenquelle', 'Eisgipfel', 'Mondsichel', 'Sturmkante', 'Moosstein',
  'Glasdüne', 'Kupferbach', 'Abendrot', 'Aschewald', 'Lichtung', 'Sternstaub',
  'Frostfeder', 'Sonnenfeld', 'Tiefsee', 'Wolkenbruch', 'Kristallgrat', 'Brandung',
  'Donnerhall', 'Waldquelle', 'Silberfluss', 'Morgentau', 'Nachtfalter', 'Feuerstein',
];
