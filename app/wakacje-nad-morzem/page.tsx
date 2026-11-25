import type { Metadata } from 'next';
import { seo } from '@/lib/seo';
import DealPage from '@/components/DealPage';
import { DEAL_CATS } from '@/lib/categories';

const cat = DEAL_CATS['wakacje-nad-morzem'];
export const metadata: Metadata = seo({ title: cat.title, description: cat.lead, path: '/wakacje-nad-morzem/' });

export default function Page() {
  return <DealPage cat={cat} />;
}
