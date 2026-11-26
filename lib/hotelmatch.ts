// Dopasowanie nazw hoteli między źródłami (wakacje.pl, Exim): ta sama logika w generatorze i na stronie.
const STOP = new Set(['hotel', 'hotels', 'the', 'and', 'by', 'resort', 'resorts', 'spa', 'beach', 'club', 'aqua', 'park', 'aquapark', 'suites', 'all', 'inclusive']);

/** Pełna znormalizowana nazwa: małe litery, bez polskich znaków, bez nawiasów i "ex ..." */
export function normName(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
    .replace(/\(.*?\)/g, ' ').replace(/\b(ex|dawniej|formerly)\b.*$/, ' ')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Rdzeń nazwy bez słów ogólnych (resort, spa, beach...) */
export function coreName(s: string): string {
  return normName(s).split(' ').filter((w) => w && !STOP.has(w)).join(' ');
}

/** Czy dwie nazwy to ten sam hotel (w obrębie jednego kraju) */
export function sameHotel(a: string, b: string): boolean {
  const na = normName(a), nb = normName(b);
  if (na === nb) return true;
  const ca = coreName(a), cb = coreName(b);
  if (!ca || !cb) return false;
  if (ca === cb && ca.length >= 5) return true;
  // jedna nazwa zawiera drugą, np. "Jaz Makadi Star" i "Jaz Makadi Star & Spa"
  const [s, l] = ca.length <= cb.length ? [ca, cb] : [cb, ca];
  return s.length >= 8 && s.split(' ').length >= 2 && (` ${l} `).includes(` ${s} `);
}

/** Dopasowanie z kontrolą miejsca: przy niepełnej zgodności nazw musi się zgadzać miejscowość lub region */
export function matchHotel(name: string, places: string[], candName: string, candPlaces: string[]): boolean {
  if (normName(name) === normName(candName)) return true;
  if (!sameHotel(name, candName)) return false;
  const a = new Set(places.flatMap((p) => normName(p).split(' ')).filter((w) => w.length > 3));
  return candPlaces.some((p) => normName(p).split(' ').some((w) => a.has(w)));
}
