import WorldMap from '@/components/WorldMap';
export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-panel">
          <span className="eyebrow">Błąd 404</span>
          <h1>Ta strona odleciała</h1>
          <p className="lead">Strony już nie ma, ale świat jest na miejscu. Wybierz kraj na mapie albo przejdź do <a href="/wakacje/" style={{ textDecoration: 'underline' }}>listy kierunków</a>.</p>
          <WorldMap />
        </div>
      </div>
    </section>
  );
}
