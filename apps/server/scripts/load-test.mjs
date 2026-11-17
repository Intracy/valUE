// Lasttest gegen einen laufenden Server mit den Daten aus `npm run seed:load`.
// Aufruf: npm run loadtest -w @value/server   (Adresse über LOAD_URL, Standard http://localhost:8787)
// Der Server braucht dafür RATE_LIMIT_PER_MINUTE auf einem sehr hohen Wert.
import autocannon from 'autocannon';
const base = process.env.LOAD_URL ?? 'http://localhost:8787';
const token = () => `load-token-${String(1 + Math.floor(Math.random() * 10000)).padStart(13, '0')}`;
const etag = (await fetch(`${base}/v1/sets/load-17`)).headers.get('etag');
const run = (title, opts) => new Promise((resolve) => {
  autocannon({ url: base, connections: 50, duration: 12, ...opts }, (err, r) => {
    console.log(`${title.padEnd(44)} ${String(Math.round(r.requests.average)).padStart(6)} req/s  p50 ${String(r.latency.p50).padStart(4)} ms  p99 ${String(r.latency.p99).padStart(4)} ms  errors ${r.errors} non2xx ${r.non2xx}`);
    resolve();
  });
});
const authed = (path, method = 'GET', body) => ({ requests: [{ method, path, setupRequest: (req) => { req.headers = { ...req.headers, authorization: `Bearer ${token()}`, ...(body ? { 'content-type': 'application/json' } : {}) }; if (body) req.body = body(); return req; } }] });
await run('Katalog: Set mit 250 Karten', { requests: [{ path: '/v1/sets/load-17' }] });
await run('Katalog: Set, Client hat Stand (304)', { requests: [{ path: '/v1/sets/load-17', headers: { 'if-none-match': etag } }] });
await run('Katalog: Kartendetail mit 30 Tagen Verlauf', { requests: [{ path: '/v1/cards/load-17-42?days=30' }] });
await run('Katalog: Suche', { requests: [{ path: '/v1/search?q=lastkarte%2017-4' }] });
await run('Nutzer: Fortschritt aller Sets', authed('/v1/me/collection/sets'));
await run('Nutzer: Karten in einem Set', authed('/v1/me/collection/sets/load-17'));
await run('Nutzer: Profil mit Score und Achievements', authed('/v1/me/profile'));
await run('Nutzer: Portfolio mit 30 Tagen Verlauf', authed('/v1/me/portfolio?range=1M'));
await run('Nutzer: Beobachtete Karten', authed('/v1/me/favorites'));
await run('Markt: Gewinner und Verlierer, 7 Tage', { requests: [{ path: '/v1/market/movers?days=7' }] });
await run('Nutzer: Karte eintragen (Schreiben)', { ...authed('/v1/me/collection/items/load-17-42', 'PUT', () => JSON.stringify({ quantity: 1 + Math.floor(Math.random() * 3) })) });
