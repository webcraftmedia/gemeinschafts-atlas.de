# Gemeinschafts-Atlas

Verzeichnis von Gemeinschaften, Projekten und Orten des gemeinschaftlichen
Lebens. Nuxt 4 mit SSR, Deployment als Node-Prozess hinter einem Reverse Proxy.

## Aufbau

```
.
├── docker-compose.yml          Stack: App (gebaut) + PostGIS
├── docker-compose.override.yml Lokal: App als Dev-Server mit Hot Reload
├── app/                    Die Anwendung (Nuxt-Projekt)
│   ├── Dockerfile          Mehrstufig: development / build / production
│   ├── app/                Vue-Ebene: app.vue, pages/, layouts/, components/,
│   │                       utils/, data/, assets/
│   ├── server/             Nitro: API-Routen
│   ├── locales/            Übersetzungen (de.json)
│   ├── test/               Vitest-Setup und Helfer
│   ├── e2e/                Playwright-Suite inkl. axe-Baseline
│   └── scripts/            Build-/Smoke-Gates, Locales-Lint
├── docs/
│   ├── testing.md          Was geprüft wird und warum
│   └── karte.md            Kacheln, Kartenstil, Zoomgrenzen, Barrierefreiheit
└── .github/
    ├── workflows/          Ein Workflow je Gate
    └── webhooks/           Deployment via GitHub-Release-Webhook
```

Der Anwendungsordner heißt `app/`, und darin liegt noch einmal ein `app/` — das
ist Nuxts eigene Konvention für das `srcDir` seit Version 4, keine Doppelung aus
Versehen.

## Entwicklung

Voraussetzung: Node in der Version aus `app/.tool-versions` (derzeit 26.8.1),
sowie `jq` für das Locales-Gate.

Es gibt zwei gleichwertige Wege, die App zu starten. Beide funktionieren, beide
werden in der CI gebaut — such dir einen aus.

**Alles im Container** (nichts außer Docker nötig):

```sh
docker compose up -d           # App auf http://localhost:3000, PostGIS auf 5433
docker compose logs -f app
```

Der Quellcode ist eingebunden, Hot Reload funktioniert. Der erste Start dauert
länger, weil im Container einmal `npm install` in ein leeres Volume läuft.

**App auf dem Host, nur die Datenbank im Container** (schnellere Iteration):

```sh
docker compose up -d postgres  # PostGIS auf 127.0.0.1:5433

cd app
cp .env.template .env
npm ci
npm run dev                    # http://localhost:3000
```

Beide Wege belegen Port 3000 — es sind Alternativen, nicht Ergänzungen. Wer sie
doch nebeneinander braucht, verschiebt den Container: `APP_PORT=3002 docker
compose up -d` (oder dauerhaft `APP_PORT=3002` in einer `.env` im
Repo-Wurzelverzeichnis, die ist gitignored).

`node_modules` und `.nuxt` liegen im Container in eigenen Volumes und
nicht im bind-gemounteten Quellcode; das ist keine Optimierung, sondern nötig:
`esbuild` und `unrs-resolver` bringen native Binaries mit, und der Host ist
glibc, das Image musl. Ein geteiltes Verzeichnis hätte für eine der beiden
Seiten immer die falschen.

Deployt wird derzeit weiterhin als Node-Prozess über pm2 auf dem Host, nicht als
Container — siehe [Deployment](#deployment). Das `production`-Target im
Dockerfile ist damit heute vor allem ein Prüfstein in der CI; es ist aber
vollständig und lauffähig, falls du den Deploy später umstellen willst.

### Datenbank

PostGIS statt nacktem PostgreSQL, weil ein Atlas Geodaten sind: Umkreissuche,
Bounding-Box-Abfragen fürs Kartenfenster und Marker-Clustering sind dort
indizierte Standardoperationen statt Handarbeit. Das weicht von jahrweiser und
kooperative ab — an dieser Stelle begründet.

```sh
docker compose up -d           # hochfahren
docker compose down            # anhalten, Daten bleiben
docker compose down -v         # anhalten und Daten wegwerfen
psql postgres://atlas:atlas@127.0.0.1:5433/atlas
```

Die Zugangsdaten stehen absichtlich im Repo: sie gelten nur für diese lokale
Instanz, die ausschließlich auf Loopback lauscht. Produktion konfiguriert sich
über `app/.env` auf dem Server. Der Port ist 5433 statt 5432, damit eine
System-Postgres nicht kollidiert; verschiebbar über `DB_PORT` in einer `.env`
im Repo-Wurzelverzeichnis.

Angebunden ist die Datenbank noch nicht — es gibt weder Schema noch
Datenzugriff. `DATABASE_URL` liegt auskommentiert in `app/.env.template` bereit.

Für die E2E-Suite einmalig den Browser holen:

```sh
npx playwright install --with-deps chromium
```

## Qualitätssicherung

Jedes Gate läuft lokal mit demselben Kommando wie in der CI. Die vollständige
Liste samt Begründung steht in [docs/testing.md](docs/testing.md).

```sh
cd app
npm run test:lint              # ESLint, Locales, Typecheck
npm run test:unit              # Vitest, Coverage-Schwelle 100 %
npm run test:build             # Produktions-Build, Warnung = Fehler
npm run test:smoke             # Dev-Server startet, Warnung = Fehler
npm run test:size              # Bundle-Budget (nach einem Build)
npm run test:e2e               # Playwright inkl. axe-Scan
```

Kurzfassung der Haltung dahinter:

- **Coverage steht auf 100 % und wird nicht gesenkt.** Sie ist Mittel, nicht
  Ziel — Tests ohne Aussage erfüllen die Quote und schaden trotzdem.
- **Warnungen sind Fehler.** Nuxt meldet sie und steigt trotzdem mit 0 aus; die
  Skripte in `app/scripts/` machen daraus ein Gate.
- **Barrierefreiheit ist ein Gate, keine Absicht.** axe-Scan gegen WCAG A/AA mit
  einer Baseline, die sich nur nach unten bewegt, plus handgeschriebene
  Tastatur-Tests für das, was axe nicht sehen kann.

## Konventionen

- **Commits und PR-Titel** folgen Conventional Commits; der PR-Titel wird in der
  CI geprüft. Erlaubte Scopes stehen in
  `.github/workflows/test.lint.pr.yml`.
- **Releases** erzeugt release-please aus den Commits: Merge des Release-PRs →
  Tag und GitHub-Release → Deploy-Webhook.
- **Code auf Englisch** (Bezeichner, Kommentare), **Inhalte auf Deutsch**
  (`locales/de.json`, Dokumentation).

## Deployment

Node-SSR auf einem Alpine-Host, gestartet über pm2, ausgelöst durch einen
GitHub-Webhook auf veröffentlichte Releases. Einrichtung und Ablauf:
[.github/webhooks/README.md](.github/webhooks/README.md).

## Offene Punkte vor dem ersten öffentlichen Deployment

- Datenschutzerklärung anlegen — sobald irgendetwas personenbezogene Daten
  verarbeitet, ist sie Pflicht. Bis dahin bleibt die Angriffsfläche klein:
  keine Cookies, keine Schriften von Dritten, und die Kacheln kommen von
  OpenFreeMap ohne Tracking (siehe [docs/karte.md](docs/karte.md)) — die
  IP-Adresse geht dabei trotzdem dorthin und gehört in die Erklärung.
- `NUXT_PUBLIC_SITE_URL` und `NUXT_PUBLIC_CONTACT_EMAIL` in der `.env` des
  Servers setzen.
- Die Einträge in `app/app/data/communities.ts` sind Platzhalter: reale Projekte,
  aber ungeprüfte Koordinaten und Beschreibungen. Vor der Veröffentlichung mit
  den Gemeinschaften abgleichen.

Das Impressum liegt bewusst nicht im Repo: die Fußzeile verlinkt das der
Betreiberin, konfigurierbar über `NUXT_PUBLIC_IMPRINT_URL`.
