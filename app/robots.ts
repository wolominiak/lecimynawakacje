import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/affiliate';
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/go/', '/api/'] }], sitemap: SITE.url + '/sitemap.xml', host: SITE.url };
}
