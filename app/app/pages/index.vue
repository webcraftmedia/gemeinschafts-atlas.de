<script setup lang="ts">
  import { communities } from '~/data/communities'

  definePageMeta({ layout: 'home' })

  const { t } = useI18n()

  useHead({
    title: t('pages.index.title'),
    meta: [{ name: 'description', content: t('pages.index.description') }],
  })
</script>

<template>
  <div>
    <!--
      Die Bühne: eine Spur von zwei Fensterhöhen, darin ein klebender Rahmen.
      Im Rahmen liegen zwei Ebenen übereinander — das gezeichnete Dorf und die
      echte Karte. Beim Scrollen verblasst das eine und klart das andere auf,
      im selben Ausschnitt und in derselben Größe: Aus dem gedachten Ort werden
      die wirklichen.

      Der Vorspann wird mit `-mt-[100dvh]` über den Rahmen zurückgezogen und
      scrollt darüber hinweg. Er ist zugleich der Taktgeber des Übergangs
      (`.reveal-hero`, siehe main.css) — seine Höhe ist deshalb nicht
      dekorativ, sie muss genau eine Fensterhöhe betragen.
    -->
    <div class="reveal-track relative h-[200dvh]">
      <div class="sticky top-0 h-[100dvh] overflow-hidden bg-paper">
        <VillageBackdrop
          :count="communities.length"
          class="reveal-drawing absolute inset-0 h-full w-full text-ink/40"
        />

        <div class="reveal-map absolute inset-0">
          <!--
            `hydrate-on-idle`, nicht `hydrate-on-visible`: Die Karte liegt von
            Anfang an im Fenster, nur unsichtbar unter der Zeichnung. Ein
            Beobachter, der auf Sichtbarkeit wartet, löst hier sofort aus und
            hätte damit gar keine Wirkung. `idle` schiebt das Laden hinter den
            ersten Aufbau der Seite: Die Zeichnung steht sofort, MapLibre kommt
            in der Leerlaufzeit danach — und ist fertig, bevor jemand weit
            genug gescrollt hat, um es zu sehen. Eine Karte, die erst beim
            Auftauchen zu laden anfinge, würde als leeres Papier aufklaren.
          -->
          <LazyCommunityMap
            hydrate-on-idle
            :communities="communities"
            cooperative-gestures
            class="h-full w-full"
          />
        </div>

        <!--
          Steht auf beiden Ebenen und geht deshalb nicht mit dem Übergang auf
          oder unter: erst zählt es die Höfe, danach die Marker. Bewusst kein
          Link — ein unsichtbarer, aber fokussierbarer Link am Seitenanfang wäre
          eine Falle für die Tastatur. Der Weg zur ganzen Karte steht im
          Vorspann.
        -->
        <p
          class="absolute top-3 left-3 rounded-full bg-paper/90 px-4 py-2 text-sm text-ink/80 shadow-sm ring-1 ring-ink/10 backdrop-blur sm:top-4 sm:left-4"
        >
          {{ t('pages.index.map-count', { count: communities.length }) }}
        </p>
      </div>

      <div class="reveal-hero relative z-10 -mt-[100dvh] flex h-[100dvh] flex-col justify-center">
        <div class="mx-auto max-w-2xl px-4 pb-16 text-center">
          <p class="text-xs tracking-[0.22em] text-ink-muted uppercase">
            {{ t('pages.index.kicker') }}
          </p>
          <h1 class="mt-6 font-serif text-4xl leading-[1.08] sm:text-6xl">
            {{ t('pages.index.title') }}
          </h1>
          <p class="mx-auto mt-6 max-w-prose text-lg leading-relaxed text-ink-muted sm:text-xl">
            {{ t('pages.index.lead') }}
          </p>
        </div>

        <!--
          Der eine Weg, den der Vorspann anbietet: unten in der Mitte, und er
          wippt. Die Bewegung ist die Aufforderung — ein Knopf sagt „hier ist
          etwas", ein wippender Pfeil sagt „da geht es weiter".

          Die Animation liegt auf einer eigenen Hülle und nicht auf dem Link
          selbst: ein Fokusring, der mitwippt, ist schwerer zu treffen. Wer
          `prefers-reduced-motion` gesetzt hat, bekommt sie gar nicht — das
          regelt main.css global.
        -->
        <p class="absolute inset-x-0 bottom-8 flex justify-center sm:bottom-12">
          <span class="animate-nudge">
            <NuxtLink
              to="/karte"
              class="inline-flex flex-col items-center gap-2 rounded-lg px-4 py-2 font-medium text-atlas-dark transition-colors hover:text-atlas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atlas-dark"
            >
              {{ t('app.to-map') }}
              <!--
                Als Zeichnung und nicht als Zeichen: „↓" im Template ist roher
                Text, den der i18n-Linter zu Recht anmahnt — und den ein
                Screenreader je nach Stimme als „Abwärtspfeil" vorliest, obwohl
                daneben schon steht, wohin es geht.
              -->
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-5"
              >
                <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
              </svg>
            </NuxtLink>
          </span>
        </p>
      </div>
    </div>

    <!--
      Unter der Bühne steht wieder alles offen da: erst die drei Abschnitte,
      dann das Verzeichnis. Nichts ist eingeklappt und nichts eine Seite weiter
      — wer nach dem Übergang weiterscrollt, liest weiter.

      Auf den Ablauf oben hat das keinen Einfluss: Taktgeber des Übergangs ist
      der Vorspann und nicht die Spur, und der ist genau fensterhoch. Was
      darunter folgt, macht die Seite länger, verschiebt den Übergang aber um
      keinen Pixel.

      Ausgeschrieben statt über eine Liste iteriert: t() mit zusammengebautem
      Key wäre kürzer, aber @intlify/vue-i18n/no-dynamic-keys verbietet es, weil
      dann weder der Linter noch ein Mensch sieht, welche Keys wirklich benutzt
      werden. Bei drei Absätzen ist die Wiederholung der billigere Preis.
    -->
    <section class="mx-auto max-w-2xl px-4 pt-20 pb-16">
      <article class="border-t border-ink/12 pt-8">
        <h2 class="font-serif text-2xl leading-snug sm:text-3xl">
          {{ t('pages.index.roof-title') }}
        </h2>
        <p class="mt-4 max-w-prose leading-relaxed text-ink-muted">
          {{ t('pages.index.roof-text') }}
        </p>
      </article>
      <article class="mt-14 border-t border-ink/12 pt-8">
        <h2 class="font-serif text-2xl leading-snug sm:text-3xl">
          {{ t('pages.index.guests-title') }}
        </h2>
        <p class="mt-4 max-w-prose leading-relaxed text-ink-muted">
          {{ t('pages.index.guests-text') }}
        </p>
      </article>
      <article class="mt-14 border-t border-ink/12 pt-8">
        <h2 class="font-serif text-2xl leading-snug sm:text-3xl">
          {{ t('pages.index.era-title') }}
        </h2>
        <p class="mt-4 max-w-prose leading-relaxed text-ink-muted">
          {{ t('pages.index.era-text') }}
        </p>
      </article>
    </section>

    <!--
      Das Verzeichnis am Seitenende. `CommunityList` bringt seit dem Umbau
      keine eigene Überschrift mehr mit — sie gehört dorthin, wo die Liste
      steht, und das ist hier eine h2 und auf /liste eine h1. Eine Komponente
      mit fester Überschriftenebene passt immer nur an eine Stelle.

      Die eigene Adresse bleibt daneben bestehen: Sie ist das, was man
      verschicken kann, und das Ziel, auf das die Karte alle verweist, die sie
      nicht bedienen können.
    -->
    <section id="liste" class="px-4 pb-24">
      <div class="mx-auto max-w-2xl">
        <h2 class="font-serif text-2xl leading-snug sm:text-3xl">
          {{ t('pages.index.list-title') }}
        </h2>
        <p class="mt-3 max-w-prose leading-relaxed text-ink-muted">
          {{ t('pages.index.list-intro') }}
        </p>
        <CommunityList :communities="communities" class="mt-10" />
      </div>
    </section>
  </div>
</template>
