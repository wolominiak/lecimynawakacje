'use client';
import Script from 'next/script';
import { useEffect, useState } from 'react';

// Google Analytics 4 z trybem zgody (Consent Mode v2).
// Domyślnie analityka jest wyłączona; po kliknięciu "Akceptuję" GA zapisuje cookies.
// Bez zgody GA wysyła tylko anonimowe sygnały bez plików cookie.

export const GA_ID = 'G-EE607H39KK';
const KEY = 'lnw-consent';

type W = Window & { gtag?: (...a: unknown[]) => void };

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export default function Analytics() {
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!read()) setAsk(true);
    const open = () => setAsk(true);
    window.addEventListener('lnw-consent-open', open);
    return () => window.removeEventListener('lnw-consent-open', open);
  }, []);

  const choose = (v: 'granted' | 'denied') => {
    try { localStorage.setItem(KEY, v); } catch { /* brak storage */ }
    (window as W).gtag?.('consent', 'update', { analytics_storage: v });
    setAsk(false);
  };

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">{`
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem('${KEY}')}catch(e){}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:c==='granted'?'granted':'denied'});
gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
      {ask && (
        <div className="consent" role="dialog" aria-label="Pliki cookie">
          <p>Ta strona używa plików cookie. <a href="/polityka-prywatnosci/">Polityka prywatności</a></p>
          <div className="consent-b">
            <button className="btn btn-sm btn-ghost" onClick={() => choose('denied')}>Tylko niezbędne</button>
            <button className="btn btn-sm" onClick={() => choose('granted')}>Akceptuję</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Przycisk do zmiany decyzji (np. w polityce prywatności) */
export function ConsentLink() {
  return <button className="linkbtn" onClick={() => window.dispatchEvent(new Event('lnw-consent-open'))}>Zmień ustawienia plików cookie</button>;
}
