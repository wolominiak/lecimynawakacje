import type { Metadata } from 'next';
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
  return {
    title: `${a.title} 2027 - ceny, terminy, porty`,
    description: a.teaser,
    alternates: { canonical: `/rejsy/${a.slug}/` },
  };
}

export default async function Page({ params }: { params: Promise<{ akwen: string }> }) {
  const a = cruiseArea((await params).akwen);
  if (!a) notFound();
  return <CruisePage area={a} />;
}
