import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import App from './app.vue'

/**
 * Die Wurzel. Was hier steht, gilt für jede Seite — und genau deshalb fällt es
 * beim Umbau einer einzelnen Seite niemandem auf, wenn es verschwindet.
 */
describe('app', () => {
  it('announces route changes', async () => {
    const wrapper = await mountSuspended(App, { route: '/' })

    expect(wrapper.findComponent({ name: 'NuxtRouteAnnouncer' }).exists()).toBe(true)
  })

  it('offers a skip link that targets the main landmark', async () => {
    const wrapper = await mountSuspended(App, { route: '/' })

    const skip = wrapper.get('a[href="#main"]')
    expect(skip.text()).toBe('Zum Inhalt springen')
    // Unsichtbar bis zum Fokus — sichtbar für alle wäre eine Gestaltungsfrage,
    // auch vor Screenreadern versteckt würde den Zweck aufheben.
    expect(skip.classes()).toContain('sr-only')
    expect(skip.classes()).toContain('focus:not-sr-only')
  })

  it('renders the routed page through its layout', async () => {
    const wrapper = await mountSuspended(App, { route: '/' })

    expect(wrapper.get('main').text()).toContain('Gemeinsam statt einsam')
  })
})
