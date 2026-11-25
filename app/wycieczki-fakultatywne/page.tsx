import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import { getCountries } from '@/lib/data';
import { allAttractionPages, getAttraction } from '@/lib/attractions';
import ServiceHub from '@/components/ServiceHub';
import TextGo from '@/components/TextGo';

export const metadata: Metadata = seo({
  title: 'Wycieczki fakultatywne i bilety do atrakcji',
  description: 'Wycieczki fakultatywne, rejsy i bilety bez kolejki do atrakcji na całym świecie. Opisy atrakcji, porady i rezerwacja z bezpłatnym anulowaniem przy wielu ofertach.',
  path: '/wycieczki-fakultatywne/',
});

export default function Page() {
  const pop = new Map(getCountries().map((c) => [c.slug, c.content?.popularity || 0]));
  const attrs = allAttractionPages().sort((a, b) => (pop.get(b.kraj) || 0) - (pop.get(a.kraj) || 0)).slice(0, 60)
    .map((a) => ({ href: `/wakacje/${a.kraj}/atrakcje/${a.slug}/`, label: getAttraction(a.kraj, a.slug)?.name || a.slug }));
  const countries = getCountries().filter((c) => (c.content?.attractions?.length || 0) >= 4).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0)).slice(0, 30)
    .map((c) => ({ href: `/wakacje/${c.slug}/atrakcje/`, label: `Atrakcje: ${c.name}` }));
  return (
    <ServiceHub
      slug="wycieczki-fakultatywne" h1="Wycieczki fakultatywne i atrakcje" eyebrow="Wycieczki" linksTitle="Najpopularniejsze atrakcje"
      lead="Wpisz miejsce lub atrakcję i zobacz wycieczki, rejsy i bilety wstępu z ocenami uczestników."
      links={attrs.length >= 8 ? attrs : countries}
      intro={[
        'Wycieczki fakultatywne kupione online są zwykle tańsze niż u rezydenta w hotelu, a przy wielu ofertach można je bezpłatnie odwołać na dzień przed terminem. Dobrze sprawdzają się bilety bez kolejki do najpopularniejszych zabytków.',
        'W naszych przewodnikach każda ważna atrakcja ma własny opis: co zobaczyć na miejscu, ile czasu zarezerwować, jak dojechać i kiedy przyjechać, żeby uniknąć tłumów.',
      ]}
      faq={[
        { q: 'Gdzie kupić wycieczki fakultatywne taniej?', a: 'Zwykle taniej jest kupić je online z wyprzedzeniem niż u rezydenta biura podróży. Porównaj program i to, co jest w cenie: transport, wstępy, posiłki.' },
        { q: 'Czy można odwołać wycieczkę?', a: 'Przy wielu ofertach tak, bezpłatnie do 24 godzin przed rozpoczęciem. Warunki są podane przy każdej wycieczce.' },
      ]}
    >
      <TextGo base="/go/atrakcje/" slashEnd placeholder="Np. Akropol, Wąwóz Samaria, Dubaj pustynia" button="Szukaj wycieczek" />
    </ServiceHub>
  );
}
