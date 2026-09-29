# Die Karte

Warum die Karte so gebaut ist, wie sie gebaut ist. Der Code steht in
`app/app/components/CommunityMap.vue`, `app/app/utils/mapStyle.ts` und
`app/app/utils/mapView.ts`.

## Kacheln: OpenFreeMap, konfigurierbar

Vector Tiles von [OpenFreeMap](https://openfreemap.org): kein Key, keine
Registrierung, keine Cookies, keine Limits, EU-Hosting. Für ein Verzeichnis, das
noch keine einzige personenbezogene Angabe verarbeitet, ist ein Kartenanbieter
mit Tracking die erste Stelle, an der das kippen würde — und der Besucher kann
sich nicht dagegen entscheiden, weil die Kacheln direkt aus seinem Browser
geladen werden.

Die Endpunkte stehen in `runtimeConfig.public` (`NUXT_PUBLIC_TILES_URL`,
`NUXT_PUBLIC_GLYPHS_URL`), damit ein Umzug auf selbst gehostete PMTiles eine
URL-Änderung bleibt und kein Umbau.

## Der Stil kommt von uns, nicht vom Anbieter

Bei Vector Tiles liefert die Kachel nur Geometrie und Attribute. Jede Farbe und
Strichstärke steht in `mapStyle.ts` — ein Anbieterwechsel ändert deshalb nichts
am Aussehen, solange das Schema dasselbe bleibt (hier: OpenMapTiles).

„Papier und Tusche" ist bewusst karg: Gebäude, Straßenklassen und POIs sind gar
nicht erst enthalten. Was mit den Markern um Aufmerksamkeit konkurriert, gehört
nicht auf eine Karte, deren einzige Aussage lautet *hier sind sie*. Nebenbei
hält das die Renderlast niedrig.

Die Palette ist dieselbe wie die der Seite (`app/assets/css/main.css`), damit
Karte und Text nicht auseinanderlaufen.

## Zoom und Rahmen werden gerechnet, nicht gesetzt

Die Anforderung lautet: **ganz herausgezoomt sieht man Deutschland.** Das ist
keine Zahl, sondern eine Funktion des Fensters — auf einem 16:10-Monitor bindet
die Höhe, auf einem Telefon die Breite. `mapView.ts` rechnet beides aus der
Containergröße, bei jedem `resize` neu.

Der Rahmen, aus dem sich die Karte nicht schieben lässt, ist ebenfalls
abgeleitet, und zwar aus demselben Ausschnitt: *höchstens einen halben
Bildschirm über das Land hinaus.*

Der Grund für die Ableitung ist eine Eigenheit von MapLibre, die einen leicht in
die Falle laufen lässt: `maxBounds` wird durchgesetzt, indem die Karte notfalls
**hineinzoomt**. Ein fest gesetzter Rahmen ist damit nicht bloß eine
Scroll-Schranke, sondern heimlich auch eine Zoom-Schranke — und `fitBounds` wird
dann still übergangen, ohne Fehler, ohne Warnung.

Genau das war der Zustand vor diesem Umbau. Nachgemessen am 29.09.2026 mit dem
damaligen Rahmen (14° × 11,3°):

| Fenster | sichtbar bei vollem Auszoomen |
| --- | --- |
| 1440 × 900 | rund 70 % der Nord-Süd-Ausdehnung; Schleswig-Holstein und alles südlich von Stuttgart fehlten — **eine der sechs Gemeinschaften lag außerhalb des Bildes** |
| 390 × 844 | rund 80 % der Ost-West-Ausdehnung |

`mapView.spec.ts` hält beide Eigenschaften als Test fest, für
Seitenverhältnisse von 1:3,5 bis 4:1.

## Auf der Startseite: aus dem gedachten Ort werden die wirklichen

Die Startseite zeigt kein Foto und keine Geografie, sondern ein **gezeichnetes
Dorf**: einen Anger mit Teich und Brunnen, Höfe auf einem Ring, Wege, Äcker,
Hecken, einen Bach. `VillageBackdrop.vue` zeichnet es, `utils/village.ts`
rechnet die Geometrie. Das Bild ist erfunden, aber nicht beliebig — es zählt die
Gemeinschaften: ein Hof je Eintrag, und die Abweichungen kommen aus einem
Sinus-Hash statt aus `Math.random`, damit Server und Browser dasselbe Dorf
zeichnen.

Darunter, im selben klebenden Rahmen, liegt die echte Karte. Beim Scrollen
verblasst die Zeichnung und die Karte klart auf: aus dem gedachten Ort werden
die wirklichen. Der Übergang läuft ohne JavaScript und ohne Scroll-Listener über
`animation-timeline` (siehe `assets/css/main.css`), ist damit an die
Scrollposition gebunden und **umkehrbar** — wer hochscrollt, bekommt das Dorf
zurück.

Zwei Fallstricke stecken in diesen zwanzig Zeilen CSS, beide teuer erkauft:

- Die Kurzschreibweise `animation: linear both` setzt `animation-duration` still
  auf `0s`. Eine scroll-gesteuerte Animation ist damit punktförmig — sie hat
  eine Zeitleiste und einen Bereich, durchläuft ihn aber nie. Beide Ebenen
  bleiben dann auf voller Deckkraft, man sieht nur die obere, und **nichts
  meldet einen Fehler**. Deshalb steht dort die Langform mit `auto`.
- Taktgeber ist der Vorspann und nicht die Spur. Er ist genau fensterhoch und
  steht am Dokumentanfang, seine `exit`-Phase läuft also exakt über die erste
  Fensterhöhe Scrollweg. Nimmt man die Spur, beginnt deren `cover`-Phase
  rechnerisch oberhalb des Dokuments, und der Übergang wäre beim Laden schon zu
  zwei Dritteln vorbei.

Der Preis dieser Lösung, offen ausgesprochen: Die Karte liegt von Anfang an im
Fenster, nur unsichtbar. Ein Sichtbarkeits-Beobachter löst dort sofort aus und
wäre wirkungslos, deshalb `hydrate-on-idle` — **jeder Startseitenbesuch lädt
MapLibre**, nach dem ersten Aufbau, aber er lädt es. Die Alternative wäre, beim
Scrollen leeres Papier aufklaren zu lassen. `.size-limit.json` merkt das nicht,
es misst je Datei und nicht je Seite; `e2e/smoke.spec.ts` hält stattdessen die
Reihenfolge fest: erst die Überschrift, dann MapLibre.

## Barrierefreiheit: die Liste ist nicht der Trostpreis

Eine WebGL-Karte ist per Tastatur kaum und per Screenreader gar nicht bedienbar
— Marker sind Pixel auf einer Canvas. `CommunityList` zeigt dieselben Daten als
Text und ist deshalb kein Anhang, sondern das gleichwertige Angebot (WCAG 1.1.1
und 2.1.1, BFSG). Seit dem Umbau hat sie unter **`/liste`** eine eigene Adresse:
eine Seite, die man verschicken kann, die vollständig server-gerendert ist und
auf die von Karte und Startseite aus verwiesen wird.

Dass das Verzeichnis eine Seite weiter liegt statt darunter, ist die eine
Stelle, an der der Umbau Barrierefreiheit gegen Aufbau abwägt. Der Link steht
deshalb dort, wo er nicht zu übersehen ist — in der Leiste über der Karte, im
`<details>`-Abschnitt der Startseite und im Fallback ohne JavaScript — und der
`sr-only`-Text der Karte nennt ihn ausdrücklich, statt wie früher „weiter unten"
zu sagen und ins Leere zu zeigen.

Die Marker tragen konsequent `aria-hidden`: durch Dutzende Punkte zu tabben,
deren Lage man nicht sieht, wäre kein Gewinn. Die Zoom-Bedienelemente bleiben
erreichbar. Dasselbe gilt für die Dorfzeichnung — sie ist Schmuck, und was sie
zeigt, steht als Text daneben.

Der Kontrast der Zeichnung ist gerechnet und nicht geschätzt: Der Teich liegt
unter der Lead-Zeile, und bei voller Deckkraft verfehlte er mit 4,44:1 die
4,5:1 aus WCAG 1.4.3. **Der axe-Scan findet so etwas nicht und kann es nicht
finden** — er vergleicht Text gegen die berechnete `background-color` seiner
Vorfahren, und ein SVG dahinter ist keine. Wer an den Flächen der Zeichnung
dreht, rechnet deshalb bitte nach; die Rechnung steht an Ort und Stelle in
`VillageBackdrop.vue`.

Ohne JavaScript gibt es keine Karte. Dann zeigt `/karte` an ihrer Stelle einen
Hinweis mit Link auf `/liste`, und dort steht das vollständige Verzeichnis
server-gerendert. Die Startseite besteht ohnehin aus Text und SVG und
funktioniert unverändert — auch das Aufklappen der Erläuterung, weil es ein
`<details>` ist und kein nachgebauter Knopf.

## Der Worker, und warum ein Test das Netz befragt

MapLibre baut die URL seines Workers zur Laufzeit zusammen. Was ein Bundler
nicht als Literal sieht, gibt er auch nicht aus — die Folge war ein 404 und eine
Karte, die aussah, als funktioniere sie: Canvas und Marker da, nur dekodierte
niemand die Vector Tiles. Deshalb der Import mit `?worker&url` (nicht `?url`,
sonst wandert der Fehler eine Ebene tiefer), und deshalb prüft der E2E-Test
fehlgeschlagene Requests statt bloß, ob ein Canvas existiert.
