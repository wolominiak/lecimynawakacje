import LastMinuteBrowser from './LastMinuteBrowser';
import Crumbs from './Crumbs';
import Faq from './Faq';
import CategoryBar from './CategoryBar';
import { lmCountries } from '@/lib/lastminute';
import type { Country } from '@/lib/types';

export default function LastMinutePage({ country, apiName }: { country?: Country; apiName?: string }) {
  const list = lmCountries();
  const loc = country?.content?.loc;
  const to = country?.content?.to;
  const faq = country
    ? [
        { q: `Kiedy kupować last minute ${to}?`, a: `Najwięcej ofert last minute ${to} pojawia się na 3 do 14 dni przed wylotem. Biura obniżają ceny, gdy zostają wolne miejsca w samolocie i hotelu, dlatego warto sprawdzać listę codziennie i mieć elastyczny termin.` },
        { q: `Czy last minute ${to} zawsze jest tańsze?`, a: 'Nie zawsze. W szczycie sezonu i w ferie wolnych miejsc jest mało, więc ceny bywają wyższe niż w first minute. Najlepsze okazje trafiają się poza wakacjami szkolnymi.' },
        { q: 'Czy ceny są za osobę?', a: 'Tak. Podajemy cenę za jedną osobę za cały pobyt z przelotem. Liczbę osób i pokój wybierasz na wakacje.pl po kliknięciu w ofertę.' },
      ]
    : [
        { q: 'Co to jest last minute?', a: 'Last minute to oferty z wylotem w najbliższych dniach lub tygodniach, które biura podróży przeceniają, żeby sprzedać wolne miejsca w samolotach i hotelach.' },
        { q: 'Kiedy kupować last minute?', a: 'Najwięcej przecenionych ofert pojawia się na 3 do 14 dni przed wylotem. Warto mieć spakowaną walizkę, elastyczny termin i kilka lotnisk wylotu do wyboru.' },
        { q: 'Gdzie lecieć na last minute zimą?', a: 'Zimą najwięcej ofert last minute jest do Egiptu, na Wyspy Kanaryjskie, do Emiratów, a z dalszych kierunków do Tajlandii, na Dominikanę i Zanzibar.' },
        { q: 'Czy ceny są za osobę?', a: 'Tak. Podajemy cenę za jedną osobę za cały pobyt z przelotem. Liczbę osób i pokój wybierasz na wakacje.pl po kliknięciu w ofertę.' },
      ];
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <Crumbs items={country ? [{ name: 'Last minute', url: '/last-minute/' }, { name: country.name }] : [{ name: 'Last minute' }]} />
          <div className="hero-panel lm-hero">
            <span className="eyebrow">Wylot w najbliższych dniach</span>
            <h1>{country ? <>Last minute {country.content?.loc}</> : 'Last minute: wakacje na ostatnią chwilę'}</h1>
            <p className="lead">
              {country
                ? `Przecenione oferty z wylotem w najbliższych tygodniach. Wybierz termin wylotu, wyżywienie i budżet, a lista od razu się zawęzi.`
                : 'Przecenione oferty kilkudziesięciu biur podróży z wylotem w najbliższych dniach. Wybierz, kiedy możesz lecieć i ile chcesz wydać, a lista od razu się zawęzi.'}
            </p>
          </div>
        </div>
      </section>
      <div className="wrap"><CategoryBar active="last-minute" /></div>
      <div className="wrap section-sm">
        <LastMinuteBrowser countries={list} initialCountry={apiName} />
      </div>
      <div className="wrap section-sm">
        <div className="sec-head"><div><span className="eyebrow">Na skróty</span><h2>Last minute według kierunków</h2></div></div>
        <div className="chips">
          {list.map((c) => <a key={c.slug} className="chip chip-light" href={`/last-minute/${c.slug}/`}>Last minute {c.name}</a>)}
        </div>
      </div>
      <div className="wrap section-sm">
        <div className="layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <article className="prose" style={{ maxWidth: 860 }}>
            <h2>{country ? `Jak kupić dobre last minute ${to}?` : 'Jak kupić dobre last minute?'}</h2>
            <p>Najlepsze okazje znikają w kilka godzin, dlatego warto mieć z góry ustalone trzy rzeczy: od kiedy możesz wylecieć, z których lotnisk dasz radę wystartować i jaki masz budżet na osobę. Im bardziej elastyczny termin i lotnisko, tym większa szansa na dużą przecenę.</p>
            <p>Zwracaj uwagę na to, co jest w cenie: wyżywienie, transfer z lotniska i bagaż rejestrowany. Oferta all inclusive za kilkaset złotych więcej często wychodzi taniej niż śniadania i jedzenie na mieście, szczególnie w Egipcie i Turcji.</p>
            {country && (
              <p>Zanim zarezerwujesz, sprawdź <a href={`/wakacje/${country.slug}/`}>przewodnik po kierunku: {country.name}</a>, czyli pogodę w danym miesiącu, regiony i dokumenty potrzebne do wjazdu.{country.content?.regions?.length ? ' ' : ''}</p>
            )}
            <h2>Najczęstsze pytania</h2>
            <Faq items={faq} />
          </article>
        </div>
      </div>
    </>
  );
}
