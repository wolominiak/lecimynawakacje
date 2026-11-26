'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import type { Card } from '@/lib/assistant-tools';
import { useHotelPages } from './useHotelPages';

type Msg = { role: 'user' | 'model'; text: string; cards?: Card[]; links?: string[] };

// Linki, które wolno pokazać jako klikalne: z danych narzędzi, strony portalu (indeks wyszukiwarki),
// stałe sekcje i wyszukiwanie wycieczek. Wymyślone przez model adresy zostają zwykłym tekstem.
const STATIC = new Set(['/', '/wakacje/', '/last-minute/', '/rejsy/', '/asystent/', '/gdzie-na-wakacje/', '/rejsy/morze-srodziemne/', '/rejsy/karaiby/', '/rejsy/fiordy-i-europa-polnocna/', '/rejsy/wyspy-kanaryjskie/', '/rejsy/dalekie-rejsy/', '/all-inclusive/', '/tanie-wakacje/', '/wakacje-nad-morzem/', '/egzotyka/', '/wycieczki-objazdowe/', '/loty/', '/hotele/', '/wynajem-auta/', '/wycieczki-fakultatywne/']);
let pages: Set<string> | null = null;
const loadPages = () => fetch('/search-index.json').then((r) => r.json()).then((l: { u: string }[]) => { pages = new Set(l.map((x) => x.u)); }).catch(() => {});
function fixHref(raw: string, allowed: Set<string>): string | null {
  const h = raw.trim().replace(/^https?:\/\/(www\.)?lecimynawakacje\.pl/i, '');
  if (!h.startsWith('/') || h.startsWith('//')) return null;
  const at = /^\/go\/atrakcje\/([^/?#]+)\/?$/.exec(h);
  if (at) { let q = at[1]; try { q = decodeURIComponent(q); } catch {} return `/go/atrakcje/${encodeURIComponent(q.trim())}/`; }
  if (allowed.has(h)) return h;
  const path = h.split(/[?#]/)[0];
  const withSlash = path.endsWith('/') ? path : path + '/';
  if (STATIC.has(withSlash) || pages?.has(withSlash)) return withSlash + h.slice(path.length);
  return null;
}

const KEY = 'lnw-asystent';
const SUGGEST = [
  'Zaplanuj mi 7 dni na Krecie w czerwcu',
  'Gdzie będzie ciepło w lutym do 3000 zł za osobę?',
  'All inclusive w Turcji dla 2 osób w sierpniu z Katowic',
  'Last minute w ciągu tygodnia, budżet 2500 zł',
];

const load = (): Msg[] => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (m: Msg[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(m.slice(-30))); } catch {} };
const pln = (n?: number) => (n ? n.toLocaleString('pl-PL') + ' zł' : '');
const dateFmt = (d?: string) => { if (!d) return ''; const x = new Date(d.slice(0, 10) + 'T12:00:00'); return x.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); };

// Mini markdown: ### nagłówki, listy -, 1., **pogrubienie**, [link](/sciezka/)
function inline(s: string, k: string, allowed: Set<string>) {
  const out: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<strong key={k + i++}>{m[1]}</strong>);
    else {
      const href = fixHref(m[3], allowed);
      const ext = href?.startsWith('/go/');
      out.push(href ? <a key={k + i++} href={href} {...(ext ? { target: '_blank', rel: 'sponsored nofollow noopener' } : {})}>{m[2]}</a> : <span key={k + i++}>{m[2]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}
function Md({ text, links }: { text: string; links?: string[] }) {
  const allowed = new Set(links || []);
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let list: { ord: boolean; items: string[] } | null = null;
  const flush = (k: number) => {
    if (!list) return;
    const L = list.ord ? 'ol' : 'ul';
    blocks.push(<L key={'l' + k}>{list.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}-`, allowed)}</li>)}</L>);
    list = null;
  };
  lines.forEach((raw, k) => {
    const l = raw.trim();
    const ul = /^[-*]\s+(.*)/.exec(l);
    const ol = /^\d+[.)]\s+(.*)/.exec(l);
    if (ul || ol) {
      const ord = !!ol;
      if (!list || list.ord !== ord) { flush(k); list = { ord, items: [] }; }
      list.items.push((ul || ol)![1]);
      return;
    }
    flush(k);
    if (!l) return;
    const h = /^#{1,4}\s+(.*)/.exec(l);
    if (h) blocks.push(<h4 key={k}>{inline(h[1], k + '-', allowed)}</h4>);
    else blocks.push(<p key={k}>{inline(l, k + '-', allowed)}</p>);
  });
  flush(lines.length);
  return <>{blocks}</>;
}

function Cards({ cards }: { cards: Card[] }) {
  const hp = useHotelPages();
  return (
    <div className="as-cards">
      {cards.map((c, i) => (
        <a key={i} className="as-card" href={c.hotelId && hp[c.hotelId] ? `/hotel/${hp[c.hotelId]}/` : c.url} target="_blank" rel={c.hotelId && hp[c.hotelId] ? 'noopener' : 'sponsored nofollow noopener'}>
          <div className="as-img">{c.img && <img src={c.img} alt="" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}{c.lm && <span className="as-lm">Last minute</span>}</div>
          <div className="as-body">
            <b>{c.title}</b>
            {!!c.stars && <span className="as-stars">{'★'.repeat(Math.min(5, Math.round(c.stars)))}</span>}
            <small>{c.place}</small>
            <small>{[c.date && dateFmt(c.date), c.nights && `${c.nights} nocy`, c.from && `z ${c.from}`].filter(Boolean).join(' · ')}</small>
            {c.board && <small>{c.board}</small>}
            <div className="as-price"><strong>{pln(c.pricePP)}</strong> <span>/ os.</span></div>
            {!!c.priceTotal && !!c.persons && <small className="as-total">razem {pln(c.priceTotal)} za {c.persons} {c.persons === 1 ? 'osobę' : c.persons < 5 ? 'osoby' : 'osób'}</small>}
            <span className="as-src">{c.src}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function AssistantChat({ full, onClose }: { full?: boolean; onClose?: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMsgs(load()); if (!pages) loadPages().then(() => setMsgs((m) => [...m])); }, []);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs, status]);
  useEffect(() => { if (!full) ta.current?.focus(); }, [full]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const history: Msg[] = [...msgs, { role: 'user', text: q }];
    let cur: Msg[] = [...history, { role: 'model', text: '' }];
    setMsgs(cur);
    setBusy(true);
    setStatus('Myślę');
    const upd = (f: (m: Msg) => Msg) => { const last = f(cur[cur.length - 1]); cur = [...cur.slice(0, -1), last]; setMsgs(cur); };
    try {
      // Do historii dopisujemy skrót pokazanych ofert, żeby model wiedział, o czym mowa w kolejnym pytaniu
      const payload = history.map((m) => ({
        role: m.role,
        text: m.text + (m.cards?.length ? '\n[Pokazane oferty: ' + m.cards.map((c, i) => `${i + 1}. ${c.title}, ${c.place}, ${c.date?.slice(0, 10)}, ${c.nights} nocy, ${c.board}, ${c.pricePP} zł/os.`).join('; ') + ']' : ''),
      }));
      const res = await fetch('/api/asystent/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: payload, page: location.pathname }) });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.t === 'text') { setStatus(''); upd((m) => ({ ...m, text: m.text + ev.v })); }
          else if (ev.t === 'status') setStatus(ev.v);
          else if (ev.t === 'links') upd((m) => ({ ...m, links: [...new Set([...(m.links || []), ...ev.v])] }));
          else if (ev.t === 'cards') upd((m) => ({ ...m, cards: [...(m.cards || []), ...ev.v].slice(0, 12) }));
          else if (ev.t === 'error') upd((m) => ({ ...m, text: (m.text ? m.text + '\n\n' : '') + ev.v }));
        }
      }
    } catch {
      upd((m) => ({ ...m, text: m.text || 'Nie udało się połączyć. Spróbuj ponownie.' }));
    } finally {
      setBusy(false);
      setStatus('');
      save(cur);
    }
  }

  const reset = () => { setMsgs([]); save([]); };

  return (
    <div className={'as' + (full ? ' as-full' : '')}>
      <div className="as-head">
        <div className="as-avatar" aria-hidden="true">✦</div>
        <div>
          <b>Asystent podróży</b>
          <small>Plan wyjazdu, oferty, wycieczki</small>
        </div>
        <div className="as-actions">
          {msgs.length > 0 && <button onClick={reset} title="Nowa rozmowa">Nowa</button>}
          {onClose && <button onClick={onClose} aria-label="Zamknij">✕</button>}
        </div>
      </div>

      <div className="as-msgs" ref={box}>
        {!msgs.length && (
          <div className="as-hello">
            <p><b>Cześć!</b> Powiedz, dokąd i kiedy chcesz jechać, a ułożę plan dzień po dniu, znajdę oferty z cenami i polecę wycieczki. Nie wiesz dokąd? Podaj miesiąc i budżet.</p>
            <div className="as-sugg">
              {SUGGEST.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <Fragment key={i}>
            {m.role === 'user' ? (
              <div className="as-u">{m.text}</div>
            ) : (
              <div className="as-m">
                {m.text && <div className="as-txt"><Md text={m.text} links={m.links} /></div>}
                {!!m.cards?.length && <Cards cards={m.cards} />}
              </div>
            )}
          </Fragment>
        ))}
        {busy && status && <div className="as-status"><span className="as-dots"><i /><i /><i /></span>{status}...</div>}
      </div>

      <form className="as-form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea
          ref={ta}
          value={input}
          rows={1}
          maxLength={1500}
          placeholder="Np. 10 dni w Tajlandii w lutym dla dwojga"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Wyślij">➤</button>
      </form>
      <p className="as-note">Asystent AI może się mylić. Ceny i dostępność sprawdź w ofercie biura.</p>
    </div>
  );
}
