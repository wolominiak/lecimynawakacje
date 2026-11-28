import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import OccasionPage from '@/components/OccasionPage';
import { SYLWESTER as O } from '@/lib/occasions';

export const metadata: Metadata = seo({ title: O.metaTitle, description: O.metaDesc, path: '/sylwester/' });

export default function Page() {
  return <OccasionPage o={O} />;
}
