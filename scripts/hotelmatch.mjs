// Kopia lib/hotelmatch.ts dla skryptów node (bez kompilacji TS). Zmieniaj obie wersje razem.
const STOP = new Set(['hotel', 'hotels', 'the', 'and', 'by', 'resort', 'resorts', 'spa', 'beach', 'club', 'aqua', 'park', 'aquapark', 'suites', 'all', 'inclusive']);
export function normName(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
    .replace(/\(.*?\)/g, ' ').replace(/\b(ex|dawniej|formerly)\b.*$/, ' ')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function coreName(s) { return normName(s).split(' ').filter((w) => w && !STOP.has(w)).join(' '); }
export function sameHotel(a, b) {
  const na = normName(a), nb = normName(b);
  if (na === nb) return true;
  const ca = coreName(a), cb = coreName(b);
  if (!ca || !cb) return false;
  if (ca === cb && ca.length >= 5) return true;
  const [s, l] = ca.length <= cb.length ? [ca, cb] : [cb, ca];
  return s.length >= 8 && s.split(' ').length >= 2 && (` ${l} `).includes(` ${s} `);
}

export function matchHotel(name, places, candName, candPlaces) {
  if (normName(name) === normName(candName)) return true;
  if (!sameHotel(name, candName)) return false;
  const a = new Set(places.flatMap((p) => normName(p).split(' ')).filter((w) => w.length > 3));
  return candPlaces.some((p) => normName(p).split(' ').some((w) => a.has(w)));
}
