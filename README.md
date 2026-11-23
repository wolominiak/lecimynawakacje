# lecimynawakacje.pl

Portal turystyczny: przewodniki po wszystkich krajach świata, mapa świata na stronie głównej, linki partnerskie wakacje.pl (TravelLead) i widgety GetYourGuide.

Next.js 15 (App Router), wszystko generowane statycznie (SSG), bez bazy danych. Hosting: Vercel.

## Struktura URL

- `/wakacje/` - wszystkie kraje A-Z
- `/wakacje/grecja/` - przewodnik po kraju
- `/wakacje/grecja/kreta/` - region lub wyspa
- `/wakacje/grecja/kiedy-jechac/`, `/all-inclusive/`, `/atrakcje/` - podstrony long-tail
- `/kontynenty/europa/` - kontynent
- `/gdzie-na-wakacje/styczen/` - ranking kierunków na dany miesiąc (liczony z danych klimatycznych)

## Treści

- `data/countries.json` - podstawowe dane wszystkich 215 krajów (generuje `npm run countries`)
- `content/countries/<slug>.json` - przewodnik po kraju. Pliki z `"source": "manual"` są pisane ręcznie i generator ich nie nadpisze.
- Kraje bez pliku z treścią mają stronę z podstawowymi informacjami i `noindex`, a w sitemapie są tylko strony z pełną treścią.

### Generowanie brakujących przewodników przez Gemini

Najprościej z poziomu GitHuba, bez terminala:

1. Settings -> Secrets and variables -> Actions -> New repository secret: `GEMINI_API_KEY`
2. Actions -> **Generuj przewodniki** -> Run workflow (np. limit 20)
3. Workflow zapisze nowe pliki w repo, a Vercel sam przebuduje stronę.

Lokalnie: `GEMINI_API_KEY=xxx npm run generate -- --limit 20`

## Zdjęcia

Wrzuć plik do `public/img/`:
- `grecja.jpg` - nagłówek i karta kraju
- `grecja-kreta.jpg` - nagłówek regionu

Bez zdjęcia wyświetla się kontur kraju na gradiencie.

## Linki partnerskie

Wszystko w `lib/affiliate.ts`: `TRAVELLEAD_AID = 1874`, `GYG_PARTNER_ID = JIO7LWL`.
Regiony linkują do `wakacje.pl/wczasy/<wakacjePath>/` (np. `kreta`, `hurghada`, `riwiera-turecka`). Gdy `wakacjePath` nie jest podany, link prowadzi do strony kraju.

## Zasada: bez długich myślników

`npm run build` uruchamia najpierw `scripts/check-dashes.mjs`, który przerywa build, jeśli w kodzie lub treściach pojawi się znak — albo –.
