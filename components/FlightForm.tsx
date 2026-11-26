'use client';
import { useState } from 'react';
import { ORIGINS } from '@/lib/travelpayouts';

const plus = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

export default function FlightForm({ dest, destName, origin = 'WAW' }: { dest: string; destName: string; origin?: string }) {
  const [o, setO] = useState(origin);
  const [dd, setDd] = useState(plus(30));
  const [rd, setRd] = useState(plus(37));
  const [a, setA] = useState(2);
  const [ow, setOw] = useState(false);
  const href = `/go/lot/?o=${o}&d=${dest}&dd=${dd}&rd=${rd}&a=${a}${ow ? '&ow=1' : ''}`;
  return (
    <form className="ft-form" onSubmit={(e) => { e.preventDefault(); window.open(href, '_blank', 'noopener'); }}>
      <label><span>Wylot z</span>
        <select value={o} onChange={(e) => setO(e.target.value)}>{ORIGINS.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}</select>
      </label>
      <label><span>Dokąd</span><input value={`${destName} (${dest})`} readOnly /></label>
      <label><span>Wylot</span><input type="date" value={dd} min={plus(1)} onChange={(e) => { setDd(e.target.value); if (rd <= e.target.value) { const x = new Date(e.target.value + 'T12:00:00'); x.setDate(x.getDate() + 7); setRd(x.toISOString().slice(0, 10)); } }} /></label>
      <label><span>Powrót</span><input type="date" value={rd} min={dd} disabled={ow} onChange={(e) => setRd(e.target.value)} /></label>
      <label><span>Osoby</span>
        <select value={a} onChange={(e) => setA(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select>
      </label>
      <label className="ft-ow"><input type="checkbox" checked={ow} onChange={(e) => setOw(e.target.checked)} /> W jedną stronę</label>
      <button className="btn" type="submit">Szukaj lotów</button>
    </form>
  );
}
