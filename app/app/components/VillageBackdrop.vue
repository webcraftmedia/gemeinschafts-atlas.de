<script setup lang="ts">
  import { farmsteads, pathToGreen, VILLAGE_RING, VILLAGE_VIEWBOX } from '~/utils/village'

  /**
   * Das gezeichnete Dorf hinter der Startseite.
   *
   * Kein Ort, den es gibt, und ausdrücklich keine Landkarte: Höfe in einem
   * lockeren Ring um einen gemeinsamen Anger, Wege dazwischen, Gärten und
   * Streuobst am Rand. Es soll an gemeinschaftliches Leben erinnern, nicht an
   * Geografie — die wirklichen Orte zeigt die Karte, die sich beim Scrollen
   * daraus auflöst.
   *
   * Die einzige Verbindung zu den Daten ist die Anzahl: so viele Höfe wie
   * Gemeinschaften im Atlas. Kommt eine dazu, wächst das Dorf.
   *
   * Reines SVG im Markup, kein Bild und kein zweiter Request. Die Farben erben
   * aus der Palette der Seite, die Linien nehmen `currentColor` — wer die
   * Zeichnung anders einfärben will, setzt am Elternelement eine Textfarbe.
   */
  const props = defineProps<{
    /** So viele Höfe werden gezeichnet. */
    count: number
  }>()

  // Vues `useId` statt einer festen Zeichenkette: Die Verlaufsmaske wird über
  // eine id referenziert, und zwei Zeichnungen auf derselben Seite hätten
  // sonst dieselbe — dann gewinnt die erste für beide.
  const maskId = useId()

  const steads = computed(() => farmsteads(props.count, VILLAGE_RING))
  const ways = computed(() =>
    steads.value.map((stead, index) => pathToGreen(stead, VILLAGE_RING, index)),
  )
</script>

<template>
  <!--
    `aria-hidden` und `focusable="false"`: Das Bild ist Schmuck. Was es sagt,
    steht als Text daneben, und ein Screenreader, der eine Zeichnung ankündigt,
    die nichts erklärt, unterbricht nur.
  -->
  <svg
    aria-hidden="true"
    focusable="false"
    :viewBox="`0 0 ${String(VILLAGE_VIEWBOX.width)} ${String(VILLAGE_VIEWBOX.height)}`"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <defs>
      <!--
        Nach außen ausblenden statt am Rand abschneiden. Ein angeschnittener
        Strich liest sich als Fehler, ein verlaufender als Absicht — und das
        Verklärte an dem Bild entsteht genau hier.
      -->
      <radialGradient :id="`${maskId}-fade`" cx="50%" cy="48%" r="62%">
        <stop offset="0%" stop-color="#fff" stop-opacity="1" />
        <stop offset="62%" stop-color="#fff" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
      <mask :id="maskId">
        <rect
          x="0"
          y="0"
          :width="VILLAGE_VIEWBOX.width"
          :height="VILLAGE_VIEWBOX.height"
          :fill="`url(#${maskId}-fade)`"
        />
      </mask>
    </defs>

    <g :mask="`url(#${maskId})`">
      <!-- Äcker am Rand: Streifen mit ein paar Furchen, mehr braucht es nicht. -->
      <g stroke-width="1.4" opacity="0.5">
        <path d="M18 128 L196 86 L214 160 L36 202 Z" />
        <path d="M44 140 L206 102 M52 168 L214 130" stroke-width="0.9" />
        <path d="M900 96 L1086 140 L1064 214 L878 170 Z" />
        <path d="M898 126 L1074 168 M890 154 L1066 196" stroke-width="0.9" />
        <path d="M10 508 L172 546 L150 618 L-12 580 Z" />
        <path d="M26 538 L156 568 M18 566 L148 596" stroke-width="0.9" />
        <path d="M934 520 L1100 480 L1118 552 L952 592 Z" />
        <path d="M950 546 L1108 508 M958 574 L1116 536" stroke-width="0.9" />
      </g>

      <!-- Hecken: gestrichelt, weil sie gliedern und nicht trennen. -->
      <g stroke-width="1.2" stroke-dasharray="7 9" opacity="0.45">
        <path d="M232 62 C 330 40, 470 34, 566 44" />
        <path d="M842 618 C 740 646, 600 656, 498 646" />
        <path d="M70 258 C 46 330, 46 402, 74 470" />
        <path d="M1032 250 C 1058 326, 1056 400, 1028 468" />
      </g>

      <!-- Der Bach, der am Dorf vorbeizieht. -->
      <path
        d="M-10 214 C 120 246, 196 300, 230 372 C 266 448, 240 540, 296 610 C 344 668, 470 688, 596 694"
        stroke-width="2.2"
        opacity="0.5"
      />

      <!-- Der Anger: die gemeinsame Mitte, mit Teich und Brunnen. -->
      <g>
        <path
          d="M550 258 C 636 258, 700 286, 700 350 C 700 414, 634 442, 548 442 C 462 442, 400 412, 400 350 C 400 288, 464 258, 550 258 Z"
          fill="var(--color-meadow)"
          fill-opacity="0.75"
          stroke-width="1.8"
          stroke-opacity="0.55"
        />
        <!--
          `fill-opacity` 0.6 und nicht 0.9, und das ist gerechnet: Der Teich
          liegt unter der Lead-Zeile des Vorspanns. Bei 0.9 (in der Gruppe mit
          opacity 0.5, also effektiv 0.45) kommt `--color-water` über Papier
          auf Y ≈ 0,762 und damit gegen `--color-ink-muted` auf 4,44:1 — knapp
          unter den 4,5:1 aus WCAG 1.4.3. Mit 0.6 stehen 4,60:1.

          Der axe-Scan findet das nicht und kann es auch nicht: Er vergleicht
          Text gegen die berechnete `background-color` seiner Vorfahren, und
          ein SVG dahinter ist keine. Wer die Farben oder die Deckkraft hier
          ändert, rechnet deshalb bitte von Hand nach.
        -->
        <path
          d="M598 372 C 634 372, 656 384, 656 398 C 656 414, 632 424, 598 424 C 566 424, 544 412, 544 398 C 544 384, 566 372, 598 372 Z"
          fill="var(--color-water)"
          fill-opacity="0.6"
          stroke-width="1.4"
          stroke-opacity="0.45"
        />
        <!-- Brunnen: Ring, Dach, zwei Pfosten. Das Zeichen für „hier trifft man sich". -->
        <g stroke-width="1.8" opacity="0.7">
          <ellipse cx="474" cy="322" rx="14" ry="8" />
          <path d="M464 316 L464 300 M484 316 L484 300 M458 300 L474 290 L490 300" />
        </g>
      </g>

      <!--
        Die Wege vom Hof zum Anger. `data-way` ist ein Griff für den Spec: Die
        Zahl der Wege muss der Zahl der Höfe folgen, und das über die Form des
        SVG zu prüfen wäre ein Test, der bei jeder Änderung am Bild bricht.
      -->
      <g stroke-width="2" opacity="0.55">
        <path v-for="(way, index) in ways" :key="`way-${String(index)}`" data-way :d="way" />
      </g>

      <!--
        Die Höfe. Jeder ist dasselbe Zeichen — Giebelhaus, Schuppen, zwei
        Beetfurchen davor — nur verschoben und leicht gedreht. Dass es dasselbe
        Zeichen ist, ist die Aussage: gleiche Höfe, kein Herrenhaus.
      -->
      <g stroke-width="2.1">
        <g
          v-for="(stead, index) in steads"
          :key="`farmstead-${String(index)}`"
          data-farmstead
          :transform="`translate(${String(stead.x)} ${String(stead.y)}) rotate(${String(stead.tilt)})`"
        >
          <path d="M-20 10 L-20 -6 L0 -21 L20 -6 L20 10 Z" fill="var(--color-paper)" />
          <path d="M-6 10 L-6 -1 L6 -1 L6 10" stroke-width="1.5" opacity="0.65" />
          <path
            d="M25 10 L25 0 L34 -7 L43 0 L43 10 Z"
            fill="var(--color-paper)"
            stroke-width="1.7"
          />
          <path d="M-20 18 L14 18 M-20 24 L14 24" stroke-width="1.2" opacity="0.5" />
        </g>
      </g>

      <!-- Streuobst: lockere Gruppen, nie im Raster. -->
      <g stroke-width="1.6" opacity="0.6">
        <circle cx="152" cy="268" r="9" />
        <circle cx="184" cy="298" r="7" />
        <circle cx="140" cy="318" r="8" />
        <circle cx="926" cy="272" r="8" />
        <circle cx="962" cy="304" r="9" />
        <circle cx="924" cy="330" r="7" />
        <circle cx="318" cy="596" r="8" />
        <circle cx="352" cy="622" r="7" />
        <circle cx="286" cy="624" r="9" />
        <circle cx="742" cy="600" r="7" />
        <circle cx="776" cy="626" r="9" />
        <circle cx="712" cy="628" r="8" />
        <circle cx="516" cy="112" r="8" />
        <circle cx="552" cy="96" r="7" />
        <circle cx="586" cy="116" r="9" />
      </g>
    </g>
  </svg>
</template>
