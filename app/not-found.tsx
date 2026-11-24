import { popular } from '@/lib/data';

export default function NotFound() {
  const top = popular(8);
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-panel">
          <span className="eyebrow">Błąd 404</span>
          <h1>Ta strona odleciała</h1>
          <p className="lead">Strony już nie ma, ale świat jest na miejscu. Wróć na <a href="/" style={{ textDecoration: 'underline' }}>mapę świata</a> albo przejdź do <a href="/wakacje/" style={{ textDecoration: 'underline' }}>listy kierunków</a>.</p>
          <div className="chips" style={{ marginTop: 18 }}>
            {top.map((c) => <a key={c.slug} className="chip" href={`/wakacje/${c.slug}/`}>{c.name}</a>)}
          </div>
        </div>
      </div>
    </section>
  );
}
