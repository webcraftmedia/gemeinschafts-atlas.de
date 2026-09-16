import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import App from './app.vue'

/**
 * The root component. It is mostly Nuxt built-ins in a row, so what is worth
 * pinning is the part that is ours and that nothing else would notice losing:
 * the route announcer (screen-reader feedback on navigation) and the skip link,
 * which has to be the first focusable element on the page and point at <main>.
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
    // Hidden until focused — visible for everyone would be a design decision,
    // hidden from screen readers too would defeat the purpose.
    expect(skip.classes()).toContain('sr-only')
    expect(skip.classes()).toContain('focus:not-sr-only')
    expect(wrapper.get('main').attributes('id')).toBe('main')
  })

  it('renders the routed page inside the main landmark', async () => {
    const wrapper = await mountSuspended(App, { route: '/impressum' })

    expect(wrapper.get('main').text()).toContain('Impressum')
  })
})
