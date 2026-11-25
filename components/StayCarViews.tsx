import type { Country } from '@/lib/types';
import { MONTHS, availableSubpages } from '@/lib/data';
import { carLink, stayLink, iataOf, flightLink } from '@/lib/travelpayouts';
import Faq from './Faq';

// Zakładki "Hotele i noclegi" (Booking.com) oraz "Wynajem auta" (DiscoverCars), linki Travelpayouts
const AFF = { target: '_blank', rel: 'sponsored nofollow noopener' } as const;

// Kraje z ruchem lewostronnym
const LEFT = new Set(['GB', 'IE', 'MT', 'CY', 'JP', 'TH', 'ID', 'MY', 'SG', 'AU', 'NZ', 'ZA', 'IN', 'LK', 'KE', 'TZ', 'UG', 'MU', 'SC', 'BB', 'JM', 'BS', 'TT', 'HK', 'MO', 'NP', 'BD', 'PK', 'BT', 'BN', 'TL', 'FJ', 'MV', 'NA', 'BW', 'ZW', 'ZM', 'MW', 'MZ', 'LS', 'SZ', 'GY', 'SR', 'AG', 'DM', 'GD', 'KN', 'LC', 'VC', 'KY', 'VG', 'BM', 'TC', 'MS', 'AI', 'CK', 'WS', 'TO', 'KI', 'NR', 'TV', 'SB', 'PG', 'JE', 'GG', 'IM', 'FK', 'SH']);
// Polskie prawo jazdy honorowane jak w UE: Europejski Obszar Gospodarczy i Szwajcaria
const EEA = new Set(['IS', 'NO', 'LI', 'CH']);

const list = (a: string[]) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' i ' + a[a.length - 1]);
const bestMonths = (c: Country) => (c.content?.bestTime?.best || []).map((m) => MONTHS[m - 1]?.name).filter(Boolean) as string[];

export function HotelsView({ c }: { c: Country }) {
  const ct = c.content!;
  const regs = ct.regions || [];
  const best = bestMonths(c);
  const hasOffers = availableSubpages(c).includes('oferty');
  const faq = [
    regs.length >= 2 && {
      q: `Gdzie najlepiej nocować ${ct.loc}?`,
      a: `To zależy od tego, jak chcesz spędzać czas. ${regs.slice(0, 3).map((r) => `${r.name}: ${(r.forWhom || '').replace(/\.$/, '')}`).join('. ')}.`,
    },
    best.length > 0 && {
      q: `Kiedy rezerwować hotel ${ct.loc}?`,
      a: `Najwięcej chętnych jest w miesiącach: ${list(best)}. Na ten czas warto rezerwować nocleg z kilkumiesięcznym wyprzedzeniem, bo najlepsze miejsca znikają najszybciej. Poza sezonem ceny są niższe, a wybór większy.`,
    },
    hasOffers && {
      q: `Hotel na własną rękę czy wczasy z biurem podróży ${ct.loc}?`,
      a: `Wczasy z biurem to przelot, transfer i hotel w jednej cenie, często z wyżywieniem. Nocleg na własną rękę daje większą swobodę wyboru miejsca i terminu. Warto porównać obie opcje dla tego samego terminu.`,
    },
    ct.practical?.money && { q: `Ile kosztuje pobyt ${ct.loc}?`, a: ct.practical.money },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <>
      <h2>Gdzie spać {ct.loc}?</h2>
      <p>Wybór miejsca na nocleg zależy od tego, jak chcesz spędzać czas: przy plaży, w centrum miasta czy blisko szlaków i atrakcji. Poniżej znajdziesz {regs.length > 1 ? 'regiony' : 'najważniejsze miejsca'} {ct.loc} z krótkim opisem, dla kogo są najlepsze, i linkiem do aktualnych ofert hoteli, apartamentów i pensjonatów.</p>
      <a className="ft-card ft-link st-main" href={stayLink(c.name)} {...AFF}>
        <span className="ft-i" aria-hidden="true">🛏</span>
        <div><h3>Wszystkie noclegi: {c.name}</h3><small>Hotele, apartamenty i pensjonaty z oceną gości na Booking.com</small></div>
        <span className="ft-go">Szukaj &rarr;</span>
      </a>

      {regs.length > 0 && (
        <div className="st-list">
          {regs.map((r) => (
            <div className="st-item" key={r.slug}>
              <div className="st-txt">
                <span className="t">{r.type}</span>
                <h3>{r.name}</h3>
                {r.forWhom && <p>{r.forWhom}</p>}
                {r.airport && <small>Lotnisko: {r.airport}</small>}
              </div>
              <div className="st-btns">
                <a className="btn btn-sm" href={stayLink(`${r.name}, ${c.name}`)} {...AFF}>Noclegi: {r.name}</a>
                <a className="st-more" href={`/wakacje/${c.slug}/${r.slug}/`}>Przewodnik &rarr;</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {best.length > 0 && (
        <>
          <h2>Kiedy rezerwować nocleg?</h2>
          <p>Najlepszy czas na wyjazd {ct.to} to {list(best)}. To też miesiące największego ruchu, więc nocleg w popularnych miejscach warto zarezerwować z wyprzedzeniem. {ct.bestTime?.text}</p>
        </>
      )}
      {hasOffers && (
        <p className="st-alt">Wolisz wszystko w jednym? Porównaj z <a href={`/wakacje/${c.slug}/oferty/`}>wczasami z przelotem i hotelem {ct.loc}</a>.</p>
      )}
      {faq.length > 0 && (<><h2>Najczęstsze pytania o noclegi {ct.loc}</h2><Faq items={faq} /></>)}
      <p className="ft-note">Linki partnerskie: rezerwując przez nie, nie płacisz więcej.</p>
    </>
  );
}

export function CarsView({ c }: { c: Country }) {
  const ct = c.content!;
  const left = LEFT.has(c.code);
  const euLicence = c.eu || EEA.has(c.code);
  const airports: { name: string; code: string; region: string }[] = [];
  const seen = new Set<string>();
  for (const r of ct.regions || []) {
    const txt = r.airport || '';
    const named = new Map<string, string>();
    for (const m of txt.matchAll(/([^,(;]+?)\s*\(([A-Z]{3})\)/g)) named.set(m[2], m[1].replace(/^(lub|i|oraz)\s+/i, '').trim());
    for (const m of txt.matchAll(/\b([A-Z]{3})\b/g)) {
      const code = m[1];
      if (seen.has(code)) continue;
      seen.add(code);
      airports.push({ name: named.get(code) || r.name, code, region: r.name });
    }
  }
  const faq = [
    { q: `Po której stronie drogi jeździ się ${ct.loc}?`, a: left ? `${ct.loc[0].toUpperCase() + ct.loc.slice(1)} obowiązuje ruch lewostronny, a kierownica w autach jest po prawej stronie. Pierwsze kilometry warto przejechać spokojnie, poza ścisłym centrum.` : `${ct.loc[0].toUpperCase() + ct.loc.slice(1)} obowiązuje ruch prawostronny, tak jak w Polsce.` },
    { q: `Jakie prawo jazdy jest potrzebne ${ct.loc}?`, a: euLicence ? `Polskie prawo jazdy jest honorowane w całej Unii Europejskiej, a także w krajach EOG i Szwajcarii, więc wystarczy dokument, którym jeździsz na co dzień. Wypożyczalnie często wymagają, by prawo jazdy było wydane co najmniej rok lub dwa lata wcześniej.` : `Przed wyjazdem sprawdź, czy lokalne przepisy i wypożyczalnia honorują polskie prawo jazdy, czy wymagają międzynarodowego prawa jazdy. Warunki każdej wypożyczalni są podane przy ofercie.` },
    { q: `Czy do wynajmu auta potrzebna jest karta kredytowa?`, a: `Większość wypożyczalni blokuje kaucję na karcie kredytowej kierowcy, a karta debetowa często nie jest akceptowana. Sprawdź to w warunkach oferty przed rezerwacją.` },
    { q: `Czy warto wynająć auto ${ct.loc}?`, a: `Samochód daje swobodę: dojedziesz do plaż, punktów widokowych i miasteczek, do których nie jeździ komunikacja, i nie zależysz od wycieczek fakultatywnych. Opłaca się szczególnie przy wyjeździe we dwie lub więcej osób.` },
  ];

  return (
    <>
      <h2>Wynajem samochodu {ct.loc}</h2>
      <p>Auto to najwygodniejszy sposób, żeby zobaczyć więcej niż okolicę hotelu. Porównywarka DiscoverCars zestawia oferty wielu wypożyczalni, od międzynarodowych sieci po lokalne firmy, z cenami za cały okres najmu i warunkami ubezpieczenia.</p>
      <a className="ft-card ft-link st-main" href={carLink(c)} {...AFF}>
        <span className="ft-i" aria-hidden="true">🚗</span>
        <div><h3>Porównaj wypożyczalnie: {c.name}</h3><small>Ceny wielu firm w jednym miejscu, po polsku</small></div>
        <span className="ft-go">Porównaj &rarr;</span>
      </a>

      <div className="st-facts">
        <div><span>Ruch</span><b>{left ? 'lewostronny' : 'prawostronny'}</b></div>
        <div><span>Prawo jazdy</span><b>{euLicence ? 'polskie wystarczy' : 'sprawdź wymagania'}</b></div>
        {c.currencies?.[0] && <div><span>Waluta</span><b>{c.currencies[0].name} ({c.currencies[0].code})</b></div>}
      </div>

      {airports.length > 0 && (
        <>
          <h2>Gdzie odebrać auto: lotniska</h2>
          <p>Najwygodniej odebrać samochód od razu po przylocie. Wypożyczalnie na lotniskach mają zwykle największy wybór aut.</p>
          <div className="st-list">
            {airports.slice(0, 10).map((a) => (
              <div className="st-item" key={a.code}>
                <div className="st-txt">
                  <span className="t">Lotnisko {a.code}</span>
                  <h3>{a.name}</h3>
                  {a.region !== a.name && <small>Region: {a.region}</small>}
                </div>
                <div className="st-btns">
                  <a className="btn btn-sm" href={carLink(c)} {...AFF}>Auta: {a.name}</a>
                  <a className="st-more" href={flightLink(a.code)} {...AFF}>Loty do {a.code} &rarr;</a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2>Na co uważać przy wynajmie auta</h2>
      <ul>
        <li><b>Ubezpieczenie:</b> podstawowa cena zwykle ma wysoki udział własny. Pełne ubezpieczenie bez udziału własnego kosztuje więcej, ale oszczędza nerwów przy drobnej rysie.</li>
        <li><b>Kaucja:</b> przygotuj kartę kredytową na nazwisko kierowcy z wolnym limitem na blokadę kaucji.</li>
        <li><b>Paliwo:</b> najkorzystniejsza jest zasada "pełny na pełny", czyli odbierasz i oddajesz auto z pełnym bakiem.</li>
        <li><b>Odbiór:</b> zrób zdjęcia lub film auta ze wszystkich stron przy odbiorze i zwrocie.</li>
        <li><b>Wiek kierowcy:</b> młodsi kierowcy (zwykle poniżej 25 lat) często płacą dodatkową opłatę.</li>
      </ul>
      {ct.practical?.safety && (<><h3>Bezpieczeństwo {ct.loc}</h3><p>{ct.practical.safety}</p></>)}
      <h2>Najczęstsze pytania o wynajem auta {ct.loc}</h2>
      <Faq items={faq} />
      <p className="ft-note">Linki partnerskie: rezerwując przez nie, nie płacisz więcej.</p>
    </>
  );
}
