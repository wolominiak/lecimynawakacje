// Generuje data/countries.json z pakietu world-countries (nazwy PL z Intl, waluty, języki, sąsiedzi).
// Uruchom: node scripts/build-countries.mjs
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const all = require('world-countries');

const R = new Intl.DisplayNames('pl', { type: 'region' });
const L = new Intl.DisplayNames('pl', { type: 'language' });
const C = new Intl.DisplayNames('pl', { type: 'currency' });

// Terytoria zależne, które warto mieć jako kierunki wakacyjne
const EXTRA = ['AW','CW','BM','KY','GL','FO','HK','MO','PR','PF','NC','TW','XK','RE','MQ','GP','GI','TC','VG','VI','SX','BL'];
const SKIP = ['AQ'];

const NAME = {
  CI: 'Wybrzeże Kości Słoniowej', HK: 'Hongkong', MO: 'Makau', US: 'USA', ZA: 'RPA',
  CV: 'Wyspy Zielonego Przylądka', MM: 'Mjanma (Birma)', VA: 'Watykan', FM: 'Mikronezja',
  VG: 'Brytyjskie Wyspy Dziewicze', VI: 'Wyspy Dziewicze USA', SX: 'Sint Maarten', BL: 'Saint-Barthélemy',
  RE: 'Reunion', TC: 'Turks i Caicos', CD: 'Demokratyczna Republika Konga', CG: 'Kongo', GB: 'Wielka Brytania',
};
const SLUG = { US: 'usa', ZA: 'rpa', CD: 'dr-konga', GB: 'wielka-brytania', MM: 'mjanma', VI: 'wyspy-dziewicze-usa' };

const CONT_FIX = { TR: 'europa' };
const CONT = (c) => {
  if (CONT_FIX[c.cca2]) return CONT_FIX[c.cca2];
  if (c.region === 'Europe') return 'europa';
  if (c.region === 'Africa') return 'afryka';
  if (c.region === 'Asia') return 'azja';
  if (c.region === 'Oceania') return 'australia-i-oceania';
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'ameryka-poludniowa' : 'ameryka-polnocna';
  return 'inne';
};

export const slugify = (s) => s.toLowerCase()
  .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l').replace(/ń/g,'n')
  .replace(/ó/g,'o').replace(/ś/g,'s').replace(/[źż]/g,'z')
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const sel = all.filter(c => !SKIP.includes(c.cca2) && (c.unMember || c.independent || EXTRA.includes(c.cca2)));
const byCca3 = Object.fromEntries(sel.map(c => [c.cca3, c.cca2]));

const out = sel.map(c => {
  const name = NAME[c.cca2] || R.of(c.cca2);
  const lang = Object.keys(c.languages || {}).map(k => { const n = L.of(k); return n === k ? (c.languages[k]) : n; });
  return {
    code: c.cca2,
    ccn3: c.ccn3 || null,
    name,
    slug: SLUG[c.cca2] || slugify(name),
    continent: CONT(c),
    currencies: Object.keys(c.currencies || {}).map(k => ({ code: k, name: C.of(k), symbol: c.currencies[k].symbol || '' })),
    languages: lang,
    latlng: c.latlng,
    area: c.area,
    landlocked: c.landlocked,
    neighbors: (c.borders || []).map(b => byCca3[b]).filter(Boolean),
    callingCode: c.idd?.root ? c.idd.root + (c.idd.suffixes?.length === 1 ? c.idd.suffixes[0] : '') : null,
    tld: c.tld?.[0] || null,
    eu: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'].includes(c.cca2),
  };
}).filter(c => c.code !== 'PL').sort((a, b) => a.name.localeCompare(b.name, 'pl'));

const slugs = new Set();
for (const c of out) { if (slugs.has(c.slug)) throw new Error('dup slug ' + c.slug); slugs.add(c.slug); }
fs.writeFileSync(new URL('../data/countries.json', import.meta.url), JSON.stringify(out, null, 1).replace(/[\u2013\u2014]/g, '-'));
console.log('countries:', out.length);
