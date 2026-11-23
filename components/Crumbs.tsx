import { SITE } from '@/lib/affiliate';

export default function Crumbs({ items }: { items: { name: string; url?: string }[] }) {
  const all = [{ name: 'Start', url: '/' }, ...items];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, ...(it.url ? { item: SITE.url + it.url } : {}) })),
  };
  return (
    <nav className="crumbs" aria-label="Okruszki">
      {all.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep">/</span>}
          {it.url && i < all.length - 1 ? <a href={it.url}>{it.name}</a> : <span>{it.name}</span>}
        </span>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}
