import type { Metadata } from 'next';
import CruisePage from '@/components/CruisePage';

export const metadata: Metadata = {
  title: 'Rejsy wycieczkowe 2027 - Morze Śródziemne, Karaiby, fiordy',
  description: 'Rejsy MSC i Costa z polskich biur podróży: Morze Śródziemne, Karaiby, fiordy norweskie i Wyspy Kanaryjskie. Filtruj po terminie, długości i cenie.',
  alternates: { canonical: '/rejsy/' },
};

export default function Page() {
  return <CruisePage />;
}
