// Wszystkie linki partnerskie w jednym miejscu.
// wakacje.pl (TravelLead): partner a_aid 1874.
// Jeśli panel TravelLead generuje deeplinki w innym formacie, zmień tylko funkcję wakacjeUrl().

export const SITE = {
  name: 'Lecimy na wakacje',
  domain: 'lecimynawakacje.pl',
  url: 'https://lecimynawakacje.pl',
};

export const TRAVELLEAD_AID = '1874';
export const TRAVELLEAD_CID = '11111111';
export const GYG_PARTNER_ID = 'JIO7LWL';

/** Parametry śledzące TravelLead - dokładnie jak w generatorze linków w panelu partnera */
const TRAVELLEAD_PARAMS = {
  utm_source: 'travellead',
  utm_medium: 'cps',
  utm_campaign: `${TRAVELLEAD_AID}-lecimynawakacje.pl`,
  a_aid: TRAVELLEAD_AID,
  a_cid: TRAVELLEAD_CID,
};

/** Link do listy ofert na wakacje.pl, np. path = "kreta" -> /wczasy/kreta/ */
export function wakacjeUrl(path?: string, opts?: { allInclusive?: boolean; lastMinute?: boolean }) {
  let url = 'https://www.wakacje.pl/';
  if (opts?.lastMinute) url += 'lastminute/' + (path ? path.replace(/\/?$/, '/') : '');
  else url += 'wczasy/' + (path ? path.replace(/\/?$/, '/') : '');
  let q = new URLSearchParams(TRAVELLEAD_PARAMS).toString();
  if (opts?.allInclusive) q = 'all-inclusive&' + q;
  return url + '?' + q;
}

/** Wyszukiwarka atrakcji GetYourGuide z ID partnera */
export function gygSearchUrl(query: string) {
  const p = new URLSearchParams({ q: query, partner_id: GYG_PARTNER_ID, cmp: 'lecimynawakacje', locale_autoredirect_optin: 'true' });
  return 'https://www.getyourguide.pl/s/?' + p.toString();
}
