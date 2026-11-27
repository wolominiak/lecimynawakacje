// Automatyczne posty na fanpage lecimynawakacje (Facebook Graph API, bez AI: szablony + nasze dane).
// Uruchamiane z GitHub Actions kilka razy dziennie; publikuje tylko w oknie czasowym danego slotu (czas polski).
// Bez FB_PAGE_TOKEN działa na sucho (wypisuje post). Wymusić slot: --slot rano|poludnie|wieczor, podgląd: --dry
import fs from 'fs';
import { getCountries, getCountry, warmIn, MONTHS, wakacjeCountryId } from '@/lib/data';
import { attractionsOf } from '@/lib/attractions';
import { allHotels, hotelUrl, type Hotel } from '@/lib/hotels';
import { allRoutes, routeUrl } from '@/lib/flights';

const SITE = 'https://lecimynawakacje.pl';
const TOKEN = process.env.FB_PAGE_TOKEN || '';
const PAGE = process.env.FB_PAGE_ID || '';
const API_V = process.env.FB_API_VERSION || 'v27.0';
const args = process.argv.slice(2);
const DRY = args.includes('--dry') || !TOKEN || !PAGE;
const FORCE_SLOT = args.includes('--slot') ? args[args.indexOf('--slot') + 1] : '';
// ręcznie wybrany rodzaj posta (z GitHub Actions), np. --type oferta-dnia; nie blokuje postów automatycznych
const TYPE = args.includes('--type') ? args[args.indexOf('--type') + 1] : '';
const STATE = 'data/fb-posted.json';

type Post = { key: string; message: string; link: string };
type State = { posts: { date: string; slot: string; key: string; id?: string }[] };
const state: State = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { posts: [] };

// --- czas polski i sloty ---
const now = new Date();
const pl = new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
  .formatToParts(now).reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
const today = `${pl.year}-${pl.month}-${pl.day}`;
const minutes = Number(pl.hour) * 60 + Number(pl.minute);
const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = niedziela
const month = Number(pl.month) - 1;

// okno: od godziny slotu do +2 h (GitHub potrafi opóźnić start o kilkadziesiąt minut)
const SLOTS = [
  { name: 'rano', from: 8 * 60 + 20, to: 10 * 60 + 30 },
  { name: 'poludnie', from: 12 * 60 + 20, to: 14 * 60 + 30 },
  { name: 'wieczor', from: 19 * 60 + 20, to: 21 * 60 + 30 },
];
const slot = TYPE && TYPE !== 'auto' ? 'reczny' : FORCE_SLOT || SLOTS.find((s) => minutes >= s.from && minutes <= s.to)?.name || '';
if (!slot) { console.log(`Poza oknem publikacji (${pl.hour}:${pl.minute} czasu polskiego)`); process.exit(0); }
if (!FORCE_SLOT && slot !== 'reczny' && state.posts.some((p) => p.date === today && p.slot === slot)) { console.log(`Slot ${slot} dziś już opublikowany`); process.exit(0); }

// --- pomocnicze ---
const recent = new Set(state.posts.filter((p) => Date.parse(p.date) > Date.now() - 45 * 86400000).map((p) => p.key));
const pickOne = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const zl = (n: number) => `${n.toLocaleString('pl-PL')} zł`;
const dm = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`;
const tag = (s: string) => '#' + s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^A-Za-z0-9]/g, '');
const cut = (s: string, n = 260) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '...');
const nights = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const popularCountries = () => getCountries().filter((c) => c.content).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0));

type TL = { id: number; hotelId?: number; name: string; price: string; departureDate: string; returnDate: string; category: number; departure?: { label: string };
  service?: { label: string; value: number }; transport?: { value: number }; placeName?: string[]; ratingValue?: number; tourOperatorName?: string };
async function offers(terms: Record<string, unknown>): Promise<TL[]> {
  try {
    const r = await fetch('https://widget.wakacje.pl/v2/api/widgets/offers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms: { regions: [], cities: [], countries: [], limit: 100, ...terms } }),
    });
    const j = await r.json();
    return (Array.isArray(j.data) ? j.data as TL[] : []).filter((o) => (!o.transport || o.transport.value === 1) && o.placeName?.[0] !== 'Polska' && o.departureDate >= today && !/objazd/i.test(o.placeName?.[1] || ''));
  } catch { return []; }
}
const price = (o: TL) => Number(String(o.price).replace(/\s/g, '')) || 0;
const hotelById = new Map(allHotels().filter((h) => typeof h.id === 'number').map((h) => [h.id as number, h]));
const offerLink = (o: TL, fallback: string) => (o.hotelId && hotelById.get(o.hotelId) ? SITE + hotelUrl(hotelById.get(o.hotelId)!.slug) : SITE + fallback);
/** najtańsze oferty z różnych krajów */
function distinctCheap(l: TL[], n: number, minRating = 0): TL[] {
  const seen = new Set<string>();
  return l.filter((o) => (o.ratingValue || 0) >= minRating && price(o) > 0).sort((a, b) => price(a) - price(b))
    .filter((o) => { const c = o.placeName?.[0] || ''; if (seen.has(c)) return false; seen.add(c); return true; }).slice(0, n);
}
const offerLine = (o: TL) => `${o.placeName?.[0]}${o.placeName?.[1] ? `, ${o.placeName[1]}` : ''}: ${o.name}${o.category ? ` ${o.category}*` : ''}, ${dm(o.departureDate)}, ${nights(o.departureDate, o.returnDate)} nocy, ${o.service?.label || ''}, od ${zl(price(o))}/os.`;

// --- POSTY: okazje (południe) ---
async function lastMinute(weekend = false): Promise<Post | null> {
  const l = await offers({ searchType: 'lastminute' });
  const lim = weekend ? l.filter((o) => Date.parse(o.departureDate) - Date.parse(today) <= 8 * 86400000) : l;
  const top = distinctCheap(lim, 4, 7);
  if (top.length < 2) return null;
  const head = weekend
    ? pickOne(['Spakuj się w weekend, wylot w przyszłym tygodniu! ✈️', 'Nagła ochota na słońce? Te wyloty są tuż tuż ☀️'])
    : pickOne(['🔥 Last minute tygodnia: najtańsze wyloty z Polski', '⏰ Last minute: ciepło za mniej, niż myślisz', '🌴 Wyloty w najbliższych dniach w najlepszych cenach']);
  return {
    key: `lm-${weekend ? 'w' : 'n'}-${top.map((o) => `${o.id}:${price(o)}`).join(',')}`,
    message: `${head}\n\n${top.map((o) => '👉 ' + offerLine(o)).join('\n')}\n\nCeny na dziś, za osobę, z przelotem. Last minute znika szybko 👇\n\n#lastminute #wakacje #tanieWakacje #lecimynawakacje`,
    link: SITE + '/last-minute/',
  };
}

async function allInclusive(): Promise<Post | null> {
  const top = distinctCheap(await offers({ service: [1] }), 4, 7.5);
  if (top.length < 2) return null;
  const o = top[0];
  return {
    key: `ai-${top.map((x) => `${x.id}:${price(x)}`).join(',')}`,
    message: `${pickOne(['🍹 All inclusive w dobrej cenie', '🏖️ Jedzenie i drinki w cenie, a portfel spokojny', '☀️ Wczasy all inclusive z oceną powyżej 7,5'])}\n\n${top.map((x) => '✅ ' + offerLine(x)).join('\n')}\n\nNajtańsza dziś: ${o.name} za ${zl(price(o))} od osoby. Porównujemy oferty wielu biur podróży w jednym miejscu.\n\n#allinclusive #wakacje #wczasy #lecimynawakacje`,
    link: offerLink(o, '/all-inclusive/'),
  };
}

async function exotic(): Promise<Post | null> {
  const ids = ['tajlandia', 'dominikana', 'tanzania', 'meksyk', 'malediwy', 'kuba', 'sri-lanka', 'wietnam', 'kenia', 'mauritius'].map(wakacjeCountryId).filter((x): x is number => !!x);
  const top = distinctCheap(await offers({ countries: ids }), 4);
  if (top.length < 2) return null;
  return {
    key: `exo-${top.map((x) => `${x.id}:${price(x)}`).join(',')}`,
    message: `${pickOne(['🌺 Egzotyka bliżej, niż myślisz', '🐠 Rajskie plaże w cenie zwykłych wczasów?', '🥥 Zimą w tropiki, latem wspomnienia'])}\n\n${top.map((o) => '🌴 ' + offerLine(o)).join('\n')}\n\nZobacz wszystkie kierunki egzotyczne 👇\n\n#egzotyka #zanzibar #dominikana #tajlandia #lecimynawakacje`,
    link: SITE + '/egzotyka/',
  };
}

async function cruises(): Promise<Post | null> {
  const l = (await offers({ countries: [521] })).sort((a, b) => price(a) - price(b));
  if (!l.length) return null;
  const top = l.slice(0, 3);
  return {
    key: `rejs-${top.map((x) => `${x.id}:${price(x)}`).join(',')}`,
    message: `${pickOne(['🚢 Kilka krajów w jeden urlop: rejsy wycieczkowe', '⚓ Rejs zamiast hotelu? Zobacz ceny', '🌊 Morze Śródziemne, fiordy, Karaiby z pokładu statku'])}\n\n${top.map((o) => `🛳️ ${o.name}, ${dm(o.departureDate)}, ${nights(o.departureDate, o.returnDate)} nocy, od ${zl(price(o))}/os.`).join('\n')}\n\nNa pokładzie wszystko w cenie: nocleg, wyżywienie, rozrywka 👇\n\n#rejsy #rejswycieczkowy #wakacje #lecimynawakacje`,
    link: SITE + '/rejsy/',
  };
}

function flights(byOrigin = false): Post | null {
  const routes = allRoutes().filter((r) => !r.dep || r.dep >= today);
  if (!routes.length) return null;
  let list = routes.sort((a, b) => a.price - b.price);
  let head = pickOne(['✈️ Najtańsze loty z Polski w tym tygodniu', '💸 Loty w obie strony w cenie obiadu na mieście?', '🛫 Tanie loty: tam i z powrotem']);
  if (byOrigin) {
    const origins = [...new Set(routes.map((r) => r.oFrom))];
    const o = origins[(Math.floor(Date.parse(today) / 86400000 / 7)) % origins.length];
    list = list.filter((r) => r.oFrom === o);
    head = `✈️ Tanie loty ${o}: gdzie polecisz najtaniej?`;
  }
  const seen = new Set<string>();
  const top = list.filter((r) => (seen.has(r.country) ? false : (seen.add(r.country), true))).slice(0, 5);
  if (top.length < 3) return null;
  return {
    key: `loty-${byOrigin ? 'o' : 'n'}-${top.map((r) => `${r.slug}:${r.price}`).join(',')}`,
    message: `${head}\n\n${top.map((r) => `🔹 ${r.oName} - ${r.name}: od ${zl(r.price)}${r.dep ? ` (${dm(r.dep)}${r.ret ? `-${dm(r.ret)}` : ''})` : ''}`).join('\n')}\n\nCeny w obie strony za osobę, sprawdzone dziś rano. Tanie bilety szybko znikają 👇\n\n#tanieloty #loty #podroze #lecimynawakacje`,
    link: SITE + (byOrigin ? '/loty/' : routeUrl(top[0].slug)),
  };
}

// jedna konkretna oferta: hotel z dobrą oceną, wylot w ciągu 2 tygodni, najlepiej z kartą hotelu (duże zdjęcie w podglądzie)
async function singleOffer(kind: 'lm' | 'ai'): Promise<Post | null> {
  const l = await offers(kind === 'ai' ? { service: [1], searchType: 'lastminute' } : { searchType: 'lastminute' });
  const soon = l.filter((o) => Date.parse(o.departureDate) - Date.parse(today) <= 15 * 86400000 && (o.ratingValue || 0) >= 7.5 && price(o) > 0 && !recent.has('oferta-' + (o.hotelId || o.id)));
  if (!soon.length) return null;
  // najlepszy stosunek ceny do oceny, z premią dla hoteli z kartą
  const score = (o: TL) => price(o) / ((o.ratingValue || 7) - 5) * (o.hotelId && hotelById.has(o.hotelId) ? 0.8 : 1);
  const o = soon.sort((a, b) => score(a) - score(b))[0];
  const h = o.hotelId ? hotelById.get(o.hotelId) : undefined;
  const days = Math.round((Date.parse(o.departureDate) - Date.parse(today)) / 86400000);
  const when = days <= 1 ? 'już jutro' : days <= 3 ? `za ${days} dni` : dm(o.departureDate);
  const head = pickOne(['🔥 Oferta dnia', '⏰ Okazja last minute', '☀️ Polecamy dziś', '✈️ Wylot ' + when]);
  const stars = o.category ? ' ' + '⭐'.repeat(Math.min(5, Math.round(o.category))) : '';
  const pros = h?.pros?.slice(0, 3).map((p) => '✅ ' + p).join('\n');
  return {
    key: 'oferta-' + (o.hotelId || o.id),
    message: `${head}: ${o.name}${stars}\n📍 ${[o.placeName?.[2], o.placeName?.[1], o.placeName?.[0]].filter((x, i, a) => x && a.indexOf(x) === i).join(', ')}\n\n🗓️ ${dm(o.departureDate)} - ${dm(o.returnDate)} (${nights(o.departureDate, o.returnDate)} nocy), wylot ${o.departure?.label || ''}\n🍽️ ${o.service?.label || ''}\n⭐ Ocena gości: ${(o.ratingValue || 0).toFixed(1)}/10\n💰 ${zl(price(o))} za osobę z przelotem${o.tourOperatorName ? ` (${o.tourOperatorName})` : ''}${pros ? `\n\n${pros}` : ''}\n\nCena z dzisiaj, miejsc w tej cenie zwykle jest niewiele 👇\n\n${tag(o.placeName?.[0] || 'wakacje')} #lastminute #ofertadnia #lecimynawakacje`,
    link: h ? SITE + hotelUrl(h.slug) : SITE + '/last-minute/',
  };
}

// --- POSTY: inspiracje (rano / wieczór) ---
async function hotelPost(kind: 'any' | 'family'): Promise<Post | null> {
  const top = new Set(popularCountries().slice(0, 15).map((c) => c.slug));
  let pool = allHotels().filter((h) => typeof h.id === 'number' && top.has(h.country) && !recent.has('hotel-' + h.slug) && h.pros.length >= 3);
  if (kind === 'family') pool = pool.filter((h) => h.aquapark || h.kidsClub || h.goodFor?.some((g) => /rodzin|dziec/i.test(g)));
  for (const h of pool.sort(() => Math.random() - 0.5).slice(0, 12)) {
    const l = await offers({ hotels: [h.id] });
    if (!l.length) continue;
    const cheapest = l.reduce((a, b) => (price(b) < price(a) ? b : a));
    return hotelMessage(h, price(cheapest), kind);
  }
  return null;
}
function hotelMessage(h: Hotel, from: number, kind: 'any' | 'family'): Post {
  const where = [h.city || h.place.at(-1), h.place[0]].filter(Boolean).join(', ');
  const head = kind === 'family'
    ? pickOne([`👨‍👩‍👧 Hotel dla rodzin: ${h.name}`, `🧒 Wakacje z dziećmi? Sprawdź ${h.name}`])
    : pickOne([`🏨 Hotel tygodnia: ${h.name}`, `⭐ Polecamy: ${h.name}`, `🌅 Hotel, który warto znać: ${h.name}`]);
  return {
    key: 'hotel-' + h.slug,
    message: `${head}${h.stars ? ` ${'⭐'.repeat(Math.min(5, Math.round(h.stars)))}` : ''}\n📍 ${where}\n\n${cut(h.intro[0], 280)}\n\n${h.pros.slice(0, 3).map((p) => '✅ ' + p).join('\n')}\n\n💰 Wczasy od ${zl(from)} za osobę. Opis, zalety i wady, mapa i wszystkie terminy z cenami 👇\n\n${tag(h.place[0])} ${tag('wakacje' + h.place[0])} #hotel #lecimynawakacje`,
    link: SITE + hotelUrl(h.slug),
  };
}

function attractionPost(): Post | null {
  const pool = popularCountries().slice(0, 30).flatMap((c) => attractionsOf(c.slug).map((a) => ({ c, a }))).filter(({ a }) => !recent.has('attr-' + a.slug));
  if (!pool.length) return null;
  const { c, a } = pickOne(pool);
  return {
    key: 'attr-' + a.slug,
    message: `${pickOne(['📸 Miejsce, które musisz zobaczyć:', '🗺️ Na liście marzeń:', '✨ Warto zobaczyć choć raz:'])} ${a.name} (${c.name})\n\n${cut(a.lead, 300)}\n\n${(a.tips || []).slice(0, 2).map((t: string) => '💡 ' + cut(t, 140)).join('\n')}\n\nJak dojechać, bilety i wycieczki z rezerwacją 👇\n\n${tag(c.name)} #zwiedzanie #podroze #lecimynawakacje`,
    link: `${SITE}/wakacje/${c.slug}/atrakcje/${a.slug}/`,
  };
}

function regionPost(): Post | null {
  const pool = popularCountries().slice(0, 20).flatMap((c) => (c.content!.regions || []).map((r) => ({ c, r }))).filter(({ c, r }) => !recent.has(`reg-${c.slug}-${r.slug}`) && r.intro?.length);
  if (!pool.length) return null;
  const { c, r } = pickOne(pool);
  return {
    key: `reg-${c.slug}-${r.slug}`,
    message: `${pickOne(['🌍 Kierunek na dziś:', '🧭 Gdzie na urlop? Może', '🏝️ Poznaj region:'])} ${r.name} (${c.name})\n\n${cut(r.intro[0], 320)}\n\n${(r.highlights || []).slice(0, 3).map((x) => '🔸 ' + cut(x, 110)).join('\n')}\n\nPrzewodnik, pogoda, hotele i aktualne oferty 👇\n\n${tag(r.name)} ${tag(c.name)} #wakacje #lecimynawakacje`,
    link: `${SITE}/wakacje/${c.slug}/${r.slug}/`,
  };
}

function countryPost(): Post | null {
  const pool = popularCountries().slice(0, 40).filter((c) => !recent.has('kraj-' + c.slug) && c.content?.teaser);
  if (!pool.length) return null;
  const c = pickOne(pool.slice(0, 25));
  const ct = c.content!;
  const t = ct.climate ? `🌡️ ${MONTHS[month].name}: powietrze ok. ${ct.climate.air[month]}°C${ct.climate.sea ? `, morze ${ct.climate.sea[month]}°C` : ''}` : '';
  return {
    key: 'kraj-' + c.slug,
    message: `${pickOne(['🌎 Kraj tygodnia:', '✈️ Myślisz o urlopie? Zobacz:', '🗺️ Kierunek, który warto rozważyć:'])} ${c.name}\n\n${cut(ct.teaser, 300)}\n\n${(ct.highlights || []).slice(0, 3).map((x) => '🔹 ' + cut(x, 110)).join('\n')}${t ? `\n\n${t}` : ''}\n\nPełny przewodnik: kiedy jechać, regiony, atrakcje, ceny 👇\n\n${tag(c.name)} ${tag('wakacje' + c.name)} #podroze #lecimynawakacje`,
    link: `${SITE}/wakacje/${c.slug}/`,
  };
}

function monthPost(ahead = 1): Post | null {
  const m = (month + ahead) % 12;
  const list = warmIn(m).slice(0, 6);
  if (list.length < 3) return null;
  return {
    key: `mies-${MONTHS[m].slug}-${today.slice(0, 7)}`,
    message: `${pickOne([`☀️ Gdzie jest ciepło ${MONTHS[m].loc}?`, `🌡️ Gdzie na wakacje ${MONTHS[m].loc}? Sprawdziliśmy pogodę`, `🏖️ Ciepłe kierunki ${MONTHS[m].loc}`])}\n\n${list.map((x) => `📍 ${x.country.name}: ${x.air}°C${x.sea ? `, morze ${x.sea}°C` : ''}`).join('\n')}\n\nTemperatury to średnie z danych klimatycznych. Pełna lista z cenami 👇\n\n#gdzienawakacje #wakacje #cieplo #lecimynawakacje`,
    link: `${SITE}/gdzie-na-wakacje/${MONTHS[m].slug}/`,
  };
}

// --- plan tygodnia: [niedziela..sobota] ---
type Gen = () => Promise<Post | null> | Post | null;
const PLAN: Record<string, Gen[][]> = {
  rano: [[regionPost], [attractionPost], [countryPost], [attractionPost], [regionPost], [attractionPost], [countryPost]],
  poludnie: [[cruises, flights], [() => lastMinute()], [() => flights()], [() => singleOffer('ai'), allInclusive], [() => flights(true)], [() => singleOffer('lm'), () => lastMinute(true)], [exotic, allInclusive]],
  wieczor: [[() => hotelPost('any')], [() => hotelPost('any')], [() => monthPost(1)], [() => hotelPost('family')], [countryPost], [() => hotelPost('any')], [() => monthPost(2)]],
};
// rezerwa, gdy główny pomysł nie zadziała (brak danych)
const FALLBACK: Gen[] = [regionPost, attractionPost, countryPost, () => flights()];

// rodzaje postów do wyboru przy ręcznym uruchomieniu
const TYPES: Record<string, Gen[]> = {
  'oferta-dnia': [() => singleOffer('lm'), () => singleOffer('ai')],
  'oferta-all-inclusive': [() => singleOffer('ai'), () => singleOffer('lm')],
  'last-minute-lista': [() => lastMinute()],
  'last-minute-weekend': [() => lastMinute(true)],
  'all-inclusive-lista': [allInclusive],
  'tanie-loty': [() => flights()],
  'tanie-loty-miasto': [() => flights(true)],
  egzotyka: [exotic],
  rejsy: [cruises],
  hotel: [() => hotelPost('any')],
  'hotel-dla-rodzin': [() => hotelPost('family')],
  atrakcja: [attractionPost],
  region: [regionPost],
  kraj: [countryPost],
  'gdzie-jechac': [() => monthPost(1)],
};

async function main() {
  let post: Post | null = null;
  const gens = slot === 'reczny' ? (TYPES[TYPE] || []) : [...PLAN[slot][dow], ...FALLBACK];
  if (slot === 'reczny' && !gens.length) { console.error('Nieznany rodzaj posta:', TYPE); process.exit(1); }
  let dup = false;
  for (const g of gens) {
    const p = await g();
    if (p && recent.has(p.key)) { dup = true; continue; }
    if (p) { post = p; break; }
  }
  if (!post) {
    console.log(dup
      ? 'Ten post byłby taki sam jak już opublikowany (te same oferty lub ten sam hotel/atrakcja). Spróbuj inny rodzaj posta albo później, gdy zmienią się oferty.'
      : 'Brak danych do tego posta (np. API ofert nic nie zwróciło albo nie ma ofert spełniających warunki).');
    return;
  }
  post.message = post.message.replace(/\s*[–—]\s*/g, ' - ');
  console.log(`--- ${slot} ${today} ---\n${post.message}\n${post.link}\n`);
  if (DRY) { console.log('(na sucho, bez publikacji)'); return; }

  const body = new URLSearchParams({ message: post.message, link: post.link, access_token: TOKEN });
  const r = await fetch(`https://graph.facebook.com/${API_V}/${PAGE}/feed`, { method: 'POST', body });
  const j = await r.json();
  if (!r.ok || !j.id) { console.error('Błąd Facebooka:', JSON.stringify(j.error || j).replace(TOKEN, '***')); process.exit(1); }
  console.log('Opublikowano:', j.id);
  state.posts.push({ date: today, slot, key: post.key, id: j.id });
  state.posts = state.posts.slice(-400);
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
}
if (process.env.FB_TEST) { (async () => { for (const g of [() => flights(), () => flights(true), () => monthPost(1)]) { const p = await g(); console.log(p ? p.message + "\n" + p.link + "\n---" : "NULL"); } })(); } else main();
