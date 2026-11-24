import { NextRequest } from 'next/server';
import { TOOL_DECLARATIONS, runTool, type Card } from '@/lib/assistant-tools';

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

function system(page?: string) {
  const d = new Date();
  const date = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
  return `Jesteś asystentem podróży portalu lecimynawakacje.pl. Pomagasz Polakom wybrać kierunek, zaplanować wyjazd dzień po dniu, znaleźć konkretne oferty biur podróży, wycieczki i internet (eSIM).
Dzisiaj jest ${date} (${d.toISOString().slice(0, 10)}).${page ? `\nUżytkownik pisze ze strony ${page}. Jeśli pyta o "ten kraj" lub "tu", chodzi o kierunek z tej strony.` : ''}

Zasady:
- Piszesz po polsku, naturalnie i konkretnie, jak doświadczony agent podróży. Nigdy nie używasz długich myślników (znaków \u2014 i \u2013), tylko zwykłego "-" albo przecinka.
- Ceny, terminy, hotele i oferty bierzesz WYŁĄCZNIE z narzędzi. Nigdy nie wymyślaj cen, hoteli ani dostępności. Jeśli narzędzie nic nie zwróciło, powiedz to i zaproponuj zmianę filtrów albo link do wyszukiwarki z narzędzia.
- Linki podajesz tylko te, które zwróciły narzędzia (zaczynają się od "/"). Format markdown: [tekst](/link/). Nie podawaj adresów zewnętrznych.
- Gdy ktoś chce zaplanować wyjazd: najpierw użyj "przewodnik", potem jeśli zna termin lub budżet "szukaj_ofert". Plan rozpisz dzień po dniu (### Dzień 1 itd.), krótko: co zobaczyć, gdzie zjeść lokalnie, jaka wycieczka fakultatywna (z linkiem link_wycieczki). Na końcu dodaj praktyczne rady i link do eSIM, jeśli narzędzie go podało.
- Gdy brakuje kluczowej informacji (termin, liczba osób, miasto wylotu, budżet), zadaj maksymalnie 2 krótkie pytania naraz. Jeśli pytanie jest ogólne, odpowiedz od razu, a dopytaj na końcu.
- Daty interpretuj względem dzisiejszej daty. "Majówka" to okolice 1 maja, "ferie" to połowa stycznia do końca lutego, "wakacje" to lipiec i sierpień.
- Oferty pokazują się użytkownikowi jako karty ze zdjęciem pod Twoją odpowiedzią. W tekście poleć 2-3 najlepsze i krótko uzasadnij (cena, wyżywienie, termin). Cena "za osobę" to cena_za_osobe_pln.
- Formatowanie: krótkie akapity, listy z "-", nagłówki "###", pogrubienia "**". Bez tabel. Odpowiedzi zwięzłe, plan wyjazdu może być dłuższy.
- Nie rozmawiasz o tematach niezwiązanych z podróżami, uprzejmie wracasz do planowania wakacji.`;
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
      try {
        for (let round = 0; round < 5; round++) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system(page) }] },
              contents,
              tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
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
