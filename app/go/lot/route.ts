import { NextRequest, NextResponse } from 'next/server';
import { tpUrl } from '@/lib/travelpayouts';
import aff from '@/data/affiliate.json';

// Własna wyszukiwarka (White Label Travelpayouts), gdy domena jest gotowa; inaczej aviasales.com
const WL = (aff.travelpayouts as { whiteLabel?: string }).whiteLabel || '';
const WL_Q = 'currency=pln&locale=pl';

// Loty (Aviasales): aviasales.com/search/<SKĄD><DDMM><DOKĄD>[<DDMM powrotu>]<dorośli>
const IATA = /^[A-Z]{3}$/;
const ddmm = (d: string) => d.slice(8, 10) + d.slice(5, 7);
const plus = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const isDate = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const o = (sp.get('o') || 'WAW').toUpperCase();
  const d = (sp.get('d') || '').toUpperCase();
  if (!IATA.test(o) || !IATA.test(d) || o === d) return NextResponse.redirect(WL ? `https://${WL}/?${WL_Q}` : tpUrl('aviasales', 'https://www.aviasales.com/'), 302);
  const dd = isDate(sp.get('dd')) && sp.get('dd')! >= plus(0) ? sp.get('dd')! : plus(30);
  const oneWay = sp.get('ow') === '1';
  const rd = isDate(sp.get('rd')) && sp.get('rd')! > dd ? sp.get('rd')! : (() => { const x = new Date(dd + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 7); return x.toISOString().slice(0, 10); })();
  const a = Math.min(9, Math.max(1, Number(sp.get('a')) || 1));
  const path = `${o}${ddmm(dd)}${d}${oneWay ? '' : ddmm(rd)}${a}`;
  if (WL) return NextResponse.redirect(`https://${WL}/flights/${path}?${WL_Q}`, 302);
  return NextResponse.redirect(tpUrl('aviasales', `https://www.aviasales.com/search/${path}`), 302);
}
