import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LastMinutePage from '@/components/LastMinutePage';
import { lmCountries, lmCountry } from '@/lib/lastminute';

export const dynamicParams = false;
export function generateStaticParams() {
  return lmCountries().map((c) => ({ kraj: c.slug }));
}
type P = { params: Promise<{ kraj: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { kraj } = await params;
  const c = lmCountry(kraj);
  if (!c?.country?.content) return {};
  return {
    title: `Last minute ${c.country.content.loc} - tanie wakacje na ostatnią chwilę`,
    description: `Oferty last minute ${c.country.content.loc} z wylotem w najbliższych dniach. Filtruj po terminie, wyżywieniu, budżecie i lotnisku wylotu.`,
    alternates: { canonical: `/last-minute/${kraj}/` },
  };
}

export default async function Page({ params }: P) {
  const { kraj } = await params;
  const c = lmCountry(kraj);
  if (!c?.country?.content) notFound();
  return <LastMinutePage country={c.country} apiName={c.name} />;
}
