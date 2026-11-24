import type { Metadata } from 'next';
import LastMinutePage from '@/components/LastMinutePage';

export const metadata: Metadata = {
  title: 'Last minute - wakacje na ostatnią chwilę, aktualne oferty',
  description: 'Last minute z wylotem w najbliższych dniach: Egipt, Turcja, Hiszpania, Grecja i egzotyka. Filtruj po terminie wylotu, wyżywieniu, budżecie i lotnisku.',
  alternates: { canonical: '/last-minute/' },
};

export default function Page() {
  return <LastMinutePage />;
}
