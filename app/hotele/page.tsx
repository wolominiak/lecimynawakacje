import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import { getCountries, availableSubpages } from '@/lib/data';
import ServiceHub from '@/components/ServiceHub';
import TextGo from '@/components/TextGo';

export const metadata: Metadata = seo({
  title: 'Hotele i noclegi za granicą - porównaj ceny',
  description: 'Hotele, apartamenty i pensjonaty w ponad 200 krajach. Sprawdź, gdzie najlepiej nocować w danym kraju, i porównaj aktualne ceny noclegów.',
  path: '/hotele/',
});

export default function Page() {
  const pop = getCountries().filter((c) => c.content && availableSubpages(c).includes('hotele')).sort((a, b) => (b.content!.popularity || 0) - (a.content!.popularity || 0));
  return (
    <ServiceHub
      slug="hotele" h1="Hotele i noclegi" eyebrow="Noclegi" linksTitle="Gdzie spać: przewodniki po krajach"
      lead="Wpisz miasto, wyspę albo region i porównaj hotele, apartamenty i pensjonaty z ocenami gości."
      links={pop.slice(0, 40).map((c) => ({ href: `/wakacje/${c.slug}/hotele/`, label: `Noclegi: ${c.name}` }))}
      intro={[
        'Wybór noclegu zaczyna się od miejsca, a nie od hotelu. W przewodnikach po krajach opisujemy regiony: które są dla rodzin, które dla par, a które dla aktywnych, i od razu linkujemy do noclegów w danym miejscu.',
        'Porównując oferty, patrz na ocenę gości z ostatnich miesięcy, odległość od plaży lub centrum i warunki anulacji. Rezerwacja z bezpłatnym odwołaniem daje spokój, gdy plany się zmienią.',
      ]}
      faq={[
        { q: 'Kiedy rezerwować hotel?', a: 'Na sezon letni i święta najlepiej kilka miesięcy wcześniej, bo najlepsze obiekty znikają najszybciej. Poza sezonem można rezerwować nawet kilka dni przed wyjazdem.' },
        { q: 'Hotel czy apartament?', a: 'Hotel daje wygodę: śniadania, sprzątanie i recepcję. Apartament ma kuchnię i więcej miejsca, co opłaca się przy rodzinie i dłuższym pobycie.' },
      ]}
    >
      <TextGo base="/go/nocleg/?q=" placeholder="Dokąd? Np. Kreta, Rzym, Tokio" button="Szukaj noclegów" />
    </ServiceHub>
  );
}
