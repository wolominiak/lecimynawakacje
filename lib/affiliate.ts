// Wszystkie linki partnerskie w jednym miejscu.
// wakacje.pl (TravelLead): partner a_aid 1874.
// Jeśli panel TravelLead generuje deeplinki w innym formacie, zmień tylko funkcję wakacjeUrl().

export const SITE = {
  name: 'Lecimy na wakacje',
  domain: 'lecimynawakacje.pl',
  url: 'https://lecimynawakacje.pl',
};

export const TRAVELLEAD_AID = '1874';
export const GYG_PARTNER_ID = 'JIO7LWL';

/** Link do listy ofert na wakacje.pl, np. path = "grecja/kreta" */
export function wakacjeUrl(path?: string, opts?: { allInclusive?: boolean; lastMinute?: boolean }) {
  let url = 'https://www.wakacje.pl/';
  if (opts?.lastMinute) url += 'lastminute/' + (path ? path.replace(/\/?$/, '/') : '');
  else url += 'wczasy/' + (path ? path.replace(/\/?$/, '/') : '');
  const params = new URLSearchParams();
  params.set('a_aid', TRAVELLEAD_AID);
  let q = params.toString();
  if (opts?.allInclusive) q = 'all-inclusive&' + q;
  return url + '?' + q;
}

/** Wyszukiwarka atrakcji GetYourGuide z ID partnera */
export function gygSearchUrl(query: string) {
  const p = new URLSearchParams({ q: query, partner_id: GYG_PARTNER_ID, cmp: 'lecimynawakacje', locale_autoredirect_optin: 'true' });
  return 'https://www.getyourguide.pl/s/?' + p.toString();
}
