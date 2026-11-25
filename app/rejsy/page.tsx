import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import CruisePage from '@/components/CruisePage';

export const metadata: Metadata = seo({
  title: 'Rejsy wycieczkowe - Morze Śródziemne, Karaiby, fiordy',
  description: 'Rejsy MSC i Costa z polskich biur podróży: Morze Śródziemne, Karaiby, fiordy norweskie i Wyspy Kanaryjskie. Filtruj po terminie, długości i cenie.',
  path: '/rejsy/',
  image: ogImage('rejsy'),
});

export default function Page() {
  return <CruisePage />;
}
