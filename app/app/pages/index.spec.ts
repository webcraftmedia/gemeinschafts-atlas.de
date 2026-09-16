import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'

import IndexPage from './index.vue'

describe('index page', () => {
  it('carries the one h1 of the page', async () => {
    const wrapper = await mountSuspended(IndexPage)

    // Exactly one — a second h1 breaks the document outline screen readers use.
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Gemeinschafts-Atlas')
  })

  it('links to the imprint', async () => {
    const wrapper = await mountSuspended(IndexPage)

    expect(wrapper.get('a[href="/impressum"]').text()).toBe('Impressum')
  })
})
