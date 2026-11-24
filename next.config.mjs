import fs from 'fs';

const aff = JSON.parse(fs.readFileSync(new URL('./data/affiliate.json', import.meta.url), 'utf8'));
const W = new URLSearchParams(aff.wakacje).toString();
const G = `partner_id=${aff.gygPartnerId}&cmp=lecimynawakacje&locale_autoredirect_optin=true`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Zamaskowane linki partnerskie: /go/... -> partner z parametrami śledzącymi
      { source: '/go/wakacje', destination: `https://www.wakacje.pl/wczasy/?${W}`, permanent: false },
      { source: '/go/wakacje/:path', destination: `https://www.wakacje.pl/wczasy/:path/?${W}`, permanent: false },
      { source: '/go/all-inclusive', destination: `https://www.wakacje.pl/wczasy/?all-inclusive&${W}`, permanent: false },
      { source: '/go/all-inclusive/:path', destination: `https://www.wakacje.pl/wczasy/:path/?all-inclusive&${W}`, permanent: false },
      { source: '/go/last-minute', destination: `https://www.wakacje.pl/lastminute/?${W}`, permanent: false },
      { source: '/go/esim/:handle', destination: 'https://esimgo.is/pl/products/:handle?utm_source=lecimynawakacje&utm_medium=referral&utm_campaign=esim', permanent: false },
      { source: '/go/atrakcje/:q', destination: `https://www.getyourguide.pl/s/?q=:q&${G}`, permanent: false },

      // Stare adresy z WordPressa - hurtowo na nowe sekcje
      { source: '/category/:path*', destination: '/wakacje/', permanent: true },
      { source: '/tag/:path*', destination: '/wakacje/', permanent: true },
      { source: '/wp-content/:path*', destination: '/', permanent: true },
      { source: '/feed', destination: '/', permanent: true },
    ];
  },
};
export default nextConfig;
