'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Search from './Search';

const LINKS = [
  { href: '/wakacje/', label: 'Kierunki A-Z' },
  { href: '/gdzie-na-wakacje/', label: 'Gdzie na wakacje?' },
  { href: '/last-minute/', label: 'Last minute' },
  { href: '/rejsy/', label: 'Rejsy' },
  { href: '/kontynenty/europa/', label: 'Europa' },
  { href: '/kontynenty/azja/', label: 'Egzotyka' },
  { href: '/asystent/', label: '✦ Asystent AI' },
];

// Menu na telefonie i tablecie: przycisk w nagłówku, panel z wyszukiwarką i linkami
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; document.body.classList.remove('menu-open'); };
  }, [open]);
  return (
    <>
      <button className={'burger' + (open ? ' on' : '')} aria-label={open ? 'Zamknij menu' : 'Otwórz menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
      {open && createPortal(
        <div className="mmenu" role="dialog" aria-label="Menu">
          <div className="mmenu-in">
            <Search big placeholder="Dokąd lecimy? Kraj, wyspa, region..." />
            <nav>
              {LINKS.map((l) => <a key={l.href} href={l.href} className={path === l.href ? 'on' : ''}>{l.label}<span>&rarr;</span></a>)}
            </nav>
            <div className="mmenu-chips">
              {['grecja', 'turcja', 'egipt', 'hiszpania', 'chorwacja', 'tajlandia'].map((s) => <a key={s} className="chip" href={`/wakacje/${s}/`}>{s[0].toUpperCase() + s.slice(1)}</a>)}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
