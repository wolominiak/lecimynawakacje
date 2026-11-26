'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { promoOffers, cheapest, daysTo, fmtDate, fmtPrice, offerHref, type PromoOffer } from '@/lib/promo';
import { useNearView } from './useNearView';

// Własne banery promocyjne z aktualnymi cenami (zamiast reklam displayowych).
// Każdy baner pokazuje prawdziwą ofertę; jeśli ofert brak, baner znika albo zostaje tekst bez ceny.

const after = (ms: number, fn: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  const t = setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(fn, { timeout: 2000 }) : fn()), ms);
  return () => clearTimeout(t);
};
const place = (o: PromoOffer) => o.place[1] && !o.tour ? `${o.place[0]}, ${o.place[1]}` : o.place[0];
const nights = (d: number) => (d > 1 ? `${d - 1} ${d - 1 === 1 ? 'noc' : d - 1 < 5 ? 'noce' : 'nocy'}` : '');
const when = (iso: string) => { const n = daysTo(iso); return n === 0 ? 'dziś' : n === 1 ? 'jutro' : fmtDate(iso); };

/* 1. Okazja dnia: pasek pod nagłówkiem */

const DAILY = [37, 16, 65, 29, 110]; // Egipt, Turcja, Tunezja, Grecja, Cypr

export function DealBar() {
  const path = usePathname();
  const [o, setO] = useState<PromoOffer | null>(null);
  useEffect(() => after(1200, async () => {
    const day = Math.floor(Date.now() / 86400000);
    const order = DAILY.map((_, i) => DAILY[(day + i) % DAILY.length]);
    const pick = (l: PromoOffer[]) => {
      const ok = l.filter((x) => !x.tour && daysTo(x.date) <= 14);
      return cheapest(ok.filter((x) => x.rating >= 7)) || cheapest(ok);
    };
    for (const id of order) {
      const best = pick(await promoOffers({ searchType: 'lastminute', countries: [id], limit: 40 }));
      if (best) { setO(best); return; }
    }
    setO(pick(await promoOffers({ searchType: 'lastminute' })));
  }), []);
  if (path?.startsWith('/asystent')) return null;
  return (
    <div className="dealbar">
      <div className="wrap dealbar-in">
        <span className="dealbar-tag">Okazja dnia</span>
        {o ? (
          <a className="dealbar-a" href={offerHref(o, 'okazja-dnia')} target="_blank" rel="sponsored nofollow noopener">
            <span className="dealbar-t"><b>Last minute: {place(o)}</b>{o.board ? `, ${o.board.toLowerCase()}` : ''}{o.stars ? `, ${o.stars}*` : ''}</span>
            <span className="dealbar-m">wylot {when(o.date)}{o.from ? ` (${o.from})` : ''}{o.days ? `, ${o.days} dni` : ''}{o.rating ? `, ocena ${o.rating.toFixed(1)}` : ''}</span>
            <span className="dealbar-p">{fmtPrice(o.price)}<small> /os.</small></span>
          </a>
        ) : (
          <a className="dealbar-a" href="/last-minute/">
            <span className="dealbar-t"><b>Last minute:</b> wyloty w najbliższych dniach w najniższych cenach</span>
            <span className="dealbar-p">Sprawdź &rarr;</span>
          </a>
        )}
      </div>
    </div>
  );
}

/* 2. W treści przewodnika: 3 najtańsze terminy */

export function GuideDeals({ countryId, loc, region, regionLoc, allHref }: { countryId: number; loc: string; region?: string; regionLoc?: string; allHref: string }) {
  const [ref, near] = useNearView<HTMLDivElement>('300px');
  const [list, setList] = useState<PromoOffer[] | null>(null);
  const [inRegion, setInRegion] = useState(false);
  useEffect(() => {
    if (!near) return;
    promoOffers({ countries: [countryId] }).then((all) => {
      const base = all.filter((o) => !o.tour);
      const stem = region?.toLowerCase().slice(0, Math.max(4, region.length - 2));
      const reg = stem ? base.filter((o) => o.place.slice(1).some((p) => p.toLowerCase().includes(stem))) : [];
      const pool = reg.length ? reg : base;
      setInRegion(reg.length > 0);
      const out: PromoOffer[] = [];
      const dates = new Set<string>();
      for (const o of [...pool].sort((a, b) => a.price - b.price)) {
        if (dates.has(o.date)) continue;
        dates.add(o.date); out.push(o);
        if (out.length === 3) break;
      }
      setList(out);
    });
  }, [near, countryId, region]);
  if (list && !list.length) return null;
  return (
    <div ref={ref} className="promo-guide">
      <div className="promo-label">Oferta</div>
      <p className="promo-eyebrow">Wakacje {inRegion ? regionLoc : loc} teraz</p>
      <p className="promo-h">Najtańsze terminy z wylotem z Polski</p>
      {list ? (
        <ul className="promo-rows">
          {list.map((o) => (
            <li key={o.id}>
              <a href={offerHref(o, 'przewodnik')} target="_blank" rel="sponsored nofollow noopener">
                <span className="pr-main"><b>{o.hotel}</b>{o.stars ? ` ${o.stars}*` : ''}<small>{[fmtDate(o.date), nights(o.days), o.board, o.from].filter(Boolean).join(', ')}</small></span>
                <span className="pr-price">{fmtPrice(o.price)}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="promo-rows promo-skel"><li /><li /><li /></ul>
      )}
      <a className="promo-more" href={allHref}>Wszystkie oferty {inRegion ? regionLoc : loc} &rarr;</a>
    </div>
  );
}

/* 3. Boczny: inna kategoria niż strona, żeby kierować ruch w głąb portalu */

const EXOTIC = [14, 86, 39, 26, 87]; // Tajlandia, Dominikana, Tanzania, Meksyk, Malediwy
const SIDE = [
  { key: 'rejsy', ico: 'ship', title: 'Rejsy wycieczkowe', sub: 'Morze Śródziemne, fiordy, Karaiby. Kilka krajów w jeden urlop.', terms: { countries: [521] }, href: '/rejsy/', btn: 'Zobacz rejsy' },
  { key: 'egzotyka', ico: 'palm', title: 'Egzotyka zimą', sub: 'Tajlandia, Dominikana, Zanzibar, Meksyk i Malediwy.', terms: { countries: EXOTIC }, href: '/egzotyka/', btn: 'Zobacz egzotykę' },
  { key: 'last-minute', ico: 'bolt', title: 'Last minute', sub: 'Wyloty w najbliższych dniach, ceny spadają z dnia na dzień.', terms: { searchType: 'lastminute' }, href: '/last-minute/', btn: 'Zobacz last minute' },
  { key: 'all-inclusive', ico: 'sun', title: 'All inclusive', sub: 'Jedzenie i napoje w cenie, bez liczenia wydatków na miejscu.', terms: { service: [1] }, href: '/all-inclusive/', btn: 'Zobacz all inclusive' },
];
const ICO: Record<string, string> = {
  ship: 'M3 17l2 3h14l2-3M5 17V11l7-3 7 3v6M12 8V3M9 5h6',
  palm: 'M12 21c0-6 1-10 3-13M15 8c-2-3-6-3-8-1 3 0 5 1 8 1zM15 8c1-3 5-4 7-2-3 0-5 1-7 2zM15 8c3 0 5 2 5 5-2-2-4-3-5-5zM15 8c-3 1-5 3-5 6 2-3 3-4 5-6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
};
const Icon = ({ k }: { k: string }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICO[k]} /></svg>
);

export function SidePromo({ seed, exclude }: { seed: string; exclude?: string }) {
  const opts = SIDE.filter((s) => s.key !== exclude);
  const h = [...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const s = opts[h % opts.length];
  const [ref, near] = useNearView<HTMLDivElement>('300px');
  const [min, setMin] = useState<number | null>(null);
  useEffect(() => {
    if (!near) return;
    promoOffers(s.terms).then((l) => { const c = cheapest(s.key === 'rejsy' ? l : l.filter((o) => !o.tour)); if (c) setMin(c.price); });
  }, [near, s]);
  return (
    <div ref={ref} className="box promo-side">
      <div className="promo-label">Oferta</div>
      <span className="promo-ico"><Icon k={s.ico} /></span>
      <h3>{s.title}</h3>
      <p>{s.sub}</p>
      <p className="promo-from">{min ? <>od <b>{fmtPrice(min)}</b> za osobę</> : <>&nbsp;</>}</p>
      {s && <a className="btn" href={s.href}>{s.btn} &rarr;</a>}
    </div>
  );
}

/* 4. Sezonowy: ferie, majówka, wakacje, jesień */

type Season = { title: string; lead: string; dests: [string, string, number][]; from: string; to: string; href: string; btn: string };

function season(now = new Date()): Season {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const md = m * 100 + d;
  if (md >= 1101 || md < 301) {
    const fy = m >= 11 ? y + 1 : y;
    return {
      title: `Ferie zimowe ${fy} w cieple`, lead: 'Wyloty od połowy stycznia do końca lutego', from: `${fy}-01-15`, to: `${fy}-03-01`,
      dests: [['Egipt', 'egipt', 37], ['Emiraty', 'zjednoczone-emiraty-arabskie', 375], ['Zanzibar', 'tanzania', 39]],
      href: '/gdzie-na-wakacje/luty/', btn: 'Gdzie ciepło w lutym',
    };
  }
  if (md < 426) {
    return {
      title: `Majówka ${y} w słońcu`, lead: 'Wyloty od 25 kwietnia do 5 maja', from: `${y}-04-25`, to: `${y}-05-06`,
      dests: [['Turcja', 'turcja', 16], ['Egipt', 'egipt', 37], ['Cypr', 'cypr', 110]],
      href: '/gdzie-na-wakacje/maj/', btn: 'Gdzie ciepło w maju',
    };
  }
  if (md < 816) {
    return {
      title: `Wakacje ${y}: lipiec i sierpień`, lead: 'Wyloty w szczycie sezonu letniego', from: `${y}-06-25`, to: `${y}-09-01`,
      dests: [['Grecja', 'grecja', 29], ['Turcja', 'turcja', 16], ['Bułgaria', 'bulgaria', 305]],
      href: '/gdzie-na-wakacje/lipiec/', btn: 'Gdzie na wakacje w lipcu',
    };
  }
  return {
    title: 'Złota jesień w słońcu', lead: 'Wyloty do końca listopada, po sezonie taniej', from: `${y}-08-16`, to: `${y}-12-01`,
    dests: [['Egipt', 'egipt', 37], ['Cypr', 'cypr', 110], ['Turcja', 'turcja', 16]],
    href: '/gdzie-na-wakacje/pazdziernik/', btn: 'Gdzie ciepło w październiku',
  };
}

export function SeasonBanner() {
  const [ref, near] = useNearView<HTMLDivElement>('300px');
  // sezon liczony w przeglądarce (strona jest budowana statycznie, data budowania może być inna)
  const [s, setS] = useState<Season | null>(null);
  const [prices, setPrices] = useState<(number | null)[] | null>(null);
  useEffect(() => setS(season()), []);
  useEffect(() => {
    if (!near || !s) return;
    Promise.all(s.dests.map(async ([, , id]) => {
      const l = (await promoOffers({ countries: [id] })).filter((o) => !o.tour && o.date >= s.from && o.date < s.to);
      return cheapest(l)?.price ?? null;
    })).then(setPrices);
  }, [near, s]);
  const shown = prices && s ? s.dests.map((d, i) => [d, prices[i]] as const).filter(([, p]) => p) : null;
  if (shown && shown.length < 2) return null;
  return (
    <div ref={ref} className="promo-season">
      <div className="promo-label">Oferta</div>
      <span className="promo-ico"><Icon k="sun" /></span>
      <div className="ps-body">
        <p className="promo-h">{s?.title || '\u00a0'}</p>
        <p className="ps-lead">{s?.lead || '\u00a0'}</p>
        <div className="ps-dests">
          {shown ? shown.map(([[name, slug], p]) => (
            <a key={slug} href={`/wakacje/${slug}/oferty/`}>{name} <span>od {fmtPrice(p!)}</span></a>
          )) : <span className="ps-skel" />}
        </div>
      </div>
      {s && <a className="btn" href={s.href}>{s.btn} &rarr;</a>}
    </div>
  );
}
