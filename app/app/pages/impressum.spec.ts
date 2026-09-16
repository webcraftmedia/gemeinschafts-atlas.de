import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import ImpressumPage from './impressum.vue'

describe('impressum page', () => {
  it('names the provider and the legal basis', async () => {
    const wrapper = await mountSuspended(ImpressumPage)

    expect(wrapper.get('h1').text()).toBe('Impressum')
    // § 5 DDG is what makes this page mandatory; if the heading loses the
    // reference, the next person will not know why the page exists.
    expect(wrapper.text()).toContain('§ 5 DDG')
  })

  it('offers a contact address as a mail link', async () => {
    const wrapper = await mountSuspended(ImpressumPage)

    const mail = wrapper.get('a[href^="mailto:"]')
    expect(mail.attributes('href')).toBe('mailto:kontakt@gemeinschafts-atlas.de')
    // Not a new tab — see AppLink.
    expect(mail.attributes('target')).toBeUndefined()
  })

  it('leads back to the start page', async () => {
    const wrapper = await mountSuspended(ImpressumPage)

    // get() throws when there is no match, so reaching the assertion is already
    // half the claim; the text is the other half.
    expect(wrapper.get('a[href="/"]').text()).toBe('Zurück zur Startseite')
  })
})
