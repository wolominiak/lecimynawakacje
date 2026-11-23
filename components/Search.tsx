'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IcoSearch } from './Icons';

export type SearchItem = { n: string; u: string; s: string };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

export default function Search({ items, big, placeholder = 'Dokąd lecimy? Kraj, wyspa, region...' }: { items: SearchItem[]; big?: boolean; placeholder?: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  const res = useMemo(() => {
    const t = norm(q.trim());
    if (t.length < 2) return [];
    const starts = items.filter((i) => norm(i.n).startsWith(t));
    const inc = items.filter((i) => !norm(i.n).startsWith(t) && norm(i.n).includes(t));
    return [...starts, ...inc].slice(0, 9);
  }, [q, items]);

  return (
    <div className={'search' + (big ? ' search-big' : '')} ref={box}
      onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <IcoSearch size={big ? 20 : 17} />
      <input
        value={q}
        placeholder={placeholder}
        aria-label="Szukaj kierunku"
        onChange={(e) => { setQ(e.target.value); setOpen(true); setIdx(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, res.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === 'Enter' && res[idx]) { router.push(res[idx].u); setOpen(false); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && res.length > 0 && (
        <div className="search-res">
          {res.map((r, i) => (
            <a key={r.u} href={r.u} className={i === idx ? 'on' : ''} onMouseEnter={() => setIdx(i)}>
              {r.n} <span>{r.s}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
