'use client';
import { useRef, useState } from 'react';

// Pokazuje nazwę kraju przy kursorze; linki w SVG działają też bez JS.
export default function MapTooltip({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; n: string; s: string } | null>(null);

  function onMove(e: React.MouseEvent) {
    const a = (e.target as Element).closest('a[data-n]');
    if (!a || !ref.current) { setTip(null); return; }
    const r = ref.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, n: a.getAttribute('data-n') || '', s: a.getAttribute('data-s') || '' });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
      {children}
      {tip && (
        <div className="map-tip" style={{ left: tip.x, top: tip.y }}>
          {tip.n}
          {tip.s && <small>{tip.s}</small>}
        </div>
      )}
    </div>
  );
}
