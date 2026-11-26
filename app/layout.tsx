import './globals.css';
import type { Metadata, Viewport } from 'next';
import Logo from '@/components/Logo';
import Search from '@/components/Search';
import AssistantLauncher from '@/components/AssistantLauncher';
import MobileMenu from '@/components/MobileMenu';
import TpDrive from '@/components/TpDrive';
import { DealBar } from '@/components/Promo';
import Analytics from '@/components/Analytics';
import { CONTINENTS, popular } from '@/lib/data';
import { SITE } from '@/lib/affiliate';
import { seo } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  ...seo({
    title: 'Gdzie na wakacje? Przewodnik po kierunkach z całego świata',
    description: 'Gdzie na wakacje? Przewodniki po krajach i regionach całego świata: kiedy jechać, pogoda, atrakcje, all inclusive i aktualne oferty biur podróży.',
    path: '/',
  }),
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { themeColor: '#0b6e99', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const top = popular(8);
  return (
    <html lang="pl">
      <body>
        <header className="hdr">
          <div className="wrap hdr-in">
            <Logo />
            <nav className="nav" aria-label="Główna nawigacja">
              <a href="/wakacje/">Kierunki</a>
              <a href="/gdzie-na-wakacje/">Gdzie na wakacje?</a>
              <a href="/rejsy/">Rejsy</a>
              <a href="/kontynenty/azja/">Egzotyka</a>
              <a href="/asystent/" className="nav-ai">Asystent AI</a>
            </nav>
            <div className="hdr-right">
              <Search placeholder="Szukaj kierunku..." />
              <a className="btn btn-sm" href="/last-minute/">Last minute</a>
              <MobileMenu />
            </div>
          </div>
        </header>
        <DealBar />
        <main>{children}</main>
        <AssistantLauncher />
        <TpDrive />
        <Analytics />
        <footer className="ftr">
          <div className="wrap">
            <div className="ftr-grid">
              <div>
                <Logo />
                <p>Przewodniki po kierunkach wakacyjnych z całego świata. Sprawdzasz, kiedy jechać i co zobaczyć, a potem porównujesz oferty biur podróży.</p>
              </div>
              <div>
                <h4>Popularne</h4>
                <ul>{top.map((c) => <li key={c.slug}><a href={`/wakacje/${c.slug}/`}>Wakacje {c.content?.loc}</a></li>)}</ul>
              </div>
              <div>
                <h4>Kontynenty</h4>
                <ul>{CONTINENTS.map((c) => <li key={c.slug}><a href={`/kontynenty/${c.slug}/`}>{c.name}</a></li>)}</ul>
              </div>
              <div>
                <h4>Serwis</h4>
                <ul>
                  <li><a href="/wakacje/">Wszystkie kraje A-Z</a></li>
                  <li><a href="/gdzie-na-wakacje/">Gdzie na wakacje w danym miesiącu</a></li>
                  <li><a href="/last-minute/">Last minute</a></li>
                  <li><a href="/o-serwisie/">O serwisie i współpraca</a></li>
                  <li><a href="/polityka-prywatnosci/">Polityka prywatności</a></li>
                </ul>
              </div>
            </div>
            <div className="ftr-bottom">
              <span>© {new Date().getFullYear()} lecimynawakacje.pl</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
