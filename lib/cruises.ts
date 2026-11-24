// Rejsy: oferty wakacje.pl (TravelLead, "kraj" Rejsy = id 521) pogrupowane w akweny.
export const CRUISE_COUNTRY_ID = 521;

export type CruiseArea = {
  slug: string;
  name: string; // "Morze Śródziemne"
  title: string; // "Rejsy po Morzu Śródziemnym"
  short: string; // na chipach
  teaser: string;
  intro: string[];
  when: string;
  ports: string;
  photoQuery: string; // dla skryptu zdjęć (Pixabay, po angielsku)
  faq: { q: string; a: string }[];
};

export const CRUISE_AREAS: CruiseArea[] = [
  {
    slug: 'morze-srodziemne',
    name: 'Morze Śródziemne',
    title: 'Rejsy po Morzu Śródziemnym',
    short: 'Morze Śródziemne',
    teaser: 'Barcelona, Rzym, Marsylia, Malta i greckie wyspy w tydzień. Najpopularniejszy i najtańszy sposób na pierwszy rejs.',
    intro: [
      'Morze Śródziemne to najczęściej wybierany akwen przez Polaków, którzy płyną pierwszy raz. Porty leżą blisko siebie, więc statek co rano zawija do innego miasta, a w trakcie tygodnia można zobaczyć Barcelonę, Marsylię, Genuę, Rzym i Palmę bez przepakowywania walizki.',
      'Wschodnia część akwenu to Morze Egejskie: Pireus koło Aten, Santorini, Mykonos i Stambuł. Trasy zachodnie łączą Hiszpanię, Francję i Włochy, często z postojem na Malcie lub Sardynii. Na start najlepiej sprawdzają się rejsy 7 nocy z przelotem z Polski do portu zaokrętowania.',
    ],
    when: 'Główny sezon trwa od kwietnia do października. Najprzyjemniej jest w maju, czerwcu i wrześniu: ciepło, mniej turystów w portach i niższe ceny niż w wakacje. Zimą pływa mniej statków, ale rejsy są wyraźnie tańsze.',
    ports: 'Barcelona, Civitavecchia (Rzym), Genua, Marsylia, Palma de Mallorca, Walencja, La Valletta, Pireus (Ateny), Wenecja i Triest.',
    photoQuery: 'cruise ship mediterranean',
    faq: [
      { q: 'Ile kosztuje rejs po Morzu Śródziemnym?', a: 'Tygodniowy rejs z przelotem z Polski zaczyna się zwykle od kilku tysięcy złotych za osobę w kabinie wewnętrznej. Kabiny z oknem i balkonem są droższe, a w szczycie sezonu ceny rosną. Aktualne ceny widzisz w wyszukiwarce powyżej.' },
      { q: 'Czy na rejs po Morzu Śródziemnym potrzebny jest paszport?', a: 'Przy trasach tylko po krajach Unii Europejskiej zwykle wystarczy dowód osobisty, ale gdy statek zawija do Turcji, Tunezji czy Maroka, potrzebny jest paszport. Zawsze sprawdź wymagania w opisie konkretnej oferty.' },
      { q: 'Który rejs po Morzu Śródziemnym wybrać na pierwszy raz?', a: 'Najlepiej 7 nocy z Barcelony lub Civitavecchii, z przelotem w pakiecie. Trasa ma wtedy 5 lub 6 portów i jeden dzień na morzu, więc łatwo ocenić, czy taki sposób podróżowania Ci odpowiada.' },
    ],
  },
  {
    slug: 'karaiby',
    name: 'Karaiby',
    title: 'Rejsy po Karaibach',
    short: 'Karaiby',
    teaser: 'Rajskie plaże, Antyle, Dominikana i Meksyk. Zimowe lato na pokładzie, z przelotem z Polski.',
    intro: [
      'Rejs po Karaibach to sposób na zobaczenie kilku wysp w jeden tydzień: Dominikany, Antyli, Jamajki czy meksykańskiego Cozumel. Statek pływa między wyspami nocą, a dni spędza się na plażach z białym piaskiem, snorkelingu i wycieczkach w głąb lądu.',
      'Z Polski najczęściej leci się do portu na Dominikanie (La Romana) lub na Gwadelupę i Martynikę. Warto doliczyć dzień lub dwa na miejscu przed rejsem, bo przelot jest długi, a różnica czasu wynosi 5 lub 6 godzin.',
    ],
    when: 'Najlepszy czas to grudzień do kwietnia: sucho, słonecznie i ok. 28 do 30 stopni. Od czerwca do listopada trwa sezon huraganów, rejsy są tańsze, ale trasy mogą się zmieniać.',
    ports: 'La Romana i Santo Domingo (Dominikana), Pointe-à-Pitre (Gwadelupa), Fort-de-France (Martynika), Cozumel (Meksyk), Samana.',
    photoQuery: 'caribbean cruise ship beach',
    faq: [
      { q: 'Kiedy płynąć na rejs po Karaibach?', a: 'Od grudnia do kwietnia. To pora sucha, morze jest spokojne, a temperatura nie spada poniżej 27 stopni. Latem i jesienią trwa sezon huraganów.' },
      { q: 'Czy na rejs po Karaibach potrzebna jest wiza?', a: 'Polacy na wyspy karaibskie i do Dominikany zwykle wjeżdżają bez wizy, ale potrzebny jest paszport ważny co najmniej 6 miesięcy. Przy trasach przez USA wymagany jest ESTA. Szczegóły są w opisie oferty.' },
      { q: 'Ile trwa rejs po Karaibach?', a: 'Zwykle 7 nocy na statku, a razem z przelotem 8 do 10 dni.' },
    ],
  },
  {
    slug: 'fiordy-i-europa-polnocna',
    name: 'Fiordy i Europa Północna',
    title: 'Rejsy po fiordach norweskich i Europie Północnej',
    short: 'Fiordy i Północ',
    teaser: 'Fiordy Norwegii, Islandia, Szkocja i stolice nad Bałtykiem. Widoki, których nie zobaczysz z lądu.',
    intro: [
      'Rejs po fiordach norweskich to jeden z najbardziej widowiskowych rejsów w Europie. Statek wpływa w wąskie fiordy otoczone wodospadami i górami, zatrzymując się w Bergen, Geiranger, Stavanger czy Ålesund.',
      'Do tej grupy należą też rejsy z Hamburga, Kopenhagi i Kilonii: wokół Wysp Brytyjskich, na Islandię oraz do stolic nad Bałtykiem. Wiele z nich ma dojazd własny, więc z zachodniej Polski można dojechać do portu samochodem.',
    ],
    when: 'Sezon trwa od maja do września. W czerwcu i lipcu dni są najdłuższe, a na północy słońce prawie nie zachodzi. Zabierz kurtkę przeciwdeszczową, bo pogoda zmienia się kilka razy dziennie.',
    ports: 'Kopenhaga, Hamburg, Kilonia, Bergen, Geiranger, Stavanger, Reykjavik, Amsterdam.',
    photoQuery: 'norway fjord cruise ship',
    faq: [
      { q: 'Kiedy najlepiej płynąć na fiordy norweskie?', a: 'Od czerwca do sierpnia: jest najcieplej, dni są bardzo długie, a wodospady pełne wody po roztopach. Maj i wrzesień są tańsze i spokojniejsze.' },
      { q: 'Czy na rejs po fiordach można dojechać samochodem?', a: 'Tak, część rejsów startuje z Kopenhagi, Kilonii lub Hamburga i ma dojazd własny. W wyszukiwarce wybierz "Dojazd własny".' },
      { q: 'Czy w Norwegii są drogie wycieczki fakultatywne?', a: 'Norwegia jest droga, dlatego wycieczki ze statku kosztują więcej niż na Morzu Śródziemnym. W wielu portach centrum jest blisko nabrzeża i można zwiedzać na własną rękę.' },
    ],
  },
  {
    slug: 'wyspy-kanaryjskie',
    name: 'Wyspy Kanaryjskie i Atlantyk',
    title: 'Rejsy wokół Wysp Kanaryjskich',
    short: 'Kanary i Atlantyk',
    teaser: 'Teneryfa, Gran Canaria, Madera i Maroko. Najcieplejszy rejs w Europie zimą.',
    intro: [
      'Rejsy wokół Wysp Kanaryjskich są popularne zimą, gdy na Morzu Śródziemnym jest chłodniej. Trasy łączą Teneryfę, Gran Canarię, La Palmę i Lanzarote, często z postojem na Maderze albo w marokańskim Agadirze lub Casablance.',
      'To dobry wybór dla osób, które chcą słońca od listopada do marca, ale nie chcą lecieć daleko. Przelot do Santa Cruz de Tenerife lub Las Palmas trwa ok. 5 godzin.',
    ],
    when: 'Wyspy Kanaryjskie mają łagodny klimat przez cały rok, z temperaturą ok. 20 do 26 stopni. Najwięcej rejsów jest od października do kwietnia.',
    ports: 'Santa Cruz de Tenerife, Las Palmas, Arrecife, Funchal (Madera), Agadir, Casablanca, Lizbona.',
    photoQuery: 'canary islands cruise ship',
    faq: [
      { q: 'Kiedy płynąć na rejs po Wyspach Kanaryjskich?', a: 'Najlepiej od października do kwietnia, gdy w Polsce jest zimno. Na wyspach jest wtedy ok. 21 do 24 stopni.' },
      { q: 'Czy na rejs z postojem w Maroku potrzebny jest paszport?', a: 'Tak. Maroko nie jest w Unii Europejskiej, dlatego do zejścia na ląd potrzebny jest paszport.' },
    ],
  },
  {
    slug: 'dalekie-rejsy',
    name: 'Dalekie rejsy',
    title: 'Dalekie rejsy: Ameryka, Azja i Australia',
    short: 'Dalekie rejsy',
    teaser: 'Ameryka Południowa, Przylądek Horn, Alaska, Japonia i Australia. Podróże życia na pokładzie.',
    intro: [
      'Dalekie rejsy to wyprawy, w których statek jest wygodną bazą do zwiedzania miejsc trudno dostępnych inaczej: Przylądka Horn i fiordów Chile, wybrzeża Brazylii i Argentyny, lodowców Alaski czy portów Japonii.',
      'Takie rejsy trwają zwykle od 8 do 18 dni i są droższe, ale cena obejmuje noclegi, większość posiłków i przemieszczanie się między krajami. Warto rezerwować z wyprzedzeniem, bo miejsc jest mniej.',
    ],
    when: 'Ameryka Południowa i Antarktyda: od grudnia do marca, czyli w tamtejsze lato. Alaska: od maja do września. Japonia: wiosna (kwitnienie wiśni) i jesień.',
    ports: 'Buenos Aires, Rio de Janeiro, Valparaiso, Seattle, Vancouver, Tokio, Sydney.',
    photoQuery: 'cruise ship glacier alaska',
    faq: [
      { q: 'Ile kosztuje daleki rejs?', a: 'Zwykle od kilkunastu do kilkudziesięciu tysięcy złotych za osobę, w zależności od długości, kabiny i przelotu. Aktualne ceny są w wyszukiwarce powyżej.' },
      { q: 'Czy na dalekie rejsy potrzebna jest wiza?', a: 'To zależy od trasy. Na rejsy z USA i Kanady potrzebny jest ESTA lub eTA, a do niektórych krajów Ameryki Południowej i Azji wjeżdża się bez wizy. Wymagania są w opisie oferty.' },
    ],
  },
];

export const cruiseArea = (slug: string) => CRUISE_AREAS.find((a) => a.slug === slug);

const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

/** Przypisanie oferty do akwenu: najpierw po nazwie trasy, potem po regionie z wakacje.pl */
export function areaOf(name: string, region?: string): string {
  const t = norm(name + ' ' + (region || ''));
  if (/karaib|antyl|dominikan|la romana|santo domingo|cozumel|samana|jamajk|bahama|gwadelup|martynik|saint george|barbados/.test(t)) return 'karaiby';
  if (/fiord|norwe|islandi|faxafl|szkoc|baltyk|kopenhag|hamburg|kilon|polnocn|brytyj|amsterdam|holandia/.test(t)) return 'fiordy-i-europa-polnocna';
  if (/kanaryj|teneryf|gran canaria|madera|maderz|lanzarote|maroko|agadir|casablanc/.test(t)) return 'wyspy-kanaryjskie';
  if (/srodziemn|egejsk|grecj|wloch|hiszpan|francj|chorwac|malta|barcelon|civitavecchia|pireus|wenecj|genua|marsyli|adriaty|turcj|stambul/.test(t)) return 'morze-srodziemne';
  if (/ameryka|brazyli|argentyn|chile|horn|rio|alaska|japoni|honsiu|pacyfik|australi|nowa poludniowa|azja|dubaj|emirat|antarktyd/.test(t)) return 'dalekie-rejsy';
  if (/atlanty/.test(t)) return 'wyspy-kanaryjskie';
  return 'morze-srodziemne';
}

const LINES = ['MSC', 'Costa', 'Royal Caribbean', 'Norwegian', 'Celebrity', 'Princess', 'Holland America', 'Carnival', 'AIDA', 'TUI', 'Hurtigruten', 'Havila', 'Viking', 'Virgin', 'Oceania', 'Cunard', 'Silversea', 'Regent', 'Azamara', 'Explora'];
/** Armator z nazwy oferty ("MSC Cruises / ...", "Costa Smeralda / ...") */
export function lineOf(name: string): string {
  const n = name.toLowerCase();
  for (const l of LINES) if (n.startsWith(l.toLowerCase()) || n.includes(l.toLowerCase() + ' ')) return l === 'MSC' ? 'MSC Cruises' : l === 'Costa' ? 'Costa Cruises' : l;
  return 'Inni armatorzy';
}

/** Rozbicie nazwy na statek/armatora i trasę */
export function splitName(name: string): { ship: string; route: string } {
  const i = name.indexOf(' / ');
  if (i > 0) return { ship: name.slice(0, i).trim(), route: name.slice(i + 3).replace(/\/\s*$/, '').trim() };
  return { ship: '', route: name.replace(/\/\s*$/, '').trim() };
}
