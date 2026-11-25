import { NextRequest } from 'next/server';
import { TOOL_DECLARATIONS, runTool, detectPlaces, collectLinks, guide, type Card } from '@/lib/assistant-tools';

// Asystent podróży: Gemini + narzędzia z danymi portalu. Odpowiedź strumieniowo jako NDJSON:
// {t:'status',v} {t:'text',v} {t:'cards',v:Card[]} {t:'error',v} {t:'done'}
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.ASSISTANT_MODEL || 'gemini-2.5-flash';
const MAX_TURNS = 24;
const MAX_LEN = 1500;

// Prosty limit na IP (na instancję): 30 wiadomości na 15 minut
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const l = (hits.get(ip) || []).filter((t) => now - t < 15 * 60_000);
  l.push(now);
  hits.set(ip, l);
  if (hits.size > 5000) hits.clear();
  return l.length > 30;
}

const STATUS: Record<string, string> = {
  przewodnik: 'Sprawdzam przewodnik',
  propozycje_kierunkow: 'Szukam ciepłych kierunków',
  szukaj_ofert: 'Przeszukuję oferty biur podróży',
  last_minute: 'Przeszukuję last minute',
  rejsy: 'Przeszukuję rejsy',
};

function system(page?: string, known?: string) {
  const d = new Date();
  const date = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
  return `Jesteś asystentem podróży portalu lecimynawakacje.pl. Pomagasz Polakom wybrać kierunek, zaplanować wyjazd dzień po dniu, znaleźć konkretne oferty biur podróży, wycieczki i internet (eSIM).
Dzisiaj jest ${date} (${d.toISOString().slice(0, 10)}).${page ? `\nUżytkownik pisze ze strony ${page}. Jeśli pyta o "ten kraj" lub "tu", chodzi o kierunek z tej strony.` : ''}

Zasady:
- Piszesz po polsku, naturalnie i konkretnie, jak doświadczony doradca w biurze podróży, który chce dobrać i sprzedać właściwy wyjazd. Nigdy nie używasz długich myślników (znaków \u2014 i \u2013), tylko zwykłego "-" albo przecinka.
- Ceny, terminy, hotele i oferty bierzesz WYŁĄCZNIE z narzędzi. Nigdy nie wymyślaj cen, hoteli ani dostępności. Jeśli narzędzie nic nie zwróciło, powiedz to i zaproponuj inny termin, budżet albo link_wyszukiwarka z narzędzia.
- Linki: NIGDY nie wymyślaj adresów. Wolno Ci użyć wyłącznie ścieżek dosłownie skopiowanych z danych narzędzi lub z sekcji DANE Z PRZEWODNIKA (zaczynają się od "/", np. /wakacje/japonia/tokio/ albo /go/esim/jp_package/). Jedyny wyjątek: wycieczkę do dowolnej atrakcji możesz podlinkować jako /go/atrakcje/<nazwa atrakcji>/. Format markdown: [tekst](/ścieżka/). Żadnych adresów z domeną.

Jak prowadzisz rozmowę (jak dobry sprzedawca):
1. Gdy ktoś pisze, że chce jechać w jakieś miejsce (np. "wycieczka do Japonii", "wakacje w Turcji"), NIE rozpisujesz planu zwiedzania. Zamiast tego:
   - w 1-2 zdaniach napisz, kiedy najlepiej jechać i czego się spodziewać (z danych przewodnika), z linkiem do przewodnika,
   - pokaż oferty z narzędzia szukaj_ofert (lub rejsy / last_minute) i poleć 2-3 konkretne, krótko dlaczego (cena, termin, program, wyżywienie). Jeśli są wycieczki objazdowe i wypoczynek, powiedz, że są obie opcje,
   - na końcu zadaj krótkie pytania, żeby zawęzić wybór: kiedy (miesiąc lub daty), ile osób (dorośli, dzieci), z jakiego miasta wylot, budżet na osobę, a jeśli to ma sens: zwiedzanie z przewodnikiem czy wypoczynek w hotelu. Maksymalnie 3-4 pytania w jednej krótkiej liście.
   - słowa "wycieczka", "objazd", "zwiedzanie", "z przewodnikiem" oznaczają wycieczkę objazdową: szukaj z typ="objazdowa". "Wakacje", "wypoczynek", "hotel", "all inclusive", "plaża" oznaczają typ="wypoczynek". Gdy nie wiadomo, nie podawaj typu (pokażą się obie opcje).
2. Gdy użytkownik poda szczegóły, od razu szukasz ponownie z filtrami (od, do, osoby, lotnisko, budżet, typ) i podajesz cenę za osobę oraz razem dla podanej liczby osób.
3. Plan dzień po dniu (### Dzień 1 itd.) rozpisujesz tylko, gdy użytkownik o to poprosi ("zaplanuj", "plan", "co zobaczyć") albo gdy wybrał już ofertę i chce zaplanować czas na miejscu. W planie poleć wycieczki fakultatywne z linkami i na końcu eSIM, jeśli jest w danych.
4. Gdy ktoś woli jechać na własną rękę albo biura nie mają ofert, poleć z danych "na_wlasna_reke": loty (link loty, wyszukiwarka Aviasales), noclegi (Booking.com), wynajem auta (DiscoverCars) i promy (Ferryhopper, link promy), gdy chodzi o wyspy. Auto polecaj szczególnie na wyspach i tam, gdzie warto zwiedzać samodzielnie.
5. Gdy oferta jest wycieczką objazdową, wyjaśnij, że program zwiedzania, przewodnik i noclegi są w cenie, a szczegóły trasy są po kliknięciu w ofertę.
- Daty interpretuj względem dzisiejszej daty. "Majówka" to okolice 1 maja, "ferie" to połowa stycznia do końca lutego, "wakacje" to lipiec i sierpień.
- Formatowanie: krótkie akapity, listy z "-", nagłówki "###", pogrubienia "**". Bez tabel. Pisz zwięźle.
- Nie rozmawiasz o tematach niezwiązanych z podróżami, uprzejmie wracasz do planowania wakacji.${known ? `\n\nDANE Z PRZEWODNIKA (kierunki wspomniane w rozmowie):\n${known}` : ''}`;
}

type Msg = { role: 'user' | 'model'; text: string };

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'x';
  const enc = new TextEncoder();
  const body = await req.json().catch(() => null);
  const msgs: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
  const page = typeof body?.page === 'string' ? body.page.slice(0, 120) : undefined;

  const stream = new ReadableStream({
    async start(ctl) {
      const send = (o: unknown) => ctl.enqueue(enc.encode(JSON.stringify(o) + '\n'));
      const fail = (v: string) => { send({ t: 'error', v }); send({ t: 'done' }); ctl.close(); };
      if (!key) return fail('Asystent nie jest jeszcze skonfigurowany.');
      if (limited(ip)) return fail('Za dużo wiadomości w krótkim czasie. Spróbuj za kilka minut.');
      const clean = msgs
        .filter((m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
        .slice(-MAX_TURNS)
        .map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, m.role === 'user' ? MAX_LEN : 6000) }] }));
      if (!clean.length || clean[clean.length - 1].role !== 'user') return fail('Pusta wiadomość.');

      const contents: any[] = clean;
      const origin = req.nextUrl.origin;

      // Kierunki z ostatnich wiadomości użytkownika i ze strony: dane przewodnika od razu w kontekście
      const recent = msgs.filter((m) => m.role === 'user').slice(-3).map((m) => m.text).join(' ');
      const pageSlug = page?.match(/^\/wakacje\/([a-z0-9-]+)\/(?:([a-z0-9-]+)\/)?/);
      const names = detectPlaces(recent);
      const userMsgs = msgs.filter((m) => m.role === 'user');
      const lastNames = detectPlaces(userMsgs[userMsgs.length - 1]?.text || '');
      const before = new Set(detectPlaces(userMsgs.slice(0, -1).map((m) => m.text).join(' ')));
      const forceOffers = lastNames.some((n) => !before.has(n));
      const guides: unknown[] = [];
      for (const n of names) { const g = guide({ kierunek: n }); if (!(g as any).blad) guides.push(g); }
      if (!guides.length && pageSlug) { const g = guide({ kierunek: pageSlug[2] || pageSlug[1] }); if (!(g as any).blad) guides.push(g); }
      const known = guides.length ? JSON.stringify(guides) : '';
      if (guides.length) send({ t: 'links', v: [...collectLinks(guides)] });
      try {
        for (let round = 0; round < 5; round++) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system(page, known) }] },
              contents,
              tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
              // nowy kierunek w pytaniu: najpierw obowiązkowo oferty, żeby rozmowa zaczynała się od konkretów
              ...(round === 0 && forceOffers ? { toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['szukaj_ofert', 'rejsy', 'last_minute'] } } } : {}),
            }),
          });
          if (!res.ok || !res.body) {
            const t = await res.text().catch(() => '');
            console.error('Gemini', res.status, t.slice(0, 300));
            return fail(res.status === 429 ? 'Asystent jest teraz oblężony. Spróbuj za chwilę.' : 'Asystent ma chwilową przerwę. Spróbuj ponownie.');
          }

          // Czytamy SSE, tekst przekazujemy od razu, wywołania narzędzi zbieramy
          const parts: any[] = [];
          const calls: { name: string; args: any }[] = [];
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, i).trim();
              buf = buf.slice(i + 1);
              if (!line.startsWith('data:')) continue;
              let j: any;
              try { j = JSON.parse(line.slice(5)); } catch { continue; }
              for (const p of j.candidates?.[0]?.content?.parts || []) {
                parts.push(p);
                if (p.functionCall) calls.push({ name: p.functionCall.name, args: p.functionCall.args || {} });
                else if (typeof p.text === 'string' && p.text && !p.thought) send({ t: 'text', v: p.text.replace(/[\u2013\u2014]/g, '-') });
              }
            }
          }

          if (!calls.length) break;
          contents.push({ role: 'model', parts });
          const responses: any[] = [];
          for (const c of calls) {
            send({ t: 'status', v: STATUS[c.name] || 'Sprawdzam' });
            const out = await runTool(c.name, c.args, origin).catch((e) => ({ result: { blad: String(e?.message || e) } }) as { result: unknown; cards?: Card[] });
            if (out.cards?.length) send({ t: 'cards', v: out.cards });
            send({ t: 'links', v: [...collectLinks(out.result)] });
            responses.push({ functionResponse: { name: c.name, response: { content: out.result } } });
          }
          contents.push({ role: 'user', parts: responses });
          send({ t: 'status', v: '' });
        }
      } catch (e) {
        console.error('asystent', e);
        return fail('Coś poszło nie tak. Spróbuj ponownie.');
      }
      send({ t: 'done' });
      ctl.close();
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } });
}
