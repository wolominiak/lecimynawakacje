import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import { getCountries } from '@/lib/data';
import { countryIata, iataOf } from '@/lib/travelpayouts';
import ServiceHub from '@/components/ServiceHub';
import FlightSearch from '@/components/FlightSearch';
import { allRoutes, routeUrl, zl } from '@/lib/flights';
import { livePrices, checkedAt } from '@/lib/flights-live';

export const revalidate = 3600;

export const metadata: Metadata = seo({
  title: 'Tanie loty z Polski - porównanie cen lotów',
  description: 'Porównaj ceny lotów z Warszawy, Krakowa, Katowic, Gdańska i innych lotnisk w Polsce do ponad 200 krajów. Wybierz kierunek, daty i liczbę osób.',
  path: '/loty/',
});

export default async function Page() {
  const pop = getCountries().filter((c) => c.content).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0));
  const dests: { code: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const c of pop) {
    for (const r of c.content!.regions || []) {
      const code = iataOf(r.airport);
      if (code && !seen.has(code) && dests.length < 120) { seen.add(code); dests.push({ code, name: `${r.name}, ${c.name}` }); }
    }
  }
  const live = await livePrices(allRoutes());
  const at = checkedAt();
  const routes = live.routes.sort((a, b) => a.price - b.price);
  const byO = new Map<string, typeof routes>();
  for (const x of routes) byO.set(x.o, [...(byO.get(x.o) || []), x]);
  const origins = [...byO.entries()];
  const links = pop.slice(0, 30).filter((c) => countryIata(c)).map((c) => ({ href: `/wakacje/${c.slug}/#lot`, label: `Loty: ${c.name}` }));
  return (
    <ServiceHub
      slug="loty" h1="Tanie loty z Polski" eyebrow="Loty" linksTitle="Loty do popularnych krajów"
      lead="Porównaj ceny wielu linii lotniczych i agencji jednocześnie. Wybierz lotnisko w Polsce, kierunek i daty."
      links={links}
      intro={[
        'Wyszukiwarka porównuje ceny lotów regularnych, tanich linii i czarterów. Wyniki zobaczysz od razu z ceną za wszystkich pasażerów, a bilet kupujesz u przewoźnika lub agencji.',
        'Najtaniej lata się zwykle we wtorki i środy, poza wakacjami szkolnymi i świętami. Warto porównać kilka lotnisk wylotu: z Katowic, Modlina czy Wrocławia bywa wyraźnie taniej niż z Warszawy.',
      ]}
      faq={[
        { q: 'Kiedy kupować tanie loty?', a: 'Na loty w Europie zwykle 1 do 3 miesięcy wcześniej, na dalekie trasy 3 do 6 miesięcy wcześniej. W szczycie sezonu ceny rosną wraz ze zbliżaniem się terminu.' },
        { q: 'Czy w cenie jest bagaż?', a: 'To zależy od linii i taryfy. Tanie linie w podstawowej cenie mają zwykle tylko mały bagaż podręczny. Sprawdź warunki przed zakupem.' },
        { q: 'Lot osobno czy wczasy z biurem?', a: 'Wczasy z biurem łączą lot, transfer i hotel w jednej cenie. Lot osobno daje swobodę wyboru noclegu i terminu, ale wymaga samodzielnej organizacji.' },
      ]}
    >
      <FlightSearch dests={dests} />
      {routes.length > 0 && (
        <div className="fl-hub">
          <h2>Najtańsze loty z Polski dziś</h2>
          <p className="fl-live">{live.live ? `Ceny sprawdzone dziś o ${at}, aktualizacja co godzinę. ` : ''}Ceny w obie strony za osobę. Najtańsze bilety szybko znikają.</p>
          <div className="chips">{routes.slice(0, 24).map((x) => <a key={x.slug} className="chip chip-light" href={routeUrl(x.slug)}>{x.oName} - {x.name}: od {zl(x.price)}</a>)}</div>
          {origins.map(([o, list]) => (
            <div key={o}>
              <h3>Loty {list[0].oFrom}</h3>
              <div className="chips">{list.slice(0, 16).map((x) => <a key={x.slug} className="chip chip-light" href={routeUrl(x.slug)}>{x.name} od {zl(x.price)}</a>)}</div>
            </div>
          ))}
        </div>
      )}
    </ServiceHub>
  );
}
