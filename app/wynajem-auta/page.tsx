import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import { getCountries, availableSubpages } from '@/lib/data';
import ServiceHub from '@/components/ServiceHub';

export const metadata: Metadata = seo({
  title: 'Wynajem auta za granicą - porównanie wypożyczalni',
  description: 'Porównaj ceny wypożyczalni samochodów w Grecji, Hiszpanii, Włoszech, na Islandii i w ponad 200 krajach. Lotniska odbioru, prawo jazdy i porady.',
  path: '/wynajem-auta/',
});

export default function Page() {
  const pop = getCountries().filter((c) => c.content && availableSubpages(c).includes('wynajem-auta')).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0));
  return (
    <ServiceHub
      slug="wynajem-auta" h1="Wynajem auta za granicą" eyebrow="Samochód" linksTitle="Wynajem auta według kraju"
      lead="Porównaj ceny wielu wypożyczalni, od międzynarodowych sieci po lokalne firmy. Wybierz kraj, aby zobaczyć lotniska odbioru i zasady na drodze."
      links={pop.slice(0, 48).map((c) => ({ href: `/wakacje/${c.slug}/wynajem-auta/`, label: `Auto: ${c.name}` }))}
      intro={[
        'Samochód na wakacjach daje swobodę: dojedziesz do plaż, punktów widokowych i miasteczek, do których nie jeżdżą autobusy. Najbardziej opłaca się na wyspach i tam, gdzie atrakcje są rozrzucone, jak na Krecie, Teneryfie, Sycylii czy Islandii.',
        'Przed rezerwacją sprawdź wysokość udziału własnego w ubezpieczeniu, kaucję na karcie kredytowej i zasady tankowania. Najkorzystniejsza jest zasada "pełny na pełny".',
      ]}
      faq={[
        { q: 'Czy do wynajmu auta potrzebna jest karta kredytowa?', a: 'Zwykle tak. Wypożyczalnie blokują na niej kaucję, a karta debetowa często nie jest akceptowana. Sprawdź warunki oferty.' },
        { q: 'Czy polskie prawo jazdy wystarczy?', a: 'W krajach Unii Europejskiej, EOG i w Szwajcarii tak. Poza Europą sprawdź, czy potrzebne jest międzynarodowe prawo jazdy. Szczegóły są na stronie każdego kraju.' },
      ]}
    >
      <a className="btn" href="/go/auto/grecja/" target="_blank" rel="sponsored nofollow noopener" style={{ alignSelf: 'flex-start' }}>Porównaj wypożyczalnie &rarr;</a>
    </ServiceHub>
  );
}
