import WorldMap from '@/components/WorldMap';
export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap hero-in">
        <span className="eyebrow" style={{ color: 'var(--gold)' }}>Błąd 404</span>
        <h1 style={{ marginTop: 14 }}>Ta strona <em className="s">odleciała</em></h1>
        <p className="lead">Strony już nie ma, ale świat jest na miejscu. Wybierz kraj na mapie albo przejdź do <a href="/wakacje/" style={{ textDecoration: 'underline' }}>listy kierunków</a>.</p>
        <WorldMap />
      </div>
    </section>
  );
}
