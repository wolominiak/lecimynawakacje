'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_Z = 12;
const DOT_R = 3.6;

// Tooltip z nazwą kraju + przybliżanie i przesuwanie mapy.
// Linki w SVG są renderowane na serwerze, więc działają także bez JS.
export default function MapTooltip({ children, width, height }: { children: React.ReactNode; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; n: string; s: string } | null>(null);
  const [view, setView] = useState({ z: 1, cx: width / 2, cy: height / 2 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const suppressClick = useRef(false);

  const clamp = useCallback((z: number, cx: number, cy: number) => {
    z = Math.min(MAX_Z, Math.max(1, z));
    const hw = width / 2 / z;
    const hh = height / 2 / z;
    return { z, cx: Math.min(width - hw, Math.max(hw, cx)), cy: Math.min(height - hh, Math.max(hh, cy)) };
  }, [width, height]);

  // viewBox i rozmiar kropek po każdej zmianie widoku
  useEffect(() => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const { z, cx, cy } = view;
    svg.setAttribute('viewBox', `${cx - width / 2 / z} ${cy - height / 2 / z} ${width / z} ${height / z}`);
    svg.querySelectorAll('circle.dot').forEach((c) => c.setAttribute('r', String(DOT_R / Math.sqrt(z))));
  }, [view, width, height]);

  // Po przybliżeniu podmieniamy kontury na dokładniejsze (1:50m), ładowane dopiero wtedy
  const hi = useRef<'no' | 'loading' | 'done'>('no');
  useEffect(() => {
    if (view.z < 2 || hi.current !== 'no') return;
    hi.current = 'loading';
    Promise.all([import('world-atlas/countries-50m.json'), import('d3-geo'), import('topojson-client')])
      .then(([w, d3, topo]) => {
        const world: any = (w as any).default || w;
        const fc: any = topo.feature(world, world.objects.countries);
        const projection = d3.geoNaturalEarth1().fitExtent([[4, 4], [width - 4, height - 4]], { type: 'Sphere' } as any);
        const path = d3.geoPath(projection).digits(2);
        const byId = new Map<string, any>();
        for (const f of fc.features) byId.set(String(f.id ?? f.properties.name), f);
        ref.current?.querySelectorAll<SVGPathElement>('path.c').forEach((el) => {
          const id = el.getAttribute('data-id') || el.closest('a')?.getAttribute('data-id');
          const f = id && byId.get(id);
          const d = f && path(f);
          if (d) el.setAttribute('d', d);
        });
        hi.current = 'done';
      })
      .catch(() => { hi.current = 'no'; });
  }, [view.z, width, height]);

  /** Punkt ekranu -> współrzędne mapy przy danym widoku */
  const toMap = useCallback((clientX: number, clientY: number, v = viewRef.current) => {
    const r = ref.current!.querySelector('svg')!.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width;
    const fy = (clientY - r.top) / r.height;
    return { x: v.cx - width / 2 / v.z + fx * (width / v.z), y: v.cy - height / 2 / v.z + fy * (height / v.z), fx, fy };
  }, [width, height]);

  /** Zoom z zachowaniem punktu pod kursorem */
  const zoomAt = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const v = viewRef.current;
    const nz = Math.min(MAX_Z, Math.max(1, v.z * factor));
    if (nz === v.z) return false;
    if (clientX == null || clientY == null) { setView(clamp(nz, v.cx, v.cy)); return true; }
    const p = toMap(clientX, clientY, v);
    const cx = p.x - (p.fx - 0.5) * (width / nz);
    const cy = p.y - (p.fy - 0.5) * (height / nz);
    setView(clamp(nz, cx, cy));
    return true;
  }, [clamp, toMap, width, height]);

  // Kółko myszy: przybliża nad mapą; gdy nie ma już czego oddalać, przewija stronę normalnie
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY)) e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  function onDown(e: React.PointerEvent) {
    if (pointers.current.size === 0) suppressClick.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: viewRef.current.z };
      drag.current = null;
      return;
    }
    const v = viewRef.current;
    drag.current = { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy, moved: 0 };
  }

  function onMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const target = pinch.current.z * (d / pinch.current.d);
      zoomAt(target / viewRef.current.z, (a.x + b.x) / 2, (a.y + b.y) / 2);
      suppressClick.current = true;
      return;
    }
    const g = drag.current;
    if (g && viewRef.current.z > 1) {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      g.moved = Math.max(g.moved, Math.abs(dx) + Math.abs(dy));
      if (g.moved > 4) {
        suppressClick.current = true;
        const r = ref.current!.querySelector('svg')!.getBoundingClientRect();
        const z = viewRef.current.z;
        setView(clamp(z, g.cx - (dx / r.width) * (width / z), g.cy - (dy / r.height) * (height / z)));
        setTip(null);
        return;
      }
    }
    const a = (e.target as Element).closest('a[data-n]');
    if (!a || !ref.current) { setTip(null); return; }
    const r = ref.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, n: a.getAttribute('data-n') || '', s: a.getAttribute('data-s') || '' });
  }

  function onUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  return (
    <div
      ref={ref}
      className={'map-zoom' + (view.z > 1 ? ' zoomed' : '')}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => { setTip(null); onUp(e); }}
      onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
      onDoubleClick={(e) => { e.preventDefault(); zoomAt(2, e.clientX, e.clientY); }}
    >
      {children}
      {tip && (
        <div className="map-tip" style={{ left: tip.x, top: tip.y }}>
          {tip.n}
          {tip.s && <small>{tip.s}</small>}
        </div>
      )}
      <div className="map-ctrl">
        <button type="button" onClick={() => zoomAt(1.6)} aria-label="Przybliż">+</button>
        <button type="button" onClick={() => zoomAt(1 / 1.6)} aria-label="Oddal" disabled={view.z <= 1}>&minus;</button>
        {view.z > 1 && <button type="button" onClick={() => setView({ z: 1, cx: width / 2, cy: height / 2 })} aria-label="Pokaż cały świat" title="Cały świat">&#8634;</button>}
      </div>
    </div>
  );
}
