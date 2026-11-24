import aff from '@/data/affiliate.json';

/** Parametry TravelLead doklejane do każdego linku do wakacje.pl */
export function trackingQuery(content = 'lista-ofert') {
  return new URLSearchParams({ ...aff.wakacje, utm_content: content }).toString();
}
