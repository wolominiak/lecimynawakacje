import type { Metadata } from 'next';
import Crumbs from '@/components/Crumbs';
export const metadata: Metadata = { title: 'Polityka prywatności', alternates: { canonical: '/polityka-prywatnosci/' }, robots: { index: false } };
export default function Privacy() {
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <Crumbs items={[{ name: 'Polityka prywatności' }]} />
      <section className="section-sm prose">
        <h1>Polityka prywatności</h1>
        <p>Administratorem serwisu lecimynawakacje.pl jest Gjafaland ehf., Aðalstræti 24, 400 Ísafjörður, Islandia.</p>
        <h2>Jakie dane przetwarzamy</h2>
        <p>Serwis nie wymaga rejestracji i nie zbiera danych osobowych przez formularze. Serwer hostingowy (Vercel) zapisuje standardowe logi techniczne, takie jak adres IP i typ przeglądarki.</p>
        <h2>Linki partnerskie i widgety</h2>
        <p>Na stronach znajdują się linki i widgety partnerów: wakacje.pl (program TravelLead) oraz GetYourGuide. Po kliknięciu partner może zapisać w przeglądarce plik cookie, aby przypisać rezerwację do naszego serwisu. Zasady przetwarzania danych przez partnerów opisują ich własne polityki prywatności.</p>
        <h2>Twoje prawa</h2>
        <p>Możesz w każdej chwili usunąć pliki cookie w ustawieniach przeglądarki lub zablokować ich zapisywanie.</p>
      </section>
    </div>
  );
}
