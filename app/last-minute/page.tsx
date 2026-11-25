import type { Metadata } from 'next';
import { seo, ogImage } from '@/lib/seo';
import LastMinutePage from '@/components/LastMinutePage';

export const metadata: Metadata = seo({
  title: 'Last minute - wakacje na ostatnią chwilę',
  description: 'Last minute z wylotem w najbliższych dniach: Egipt, Turcja, Hiszpania, Grecja i egzotyka. Filtruj po terminie, wyżywieniu, budżecie i lotnisku.',
  path: '/last-minute/',
});

export default function Page() {
  return <LastMinutePage />;
}
