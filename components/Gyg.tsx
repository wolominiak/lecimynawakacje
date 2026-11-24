'use client';
import { useEffect } from 'react';
import { useNearView } from './useNearView';
import { GYG_PARTNER_ID, gygSearchUrl } from '@/lib/affiliate';

const SRC = 'https://widget.getyourguide.com/dist/pa.umd.production.min.js';

export function GygWidget({ q, items = 4, title }: { q: string; items?: number; title?: string }) {
  const [box, near] = useNearView<HTMLDivElement>();
  useEffect(() => {
    if (!near) return;
    if (document.querySelector(`script[src="${SRC}"]`)) {
      // skrypt już jest - ponowne skanowanie widgetów po nawigacji
      (window as any).GYG?.Widget?.init?.();
      return;
    }
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-gyg-partner-id', GYG_PARTNER_ID);
    document.body.appendChild(s);
  }, [q, near]);

  return (
    <div className="gyg-box" ref={box}>
      <div className="gyg-head">
        <h3>{title || `Wycieczki i bilety: ${q}`}</h3>
        <a className="link-arrow" href={gygSearchUrl(q)} target="_blank" rel="sponsored nofollow noopener">Zobacz wszystkie &rarr;</a>
      </div>
      <div
        key={q}
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-locale-code="pl-PL"
        data-gyg-currency="PLN"
        data-gyg-widget="activities"
        data-gyg-number-of-items={String(items)}
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-cmp="lecimynawakacje"
        data-gyg-q={q}
      />
    </div>
  );
}
