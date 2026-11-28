import { CATEGORIES, type CatIcon } from '@/lib/categories';

// Pasek kategorii z ikonami (strona główna i strony kategorii)
const P: Record<CatIcon, React.ReactNode> = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  infinity: <path d="M6.5 8.5c-2 0-3.5 1.6-3.5 3.5s1.5 3.5 3.5 3.5c3.5 0 7.5-7 11-7 2 0 3.5 1.6 3.5 3.5s-1.5 3.5-3.5 3.5c-3.5 0-7.5-7-11-7Z" />,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14.5h2" /><path d="M7 6V4.5h10V6" /></>,
  beach: <><path d="M4 20h16" /><path d="M12 20 9.5 8" /><path d="M4 9a8 8 0 0 1 15 -2Z" /><circle cx="18.5" cy="16.5" r="1.5" /></>,
  palm: <><path d="M12 21c0-5 .5-8 2-11" /><path d="M14 10c-1-3-4-4-7-3 2 0 4 1 5 3" /><path d="M14 10c1-3 4-4 7-2-2-.5-4 0-5 2" /><path d="M14 10c3 0 5 2 5 5-1-2-3-3-5-4" /><path d="M14 10c-3 0-5 2-5.5 4.5 1.5-1.5 3-2.5 5.5-3.5" /><path d="M5 21h14" /></>,
  bus: <><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M8 17v2M16 17v2" /><circle cx="8" cy="14" r=".8" /><circle cx="16" cy="14" r=".8" /></>,
  ship: <><path d="M3 15h18l-2.5 4.5h-13Z" /><path d="M6 15V10h12v5M9 10V6h6v4M12 6V3" /><path d="M2 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" /></>,
  plane: <path d="M10.5 3.5c.4-.9 1.6-.9 2 0l.9 5.5 6.6 3.8v1.9l-6.6-1.6-.5 4.4 2 1.6v1.4l-3.4-1-3.4 1v-1.4l2-1.6-.5-4.4L3 14.7v-1.9L9.6 9l.9-5.5Z" />,
  bed: <><path d="M3 18V6M3 13h18v5M21 18v-3.5A3.5 3.5 0 0 0 17.5 11H11v2" /><circle cx="7" cy="10" r="2" /></>,
  car: <><path d="M5 16V12l2-5h10l2 5v4" /><rect x="3.5" y="12" width="17" height="5" rx="2" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>,
  party: <><path d="M4 20 9.5 7.5l7 7Z" /><path d="M13 4.5c1 .8 1.2 2 .6 3M17 9.5c1.2-.4 2.4 0 3 1M15.5 3v1.5M20 6h1.5M19 3l-1 1" /></>,
  ticket: <><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M14 6v12" strokeDasharray="2 2" /></>,
  spark: <><path d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" /><path d="M19 15c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" /></>,
};

export default function CategoryBar({ active, title }: { active?: string; title?: string }) {
  return (
    <nav className="cats" aria-label="Rodzaje wyjazdów">
      {title && <h2 className="cats-title">{title}</h2>}
      <div className="cats-row">
        {CATEGORIES.map((c) => (
          <a key={c.slug} href={c.href} className={'cat' + (active === c.slug ? ' on' : '')} aria-current={active === c.slug ? 'page' : undefined}>
            <span className="cat-i" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{P[c.icon]}</svg>
            </span>
            <span className="cat-l">{c.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
