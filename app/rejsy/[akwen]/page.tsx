import type { Metadata } from 'next';
import { seo, ogImage, pick } from '@/lib/seo';
import { notFound } from 'next/navigation';
import CruisePage from '@/components/CruisePage';
import { CRUISE_AREAS, cruiseArea } from '@/lib/cruises';

export const dynamicParams = false;
export function generateStaticParams() {
  return CRUISE_AREAS.map((a) => ({ akwen: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ akwen: string }> }): Promise<Metadata> {
  const a = cruiseArea((await params).akwen);
  if (!a) return {};
  return seo({
    title: pick(`${a.title} - ceny, terminy, porty`, `${a.title} - ceny i terminy`, a.title),
    description: `${a.teaser} Aktualne rejsy z cenami i terminami.`,
    path: `/rejsy/${a.slug}/`,
    image: ogImage(`rejsy-${a.slug}`, 'rejsy'),
  });
}

export default async function Page({ params }: { params: Promise<{ akwen: string }> }) {
  const a = cruiseArea((await params).akwen);
  if (!a) notFound();
  return <CruisePage area={a} />;
}
