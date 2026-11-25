'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Travelpayouts Drive (podmiana linków, słowa kluczowe, podglądy).
// Skrypt skanuje całą stronę i na chwilę blokuje przeglądarkę, więc ładujemy go dopiero
// przy pierwszej interakcji (przewinięcie, dotyk, klawisz) albo po 5 s czytania.
// Wyłączony na stronie asystenta AI.
const SRC = 'https://tpembars.com/MTczODI1.js?t=173825';
const EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'mousemove'] as const;

export default function TpDrive() {
  const path = usePathname();
  useEffect(() => {
    if (path?.startsWith('/asystent') || document.querySelector(`script[src="${SRC}"]`)) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      cleanup();
      const go = () => {
        const s = document.createElement('script');
        s.src = SRC;
        s.async = true;
        s.setAttribute('data-cmp-ab', '2');
        document.head.appendChild(s);
      };
      if ('requestIdleCallback' in window) (window as any).requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 200);
    };
    const timer = setTimeout(load, 5000);
    const cleanup = () => { clearTimeout(timer); EVENTS.forEach((e) => window.removeEventListener(e, load)); };
    EVENTS.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
    return cleanup;
  }, [path]);
  return null;
}
