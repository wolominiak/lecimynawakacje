import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import DealPage from '@/components/DealPage';
import { DEAL_CATS } from '@/lib/categories';

const cat = DEAL_CATS['wycieczki-objazdowe'];
export const metadata: Metadata = seo({ title: cat.title, description: cat.lead, path: '/wycieczki-objazdowe/' });

export default function Page() {
  return <DealPage cat={cat} />;
}
