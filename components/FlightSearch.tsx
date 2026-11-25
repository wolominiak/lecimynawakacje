'use client';
import { useState } from 'react';
import { ORIGINS } from '@/lib/travelpayouts';

// Wyszukiwarka lotów z wyborem kierunku (strona /loty/)
const plus = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

export default function FlightSearch({ dests }: { dests: { code: string; name: string }[] }) {
  const [o, setO] = useState('WAW');
  const [d, setD] = useState(dests[0]?.code || '');
  const [dd, setDd] = useState(plus(30));
  const [rd, setRd] = useState(plus(37));
  const [a, setA] = useState(2);
  const go = () => window.open(`/go/lot/?o=${o}&d=${d}&dd=${dd}&rd=${rd}&a=${a}`, '_blank', 'noopener');
  return (
    <form className="ft-form fs-form" onSubmit={(e) => { e.preventDefault(); go(); }}>
      <label><span>Wylot z</span><select value={o} onChange={(e) => setO(e.target.value)}>{ORIGINS.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select></label>
      <label><span>Dokąd</span><select value={d} onChange={(e) => setD(e.target.value)}>{dests.map((x) => <option key={x.code + x.name} value={x.code}>{x.name} ({x.code})</option>)}</select></label>
      <label><span>Wylot</span><input type="date" value={dd} min={plus(1)} onChange={(e) => setDd(e.target.value)} /></label>
      <label><span>Powrót</span><input type="date" value={rd} min={dd} onChange={(e) => setRd(e.target.value)} /></label>
      <label><span>Osoby</span><select value={a} onChange={(e) => setA(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
      <button className="btn" type="submit">Szukaj lotów</button>
    </form>
  );
}
