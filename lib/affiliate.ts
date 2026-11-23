// Wszystkie linki partnerskie w jednym miejscu.
// Parametry partnerskie: data/affiliate.json

export const SITE = {
  name: 'Lecimy na wakacje',
  domain: 'lecimynawakacje.pl',
  url: 'https://lecimynawakacje.pl',
};

import aff from '@/data/affiliate.json';

export const GYG_PARTNER_ID = aff.gygPartnerId;

// Linki partnerskie są maskowane: na stronie widać /go/..., a przekierowanie
// z parametrami TravelLead i GetYourGuide robi next.config.mjs (dane w data/affiliate.json).

/** Link do ofert wakacje.pl, np. path = "kreta" -> /go/wakacje/kreta */
export function wakacjeUrl(path?: string, opts?: { allInclusive?: boolean; lastMinute?: boolean }) {
  if (opts?.lastMinute) return '/go/last-minute/';
  const base = opts?.allInclusive ? '/go/all-inclusive' : '/go/wakacje';
  return path ? `${base}/${encodeURIComponent(path.replace(/\/$/, ''))}/` : `${base}/`;
}

/** Wyszukiwarka atrakcji GetYourGuide z ID partnera */
export function gygSearchUrl(query: string) {
  return '/go/atrakcje/' + encodeURIComponent(query) + '/';
}
