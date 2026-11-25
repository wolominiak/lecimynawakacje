import type { Country } from '@/lib/types';
import { esimFor, esimUrl, usd } from '@/lib/esim';

const Icon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <rect x="8.5" y="11" width="7" height="7" rx="1" />
    <path d="M12 11v7M8.5 14.5h7" />
  </svg>
);

/** Karta w bocznej kolumnie */
export function EsimBox({ c }: { c: Country }) {
  const e = esimFor(c);
  if (!e) return null;
  const from = Math.min(e.package ?? Infinity, e.unlimited ?? Infinity);
  return (
    <div className="box esim-box">
      <div className="esim-head"><span className="esim-ico"><Icon /></span><h3>Internet w podróży: {c.name}</h3></div>
      <p>{c.eu ? 'W UE działa roaming z Polski, ale limit danych w abonamencie bywa mały. ' : 'Roaming poza UE jest drogi. '}Karta eSIM działa od razu po wylądowaniu, bez wymiany karty SIM.</p>
      <p className="esim-price">od <b>{usd(from)}</b></p>
      <a className="btn" href={esimUrl(c, e.package != null ? 'package' : 'unlimited')} target="_blank" rel="nofollow noopener">Kup eSIM {c.name} &rarr;</a>
    </div>
  );
}

/** Sekcja w treści przewodnika */
export function EsimSection({ c, loc }: { c: Country; loc: string }) {
  const e = esimFor(c);
  if (!e) return null;
  return (
    <div className="esim-sec">
      <h3>Internet i karta eSIM</h3>
      <p>
        {c.eu
          ? `${c.name} jest w Unii Europejskiej, więc polska karta działa w roamingu na krajowych zasadach. Pakiet danych w roamingu bywa jednak ograniczony, dlatego przy dłuższym pobycie lub intensywnym korzystaniu z map i social mediów taniej wychodzi lokalna eSIM.`
          : `${c.name} nie należy do Unii Europejskiej, więc roaming z polską kartą jest płatny i potrafi kosztować kilkadziesiąt złotych za 1 GB. Taniej jest kupić przed wyjazdem kartę eSIM z pakietem danych ${loc}.`}{' '}
        eSIM instalujesz w telefonie przez kod QR, a internet włącza się po przylocie. Twoja polska karta zostaje w telefonie, więc nadal odbierasz SMS-y.
      </p>
      <div className="esim-opts">
        {e.package != null && (
          <a className="esim-opt" href={esimUrl(c, 'package')} target="_blank" rel="nofollow noopener">
            <b>Pakiet danych</b>
            <span>Określona liczba GB na 7 do 30 dni. Najlepszy na krótki urlop.</span>
            <em>od {usd(e.package)} &rarr;</em>
          </a>
        )}
        {e.unlimited != null && (
          <a className="esim-opt" href={esimUrl(c, 'unlimited')} target="_blank" rel="nofollow noopener">
            <b>Pakiet dzienny</b>
            <span>Dzienny limit danych na wybraną liczbę dni. Dla tych, którzy dużo korzystają z internetu.</span>
            <em>od {usd(e.unlimited)} &rarr;</em>
          </a>
        )}
      </div>
      <p className="muted" style={{ fontSize: '0.85rem' }}>Przed zakupem sprawdź, czy Twój telefon obsługuje eSIM (większość modeli iPhone od XS i nowsze telefony z Androidem).</p>
    </div>
  );
}
