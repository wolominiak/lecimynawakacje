'use client';
import { useState } from 'react';

// Proste pole "Dokąd?" otwierające wyszukiwanie u partnera (noclegi, wycieczki)
export default function TextGo({ base, placeholder, button, slashEnd }: { base: string; placeholder: string; button: string; slashEnd?: boolean }) {
  const [q, setQ] = useState('');
  return (
    <form className="tg" onSubmit={(e) => { e.preventDefault(); if (q.trim()) window.open(base + encodeURIComponent(q.trim()) + (slashEnd ? '/' : ''), '_blank', 'noopener'); }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <button className="btn" type="submit">{button}</button>
    </form>
  );
}
