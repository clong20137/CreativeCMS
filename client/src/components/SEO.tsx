import { useEffect } from 'react'

type SEOProps = {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
  structuredData?: Record<string, any> | Record<string, any>[]
}

const SITE_NAME = 'Creative by Caleb'
const DEFAULT_IMAGE = '/og-image.jpg'

function getSiteUrl() {
  return (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')
}

function upsertMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  noIndex = false,
  structuredData
}: SEOProps) {
  useEffect(() => {
    const siteUrl = getSiteUrl()
    const canonicalUrl = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
    const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

    document.title = fullTitle
    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'description'
      return meta
    }, description)
    upsertMeta('meta[name="robots"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      return meta
    }, noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')

    upsertLink('canonical', canonicalUrl)

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    }, fullTitle)
    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    }, description)
    upsertMeta('meta[property="og:type"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:type')
      return meta
    }, 'website')
    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:url')
      return meta
    }, canonicalUrl)
    upsertMeta('meta[property="og:image"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:image')
      return meta
    }, imageUrl)

    upsertMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:card'
      return meta
    }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:title'
      return meta
    }, fullTitle)
    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:description'
      return meta
    }, description)
    upsertMeta('meta[name="twitter:image"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'twitter:image'
      return meta
    }, imageUrl)

    document.querySelectorAll('script[data-seo-jsonld="true"]').forEach(script => script.remove())
    if (structuredData) {
      const jsonLd = document.createElement('script')
      jsonLd.type = 'application/ld+json'
      jsonLd.dataset.seoJsonld = 'true'
      jsonLd.text = JSON.stringify(structuredData)
      document.head.appendChild(jsonLd)
    }
  }, [title, description, path, image, noIndex, structuredData])

  return null
}

export function localBusinessSchema(path = '/') {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE_NAME,
    url: `${siteUrl}${path}`,
    areaServed: [
      { '@type': 'City', name: 'Indianapolis' },
      { '@type': 'State', name: 'Indiana' },
      { '@type': 'Country', name: 'United States' }
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indianapolis',
      addressRegion: 'IN',
      addressCountry: 'US'
    },
    serviceType: [
      'Web design',
      'Photography',
      'Videography',
      'Branding'
    ]
  }
}
