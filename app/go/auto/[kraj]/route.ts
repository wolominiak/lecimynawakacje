import { NextRequest, NextResponse } from 'next/server';
import { getCountry } from '@/lib/data';
import { tpUrl } from '@/lib/travelpayouts';

// Wynajem auta (DiscoverCars). Strona kraju po polsku: discovercars.com/pl/<kraj po angielsku>.
// Nie każdy kraj ma stronę pod przewidywalnym adresem, więc sprawdzamy ją raz (cache 7 dni),
// a gdy jej nie ma, kierujemy na polską stronę główną.
const ALT: Record<string, string[]> = {
  usa: ['usa', 'united-states'], 'wielka-brytania': ['united-kingdom', 'uk'], turcja: ['turkey', 'turkiye'],
  'zjednoczone-emiraty-arabskie': ['united-arab-emirates', 'uae'], czechy: ['czech-republic', 'czechia'],
};
const en = new Intl.DisplayNames(['en'], { type: 'region' });
const kebab = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function exists(slug: string) {
  try {
    const r = await fetch(`https://www.discovercars.com/${slug}`, { method: 'HEAD', redirect: 'manual', next: { revalidate: 604800 } } as RequestInit);
    return r.status === 200;
  } catch { return false; }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ kraj: string }> }) {
  const c = getCountry((await params).kraj);
  let target = 'https://www.discovercars.com/pl';
  if (c) {
    let name = c.name;
    try { name = en.of(c.code) || c.name; } catch {}
    const cands = ALT[c.slug] || [kebab(name)];
    for (const s of cands) if (await exists(s)) { target = `https://www.discovercars.com/pl/${s}`; break; }
  }
  return NextResponse.redirect(tpUrl('discovercars', target), 302);
}
