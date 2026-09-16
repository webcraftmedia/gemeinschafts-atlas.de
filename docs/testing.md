# Tests & Linting

Alle Kommandos laufen in `app/`.

| Kommando | Was es tut |
| --- | --- |
| `npm run test:lint` | ESLint + Locales + Typecheck (das, was die CI als Gate fährt) |
| `npm run test:lint:eslint` | ESLint mit `--max-warnings 0` |
| `npm run test:lint:locales` | Prüft `locales/*.json` auf Sortierung und deckungsgleiche Keys |
| `npm run test:lint:locales:fix` | Sortiert die Locale-Dateien neu |
| `npm run test:lint:typecheck` | `vue-tsc --noEmit` |
| `npm run test:unit` | Vitest einmalig inkl. Coverage-Gate |
| `npm run test:unit:dev` | Vitest im Watch-Modus |
| `npm run test:build` | Produktions-Build; jede Warnung ist ein Fehler |
| `npm run test:smoke` | Startet `nuxt dev`, holt `/`, jede Warnung ist ein Fehler |
| `npm run test:size` | Bundle-Budget gegen `.output/public/_nuxt/*` (setzt einen Build voraus) |
| `npm run test:e2e` | Playwright gegen das Produktions-Artefakt, inkl. axe-Scan |
| `npm run test:e2e:ui` | Playwright im UI-Modus |
| `npm run test:e2e:a11y:update` | axe-Baseline neu schreiben (nur nach beabsichtigter Änderung) |

Jedes Gate hat einen eigenen Workflow unter `.github/workflows/app.test.*.yml`,
jeweils mit vorgeschaltetem `paths-filter`-Job, damit Änderungen außerhalb von
`app/` keine Läufe auslösen.

## Coverage: 100 %, ab Tag eins

`app/vitest.config.ts` setzt die Schwelle auf 100 % für Statements, Branches,
Functions und Lines. Das ist kein Selbstzweck: Der einzige Zeitpunkt, zu dem
100 % gratis sind, ist der Projektstart — jeder später gesetzte Wert ist eine
Verhandlung darüber, welche Lücke geduldet wird.

Die Regel dahinter: **Coverage ist das Mittel, nicht das Ziel.** Ein Test, der
nur eine Zeile berührt, ohne eine Aussage zu treffen, erfüllt die Quote und
schadet trotzdem — er behauptet Sicherheit, die es nicht gibt. Wenn ein Stück
Code sich nicht sinnvoll testen lässt, ist das ein Hinweis auf den Code, nicht
auf die Schwelle.

Die Schwelle wird angehoben, nie gesenkt.

## Warum es ein Build- *und* ein Smoke-Gate gibt

Lint, Typecheck und die Unit-Suite fassen drei Dinge nie an: Nitros Scan über
`server/`, die Auto-Import-Registry und den Vue-Compiler über alle Seiten. Genau
dort liegt eine eigene Fehlerklasse — eine Spec-Datei, die als Server-Plugin
eingesammelt wird; zwei Module, die denselben Auto-Import exportieren.

Die beiden Pipelines sind sich dabei nicht einig, und das ist der Grund für zwei
Schritte statt einem: Ein Spec unter `server/plugins/` lässt `nuxt dev` mit einem
Rollup-Fehler abbrechen, während `nuxt build` ihn stillschweigend wegoptimiert
und ein lauffähiges Artefakt abliefert. Ein Build-Gate allein hätte den Fall also
durchgelassen.

Beide Skripte behandeln **jede Warnung als Fehler**, weil Nuxt Warnungen meldet
und trotzdem mit 0 aussteigt. Ausnahmen kommen in die `ACCEPTED`-Liste im
jeweiligen Skript — mit Begründung, und so wenige wie irgend möglich. Jeder
Eintrag dort bedeutet, dass der nächste Leser darauf vertrauen muss, dass diese
Warnung noch harmlos ist.

## Barrierefreiheit

Die E2E-Suite prüft zwei Dinge, die sich nicht überschneiden:

- **`e2e/a11y.spec.ts`, axe-Scan** — WCAG 2.0/2.1/2.2 Level A und AA, also der
  normative Satz und die Latte, die das BFSG anlegt. Ergebnis wird gegen
  `e2e/a11y-baseline.json` verglichen.
- **`e2e/a11y.spec.ts`, Tastatur-Tests** — was axe nicht kann: wo der Fokus
  landet, ob der Skip-Link als erstes erreichbar wird, ob jeder Link ohne Maus
  bedienbar ist.

Die Baseline ist eine Ratsche, die sich nur nach unten bewegt. Eine neue
Verletzung lässt den Lauf scheitern; eine behobene ebenfalls — mit der
Aufforderung, den Eintrag zu entfernen, damit er nicht später eine echte
Regression deckt. Aktualisieren mit `npm run test:e2e:a11y:update`.

Heute ist die Baseline leer. Das ist der Zustand, den sie behalten soll.

## E2E gegen das Produktions-Artefakt

`playwright.config.ts` baut die App und startet den Nitro-Server, statt gegen
`nuxt dev` zu testen. Zwei Gründe: Der Dev-Server lädt nach der Hydration die
Nuxt DevTools nach und rendert die Seite unter dem laufenden Test neu, und
getestet werden soll ohnehin das, was deployt wird.

`e2e/global-setup.ts` prüft vorher über `/api/health`, dass der Dienst auf dem
Port wirklich diese Anwendung ist. Ohne das übernimmt Playwrights
`reuseExistingServer` klaglos einen fremden Dienst, der zufällig denselben Port
hält — die Suite testet dann die falsche App und die Fehlermeldungen zeigen auf
die eigenen Seiten. Der Port lässt sich über `E2E_PORT` verschieben.

## Was nicht geprüft wird

- **CSS** wird von ESLint ausgenommen (Begründung steht in
  `app/eslint.config.ts`). Prettier formatiert es weiterhin. Sollte
  handgeschriebenes CSS nennenswert wachsen, ist die Antwort stylelint mit
  `stylelint-config-tailwindcss` als eigenes Gate.
- **Visuelle Regression** gibt es nicht. Bei einer Seite ohne Bildsprache wären
  Screenshot-Vergleiche vor allem eine Quelle für Flakes.
