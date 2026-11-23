import type { Metadata } from 'next';
import Crumbs from '@/components/Crumbs';
export const metadata: Metadata = { title: 'O serwisie', alternates: { canonical: '/o-serwisie/' } };
export default function About() {
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <Crumbs items={[{ name: 'O serwisie' }]} />
      <section className="section-sm prose">
        <h1>O serwisie</h1>
        <p className="lead" style={{ marginTop: 16 }}>Lecimynawakacje.pl to przewodnik po kierunkach wakacyjnych z całego świata, pisany z myślą o osobach wylatujących z Polski.</p>
        <p>Dla każdego kraju zbieramy to, czego potrzeba przed rezerwacją: kiedy jechać, które regiony wybrać, ile trwa lot, jakie dokumenty są potrzebne i co warto zobaczyć na miejscu.</p>
        <h2>Jak zarabiamy</h2>
        <p>Serwis utrzymuje się z linków partnerskich. Gdy klikniesz w ofertę wakacje.pl lub wycieczkę GetYourGuide i dokonasz rezerwacji, otrzymujemy prowizję. Cena dla Ciebie jest taka sama jak przy wejściu bezpośrednio na stronę partnera.</p>
        <h2>Kontakt i współpraca</h2>
        <p>Wydawca: Gjafaland ehf., Aðalstræti 24, 400 Ísafjörður, Islandia.</p>
      </section>
    </div>
  );
}
