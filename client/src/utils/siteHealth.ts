const builtInPageDefaults: Record<string, { label: string; path: string }> = {
  home: { label: 'Homepage', path: '/' },
  portfolio: { label: 'Portfolio', path: '/portfolio' },
  services: { label: 'Services', path: '/services' },
  pricing: { label: 'Pricing', path: '/pricing' },
  plugins: { label: 'Plugins', path: '/plugins' },
  creativecms: { label: 'CreativeCMS', path: '/creativecms-platform' },
  contact: { label: 'Contact', path: '/contact' }
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(value: string) {
  const trimmed = stripHtml(value)
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function collectSectionText(section: any): string[] {
  if (!section || typeof section !== 'object') return []
  const values: string[] = []
  const maybePush = (value: any) => {
    const text = stripHtml(String(value || ''))
    if (text) values.push(text)
  }

  maybePush(section.title)
  maybePush(section.body)
  maybePush(section.description)
  maybePush(section.headerTitle)
  maybePush(section.headerSubtitle)
  maybePush(section.content)
  maybePush(section.fallbackContent)

  if (Array.isArray(section.items)) {
    section.items.forEach((item: any) => {
      if (item?.sections) {
        item.sections.forEach((nested: any) => values.push(...collectSectionText(nested)))
      } else {
        maybePush(item?.title)
        maybePush(item?.body)
        maybePush(item?.description)
        maybePush(item?.desc)
        maybePush(item?.q)
        maybePush(item?.a)
        maybePush(item?.question)
        maybePush(item?.answer)
      }
    })
  }

  return values
}

function collectImageDiagnostics(section: any) {
  let total = 0
  let missingAlt = 0

  const inspect = (imageUrl: any, alt: any) => {
    if (!String(imageUrl || '').trim()) return
    total += 1
    if (!String(alt || '').trim()) missingAlt += 1
  }

  inspect(section?.imageUrl, section?.alt)

  if (Array.isArray(section?.items)) {
    section.items.forEach((item: any) => {
      inspect(item?.image || item?.imageUrl, item?.alt || item?.title)
      if (Array.isArray(item?.sections)) {
        const nested = collectImageDiagnostics({ items: item.sections })
        total += nested.total
        missingAlt += nested.missingAlt
      }
    })
  }

  return { total, missingAlt }
}

function collectLinksFromText(value: string) {
  const html = String(value || '')
  return [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((match) => String(match[1] || '').trim()).filter(Boolean)
}

function collectSectionLinks(section: any): string[] {
  if (!section || typeof section !== 'object') return []
  const links = [
    ...collectLinksFromText(section.body),
    ...collectLinksFromText(section.description),
    ...collectLinksFromText(section.content)
  ]

  if (section.buttonUrl) links.push(String(section.buttonUrl))
  if (section.secondaryButtonUrl) links.push(String(section.secondaryButtonUrl))
  if (section.url) links.push(String(section.url))
  if (section.pageUrl) links.push(String(section.pageUrl))

  if (Array.isArray(section.items)) {
    section.items.forEach((item: any) => {
      links.push(...collectLinksFromText(item?.body))
      links.push(...collectLinksFromText(item?.description))
      if (item?.buttonUrl) links.push(String(item.buttonUrl))
      if (item?.url) links.push(String(item.url))
      if (Array.isArray(item?.sections)) {
        item.sections.forEach((nested: any) => links.push(...collectSectionLinks(nested)))
      }
    })
  }

  return links.filter(Boolean)
}

function looksBrokenInternalLink(value: string) {
  const link = String(value || '').trim()
  if (!link || link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) return false
  return !link.startsWith('/')
}

export function buildPageHealthInsights(page: any, sections: any[] = []) {
  let seo = 100
  let mobile = 100
  let speed = 100
  const diagnostics = { seo: [] as string[], mobile: [] as string[], speed: [] as string[] }

  const title = String(page?.title || page?.pageTitle || '').trim()
  const metaTitle = String(page?.metaTitle || '').trim()
  const metaDescription = String(page?.metaDescription || '').trim()
  const rawSlug = String(page?.slug || page?.pageUrl || '').trim()
  const slug = rawSlug ? (rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`) : ''
  const headerTitle = String(page?.headerTitle || '').trim()
  const bodyText = sections.flatMap((section) => collectSectionText(section)).join(' ').trim()
  const bodyWordCount = countWords(bodyText)
  const heroSections = sections.filter((section) => section?.type === 'hero')
  const imageSections = sections.filter((section) => ['image', 'gallery', 'imageCards', 'imageOverlay', 'portfolio', 'portfolioGallery', 'imageStrip'].includes(section?.type))
  const imageStats = sections.reduce((totals, section) => {
    const next = collectImageDiagnostics(section)
    totals.total += next.total
    totals.missingAlt += next.missingAlt
    return totals
  }, { total: 0, missingAlt: 0 })
  const missingAltCount = imageStats.missingAlt
  const internalLinks = sections.flatMap((section) => collectSectionLinks(section))
  const brokenInternalLinks = internalLinks.filter(looksBrokenInternalLink)
  const h1LikeSections = sections.filter((section) => (
    ['hero', 'banner'].includes(section?.type) || (section?.type === 'header' && (section?.headingTag || 'h2') === 'h1')
  ) && String(section?.title || '').trim())
  const hasCanonicalVisibility = Boolean(slug && slug.startsWith('/'))
  const keywordSlug = slug.replace(/^\//, '')
  const hasKeywordSlug = keywordSlug.length >= 3 && !keywordSlug.includes('_')

  if (!title || title.length < 4) {
    seo -= 18
    diagnostics.seo.push('Missing or weak page title')
  }
  if (!metaTitle || metaTitle.length < 20 || metaTitle.length > 60) {
    seo -= 14
    diagnostics.seo.push(`SEO title length is ${metaTitle.length || 0} characters`)
  }
  if (!metaDescription || metaDescription.length < 70 || metaDescription.length > 160) {
    seo -= 12
    diagnostics.seo.push(`Meta description length is ${metaDescription.length || 0} characters`)
  }
  if (!slug || !slug.startsWith('/')) {
    seo -= 8
    diagnostics.seo.push('URL path should start with /')
  }
  if (!headerTitle && !heroSections.length) {
    seo -= 10
    diagnostics.seo.push('No strong visible primary heading')
  }
  if (h1LikeSections.length > 1) {
    seo -= 6
    diagnostics.seo.push(`${h1LikeSections.length} major heading sections detected`)
  }
  if (bodyText.length < 140 || bodyWordCount < 60) {
    seo -= 10
    diagnostics.seo.push(`Only about ${bodyWordCount} words of body content`)
  }
  if (missingAltCount > 0) {
    seo -= Math.min(12, missingAltCount * 4)
    diagnostics.seo.push(`${missingAltCount} image${missingAltCount === 1 ? '' : 's'} missing alt text`)
  }
  if (brokenInternalLinks.length > 0) {
    seo -= Math.min(10, brokenInternalLinks.length * 3)
    diagnostics.seo.push(`${brokenInternalLinks.length} internal link${brokenInternalLinks.length === 1 ? '' : 's'} may be broken`)
  }
  if (!hasKeywordSlug) {
    seo -= 5
    diagnostics.seo.push('Slug could be cleaner for search')
  }
  if (!hasCanonicalVisibility) {
    diagnostics.seo.push('Canonical path is unclear until the URL is cleaned up')
  }
  if (heroSections.some((section) => Number(section?.heroHeight || 0) > 760)) {
    mobile -= 14
    diagnostics.mobile.push('Hero height is likely too tall for phones')
  }
  if (sections.some((section) => Number(section?.columns || 1) >= 3)) {
    mobile -= 10
    diagnostics.mobile.push('Three-column layouts need mobile review')
  }
  if (sections.length > 10) {
    mobile -= 8
    speed -= 6
    diagnostics.mobile.push(`Long page with ${sections.length} sections`)
    diagnostics.speed.push(`Long page with ${sections.length} sections`)
  }
  if (imageSections.length >= 6) {
    mobile -= 6
    diagnostics.mobile.push(`Image-heavy layout with ${imageSections.length} media sections`)
  }
  if (heroSections.some((section) => section?.mediaType === 'video')) {
    speed -= 18
    diagnostics.speed.push('Hero video increases load cost')
  }
  if (imageSections.length >= 4) {
    speed -= 10
    diagnostics.speed.push(`${imageSections.length} image-heavy sections found`)
  }
  if (sections.some((section) => section?.animationType && section.animationType !== 'none')) {
    speed -= 6
    diagnostics.speed.push('Entrance animations are enabled')
  }

  return {
    overall: clampScore((seo + mobile + speed) / 3),
    seo: clampScore(seo),
    mobile: clampScore(mobile),
    speed: clampScore(speed),
    diagnostics,
    facts: {
      wordCount: bodyWordCount,
      imageCount: imageStats.total,
      missingAltCount,
      brokenInternalLinks: brokenInternalLinks.length,
      majorHeadingCount: h1LikeSections.length,
      sectionCount: sections.length,
      canonicalVisible: hasCanonicalVisibility
    }
  }
}

function normalizeNavigationPath(url: string) {
  const value = String(url || '/').trim()
  if (!value || value === '/') return '/'
  const prefixed = value.startsWith('/') ? value : `/${value}`
  const normalized = prefixed.replace(/\/{2,}/g, '/')
  return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

function flattenNavigationUrls(items: any[] = [], results = new Set<string>()) {
  items.forEach((item) => {
    if (item?.isActive !== false && item?.url) results.add(normalizeNavigationPath(item.url))
    if (Array.isArray(item?.children)) flattenNavigationUrls(item.children, results)
  })
  return results
}

export function buildSiteHealthDashboard({ settings, pages, media }: { settings: any; pages: any[]; media: any[] }) {
  const navigationUrls = flattenNavigationUrls(Array.isArray(settings?.navigationItems) ? settings.navigationItems : [])
  const builtInPages = Object.entries(builtInPageDefaults).map(([key, defaults]) => {
    const metadata = settings?.pageMetadata?.[key] || {}
    const sections = Array.isArray(settings?.pageSections?.[key]) ? settings.pageSections[key] : []
    const path = normalizeNavigationPath(metadata.pageUrl || defaults.path)
    return {
      id: `built-in:${key}`,
      label: metadata.pageTitle || metadata.headerTitle || defaults.label,
      path,
      source: 'Built-in',
      sections,
      page: {
        pageTitle: metadata.pageTitle || defaults.label,
        title: metadata.pageTitle || defaults.label,
        metaTitle: metadata.metaTitle || '',
        metaDescription: metadata.metaDescription || '',
        pageUrl: path,
        headerTitle: metadata.headerTitle || ''
      },
      isPublished: true
    }
  })

  const customPages = (Array.isArray(pages) ? pages : []).map((page: any) => ({
    id: `custom:${page.id}`,
    label: page.title || page.slug || 'Custom Page',
    path: normalizeNavigationPath(page.slug ? `/${page.slug}` : page.pageUrl || ''),
    source: 'Custom',
    sections: Array.isArray(page.sections) ? page.sections : [],
    page: {
      title: page.title || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      pageUrl: page.slug ? `/${page.slug}` : page.pageUrl || '',
      headerTitle: page.headerTitle || ''
    },
    isPublished: page.isPublished !== false
  }))

  const allPages = [...builtInPages, ...customPages]
  const pageAudits = allPages.map((item) => {
    const insights = buildPageHealthInsights(item.page, item.sections)
    const isOrphan = item.path !== '/' && !navigationUrls.has(item.path)
    const isUnpublished = item.source === 'Custom' && !item.isPublished
    return {
      ...item,
      ...insights,
      issuesCount: insights.diagnostics.seo.length + insights.diagnostics.mobile.length + insights.diagnostics.speed.length + (isOrphan ? 1 : 0),
      isOrphan,
      isUnpublished
    }
  })

  const mediaAssets = Array.isArray(media) ? media : []
  const missingAltAssets = mediaAssets.filter((asset) => String(asset?.altStatus || '').toLowerCase() === 'missing' || !String(asset?.altText || '').trim()).length
  const averageScore = pageAudits.length > 0 ? Math.round(pageAudits.reduce((sum, page) => sum + page.overall, 0) / pageAudits.length) : 0
  const pagesWithIssues = pageAudits.filter((page) => page.issuesCount > 0)
  const topIssues = [...pagesWithIssues].sort((a, b) => b.issuesCount - a.issuesCount || a.overall - b.overall)

  return {
    summary: {
      totalPages: pageAudits.length,
      averageScore,
      pagesWithIssues: pagesWithIssues.length,
      missingAltAssets,
      missingAltImages: pageAudits.reduce((sum, page) => sum + Number(page.facts.missingAltCount || 0), 0),
      brokenLinks: pageAudits.reduce((sum, page) => sum + Number(page.facts.brokenInternalLinks || 0), 0),
      orphanPages: pageAudits.filter((page) => page.isOrphan).length,
      unpublishedPages: pageAudits.filter((page) => page.isUnpublished).length
    },
    pageAudits,
    topIssues: topIssues.slice(0, 8),
    orphanPages: pageAudits.filter((page) => page.isOrphan).slice(0, 8),
    mediaAssetsMissingAlt: mediaAssets.filter((asset) => String(asset?.altStatus || '').toLowerCase() === 'missing' || !String(asset?.altText || '').trim()).slice(0, 8)
  }
}
