'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Travelpayouts Drive (podmiana linków, słowa kluczowe, podglądy).
// Ładowany po pełnym wczytaniu strony (lazyOnload), żeby nie spowalniać otwierania.
// Wyłączony na stronie asystenta AI.
export default function TpDrive() {
  const path = usePathname();
  if (path?.startsWith('/asystent')) return null;
  return <Script id="tp-drive" src="https://tpembars.com/MTczODI1.js?t=173825" strategy="lazyOnload" data-cmp-ab="2" />;
}
