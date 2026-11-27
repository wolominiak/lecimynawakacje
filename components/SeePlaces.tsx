import { spFor } from '@/lib/seeplaces';

// Wycieczki fakultatywne z rezerwacją po polsku (SeePlaces, TradeDoubler)
export default function SeePlaces({ kraj, region, phrase, title }: { kraj: string; region?: string; phrase?: string; title: string }) {
  const list = spFor(kraj, { region, phrase });
  if (!list.length) return null;
  const pln = (n: number) => n.toLocaleString('pl-PL') + ' zł';
  return (
    <section className="sp">
      <div className="sp-head"><h3>{title}</h3><span>Opisy i rezerwacja po polsku, SeePlaces</span></div>
      <div className="sp-list">
        {list.map((t) => (
          <a key={t.id} className="sp-card" href={`/go/sp/?k=${kraj}&id=${encodeURIComponent(t.id)}`} target="_blank" rel="sponsored nofollow noopener">
            <div className="sp-img">{t.img && <img src={t.img} alt="" loading="lazy" />}{t.best ? <span className="sp-best">Bestseller</span> : null}</div>
            <div className="sp-body">
              {t.cat && <small>{t.cat}</small>}
              <b>{t.n}</b>
              <div className="sp-price">{t.op > t.p && <s>{pln(t.op)}</s>} <strong>{t.p ? 'od ' + pln(t.p) : 'Sprawdź cenę'}</strong></div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
