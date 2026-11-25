import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import Crumbs from '@/components/Crumbs';
export const metadata: Metadata = seo({
  title: 'Polityka prywatności',
  description: 'Polityka prywatności serwisu lecimynawakacje.pl: jakie dane przetwarzamy, pliki cookie partnerów i asystent AI.',
  path: '/polityka-prywatnosci/',
  noindex: true,
});
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
        <p>Na stronach znajdują się linki i widgety partnerów: wakacje.pl (program TravelLead), Exim Tours (TradeDoubler), GetYourGuide, Booking.com, DiscoverCars i Aviasales (program Travelpayouts) oraz sklep esimgo.is. Po kliknięciu partner może zapisać w przeglądarce plik cookie, aby przypisać rezerwację do naszego serwisu. Zasady przetwarzania danych przez partnerów opisują ich własne polityki prywatności.</p>
        <h2>Asystent podróży AI</h2>
        <p>Wiadomości wpisane w czacie asystenta są przesyłane do modelu Gemini firmy Google w celu przygotowania odpowiedzi. Nie zapisujemy rozmów na serwerze. Historia rozmowy jest przechowywana tylko w Twojej przeglądarce do zamknięcia karty. Nie wpisuj w czacie danych osobowych, których nie chcesz przekazywać.</p>
        <h2>Twoje prawa</h2>
        <p>Możesz w każdej chwili usunąć pliki cookie w ustawieniach przeglądarki lub zablokować ich zapisywanie.</p>
      </section>
    </div>
  );
}
