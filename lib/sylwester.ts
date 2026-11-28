import { allRoutes } from './flights';

// Sylwester za granicą: kierunki, loty na przełom roku, porady.
// Oferty biur: wakacje.pl ma osobny filtr "?sylwester" (przekierowanie /go/sylwester/).
// API widgetu nie filtruje dat, więc listy ofert nie da się zbudować z API.

export const NY = { year: 2027, dep: '2026-12-30', ret: '2027-01-02', last: '2027-01-01' };
/** Sekcja widoczna do Nowego Roku (strona buduje się co godzinę) */
export const nyActive = () => new Date().toISOString().slice(0, 10) <= NY.last;

export type NyWarm = { name: string; path: string; img: string; temp: string; text: string; guide: string };
export const NY_WARM: NyWarm[] = [
  { name: 'Egipt', path: 'egipt', img: 'egipt', temp: 'ok. 23°C w dzień', guide: '/wakacje/egipt/', text: 'Najtańszy ciepły sylwester z Polski. Hotele all inclusive w Hurghadzie i Marsa Alam robią gala dinner i pokazy na plaży.' },
  { name: 'Wyspy Kanaryjskie', path: 'wyspy-kanaryjskie', img: 'hiszpania-teneryfa', temp: 'ok. 21°C', guide: '/wakacje/hiszpania/teneryfa/', text: 'Europejska pogoda jak wiosną. O północy, po hiszpańsku, je się 12 winogron do uderzeń zegara.' },
  { name: 'Dubaj i Emiraty', path: 'zjednoczone-emiraty-arabskie', img: 'zjednoczone-emiraty-arabskie-dubaj', temp: 'ok. 24°C', guide: '/wakacje/zjednoczone-emiraty-arabskie/', text: 'Pokaz fajerwerków przy Burj Khalifa to jeden z największych na świecie. Miejsca z widokiem trzeba rezerwować wcześniej.' },
  { name: 'Madera', path: 'madera', img: 'portugalia-madera', temp: 'ok. 19°C', guide: '/wakacje/portugalia/madera/', text: 'Słynne fajerwerki nad zatoką w Funchal, oglądane z hotelowych tarasów i statków w porcie.' },
  { name: 'Zanzibar', path: 'zanzibar', img: 'tanzania-zanzibar', temp: 'ok. 31°C', guide: '/wakacje/tanzania/zanzibar/', text: 'Rajskie plaże i ciepłe morze. Koniec grudnia to początek pory suchej, więc pogoda zwykle dopisuje.' },
  { name: 'Tajlandia', path: 'tajlandia', img: 'tajlandia-phuket', temp: 'ok. 31°C', guide: '/wakacje/tajlandia/', text: 'Imprezy na plażach Phuket i Koh Samui albo fajerwerki nad rzeką w Bangkoku. Szczyt sezonu, ceny rosną.' },
  { name: 'Dominikana', path: 'dominikana', img: 'dominikana-punta-cana', temp: 'ok. 29°C', guide: '/wakacje/dominikana/', text: 'Karaibskie all inclusive w Punta Cana. Długi lot, więc warto jechać na 9 dni lub dłużej.' },
  { name: 'Meksyk', path: 'meksyk', img: 'meksyk-riwiera-maya', temp: 'ok. 28°C', guide: '/wakacje/meksyk/', text: 'Riwiera Maya z plażami Cancun i Playa del Carmen. Sylwester w hotelu albo w klubach Playa.' },
  { name: 'Cypr', path: 'cypr', img: 'cypr', temp: 'ok. 17°C', guide: '/wakacje/cypr/', text: 'Spokojniejszy sylwester w łagodnym klimacie, krótki lot i dużo tanich połączeń z Polski.' },
  { name: 'Malta', path: 'malta', img: 'malta', temp: 'ok. 16°C', guide: '/wakacje/malta/', text: 'Sylwester w Valletcie z koncertem i fajerwerkami nad portem. Dobre połączenie miasta i morza.' },
];

export type NyCity = { name: string; iata: string; img: string; text: string; guide?: string };
export const NY_CITIES: NyCity[] = [
  { name: 'Rzym', iata: 'ROM', img: 'wlochy-rzym', guide: '/wakacje/wlochy/rzym/', text: 'Koncert na Circo Massimo i fajerwerki nad Tybrem.' },
  { name: 'Barcelona', iata: 'BCN', img: 'hiszpania-barcelona', guide: '/wakacje/hiszpania/barcelona/', text: 'Pokaz przy Magicznej Fontannie na Montjuïc.' },
  { name: 'Lizbona', iata: 'LIS', img: 'portugalia-lizbona', guide: '/wakacje/portugalia/lizbona/', text: 'Zabawa na Praça do Comércio nad Tagiem.' },
  { name: 'Praga', iata: 'PRG', img: 'czechy-praga', guide: '/wakacje/czechy/praga/', text: 'Fajerwerki nad Wełtawą, widok z mostów i wzgórza Letná.' },
  { name: 'Wiedeń', iata: 'VIE', img: 'austria-wieden', guide: '/wakacje/austria/wieden/', text: 'Szlak sylwestrowy w centrum i walc o północy.' },
  { name: 'Budapeszt', iata: 'BUD', img: 'wegry-budapeszt', guide: '/wakacje/wegry/budapeszt/', text: 'Fajerwerki nad Dunajem i imprezy w termach.' },
  { name: 'Berlin', iata: 'BER', img: 'niemcy-berlin', guide: '/wakacje/niemcy/berlin/', text: 'Wielka impreza pod Bramą Brandenburską.' },
  { name: 'Londyn', iata: 'LON', img: 'wielka-brytania-londyn', guide: '/wakacje/wielka-brytania/londyn/', text: 'Pokaz nad Tamizą przy London Eye, wejście na bilety.' },
  { name: 'Paryż', iata: 'PAR', img: 'francja-paryz', guide: '/wakacje/francja/paryz/', text: 'Pokaz świetlny na Łuku Triumfalnym i Polach Elizejskich.' },
  { name: 'Reykjavik', iata: 'REK', img: 'islandia', guide: '/wakacje/islandia/', text: 'Ogniska w dzielnicach i fajerwerki odpalane przez całe miasto.' },
];

/** Najniższa cena lotu w grudniu do danego miasta (z dziennych danych), z lotniskiem wylotu */
export function decemberFlight(iata: string): { price: number; o: string; oName: string } | null {
  let best: { price: number; o: string; oName: string } | null = null;
  for (const r of allRoutes()) {
    if (r.d !== iata) continue;
    const p = r.months?.['2026-12'];
    if (p && (!best || p < best.price)) best = { price: p, o: r.o, oName: r.oName };
  }
  return best;
}

export const NY_TIPS = [
  { title: 'Rezerwuj teraz', text: 'Terminy z wylotem 27-31 grudnia schodzą najszybciej w całym sezonie zimowym. Im bliżej świąt, tym mniej wolnych miejsc i wyższe ceny.' },
  { title: 'Gala dinner', text: 'W wielu hotelach kolacja sylwestrowa jest obowiązkowa i płatna osobno, nawet przy all inclusive. Sprawdź to w opisie oferty przed rezerwacją.' },
  { title: 'Wylot po świętach', text: 'Najtańsze są zwykle wyjazdy z wylotem 27-28 grudnia i powrotem 3-4 stycznia. Wylot 30 grudnia jest najdroższy.' },
  { title: 'Fajerwerki z widokiem', text: 'W Dubaju, Londynie i na Maderze najlepsze miejsca do oglądania pokazu są płatne albo wymagają wcześniejszej rezerwacji.' },
];

export const NY_FAQ = [
  { q: 'Gdzie na sylwestra w ciepłe kraje?', a: 'Najpopularniejsze są Egipt, Wyspy Kanaryjskie, Dubaj, Madera i Zanzibar. Najtaniej jest w Egipcie, najcieplej na Zanzibarze, w Tajlandii i na Karaibach.' },
  { q: 'Gdzie są najładniejsze fajerwerki sylwestrowe?', a: 'Najsłynniejsze pokazy są w Dubaju przy Burj Khalifa, w Funchal na Maderze, w Londynie nad Tamizą i w Sydney. W Europie warto też wybrać Rzym, Pragę lub Budapeszt.' },
  { q: 'Czy kolacja sylwestrowa jest w cenie all inclusive?', a: 'Często nie. Hotele organizują gala dinner, który bywa obowiązkowy i płatny osobno. Informacja jest w opisie oferty albo w warunkach hotelu.' },
  { q: 'Kiedy kupić wyjazd na sylwestra?', a: 'Najlepiej jak najszybciej. Oferty na przełom roku wyprzedają się wcześniej niż inne terminy zimowe, a last minute na sylwestra zdarza się rzadko i zwykle nie jest tanie.' },
  { q: 'Na ile dni jechać na sylwestra?', a: 'Na city break wystarczą 3-4 dni (np. 30 grudnia - 2 stycznia). Na ciepłe kraje warto jechać na 7 dni, a na egzotykę z długim lotem na 9-12 dni.' },
];
