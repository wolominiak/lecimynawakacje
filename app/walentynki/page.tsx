import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import OccasionPage from '@/components/OccasionPage';
import { WALENTYNKI as O } from '@/lib/occasions';

export const metadata: Metadata = seo({ title: O.metaTitle, description: O.metaDesc, path: '/walentynki/' });

export default function Page() {
  return <OccasionPage o={O} />;
}
