import { allRoutes } from './flights';

// Strony okazjonalne (sylwester, walentynki): kierunki, loty na konkretne dni, porady.
// API widgetu wakacje.pl nie filtruje dat, więc zamiast listy ofert są linki do wyszukiwarki biur.

export type OccWarm = { name: string; path: string; img: string; temp: string; text: string; guide: string };
export type OccCity = { name: string; iata: string; img: string; text: string; guide?: string };
export type Occasion = {
  slug: string; label: string; eyebrow: string; h1: string; lead: string;
  metaTitle: string; metaDesc: string;
  until: string;              // ostatni dzień, w którym strona jest promowana
  month: string;              // miesiąc cen lotów, np. 2026-12
  dep: string; ret: string; datesLabel: string;
  allHref: string; allLabel: string;
  offersTitle: string; offersLabel: string; offersNote: string;
  warmTitle: string; warmEyebrow: string; warmNote: string; offerLabel: string; offerHref: (w: OccWarm) => string;
  cityTitle: string; cityNote: string;
  warm: OccWarm[]; cities: OccCity[];
  introTitle: string; intro: string[];
  tips: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  home: { title: string; text: string };
};

const today = () => new Date().toISOString().slice(0, 10);
export const occActive = (o: Occasion) => today() <= o.until;

export const SYLWESTER: Occasion = {
  slug: 'sylwester', label: 'Sylwester', eyebrow: 'Sylwester 2026/2027', h1: 'Sylwester za granicą',
  lead: 'Przywitaj 2027 rok na plaży w Egipcie, pod fajerwerkami w Dubaju albo na city breaku w Rzymie. Zebraliśmy kierunki, oferty biur podróży na przełom roku i loty na sylwestra.',
  metaTitle: 'Sylwester 2026/2027 za granicą - oferty w ciepłych krajach i city break',
  metaDesc: 'Gdzie na sylwestra za granicę? Oferty biur podróży na przełom roku w Egipcie, na Kanarach, w Dubaju i na Maderze oraz tanie loty na sylwestra do Rzymu, Pragi, Barcelony i Londynu.',
  until: '2027-01-01', month: '2026-12', dep: '2026-12-30', ret: '2027-01-02', datesLabel: '30.12-02.01',
  allHref: '/go/sylwester/', allLabel: 'Wszystkie oferty sylwestrowe',
  offersTitle: 'Oferty na sylwestra', offersLabel: 'sylwestrowych',
  offersNote: 'Wyjazdy, w których pobyt obejmuje noc z 31 grudnia na 1 stycznia, od kilkudziesięciu biur podróży. Lista odświeża się kilka razy dziennie, aktualną cenę zobaczysz po kliknięciu.',
  warmEyebrow: 'Ciepłe kraje', warmTitle: 'Sylwester na plaży',
  warmNote: 'Przycisk "Oferty na sylwestra" otwiera wyszukiwarkę wakacje.pl z terminami na przełom roku od kilkudziesięciu biur podróży.',
  offerLabel: 'Oferty na sylwestra', offerHref: (w) => `/go/sylwester/${w.path}/`,
  cityTitle: 'Sylwester w europejskim mieście',
  cityNote: 'Loty z wylotem 30 grudnia i powrotem 2 stycznia dla 2 osób. Cena "od" to najtańszy lot w grudniu z naszych codziennych danych, na przełom roku bywa wyższa.',
  warm: [
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
],
  cities: [
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
],
  introTitle: 'Jak zaplanować sylwestra za granicą',
  intro: [
    'Wyjazd na przełom roku to najbardziej oblegany termin zimy. Biura podróży przygotowują osobne oferty sylwestrowe, a hotele organizują uroczyste kolacje i zabawy do rana. Najwięcej Polaków wybiera Egipt i Wyspy Kanaryjskie, coraz popularniejsze są też Dubaj, Madera i Zanzibar.',
    'Jeśli wolisz miasto, wystarczy krótki wyjazd: tani lot, hotel blisko centrum i plan, gdzie oglądać fajerwerki. Rzym, Praga, Budapeszt i Barcelona są blisko i mają tanie połączenia z kilku polskich lotnisk.',
  ],
  tips: [
  { title: 'Rezerwuj teraz', text: 'Terminy z wylotem 27-31 grudnia schodzą najszybciej w całym sezonie zimowym. Im bliżej świąt, tym mniej wolnych miejsc i wyższe ceny.' },
  { title: 'Gala dinner', text: 'W wielu hotelach kolacja sylwestrowa jest obowiązkowa i płatna osobno, nawet przy all inclusive. Sprawdź to w opisie oferty przed rezerwacją.' },
  { title: 'Wylot po świętach', text: 'Najtańsze są zwykle wyjazdy z wylotem 27-28 grudnia i powrotem 3-4 stycznia. Wylot 30 grudnia jest najdroższy.' },
  { title: 'Fajerwerki z widokiem', text: 'W Dubaju, Londynie i na Maderze najlepsze miejsca do oglądania pokazu są płatne albo wymagają wcześniejszej rezerwacji.' },
],
  faq: [
  { q: 'Gdzie na sylwestra w ciepłe kraje?', a: 'Najpopularniejsze są Egipt, Wyspy Kanaryjskie, Dubaj, Madera i Zanzibar. Najtaniej jest w Egipcie, najcieplej na Zanzibarze, w Tajlandii i na Karaibach.' },
  { q: 'Gdzie są najładniejsze fajerwerki sylwestrowe?', a: 'Najsłynniejsze pokazy są w Dubaju przy Burj Khalifa, w Funchal na Maderze, w Londynie nad Tamizą i w Sydney. W Europie warto też wybrać Rzym, Pragę lub Budapeszt.' },
  { q: 'Czy kolacja sylwestrowa jest w cenie all inclusive?', a: 'Często nie. Hotele organizują gala dinner, który bywa obowiązkowy i płatny osobno. Informacja jest w opisie oferty albo w warunkach hotelu.' },
  { q: 'Kiedy kupić wyjazd na sylwestra?', a: 'Najlepiej jak najszybciej. Oferty na przełom roku wyprzedają się wcześniej niż inne terminy zimowe, a last minute na sylwestra zdarza się rzadko i zwykle nie jest tanie.' },
  { q: 'Na ile dni jechać na sylwestra?', a: 'Na city break wystarczą 3-4 dni (np. 30 grudnia - 2 stycznia). Na ciepłe kraje warto jechać na 7 dni, a na egzotykę z długim lotem na 9-12 dni.' },
],
  home: { title: 'Sylwester za granicą', text: 'Nowy Rok na plaży w Egipcie, pod fajerwerkami w Dubaju albo na city breaku w Rzymie i Pradze.' },
};

export const WALENTYNKI: Occasion = {
  slug: 'walentynki', label: 'Walentynki', eyebrow: 'Walentynki 2027', h1: 'Walentynki za granicą',
  lead: 'Romantyczny wyjazd we dwoje: city break w Paryżu, Wenecji lub Lizbonie albo kilka dni słońca na Maderze, Kanarach czy Malediwach. Walentynki 2027 wypadają w niedzielę, więc wystarczy długi weekend.',
  metaTitle: 'Walentynki 2027 za granicą - romantyczny wyjazd we dwoje, loty i oferty',
  metaDesc: 'Gdzie na walentynki za granicę? Romantyczne miasta na długi weekend 12-15 lutego (Paryż, Wenecja, Rzym, Lizbona, Praga) i ciepłe kraje dla par: Madera, Kanary, Egipt, Malediwy.',
  until: '2027-02-14', month: '2027-02', dep: '2027-02-12', ret: '2027-02-15', datesLabel: '12-15.02',
  allHref: '/go/walentynki/', allLabel: 'Walentynkowe oferty biur',
  offersTitle: 'Oferty na walentynki', offersLabel: 'walentynkowych',
  offersNote: 'Wyjazdy, w których pobyt obejmuje 14 lutego, od kilkudziesięciu biur podróży. Lista odświeża się kilka razy dziennie, aktualną cenę zobaczysz po kliknięciu.',
  warmEyebrow: 'Słońce zimą', warmTitle: 'Walentynki w ciepłych krajach',
  warmNote: 'Przycisk "Oferty wyjazdów" otwiera wyszukiwarkę wakacje.pl z ofertami do danego kraju od kilkudziesięciu biur podróży. Wybierz termin w lutym.',
  offerLabel: 'Oferty wyjazdów', offerHref: (w) => `/go/wakacje/${w.path}/`,
  cityTitle: 'Romantyczny city break',
  cityNote: 'Loty na długi weekend walentynkowy: wylot w piątek 12 lutego, powrót w poniedziałek 15 lutego, dla 2 osób. Cena "od" to najtańszy lot w lutym z naszych codziennych danych.',
  warm: [
    { name: 'Madera', path: 'madera', img: 'portugalia-madera', temp: 'ok. 19°C', guide: '/wakacje/portugalia/madera/', text: 'Wiosna w środku zimy: kwitnące ogrody, klify nad oceanem i romantyczne kolacje w Funchal.' },
    { name: 'Wyspy Kanaryjskie', path: 'wyspy-kanaryjskie', img: 'hiszpania-teneryfa', temp: 'ok. 21°C', guide: '/wakacje/hiszpania/teneryfa/', text: 'Słońce, plaże i zachody słońca nad oceanem, a lot trwa tylko około 5 godzin.' },
    { name: 'Egipt', path: 'egipt', img: 'egipt-marsa-alam', temp: 'ok. 22°C', guide: '/wakacje/egipt/', text: 'Najtańsze ciepłe walentynki. Hotele dla dorosłych (adults only) w Hurghadzie i Marsa Alam to spokój bez dzieci.' },
    { name: 'Malediwy', path: 'malediwy', img: 'malediwy', temp: 'ok. 30°C', guide: '/wakacje/malediwy/', text: 'Klasyka podróży poślubnych: domki nad wodą, rafy i biały piasek. Luty to pora sucha.' },
    { name: 'Dubaj i Emiraty', path: 'zjednoczone-emiraty-arabskie', img: 'zjednoczone-emiraty-arabskie-dubaj', temp: 'ok. 25°C', guide: '/wakacje/zjednoczone-emiraty-arabskie/', text: 'Kolacja z widokiem z wieżowca, pustynne safari o zachodzie słońca i luksusowe plaże.' },
    { name: 'Maroko', path: 'maroko', img: 'maroko-marrakesz', temp: 'ok. 20°C', guide: '/wakacje/maroko/', text: 'Nocleg w riadzie w Marrakeszu, hammam we dwoje i kolacja na dachu z widokiem na medynę.' },
    { name: 'Zanzibar', path: 'zanzibar', img: 'tanzania-zanzibar', temp: 'ok. 32°C', guide: '/wakacje/tanzania/zanzibar/', text: 'Turkusowe morze i rajskie plaże. Luty to jeden z najlepszych miesięcy na wyjazd.' },
    { name: 'Mauritius', path: 'mauritius', img: 'mauritius', temp: 'ok. 30°C', guide: '/wakacje/mauritius/', text: 'Luksusowe hotele dla par, laguny i góry. Luty to lato, ale też pora deszczowa, więc licz się z przelotnymi ulewami.' },
    { name: 'Seszele', path: 'seszele', img: 'seszele-la-digue', temp: 'ok. 29°C', guide: '/wakacje/seszele/', text: 'Najpiękniejsze plaże świata na La Digue i Praslin. Drogo, ale na specjalną okazję.' },
    { name: 'Sri Lanka', path: 'sri-lanka', img: 'sri-lanka', temp: 'ok. 30°C', guide: '/wakacje/sri-lanka/', text: 'Plaże południowego wybrzeża, plantacje herbaty i świątynie. Luty to szczyt pory suchej.' },
  ],
  cities: [
    { name: 'Paryż', iata: 'PAR', img: 'francja-paryz', guide: '/wakacje/francja/paryz/', text: 'Miasto zakochanych: kolacja z widokiem na wieżę Eiffla i spacer nad Sekwaną.' },
    { name: 'Wenecja', iata: 'VCE', img: 'wlochy', guide: '/wakacje/wlochy/', text: 'Gondole i kanały. W lutym trwa karnawał, więc hotele warto rezerwować wcześniej.' },
    { name: 'Rzym', iata: 'ROM', img: 'wlochy-rzym', guide: '/wakacje/wlochy/rzym/', text: 'Moneta do Fontanny di Trevi i włoska kolacja w Zatybrzu.' },
    { name: 'Lizbona', iata: 'LIS', img: 'portugalia-lizbona', guide: '/wakacje/portugalia/lizbona/', text: 'Zachód słońca z punktów widokowych, tramwaj 28 i wieczór z fado.' },
    { name: 'Praga', iata: 'PRG', img: 'czechy-praga', guide: '/wakacje/czechy/praga/', text: 'Most Karola o świcie i romantyczne uliczki Malej Strany, blisko i tanio.' },
    { name: 'Wiedeń', iata: 'VIE', img: 'austria-wieden', guide: '/wakacje/austria/wieden/', text: 'Kawiarnie, opera i bale karnawałowe, które trwają do lutego.' },
    { name: 'Budapeszt', iata: 'BUD', img: 'wegry-budapeszt', guide: '/wakacje/wegry/budapeszt/', text: 'Wieczorny rejs po Dunaju i termy Széchenyi we dwoje.' },
    { name: 'Barcelona', iata: 'BCN', img: 'hiszpania-barcelona', guide: '/wakacje/hiszpania/barcelona/', text: 'Gaudí, tapas i spacer po plaży w łagodnej lutowej pogodzie.' },
    { name: 'Amsterdam', iata: 'AMS', img: 'holandia-amsterdam', guide: '/wakacje/holandia/amsterdam/', text: 'Rejs po kanałach przy świecach i klimatyczne kamienice.' },
    { name: 'Werona', iata: 'VRN', img: 'wlochy', guide: '/wakacje/wlochy/', text: 'Balkon Julii i festiwal Verona in Love w okolicach 14 lutego.' },
  ],
  introTitle: 'Jak zaplanować walentynki za granicą',
  intro: [
    'W 2027 roku walentynki wypadają w niedzielę, więc najwygodniej jest wylecieć w piątek 12 lutego i wrócić w poniedziałek. To wystarczy na romantyczny city break w Paryżu, Rzymie czy Pradze, gdzie tanie loty z Polski są przez cały luty.',
    'Jeśli chcecie słońca, najbliżej jest Madera, Kanary i Egipt. Na dłuższy wyjazd we dwoje dobre są Malediwy, Zanzibar i Seszele, gdzie luty to jeden z najlepszych miesięcy w roku. Wyjazd można też podarować jako prezent i pojechać w innym terminie.',
  ],
  tips: [
    { title: 'Rezerwuj kolację', text: 'Restauracje z widokiem w Paryżu, Wenecji czy Rzymie mają komplet na 14 lutego na kilka tygodni wcześniej.' },
    { title: 'Adults only', text: 'W Egipcie, na Kanarach i na Maderze są hotele tylko dla dorosłych: ciszej i bardziej romantycznie.' },
    { title: 'Karnawał w Wenecji', text: 'W lutym trwa karnawał, więc ceny hoteli rosną. Jeśli nie jedziecie na karnawał, rozważcie Weronę lub Lizbonę.' },
    { title: 'Wyjazd w prezencie', text: 'Możecie zarezerwować wyjazd na wiosnę lub lato i wręczyć go jako walentynkowy prezent.' },
  ],
  faq: [
    { q: 'Gdzie pojechać na walentynki za granicę?', a: 'Na city break najczęściej wybierane są Paryż, Wenecja, Rzym, Lizbona, Praga i Wiedeń. Po słońce warto lecieć na Maderę, Kanary, do Egiptu, a na dłużej na Malediwy, Zanzibar lub Seszele.' },
    { q: 'Gdzie jest ciepło w lutym?', a: 'W Egipcie i na Kanarach jest ok. 21-22 stopni, na Maderze ok. 19 stopni, w Dubaju ok. 25 stopni, a na Malediwach, Zanzibarze i Sri Lance ok. 30 stopni.' },
    { q: 'Kiedy są walentynki w 2027 roku?', a: 'W niedzielę 14 lutego 2027. Najwygodniej zaplanować długi weekend od piątku 12 do poniedziałku 15 lutego.' },
    { q: 'Jaki romantyczny city break jest najtańszy?', a: 'Najtańsze loty z Polski są zwykle do Rzymu, Barcelony, Mediolanu i Budapesztu. Do Pragi i Wiednia wygodnie dojechać pociągiem.' },
  ],
  home: { title: 'Walentynki we dwoje', text: 'Romantyczny city break w Paryżu, Wenecji lub Lizbonie albo słońce na Maderze i Malediwach.' },
};

export const OCCASIONS = [SYLWESTER, WALENTYNKI];
/** Pierwsza trwająca okazja (do kafelka na stronie głównej) */
export const currentOccasion = () => OCCASIONS.find(occActive) || null;

/** Najniższa cena lotu w danym miesiącu do miasta, z lotniskiem wylotu */
export function monthFlight(iata: string, month: string): { price: number; o: string; oName: string } | null {
  let best: { price: number; o: string; oName: string } | null = null;
  for (const r of allRoutes()) {
    if (r.d !== iata) continue;
    const p = r.months?.[month];
    if (p && (!best || p < best.price)) best = { price: p, o: r.o, oName: r.oName };
  }
  return best;
}
