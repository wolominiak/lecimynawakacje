import { getCountry, wakacjeCountryId } from './data';
import type { DealCfg, LmCountry } from '@/components/LastMinuteBrowser';

// Kategorie wyjazdów: pasek z ikonami na stronie głównej + strony z wyszukiwarką ofert.
export type CatIcon = 'bolt' | 'infinity' | 'wallet' | 'beach' | 'palm' | 'bus' | 'ship' | 'plane' | 'bed' | 'car' | 'ticket' | 'spark' | 'party' | 'heart';
export type Cat = { slug: string; label: string; href: string; icon: CatIcon };

const TODAY = new Date().toISOString().slice(0, 10);

export const CATEGORIES: Cat[] = [
  ...(TODAY <= '2027-01-01' ? [{ slug: 'sylwester', label: 'Sylwester', href: '/sylwester/', icon: 'party' as CatIcon }] : []),
  ...(TODAY <= '2027-02-14' ? [{ slug: 'walentynki', label: 'Walentynki', href: '/walentynki/', icon: 'heart' as CatIcon }] : []),
  { slug: 'last-minute', label: 'Last minute', href: '/last-minute/', icon: 'bolt' },
  { slug: 'all-inclusive', label: 'All inclusive', href: '/all-inclusive/', icon: 'infinity' },
  { slug: 'tanie-wakacje', label: 'Do 2000 zł', href: '/tanie-wakacje/', icon: 'wallet' },
  { slug: 'wakacje-nad-morzem', label: 'Plaża', href: '/wakacje-nad-morzem/', icon: 'beach' },
  { slug: 'egzotyka', label: 'Egzotyka', href: '/egzotyka/', icon: 'palm' },
  { slug: 'wycieczki-objazdowe', label: 'Objazdowe', href: '/wycieczki-objazdowe/', icon: 'bus' },
  { slug: 'rejsy', label: 'Rejsy', href: '/rejsy/', icon: 'ship' },
  { slug: 'loty', label: 'Loty', href: '/loty/', icon: 'plane' },
  { slug: 'hotele', label: 'Hotele', href: '/hotele/', icon: 'bed' },
  { slug: 'wynajem-auta', label: 'Auta', href: '/wynajem-auta/', icon: 'car' },
  { slug: 'wycieczki-fakultatywne', label: 'Wycieczki', href: '/wycieczki-fakultatywne/', icon: 'ticket' },
  { slug: 'asystent', label: 'Asystent AI', href: '/asystent/', icon: 'spark' },
];

export type DealCat = {
  slug: string;
  title: string; // <title>
  h1: string;
  lead: string;
  eyebrow: string;
  cfg: DealCfg;
  countries: string[]; // slugi krajów doczytywanych osobno
  globalPool: boolean;
  intro: string[];
  tips: { title: string; text: string }[];
  faq: { q: string; a: string }[];
};

const SEA = ['egipt', 'turcja', 'grecja', 'hiszpania', 'tunezja', 'cypr', 'bulgaria', 'chorwacja', 'albania', 'portugalia', 'wlochy', 'malta', 'maroko', 'czarnogora'];
const EXOTIC = ['tajlandia', 'dominikana', 'tanzania', 'meksyk', 'malediwy', 'sri-lanka', 'wietnam', 'kenia', 'indonezja', 'zjednoczone-emiraty-arabskie', 'oman', 'mauritius', 'seszele', 'jamajka', 'kostaryka', 'wyspy-zielonego-przyladka', 'malezja', 'filipiny', 'madagaskar', 'brazylia'];
const TOURS = ['wlochy', 'grecja', 'hiszpania', 'portugalia', 'maroko', 'japonia', 'chiny', 'indie', 'peru', 'usa', 'gruzja', 'uzbekistan', 'armenia', 'islandia', 'norwegia', 'francja', 'irlandia', 'wielka-brytania', 'wietnam', 'tajlandia', 'meksyk', 'sri-lanka', 'argentyna', 'rpa', 'namibia', 'kambodza', 'nepal', 'turcja', 'egipt', 'chorwacja'];

export const DEAL_CATS: Record<string, DealCat> = {
  'all-inclusive': {
    slug: 'all-inclusive',
    title: 'All inclusive - wakacje z wyżywieniem i napojami w cenie',
    h1: 'Wakacje all inclusive',
    eyebrow: 'All inclusive',
    lead: 'Hotele z jedzeniem i napojami przez cały dzień, z przelotem z Polski. Wybierz kraj, miesiąc i budżet, a lista od razu się zawęzi.',
    cfg: { mode: 'all', service: 1, label: 'all inclusive', cmp: 'all-inclusive', allLink: '/go/all-inclusive/' },
    countries: SEA.concat(['zjednoczone-emiraty-arabskie', 'dominikana', 'meksyk', 'tanzania', 'kenia', 'wyspy-zielonego-przyladka']),
    globalPool: true,
    intro: [
      'All inclusive to najwygodniejszy sposób na wypoczynek: posiłki, przekąski i napoje są w cenie, więc na miejscu nie trzeba liczyć wydatków. Polacy najczęściej wybierają Egipt, Turcję, Grecję, Bułgarię i Tunezję, a zimą Egipt, Emiraty i Wyspy Kanaryjskie.',
      'Pakiet all inclusive w każdym hotelu wygląda trochę inaczej. Zwykle obejmuje trzy główne posiłki w formie bufetu, przekąski i lokalne napoje. Alkohole importowane, restauracje à la carte czy świeżo wyciskane soki bywają dodatkowo płatne, dlatego warto przeczytać opis wyżywienia w ofercie.',
    ],
    tips: [
      { title: 'Ultra all inclusive', text: 'Wersja rozszerzona: zwykle więcej restauracji, importowane alkohole i dłuższe godziny barów. Opłaca się, jeśli dużo czasu spędzasz w hotelu.' },
      { title: 'Z dziećmi', text: 'Szukaj hoteli z aquaparkiem i miniklubem. W Turcji, Egipcie i Bułgarii takich obiektów jest najwięcej.' },
      { title: 'Poza sezonem', text: 'Najtańsze all inclusive jest w maju, czerwcu i od połowy września, gdy ceny spadają, a pogoda wciąż dopisuje.' },
    ],
    faq: [
      { q: 'Co jest w cenie all inclusive?', a: 'Zwykle śniadania, obiady i kolacje w formie bufetu, przekąski między posiłkami oraz lokalne napoje, także alkoholowe. Dokładny zakres zależy od hotelu i jest opisany w ofercie.' },
      { q: 'Gdzie najtaniej na all inclusive?', a: 'Najniższe ceny ma zwykle Egipt, Turcja, Tunezja i Bułgaria, szczególnie poza szczytem sezonu i w ofertach last minute.' },
      { q: 'Czy all inclusive się opłaca?', a: 'Jeśli planujesz spędzać dużo czasu w hotelu i nie chcesz pilnować wydatków, zwykle tak. Gdy chcesz codziennie zwiedzać i jeść na mieście, lepsze może być śniadanie albo HB.' },
    ],
  },
  'tanie-wakacje': {
    slug: 'tanie-wakacje',
    title: 'Tanie wakacje do 2000 zł za osobę - aktualne oferty',
    h1: 'Tanie wakacje do 2000 zł',
    eyebrow: 'Tanie wakacje',
    lead: 'Wyjazdy z przelotem z Polski do 2000 zł za osobę. Wybierz kraj, termin i wyżywienie, a pokażemy najtańsze oferty biur podróży.',
    cfg: { mode: 'all', maxPrice: 2000, label: 'do 2000 zł', cmp: 'tanie-wakacje', allLink: '/go/wakacje/' },
    countries: SEA.concat(['zjednoczone-emiraty-arabskie', 'wyspy-zielonego-przyladka']),
    globalPool: true,
    intro: [
      'Tanie wakacje za granicą wciąż są możliwe. Najwięcej ofert do 2000 zł za osobę z przelotem jest do Egiptu, Turcji, Tunezji, Bułgarii i Albanii, szczególnie wiosną, jesienią i w ofertach last minute.',
      'Cena za osobę zwykle dotyczy dwóch dorosłych w pokoju. Na tańsze wyjazdy warto patrzeć elastycznie: wylot w środku tygodnia, krótszy pobyt albo hotel dalej od plaży potrafią obniżyć cenę o kilkaset złotych.',
    ],
    tips: [
      { title: 'Elastyczny termin', text: 'Przesunięcie wylotu o kilka dni często daje dużą różnicę w cenie. Porównaj sąsiednie terminy w filtrze miesięcy.' },
      { title: 'Inne lotnisko', text: 'Oferty z Katowic, Wrocławia czy Poznania bywają tańsze niż z Warszawy. Sprawdź filtr "Wylot z".' },
      { title: 'Last minute', text: 'Najtańsze oferty pojawiają się kilka dni przed wylotem. Zajrzyj też na stronę last minute.' },
    ],
    faq: [
      { q: 'Gdzie pojechać tanio za granicę?', a: 'Najtańsze wczasy z przelotem są zwykle do Egiptu, Turcji, Tunezji, Bułgarii i Albanii. Zimą najtaniej jest w Egipcie.' },
      { q: 'Kiedy są najtańsze wakacje?', a: 'Poza szczytem sezonu: w maju, czerwcu, od połowy września do października oraz w ofertach last minute. Najdrożej jest w lipcu, sierpniu i w okresie świąt.' },
      { q: 'Czy cena jest za osobę?', a: 'Tak, ceny na liście są za jedną osobę przy zakwaterowaniu dwóch dorosłych. Dokładną cenę dla Twojej liczby osób zobaczysz po kliknięciu w ofertę.' },
    ],
  },
  'wakacje-nad-morzem': {
    slug: 'wakacje-nad-morzem',
    title: 'Wakacje nad morzem - wczasy przy plaży z przelotem',
    h1: 'Wakacje nad morzem',
    eyebrow: 'Plaża',
    lead: 'Wczasy przy plaży nad Morzem Śródziemnym, Czerwonym i Egejskim, z przelotem z Polski. Wybierz kraj, miesiąc i wyżywienie.',
    cfg: { mode: 'all', kind: 'wypoczynek', label: 'nad morzem', cmp: 'nad-morzem', allLink: '/go/wakacje/' },
    countries: SEA,
    globalPool: false,
    intro: [
      'Wakacje nad ciepłym morzem to wciąż najpopularniejszy wybór Polaków. Latem najcieplejsza woda jest w Egipcie, Turcji, na Cyprze i w Grecji, a od listopada do marca kąpać się można głównie w Egipcie i na dalszych kierunkach.',
      'Wybierając hotel, sprawdź odległość od plaży i rodzaj plaży: piaszczysta jest wygodniejsza dla dzieci, a kamienista ma zwykle czystszą wodę. W Egipcie warto szukać hoteli z własną rafą koralową.',
    ],
    tips: [
      { title: 'Woda najcieplejsza', text: 'We wrześniu morze jest najcieplejsze w całym roku, a plaże są już luźniejsze niż w sierpniu.' },
      { title: 'Pierwsza linia', text: 'Hotel przy samej plaży kosztuje więcej, ale oszczędza czas i jest wygodny przy dzieciach.' },
      { title: 'Rafa', text: 'W Egipcie hotel z rafą przy plaży pozwala snurkować bez wykupywania wycieczek.' },
    ],
    faq: [
      { q: 'Gdzie jest najcieplejsze morze w maju?', a: 'W maju najcieplejsze morze jest w Egipcie (ok. 25 stopni). Na Cyprze i w południowej Turcji woda ma już ok. 21-22 stopni.' },
      { q: 'Gdzie nad morze z dziećmi?', a: 'Dobre są Bułgaria, Turcja, Grecja (Kreta, Rodos, Kos) i Egipt w hotelach z piaszczystą plażą, łagodnym zejściem do wody i aquaparkiem.' },
    ],
  },
  egzotyka: {
    slug: 'egzotyka',
    title: 'Wakacje w egzotyce - Tajlandia, Zanzibar, Dominikana, Meksyk',
    h1: 'Egzotyczne wakacje',
    eyebrow: 'Egzotyka',
    lead: 'Tajlandia, Zanzibar, Dominikana, Meksyk, Malediwy, Sri Lanka i Emiraty z przelotem z Polski. Wybierz kraj, miesiąc i budżet.',
    cfg: { mode: 'all', label: 'egzotycznych', cmp: 'egzotyka', allLink: '/go/wakacje/' },
    countries: EXOTIC,
    globalPool: false,
    intro: [
      'Egzotyka to najlepszy pomysł na polską zimę: od listopada do marca w Tajlandii, na Zanzibarze, Dominikanie, w Meksyku i na Malediwach panuje pora sucha, a temperatura nie spada poniżej 28 stopni.',
      'Do większości tych krajów lata się z przesiadką albo czarterem 9-12 godzin. Warto zaplanować co najmniej 10 dni, sprawdzić wymagania wizowe i szczepienia oraz pamiętać o ubezpieczeniu z wysoką sumą kosztów leczenia.',
    ],
    tips: [
      { title: 'Pora sucha', text: 'Każdy z tych krajów ma porę deszczową w innych miesiącach. Sprawdź zakładkę "Kiedy jechać" przy wybranym kraju.' },
      { title: 'Dokumenty', text: 'Paszport ważny co najmniej 6 miesięcy. Część krajów wymaga wizy lub elektronicznego zezwolenia przed wylotem.' },
      { title: 'Internet', text: 'Karta eSIM na dany kraj działa od razu po wylądowaniu i jest dużo tańsza niż roaming.' },
    ],
    faq: [
      { q: 'Gdzie na egzotyczne wakacje zimą?', a: 'Zimą pogoda jest najlepsza w Tajlandii, na Zanzibarze, Dominikanie, w Meksyku, na Sri Lance, Malediwach i w Emiratach.' },
      { q: 'Ile kosztują egzotyczne wakacje?', a: 'Zwykle od ok. 5-6 tysięcy złotych za osobę za tydzień z przelotem, więcej w okresie świąt i ferii. Aktualne ceny widzisz na liście powyżej.' },
    ],
  },
  'wycieczki-objazdowe': {
    slug: 'wycieczki-objazdowe',
    title: 'Wycieczki objazdowe z przelotem - zwiedzanie z przewodnikiem',
    h1: 'Wycieczki objazdowe',
    eyebrow: 'Zwiedzanie',
    lead: 'Zwiedzanie z polskim pilotem: Włochy, Hiszpania, Maroko, Japonia, Peru, Islandia i wiele innych. Program, noclegi i przejazdy w cenie.',
    cfg: { mode: 'all', kind: 'objazd', label: 'wycieczek objazdowych', cmp: 'objazdowe', allLink: '/go/wakacje/' },
    countries: TOURS,
    globalPool: false,
    intro: [
      'Wycieczka objazdowa to sposób na zobaczenie kilku miast i regionów w jeden wyjazd bez planowania logistyki. W cenie są zwykle przelot, noclegi, przejazdy autokarem, opieka polskiego pilota i program zwiedzania.',
      'Przed wyborem sprawdź program dzień po dniu: ile godzin spędza się w autokarze, jakie bilety wstępu są w cenie, a za co trzeba dopłacić na miejscu. Objazdówki bywają intensywne, więc dobrze, gdy w programie jest dzień wolny.',
    ],
    tips: [
      { title: 'Wyżywienie', text: 'Na objazdach zwykle w cenie są śniadania lub śniadania i obiadokolacje. Resztę posiłków je się na trasie.' },
      { title: 'Bilety wstępu', text: 'Sprawdź, czy wstępy do muzeów i zabytków są w cenie. Jeśli nie, doliczy się je do budżetu.' },
      { title: 'Połączenie z wypoczynkiem', text: 'Wiele biur ma objazd z kilkoma dniami w hotelu przy plaży na końcu. To dobry kompromis.' },
    ],
    faq: [
      { q: 'Co jest w cenie wycieczki objazdowej?', a: 'Zwykle przelot, noclegi, przejazdy, opieka pilota i program zwiedzania, często też część posiłków. Bilety wstępu bywają dodatkowo płatne. Szczegóły są w programie oferty.' },
      { q: 'Dla kogo są wycieczki objazdowe?', a: 'Dla osób, które chcą dużo zobaczyć i nie chcą same organizować transportu i noclegów, także dla podróżujących samotnie.' },
    ],
  },
};

/** Kraje do doczytania dla kategorii (nazwa tak, jak zwraca ją wakacje.pl) */
const WNAME: Record<string, string> = { 'zjednoczone-emiraty-arabskie': 'Emiraty Arabskie', usa: 'USA', 'wielka-brytania': 'Wielka Brytania' };
export function catCountries(slugs: string[]): LmCountry[] {
  return slugs.map((slug) => ({ slug, name: WNAME[slug] || getCountry(slug)?.name || slug, id: wakacjeCountryId(slug)! })).filter((c) => c.id);
}
