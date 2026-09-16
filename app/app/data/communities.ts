/**
 * Die Gemeinschaften des Atlas.
 *
 * ACHTUNG — Platzhalterdaten. Die Einträge sind real existierende, öffentlich
 * auftretende Projekte, aber Koordinaten und Beschreibungen sind grob und
 * ungeprüft. Vor der Veröffentlichung muss jeder Eintrag mit der jeweiligen
 * Gemeinschaft abgeglichen werden — ein Verzeichnis, das Menschen an falsche
 * Orte schickt oder ihnen Zwecke andichtet, schadet genau denen, für die es
 * gedacht ist.
 *
 * Diese Datei verschwindet, sobald die PostGIS-Anbindung steht; bis dahin ist
 * sie die einzige Datenquelle und hält die Form fest, die später aus der
 * Datenbank kommen muss.
 */

export interface Community {
  /** Stabil, taucht in URLs und Ankern auf. */
  id: string
  name: string
  /** Ort und Bundesland, wie man es jemandem am Telefon sagen würde. */
  place: string
  /** Wofür die Gemeinschaft neben dem Wohnen steht — der Kern des Atlas. */
  purpose: string
  /**
   * WGS84 als [Länge, Breite]. Diese Reihenfolge ist die von GeoJSON und
   * MapLibre — anders als bei Leaflet und anders, als man sie spricht.
   */
  coordinates: [number, number]
  /** Ob die Gemeinschaft Gäste aufnimmt. */
  guests: boolean
}

export const communities: Community[] = [
  {
    id: 'sieben-linden',
    name: 'Ökodorf Sieben Linden',
    place: 'Beetzendorf, Sachsen-Anhalt',
    purpose: 'Ökologisches Bauen, Selbstversorgung und Bildungsarbeit',
    coordinates: [11.15, 52.72],
    guests: true,
  },
  {
    id: 'zegg',
    name: 'ZEGG',
    place: 'Bad Belzig, Brandenburg',
    purpose: 'Seminare, Gemeinschaftsforschung und Friedensarbeit',
    coordinates: [12.6, 52.14],
    guests: true,
  },
  {
    id: 'schloss-tempelhof',
    name: 'Schloss Tempelhof',
    place: 'Kreßberg, Baden-Württemberg',
    purpose: 'Solidarische Landwirtschaft, freie Schule und Seminarbetrieb',
    coordinates: [10.14, 49.15],
    guests: true,
  },
  {
    id: 'lebensgarten-steyerberg',
    name: 'Lebensgarten Steyerberg',
    place: 'Steyerberg, Niedersachsen',
    purpose: 'Ökologie, Permakultur und Seminarhaus',
    coordinates: [9.03, 52.57],
    guests: true,
  },
  {
    id: 'niederkaufungen',
    name: 'Kommune Niederkaufungen',
    place: 'Kaufungen, Hessen',
    purpose: 'Gemeinsame Ökonomie, Handwerksbetriebe und Kinderladen',
    coordinates: [9.6, 51.27],
    guests: true,
  },
  {
    id: 'sulzbrunn',
    name: 'Gemeinschaft Sulzbrunn',
    place: 'Sulzberg, Bayern',
    purpose: 'Kultur, Tagungshaus und gemeinschaftliches Arbeiten im Allgäu',
    coordinates: [10.32, 47.63],
    guests: true,
  },
]

/**
 * Deutschland in WGS84, [[West, Süd], [Ost, Nord]]. Der Startausschnitt.
 */
export const GERMANY_BOUNDS: [[number, number], [number, number]] = [
  [5.87, 47.27],
  [15.04, 55.06],
]

/**
 * Der Rahmen, aus dem man nicht herausscrollen kann — bewusst großzügiger als
 * GERMANY_BOUNDS.
 *
 * Der Grund ist nicht Geschmack: MapLibre sorgt dafür, dass `maxBounds` nie
 * überschritten wird, und zoomt dafür notfalls *hinein*. Mit exakt dem
 * Deutschland-Rahmen füllt ein breites Fenster den Bildschirm mit der
 * Landesmitte, statt das Land zu zeigen — nachgemessen, das war der erste
 * Versuch. Der Puffer gibt dem Fit den Platz, den er braucht; dass dabei die
 * Nachbarländer angeschnitten werden, ist der Preis und schadet nichts.
 */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [3.5, 45.5],
  [17.5, 56.8],
]
