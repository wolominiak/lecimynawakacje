'use client';
import { useEffect } from 'react';
import aff from '@/data/affiliate.json';

const SRC = 'https://widget.wakacje.pl/v2/public/js/widgets/mini-listing-widget-v2.js';

/** Mini-listing ofert wakacje.pl (TravelLead). Każdy widget na stronie musi mieć inne id. */
export default function OffersWidget({ country, region, count = 10, uid }: { country?: number | null; region?: number | null; count?: number; uid: string }) {
  const id = `mini-listing-widget-${uid}`;
  useEffect(() => {
    const s = document.createElement('script');
    s.src = `${SRC}?c=${id}`;
    s.async = true;
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [id]);

  const attrs: Record<string, string> = {
    'data-branding': 'false',
    'data-version': 'normal',
    'data-offer-counter': String(count),
    'data-affiliate': aff.wakacje.a_aid,
    'data-campaign': aff.wakacje.utm_campaign,
  };
  if (region) attrs['data-directions-regions'] = String(region);
  else if (country) attrs['data-directions-countries'] = String(country);

  return (
    <div className="offers-widget">
      <div id={id} key={id} {...attrs} />
      <noscript>Włącz JavaScript, aby zobaczyć aktualne oferty.</noscript>
    </div>
  );
}
