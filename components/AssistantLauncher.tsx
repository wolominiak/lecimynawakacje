'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Czat ładuje się dopiero po kliknięciu, żeby nie spowalniać strony
const Chat = dynamic(() => import('./AssistantChat'), { ssr: false, loading: () => <div className="as as-loading">Wczytuję asystenta...</div> });
const OPEN = 'lnw-asystent-open';

export default function AssistantLauncher() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { try { if (sessionStorage.getItem(OPEN) === '1' && window.innerWidth > 720) setOpen(true); } catch {} }, []);
  const toggle = (v: boolean) => { setOpen(v); try { sessionStorage.setItem(OPEN, v ? '1' : '0'); } catch {} };
  if (path?.startsWith('/asystent')) return null;
  return (
    <>
      {open && <div className="as-pop"><Chat onClose={() => toggle(false)} /></div>}
      {!open && (
        <button className="as-fab" onClick={() => toggle(true)} aria-label="Otwórz asystenta podróży">
          <span className="as-fab-i" aria-hidden="true">✦</span>
          <span>Zaplanuj z AI</span>
        </button>
      )}
    </>
  );
}
