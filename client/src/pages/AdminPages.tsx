import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiAlignCenter, FiAlignLeft, FiAlignRight, FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiColumns, FiCopy, FiEye, FiEyeOff, FiFileText, FiGrid, FiImage, FiLayout, FiLink, FiMail, FiMapPin, FiMessageSquare, FiMonitor, FiMove, FiPhone, FiRotateCcw, FiRotateCw, FiSave, FiSearch, FiSmartphone, FiSquare, FiTablet, FiTrash2, FiType, FiVideo } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'
import { cloneDemoStarterSections, demoStarterSections } from '../utils/demoStarterTemplates'

const MediaPicker = lazy(() => import('../components/MediaPicker'))
const PageSections = lazy(() => import('../components/PageSections'))
const RichTextEditorField = lazy(() => import('../components/RichTextEditorField'))

const publicPages = [
  { id: 'home', label: 'Homepage', url: '/' },
  { id: 'portfolio', label: 'Portfolio', url: '/portfolio' },
  { id: 'services', label: 'Services', url: '/services' },
  { id: 'pricing', label: 'Pricing', url: '/pricing' },
  { id: 'plugins', label: 'Plugins', url: '/plugins' },
  { id: 'creativecms', label: 'CreativeCMS', url: '/creativecms-platform' },
  { id: 'contact', label: 'Contact', url: '/contact' }
]

const emptySettings = {
  heroTitle: '',
  heroSubtitle: '',
  heroPrimaryLabel: '',
    heroPrimaryUrl: '',
    heroSecondaryLabel: '',
    heroSecondaryUrl: '',
    buttonIcon: '',
    buttonIconOnly: false,
    buttonShowArrow: true,
    secondaryButtonIcon: '',
    secondaryButtonIconOnly: false,
    secondaryButtonShowArrow: false,
    headingTag: '',
    titleLinkUrl: '',
    contentVerticalAlign: '',
    heroMediaType: 'none',
  heroMediaUrl: '',
  pageHeaders: {} as Record<string, { title: string; subtitle: string }>,
  pageMetadata: {} as Record<string, any>,
  pageSections: {} as Record<string, any[]>,
  reusableSections: [] as any[],
  whatWeDoHeader: { title: 'What We Do', subtitle: '' },
  whatWeDoEnabled: true,
  whatWeDo: [] as any[],
  featuredWork: [] as any[],
  services: [] as any[],
  webDesignPackages: [] as any[],
  faqs: [] as any[],
  googleReviewsEnabled: false,
  googlePlaceId: '',
  googleApiKey: '',
  testimonials: [] as any[]
}

const pageHeaderLabels: Record<string, string> = {
  portfolio: 'Portfolio',
  services: 'Services',
  pricing: 'Pricing',
  plugins: 'Plugins',
  creativecms: 'CreativeCMS',
  contact: 'Contact'
}

const pluginOptions = [
  { value: 'restaurant', label: 'Restaurant Menu' },
  { value: 'real-estate', label: 'Real Estate Listings' },
  { value: 'booking', label: 'Booking Appointments' },
  { value: 'events', label: 'Events' },
  { value: 'blog', label: 'Blog & Articles' },
  { value: 'protected-content', label: 'Protected Content' },
  { value: 'crm', label: 'CRM Quote System' }
]

const sectionTypeOptions = [
  { value: 'hero', label: 'Hero', icon: FiLayout },
  { value: 'banner', label: 'Banner', icon: FiLayout },
  { value: 'button', label: 'Button', icon: FiSquare },
  { value: 'columns', label: 'Columns', icon: FiColumns },
  { value: 'header', label: 'Header', icon: FiType },
  { value: 'paragraph', label: 'Paragraph', icon: FiFileText },
  { value: 'image', label: 'Image', icon: FiImage },
  { value: 'imageCards', label: 'Image Cards', icon: FiGrid },
  { value: 'imageOverlay', label: 'Image Overlay', icon: FiImage },
  { value: 'map', label: 'Interactive Map', icon: FiMapPin },
  { value: 'youtube', label: 'YouTube Video', icon: FiVideo },
  { value: 'divider', label: 'Divider', icon: FiLayout },
  { value: 'gallery', label: 'Gallery', icon: FiImage },
  { value: 'plugin', label: 'Plugin', icon: FiGrid },
  { value: 'section', label: 'Text + Image', icon: FiColumns },
  { value: 'testimonials', label: 'Testimonials', icon: FiFileText },
  { value: 'portfolio', label: 'Portfolio Items', icon: FiImage },
  { value: 'services', label: 'Services', icon: FiGrid },
  { value: 'whatWeDo', label: 'Image + Name Cards', icon: FiGrid },
  { value: 'featuredWork', label: 'Featured Work', icon: FiImage },
  { value: 'portfolioGallery', label: 'Portfolio Gallery', icon: FiImage },
  { value: 'servicesList', label: 'Services List', icon: FiGrid },
  { value: 'pricingPackages', label: 'Pricing Packages', icon: FiGrid },
  { value: 'servicePricing', label: 'A La Carte Pricing', icon: FiGrid },
  { value: 'faq', label: 'FAQ', icon: FiFileText },
  { value: 'pluginsList', label: 'Plugins List', icon: FiGrid },
  { value: 'siteDemos', label: 'Site Demos', icon: FiGrid },
  { value: 'contactForm', label: 'Contact Form', icon: FiFileText },
  { value: 'customForm', label: 'Custom Form', icon: FiFileText },
  { value: 'cta', label: 'CTA', icon: FiLayout }
]

const nestedBlockOptions = [
  { value: 'header', label: 'Header', icon: FiType },
  { value: 'paragraph', label: 'Paragraph', icon: FiFileText },
  { value: 'button', label: 'Button', icon: FiSquare },
  { value: 'image', label: 'Image', icon: FiImage },
  { value: 'imageCard', label: 'Image Card', icon: FiGrid },
  { value: 'hero', label: 'Hero', icon: FiLayout },
  { value: 'banner', label: 'Banner', icon: FiLayout },
  { value: 'cta', label: 'CTA', icon: FiLayout },
  { value: 'imageOverlay', label: 'Image Overlay', icon: FiImage },
  { value: 'map', label: 'Interactive Map', icon: FiMapPin },
  { value: 'youtube', label: 'YouTube Video', icon: FiVideo },
  { value: 'divider', label: 'Divider', icon: FiLayout },
  { value: 'gallery', label: 'Gallery', icon: FiImage },
  { value: 'plugin', label: 'Plugin', icon: FiGrid },
  { value: 'section', label: 'Text + Image', icon: FiColumns },
  { value: 'testimonials', label: 'Testimonials', icon: FiFileText },
  { value: 'portfolio', label: 'Portfolio Items', icon: FiImage },
  { value: 'services', label: 'Services', icon: FiGrid },
  { value: 'whatWeDo', label: 'Image + Name Cards', icon: FiGrid },
  { value: 'featuredWork', label: 'Featured Work', icon: FiImage },
  { value: 'portfolioGallery', label: 'Portfolio Gallery', icon: FiImage },
  { value: 'servicesList', label: 'Services List', icon: FiGrid },
  { value: 'pricingPackages', label: 'Pricing Packages', icon: FiGrid },
  { value: 'servicePricing', label: 'A La Carte Pricing', icon: FiGrid },
  { value: 'faq', label: 'FAQ', icon: FiFileText },
  { value: 'pluginsList', label: 'Plugins List', icon: FiGrid },
  { value: 'siteDemos', label: 'Site Demos', icon: FiMonitor },
  { value: 'contactForm', label: 'Contact Form', icon: FiFileText },
  { value: 'customForm', label: 'Custom Form', icon: FiFileText }
]

const buttonIconOptions = [
  { value: '', label: 'No icon', icon: null },
  { value: 'phone', label: 'Phone', icon: FiPhone },
  { value: 'mail', label: 'Mail', icon: FiMail },
  { value: 'message', label: 'Message', icon: FiMessageSquare },
  { value: 'map', label: 'Map Pin', icon: FiMapPin },
  { value: 'video', label: 'Video', icon: FiVideo },
  { value: 'monitor', label: 'Monitor', icon: FiMonitor }
]

const MAX_IMAGE_WIDTH = 1200
const MAX_IMAGE_HEIGHT = 800
const MAX_UPLOAD_DATA_URL_LENGTH = 3_000_000
const PAGE_AUTOSAVE_KEY_PREFIX = 'creativecms:page-autosave:'
const PAGE_AUTOSAVE_DELAY = 1200

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = src
  })
}

async function getUploadDataUrl(file: File) {
  if (!file.type.startsWith('image/')) return readFileAsDataUrl(file)
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type.includes('icon')) return readFileAsDataUrl(file)

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    let scale = Math.min(1, MAX_IMAGE_WIDTH / image.width, MAX_IMAGE_HEIGHT / image.height)
    let quality = 0.76

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image compression is not available in this browser.')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrl.length <= MAX_UPLOAD_DATA_URL_LENGTH) return dataUrl
      scale *= 0.82
      quality = Math.max(0.52, quality - 0.06)
    }

    throw new Error('This image is still too large after compression. Please use a smaller image or a hosted image URL.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getActivePayload(settings: typeof emptySettings, activeTab: string) {
  const payloadMap: Record<string, string[]> = {
    home: [
      'heroTitle',
      'heroSubtitle',
      'heroPrimaryLabel',
      'heroPrimaryUrl',
      'heroSecondaryLabel',
      'heroSecondaryUrl',
      'heroMediaType',
      'heroMediaUrl',
      'whatWeDoHeader',
      'whatWeDoEnabled',
      'whatWeDo',
      'featuredWork'
    ],
    portfolio: ['pageHeaders'],
    plugins: ['pageHeaders'],
    contact: ['pageHeaders'],
    services: ['pageHeaders', 'services'],
    pricing: ['pageHeaders', 'webDesignPackages', 'faqs']
  }

  const payload = (payloadMap[activeTab] || []).reduce((nextPayload: any, key) => {
    nextPayload[key] = (settings as any)[key]
    return nextPayload
  }, {})
  payload.pageMetadata = settings.pageMetadata || {}
  payload.pageSections = settings.pageSections || {}
  payload.reusableSections = settings.reusableSections || []
  payload.googleReviewsEnabled = settings.googleReviewsEnabled
  payload.googlePlaceId = settings.googlePlaceId
  payload.googleApiKey = settings.googleApiKey
  payload.testimonials = settings.testimonials
  return payload
}

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function normalizeCustomSlug(value: string) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .split('/')
    .map(segment => makeSlug(segment))
    .filter(Boolean)
    .join('/')
}

function normalizePagePath(value: string) {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/^\/+/, '')
    .split('/')
    .map(segment => makeSlug(segment))
    .filter(Boolean)
    .join('/')

  return normalized ? `/${normalized}` : ''
}

function getAutosaveStorageKey(activeTab: string, selectedPageId: string) {
  return `${PAGE_AUTOSAVE_KEY_PREFIX}${activeTab === 'Custom Pages' ? `custom:${selectedPageId}` : `built-in:${activeTab}`}`
}

function loadAutosaveEntry(key: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function saveAutosaveEntry(key: string, value: any) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function clearAutosaveEntry(key: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}

function extractPlainTextFromHtml(value: string) {
  if (!value) return ''
  if (typeof window === 'undefined') return value.replace(/<[^>]+>/g, ' ').trim()
  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<div>${value}</div>`, 'text/html')
  return documentNode.body.textContent?.replace(/\s+/g, ' ').trim() || ''
}

function getSectionSeoIssues(section: any) {
  const issues: string[] = []
  const imageStats = collectImageDiagnostics(section)
  if (imageStats.missingAlt > 0) issues.push(`${imageStats.missingAlt} missing alt`)
  const badLinks = collectSectionLinks(section).filter(looksBrokenInternalLink)
  if (badLinks.length > 0) issues.push(`${badLinks.length} broken link${badLinks.length === 1 ? '' : 's'}`)
  if (section?.type === 'header' && !String(section?.title || '').trim()) issues.push('Missing heading')
  return issues
}

function makePageSection(type: string) {
  const defaultItems = () => {
    if (type === 'gallery') return [{ id: crypto.randomUUID(), title: '', description: '', image: '' }]
    if (type === 'imageCards') return [makeImageCard()]
    if (type === 'columns') return makeColumns(2)
    if (type === 'faq') return [{ id: crypto.randomUUID(), q: '', a: '' }]
    return []
  }

  return {
    id: crypto.randomUUID(),
    type,
    title: '',
    headingTag: type === 'hero' ? 'h1' : (type === 'header' ? 'h2' : ''),
    titleHtml: '',
    titleLinkUrl: '',
    body: '',
    imageUrl: '',
    mapQuery: '',
    mapEmbedUrl: '',
    mapHeight: type === 'map' ? 420 : '',
    mapPins: [],
    videoUrl: '',
    videoHeight: type === 'youtube' ? 420 : '',
    mediaType: 'image',
    alt: '',
    pluginSlug: 'restaurant',
    buttonLabel: 'Get Started',
    buttonUrl: '/contact',
    secondaryButtonLabel: '',
    secondaryButtonUrl: '',
    secondaryButtonBackgroundColor: '',
    secondaryButtonTextColor: '',
    secondaryButtonHoverBackgroundColor: '',
    secondaryButtonBorderRadius: '',
    secondaryButtonPaddingX: '',
    secondaryButtonPaddingY: '',
    secondaryButtonHoverEffect: 'none',
    buttonHoverBackgroundColor: '',
    buttonBoxShadow: '',
    buttonBorderRadius: '',
    buttonPaddingX: '',
    buttonPaddingY: '',
    buttonHoverEffect: 'lift',
    contentVerticalAlign: type === 'section' ? 'center' : '',
    heroFormEnabled: false,
    heroHeight: '',
    items: defaultItems(),
    overlayColor: '',
    overlayOpacity: 55,
    crmEyebrow: '',
    crmPanelTitle: '',
    crmPanelText: '',
    crmFormTitle: '',
    crmServices: '',
    crmDetailsPlaceholder: '',
    crmBackgroundColor: '',
    crmBackgroundImageUrl: '',
    crmTextColor: '',
    crmInputTextColor: '',
    crmPlaceholderColor: '',
    crmInputBackgroundColor: '',
    crmInputBorderColor: '',
    crmInputBorderWidth: '',
    crmInputBorderRadius: '',
    crmInputPaddingX: '',
    crmInputPaddingY: '',
    customFormName: 'Website Inquiry',
    customFormSubmitLabel: 'Send Message',
    customFormSuccessMessage: 'Thanks. Your submission has been sent.',
    formFields: type === 'customForm'
      ? [
          makeCustomFormField('text', { label: 'Your Name', placeholder: 'Jane Doe', required: true }),
          makeCustomFormField('email', { label: 'Email Address', placeholder: 'hello@example.com', required: true }),
          makeCustomFormField('textarea', { label: 'How can we help?', placeholder: 'Tell us about your project...', required: true })
        ]
      : [],
    marginTop: '',
    marginRight: '',
    marginBottom: '',
    marginLeft: '',
    paddingTop: '',
    paddingRight: '',
    paddingBottom: '',
    paddingLeft: '',
    backgroundColor: '',
    headingColor: '',
    textColor: '',
    buttonBackgroundColor: '',
    buttonTextColor: '',
    isHidden: false,
    boxShadow: '',
    borderWidth: '',
    borderColor: '',
    borderStyle: 'solid',
    borderTopLeftRadius: '',
    borderTopRightRadius: '',
    borderBottomRightRadius: '',
    borderBottomLeftRadius: '',
    textAlign: '',
    headingFontSize: '',
    bodyFontSize: '',
    buttonFontSize: '',
    cardMetaFontSize: '',
    cardHeadingFontSize: '',
    cardBodyFontSize: '',
    headingTextShadow: '',
    bodyTextShadow: '',
    buttonTextShadow: '',
    cardMetaTextShadow: '',
    cardHeadingTextShadow: '',
    cardBodyTextShadow: '',
    headingFontWeight: '',
    bodyFontWeight: '',
    buttonFontWeight: '',
    cardHeadingFontWeight: '',
    cardBodyFontWeight: '',
    headingLineHeight: '',
    bodyLineHeight: '',
    cardHeadingLineHeight: '',
    cardBodyLineHeight: '',
    letterSpacing: '',
    animationType: '',
    animationDuration: 650,
    animationDelay: 0,
    animationEasing: 'ease-out',
    animationTrigger: 'viewport',
    itemLimit: type === 'portfolio' ? 8 : 6,
    columns: type === 'portfolio' ? 4 : type === 'columns' ? 2 : 3
  }
}

function makeImageCard() {
  return {
    id: crypto.randomUUID(),
    category: '',
    title: '',
    description: '',
    image: '',
    buttonLabel: 'View More',
    buttonUrl: '/contact'
  }
}

function makeCustomFormField(type = 'text', overrides: Record<string, any> = {}) {
  return {
    id: crypto.randomUUID(),
    label: '',
    type,
    required: false,
    placeholder: '',
    options: '',
    ...overrides
  }
}

function makeMapPin(overrides: Record<string, any> = {}) {
  return {
    id: crypto.randomUUID(),
    label: 'Location',
    x: 50,
    y: 50,
    ...overrides
  }
}

function makeNestedBlock(type: string) {
  if (type !== 'imageCard') {
    const baseSection = makePageSection(type)
    return {
      ...baseSection,
      id: crypto.randomUUID(),
      buttonLabel: type === 'button' ? 'Learn More' : baseSection.buttonLabel,
      buttonUrl: type === 'button' ? '/contact' : baseSection.buttonUrl
    }
  }

  const base = {
    id: crypto.randomUUID(),
    type,
    title: '',
    body: '',
    imageUrl: '',
    alt: '',
    category: '',
    description: '',
    buttonLabel: 'Learn More',
    buttonUrl: '/contact',
    buttonBackgroundColor: '',
    buttonTextColor: '',
    buttonHoverBackgroundColor: '',
    buttonBorderRadius: '',
    buttonPaddingX: '',
    buttonPaddingY: '',
    buttonHoverEffect: 'lift'
  }

  return base
}

function makeColumns(count: number, existing: any[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: existing[index]?.id || crypto.randomUUID(),
    sections: Array.isArray(existing[index]?.sections) ? existing[index].sections : []
  }))
}

function getSectionTitle(section: any, index: number) {
  const typeLabel = sectionTypeOptions.find(option => option.value === section.type)?.label || 'Section'
  return section.title || `${typeLabel} ${index + 1}`
}

function stripSyncedBlockMeta(section: any) {
  if (!section || typeof section !== 'object') return section
  const cloned = JSON.parse(JSON.stringify(section))
  delete cloned.syncedBlockId
  delete cloned.syncedBlockName
  delete cloned.isSyncedBlockInstance
  delete cloned.syncedBlockUpdatedAt
  return cloned
}

function cloneSectionWithNewIds(section: any) {
  const cloned = JSON.parse(JSON.stringify(section || {}))
  const applyIds = (value: any) => {
    if (!value || typeof value !== 'object') return
    if ('id' in value) value.id = crypto.randomUUID()
    Object.values(value).forEach(child => {
      if (Array.isArray(child)) child.forEach(applyIds)
      else applyIds(child)
    })
  }
  cloned.id = crypto.randomUUID()
  cloned.title = cloned.title ? `${cloned.title} Copy` : cloned.title
  applyIds(cloned)
  return cloned
}

function makeSyncedSectionInstance(template: any) {
  const sourceSection = stripSyncedBlockMeta(template.section || {})
  return {
    id: crypto.randomUUID(),
    type: sourceSection.type || template.type || 'section',
    title: sourceSection.title || template.name || '',
    syncedBlockId: template.id,
    syncedBlockName: template.name || sourceSection.title || 'Synced Block',
    isSyncedBlockInstance: true,
    syncedBlockUpdatedAt: template.updatedAt || new Date().toISOString()
  }
}

function resolveSyncedSection(section: any, reusableSections: any[] = []) {
  if (!section?.syncedBlockId) return section
  const template = reusableSections.find((item: any) => item.id === section.syncedBlockId && item.kind === 'synced')
  if (!template?.section) return section
  const sourceSection = stripSyncedBlockMeta(template.section)
  return {
    ...sourceSection,
    id: section.id || sourceSection.id || crypto.randomUUID(),
    syncedBlockId: template.id,
    syncedBlockName: template.name || sourceSection.title || 'Synced Block',
    isSyncedBlockInstance: true,
    syncedBlockUpdatedAt: template.updatedAt || section.syncedBlockUpdatedAt || ''
  }
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(value: string) {
  const trimmed = stripHtml(value)
  return trimmed ? trimmed.split(/\s+/).length : 0
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
        item.sections.forEach((nested: any) => {
          values.push(...collectSectionText(nested))
        })
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
        item.sections.forEach((nested: any) => {
          const nestedImages = collectImageDiagnostics(nested)
          total += nestedImages.total
          missingAlt += nestedImages.missingAlt
        })
      }
    })
  }

  return { total, missingAlt }
}

function collectLinksFromText(value: string) {
  const html = String(value || '')
  const matches = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
  return matches.map((match) => String(match[1] || '').trim()).filter(Boolean)
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
        item.sections.forEach((nested: any) => {
          links.push(...collectSectionLinks(nested))
        })
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

function buildPageEditorInsights(page: any, sections: any[] = []) {
  let seo = 100
  let mobile = 100
  let speed = 100
  const suggestions: Array<{ category: 'SEO' | 'Mobile' | 'Speed'; text: string; priority: 'high' | 'medium' }> = []
  const diagnostics = {
    seo: [] as string[],
    mobile: [] as string[],
    speed: [] as string[]
  }

  const title = String(page?.title || page?.pageTitle || '').trim()
  const metaTitle = String(page?.metaTitle || '').trim()
  const metaDescription = String(page?.metaDescription || '').trim()
  const rawSlug = String(page?.slug || page?.pageUrl || '').trim()
  const slug = rawSlug ? (rawSlug.startsWith('/') ? rawSlug : `/${rawSlug}`) : ''
  const headerTitle = String(page?.headerTitle || '').trim()
  const bodyText = sections.flatMap(section => collectSectionText(section)).join(' ').trim()
  const bodyWordCount = countWords(bodyText)
  const heroSections = sections.filter(section => section?.type === 'hero')
  const imageSections = sections.filter(section => ['image', 'gallery', 'imageCards', 'imageOverlay', 'portfolio', 'portfolioGallery'].includes(section?.type))
  const imageStats = sections.reduce((totals, section) => {
    const next = collectImageDiagnostics(section)
    totals.total += next.total
    totals.missingAlt += next.missingAlt
    return totals
  }, { total: 0, missingAlt: 0 })
  const missingAltCount = imageStats.missingAlt
  const internalLinks = sections.flatMap(section => collectSectionLinks(section))
  const brokenInternalLinks = internalLinks.filter(looksBrokenInternalLink)
  const h1LikeSections = sections.filter(section => (
    ['hero', 'banner'].includes(section?.type) || (section?.type === 'header' && (section?.headingTag || 'h2') === 'h1')
  ) && String(section?.title || '').trim())
  const hasCanonicalVisibility = Boolean(slug && slug.startsWith('/'))
  const keywordSlug = slug.replace(/^\//, '')
  const hasKeywordSlug = keywordSlug.length >= 3 && !keywordSlug.includes('_')
  const sectionIssueCounts = sections.reduce((acc: Record<string, number>, section: any, index: number) => {
    const issues = getSectionSeoIssues(section)
    if (issues.length > 0) acc[String(section?.id || index)] = issues.length
    return acc
  }, {})

  if (!title || title.length < 4) {
    seo -= 18
    suggestions.push({ category: 'SEO', priority: 'high', text: 'Add a clear page title so search engines and visitors know what this page is about.' })
    diagnostics.seo.push('Missing or weak page title')
  }
  if (!metaTitle || metaTitle.length < 20 || metaTitle.length > 60) {
    seo -= 14
    suggestions.push({ category: 'SEO', priority: 'high', text: 'Keep the SEO title between about 20 and 60 characters so it has a better chance of showing cleanly in Google.' })
    diagnostics.seo.push(`SEO title length is ${metaTitle.length || 0} characters`)
  }
  if (!metaDescription || metaDescription.length < 70 || metaDescription.length > 160) {
    seo -= 12
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Write a meta description around 70 to 160 characters to improve click-through rate from search.' })
    diagnostics.seo.push(`Meta description length is ${metaDescription.length || 0} characters`)
  }
  if (!slug || !slug.startsWith('/')) {
    seo -= 8
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Use a clean URL path that starts with a slash, like /services or /locations.' })
    diagnostics.seo.push('URL path should start with /')
  }
  if (!headerTitle && !heroSections.length) {
    seo -= 10
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Add a visible heading or hero title so the page has a strong main heading.' })
    diagnostics.seo.push('No strong visible primary heading')
  }
  if (h1LikeSections.length > 1) {
    seo -= 6
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'This page has multiple large hero/header titles. Keep one primary heading and make the rest secondary where possible.' })
    diagnostics.seo.push(`${h1LikeSections.length} major heading sections detected`)
  }
  if (bodyText.length < 140 || bodyWordCount < 60) {
    seo -= 10
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'This page is still light on content. Add more useful copy to help it rank for real searches.' })
    diagnostics.seo.push(`Only about ${bodyWordCount} words of body content`)
  }
  if (missingAltCount > 0) {
    seo -= Math.min(12, missingAltCount * 4)
    suggestions.push({ category: 'SEO', priority: 'medium', text: `Add alt text to ${missingAltCount} image${missingAltCount === 1 ? '' : 's'} so the page is more accessible and better described.` })
    diagnostics.seo.push(`${missingAltCount} image${missingAltCount === 1 ? '' : 's'} missing alt text`)
  }
  if (brokenInternalLinks.length > 0) {
    seo -= Math.min(10, brokenInternalLinks.length * 3)
    suggestions.push({ category: 'SEO', priority: 'high', text: 'Some internal links do not start with /. Update them so they point to valid site paths instead of broken relative URLs.' })
    diagnostics.seo.push(`${brokenInternalLinks.length} internal link${brokenInternalLinks.length === 1 ? '' : 's'} may be broken`)
  }
  if (!hasKeywordSlug) {
    seo -= 5
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Use a short descriptive URL slug with hyphens, like /web-design or /service-areas.' })
    diagnostics.seo.push('Slug could be cleaner for search')
  }
  if (!hasCanonicalVisibility) {
    diagnostics.seo.push('Canonical path is unclear until the URL is cleaned up')
  }

  if (heroSections.some(section => Number(section?.heroHeight || 0) > 760)) {
    mobile -= 14
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'The hero is very tall. Shortening it a bit will show more content above the fold on phones.' })
    diagnostics.mobile.push('Hero height is likely too tall for phones')
  }
  if (sections.some(section => Number(section?.columns || 1) >= 3)) {
    mobile -= 10
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'Three-column layouts can feel cramped on phones. Check mobile preview and reduce columns where needed.' })
    diagnostics.mobile.push('Three-column layouts need mobile review')
  }
  if (sections.length > 10) {
    mobile -= 8
    speed -= 6
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'This page is getting long. Combine lighter sections where possible to keep mobile scrolling focused.' })
    diagnostics.mobile.push(`Long page with ${sections.length} sections`)
    diagnostics.speed.push(`Long page with ${sections.length} sections`)
  }
  if (imageSections.length >= 6) {
    mobile -= 6
    diagnostics.mobile.push(`Image-heavy layout with ${imageSections.length} media sections`)
  }

  if (heroSections.some(section => section?.mediaType === 'video')) {
    speed -= 18
    suggestions.push({ category: 'Speed', priority: 'high', text: 'Hero videos are expensive on mobile. Use them sparingly or fall back to a compressed image.' })
    diagnostics.speed.push('Hero video increases load cost')
  }
  if (imageSections.length >= 4) {
    speed -= 10
    suggestions.push({ category: 'Speed', priority: 'medium', text: 'This page uses a lot of imagery. Make sure uploaded images are compressed and sized close to how they render.' })
    diagnostics.speed.push(`${imageSections.length} image-heavy sections found`)
  }
  if (sections.some(section => section?.animationType && section.animationType !== 'none')) {
    speed -= 6
    suggestions.push({ category: 'Speed', priority: 'medium', text: 'Multiple entrance animations can add extra work on slower devices. Use them where they matter most.' })
    diagnostics.speed.push('Entrance animations are enabled')
  }

  return {
    overall: clampScore((seo + mobile + speed) / 3),
    seo: clampScore(seo),
    mobile: clampScore(mobile),
    speed: clampScore(speed),
    suggestions: suggestions.slice(0, 8),
    diagnostics,
    facts: {
      wordCount: bodyWordCount,
      imageCount: imageStats.total,
      missingAltCount,
      brokenInternalLinks: brokenInternalLinks.length,
      majorHeadingCount: h1LikeSections.length,
      sectionCount: sections.length,
      canonicalVisible: hasCanonicalVisibility
    },
    sectionIssueCounts
  }
}

export default function AdminPages() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [settings, setSettings] = useState(emptySettings)
  const [pages, setPages] = useState<any[]>([])
  const [siteDemos, setSiteDemos] = useState<any[]>([])
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [servicePackages, setServicePackages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('new')
  const [pageDraft, setPageDraft] = useState<any>({
    title: '',
    slug: '',
    headerTitle: '',
    headerSubtitle: '',
    showPageHeader: true,
    previewToken: '',
    content: '',
    sections: [],
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    sortOrder: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [autosaveMessage, setAutosaveMessage] = useState('')
  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null)
  const [editingSectionId, setEditingSectionId] = useState('')
  const [highlightedSectionId, setHighlightedSectionId] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [sectionsPanelOpen, setSectionsPanelOpen] = useState(true)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [unsavedPrompt, setUnsavedPrompt] = useState<{ open: boolean; href?: string; action?: () => void }>({ open: false })
  const [draftRecoveryPrompt, setDraftRecoveryPrompt] = useState<{ open: boolean; key: string; label: string; updatedAt?: string; data?: any }>({ open: false, key: '', label: '' })
  const [deletePromptOpen, setDeletePromptOpen] = useState(false)
  const [newPageTemplatePromptOpen, setNewPageTemplatePromptOpen] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; type: string; onSelect: null | ((url: string) => void) }>({ open: false, type: 'image', onSelect: null })
  const skipNextNewPagePromptRef = useRef(false)
  const lastAutosavedSnapshotRef = useRef('')
  const autosaveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncMobileEditor = () => {
      if (window.innerWidth < 768) {
        setPreviewMode('mobile')
        setSectionsPanelOpen(false)
      }
    }
    syncMobileEditor()
    window.addEventListener('resize', syncMobileEditor)
    return () => window.removeEventListener('resize', syncMobileEditor)
  }, [])

  const activeBuiltInPageKey = publicPages.some(page => page.id === activeTab) ? activeTab : ''
  const activeBuiltInMetadata: Record<string, any> = useMemo(() => (
    activeBuiltInPageKey ? (settings.pageMetadata?.[activeBuiltInPageKey] || {}) : {}
  ), [activeBuiltInPageKey, settings.pageMetadata])
  const activeBuiltInHeader: Record<string, any> = useMemo(() => (
    activeBuiltInPageKey ? (settings.pageHeaders?.[activeBuiltInPageKey] || {}) : {}
  ), [activeBuiltInPageKey, settings.pageHeaders])
  const activeBuiltInSections = useMemo(() => (
    activeBuiltInPageKey && Array.isArray(settings.pageSections?.[activeBuiltInPageKey])
      ? settings.pageSections[activeBuiltInPageKey]
      : []
  ), [activeBuiltInPageKey, settings.pageSections])
  const pageInsights = useMemo(() => {
    if (activeTab === 'Custom Pages') return buildPageEditorInsights(pageDraft, pageDraft.sections || [])

    return buildPageEditorInsights({
      title: activeBuiltInMetadata.pageTitle || publicPages.find(page => page.id === activeBuiltInPageKey)?.label || '',
      metaTitle: activeBuiltInMetadata.metaTitle || '',
      metaDescription: activeBuiltInMetadata.metaDescription || '',
      slug: activeBuiltInMetadata.pageUrl || publicPages.find(page => page.id === activeBuiltInPageKey)?.url || '',
      headerTitle: activeBuiltInMetadata.headerTitle || activeBuiltInHeader.title || ''
    }, activeBuiltInSections)
  }, [activeTab, activeBuiltInHeader.title, activeBuiltInMetadata, activeBuiltInPageKey, activeBuiltInSections, pageDraft])

  useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true)
          const [settingsData, pagesData, demosData] = await Promise.all([adminAPI.getSiteSettings(), adminAPI.getPages(), adminAPI.getSiteDemos()])
          setSettings({ ...emptySettings, ...settingsData })
          setPages(pagesData)
          setSiteDemos(demosData)
          const [portfolioData, serviceData] = await Promise.all([
            adminAPI.getPortfolioItems(),
            adminAPI.getServicePackages()
        ])
        setPortfolioItems(portfolioData)
        setServicePackages(serviceData)
      } catch (err: any) {
        setError(err.error || 'Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }))

  const updateListItem = (key: string, index: number, field: string, value: any) => {
    setSettings(prev => {
      const list = [...((prev as any)[key] || [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key: string) => setSettings(prev => ({ ...prev, [key]: [...((prev as any)[key] || []), {}] }))
  const removeListItem = (key: string, index: number) => setSettings(prev => ({ ...prev, [key]: ((prev as any)[key] || []).filter((_: any, i: number) => i !== index) }))

  const updatePageHeader = (page: string, field: 'title' | 'subtitle', value: string) => {
    recordHistory()
    setSettings(prev => ({
      ...prev,
      pageHeaders: {
        ...(prev.pageHeaders || {}),
        [page]: {
          ...(prev.pageHeaders?.[page] || {}),
          [field]: value
        }
      }
    }))
  }

  const updatePageMetadata = (page: string, field: string, value: string) => {
    recordHistory()
    const nextValue = field === 'pageUrl' ? normalizePagePath(value) : value
    setSettings(prev => ({
      ...prev,
      pageMetadata: {
        ...(prev.pageMetadata || {}),
        [page]: {
          ...(prev.pageMetadata?.[page] || {}),
          [field]: nextValue
        }
      }
    }))
  }

  const markNewSection = (sectionId: string) => {
    setEditingSectionId(sectionId)
    setHighlightedSectionId(sectionId)
    window.setTimeout(() => {
      document.getElementById(`preview-section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    window.setTimeout(() => setHighlightedSectionId(current => current === sectionId ? '' : current), 1800)
  }

  const saveSettingsTab = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveBuiltInPageEdits()
  }

  const saveBuiltInPageEdits = async () => {
    try {
      setError('')
      setMessage('Saving page edits...')
      const payload = getActivePayload(settings, activeTab)
      await adminAPI.updateSiteSettings(payload)
      setSavedSnapshot(JSON.stringify(payload))
      clearAutosaveEntry(autosaveStorageKey)
      lastAutosavedSnapshotRef.current = JSON.stringify(payload)
      setAutosaveMessage('')
      setUndoStack([])
      setRedoStack([])
      setMessage('Page edits saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save page edits')
    }
  }

  const startNewPage = useCallback((syncUrl = true, promptForTemplate = true) => {
      if (syncUrl && !promptForTemplate) skipNextNewPagePromptRef.current = true
      setActiveTab('Custom Pages')
      setSelectedPageId('new')
      setPageDraft({
      title: '',
      slug: '',
      headerTitle: '',
      headerSubtitle: '',
      showPageHeader: true,
      previewToken: '',
      content: '',
      sections: [],
      metaTitle: '',
        metaDescription: '',
        isPublished: false,
        sortOrder: pages.length * 10
      })
      setNewPageTemplatePromptOpen(promptForTemplate)
      if (syncUrl) navigate('/admin/pages?page=new')
    }, [navigate, pages.length])

  const applyTemplateToNewPage = (template: any) => {
    const sections = Array.isArray(template.sections) && template.sections.length > 0
      ? template.sections.map((section: any) => cloneSectionWithNewIds(section))
      : [cloneSectionWithNewIds(template.section || template)]
    setPageDraft((current: any) => ({
      ...current,
      title: current.title || template.name || '',
      headerTitle: current.headerTitle || template.name || '',
      metaTitle: current.metaTitle || template.name || '',
      sections
    }))
    if (sections[0]?.id) markNewSection(sections[0].id)
    setNewPageTemplatePromptOpen(false)
    setMessage(`Started the page with ${template.name}. Save when you're ready to keep it.`)
  }

  const applyDemoStarterToNewPage = (demo: any) => {
    const sections = cloneDemoStarterSections(demo.slug)
    setPageDraft((current: any) => ({
      ...current,
      title: current.title || `${demo.name} Starter`,
      slug: current.slug || normalizeCustomSlug(demo.slug),
      headerTitle: current.headerTitle || demo.name,
      headerSubtitle: current.headerSubtitle || demo.description || '',
      metaTitle: current.metaTitle || `${demo.name} Starter`,
      metaDescription: current.metaDescription || demo.description || '',
      sections
    }))
    if (sections[0]?.id) markNewSection(sections[0].id)
    setNewPageTemplatePromptOpen(false)
    setMessage(`Started the page with the ${demo.name} demo template. Save when you're ready to keep it.`)
  }

  useEffect(() => {
    if (loading) return

    const params = new URLSearchParams(location.search)
      const pageParam = params.get('page')
      const customParam = params.get('custom')

      if (pageParam === 'new') {
        const promptForTemplate = !skipNextNewPagePromptRef.current
        skipNextNewPagePromptRef.current = false
        setEditingSectionId('')
        startNewPage(false, promptForTemplate)
        return
      }

    if (pageParam && publicPages.some(page => page.id === pageParam)) {
      setEditingSectionId('')
      setActiveTab(pageParam)
      return
    }

    if (customParam) {
      const customPage = pages.find(page => String(page.id) === customParam)
      if (customPage) {
        setEditingSectionId('')
        setActiveTab('Custom Pages')
        setSelectedPageId(String(customPage.id))
        setPageDraft({
          ...customPage,
          showPageHeader: customPage.showPageHeader !== false,
          previewToken: customPage.previewToken || '',
          sections: Array.isArray(customPage.sections) ? customPage.sections : []
        })
      }
    }
  }, [location.search, loading, pages, startNewPage])

  const updatePageDraft = (field: string, value: any) => {
    recordHistory()
    setPageDraft((current: any) => ({
      ...current,
      [field]: value,
      ...(field === 'title' && !current.slug ? { slug: normalizeCustomSlug(value) } : {})
    }))
  }

  const uploadImageToField = async (setter: (url: string) => void, file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      setMessage('Uploading image...')
      const dataUrl = await getUploadDataUrl(file)
      const upload = await adminAPI.uploadImage(dataUrl)
      setter(upload.url)
      setMessage('Image uploaded. Save to publish it.')
    } catch (err: any) {
      setMessage('')
      setError(err.error || err.message || 'Failed to upload image')
    }
  }

  const openMediaPicker = (setter: (url: string) => void, type = 'image') => {
    setMediaPicker({ open: true, type, onSelect: setter })
  }

  const addPageSection = (type: string) => {
    recordHistory()
    const baseSection: any = makePageSection(type)
    setPageDraft((current: any) => ({ ...current, sections: [...(current.sections || []), baseSection] }))
    markNewSection(baseSection.id)
  }

  const updatePageSection = (index: number, field: string, value: any) => {
    recordHistory()
    setPageDraft((current: any) => {
      const sections = [...(current.sections || [])]
      sections[index] = { ...sections[index], [field]: value }
      return { ...current, sections }
    })
  }

  const removePageSection = (index: number) => {
    recordHistory()
    const section = (pageDraft.sections || [])[index]
    if (section?.id === editingSectionId) setEditingSectionId('')
    setPageDraft((current: any) => ({ ...current, sections: (current.sections || []).filter((_: any, i: number) => i !== index) }))
  }

  const duplicatePageSection = (index: number) => {
    recordHistory()
    const section = (pageDraft.sections || [])[index]
    if (!section) return
    const duplicated = cloneSectionWithNewIds(section)
    setPageDraft((current: any) => {
      const sections = [...(current.sections || [])]
      sections.splice(index + 1, 0, duplicated)
      return { ...current, sections }
    })
    markNewSection(duplicated.id)
  }

  const movePageSection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0) return
    recordHistory()

    setPageDraft((current: any) => {
      const sections = [...(current.sections || [])]
      if (fromIndex < 0 || fromIndex >= sections.length || toIndex >= sections.length) return current
      const [movedSection] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, movedSection)
      return { ...current, sections }
    })
  }

  const getBuiltInSections = useCallback((pageKey: string) => (
    Array.isArray(settings.pageSections?.[pageKey]) ? settings.pageSections[pageKey] : []
  ), [settings.pageSections])

  function updateBuiltInSections(pageKey: string, sections: any[]) {
    recordHistory()
    setSettings(prev => ({
      ...prev,
      pageSections: {
        ...(prev.pageSections || {}),
        [pageKey]: sections
      }
    }))
  }

  const addBuiltInSection = (pageKey: string, type: string) => {
    const section = makePageSection(type)
    updateBuiltInSections(pageKey, [...getBuiltInSections(pageKey), section])
    markNewSection(section.id)
  }

  const updateBuiltInSection = (pageKey: string, index: number, field: string, value: any) => {
    const sections = [...getBuiltInSections(pageKey)]
    sections[index] = { ...sections[index], [field]: value }
    updateBuiltInSections(pageKey, sections)
  }

  const removeBuiltInSection = (pageKey: string, index: number) => {
    const section = getBuiltInSections(pageKey)[index]
    if (section?.id === editingSectionId) setEditingSectionId('')
    updateBuiltInSections(pageKey, getBuiltInSections(pageKey).filter((_: any, i: number) => i !== index))
  }

  const duplicateBuiltInSection = (pageKey: string, index: number) => {
    const sections = [...getBuiltInSections(pageKey)]
    const section = sections[index]
    if (!section) return
    const duplicated = cloneSectionWithNewIds(section)
    sections.splice(index + 1, 0, duplicated)
    updateBuiltInSections(pageKey, sections)
    markNewSection(duplicated.id)
  }

  const moveBuiltInSection = (pageKey: string, fromIndex: number, toIndex: number) => {
    const sections = [...getBuiltInSections(pageKey)]
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= sections.length || toIndex >= sections.length) return
    const [movedSection] = sections.splice(fromIndex, 1)
    sections.splice(toIndex, 0, movedSection)
    updateBuiltInSections(pageKey, sections)
  }

  const activeSectionsRaw = useMemo(
    () => (activeTab === 'Custom Pages' ? (pageDraft.sections || []) : activeBuiltInPageKey ? getBuiltInSections(activeBuiltInPageKey) : []),
    [activeTab, pageDraft.sections, activeBuiltInPageKey, getBuiltInSections]
  )
  const activeSections = useMemo(
    () => activeSectionsRaw.map((section: any) => resolveSyncedSection(section, settings.reusableSections || [])),
    [activeSectionsRaw, settings.reusableSections]
  )
  const activePageLabel = activeTab === 'Custom Pages'
    ? (selectedPageId === 'new' ? 'New Custom Page' : pageDraft.title || 'Custom Page')
    : activeBuiltInPageKey === 'home'
      ? 'Homepage'
      : pageHeaderLabels[activeBuiltInPageKey] || 'Page'
  const addActiveSection = (type: string) => activeTab === 'Custom Pages' ? addPageSection(type) : addBuiltInSection(activeBuiltInPageKey, type)
  const updateReusableSyncedBlock = (templateId: string, updater: (template: any) => any) => {
    recordHistory()
    setSettings((prev) => ({
      ...prev,
      reusableSections: (prev.reusableSections || []).map((template: any) => (
        template.id === templateId
          ? { ...updater(template), updatedAt: new Date().toISOString() }
          : template
      ))
    }))
    setMessage('Synced block updated everywhere. Save the page to keep it.')
  }
  const updateActiveSection = (index: number, field: string, value: any) => {
    const rawSection = activeSectionsRaw[index]
    if (rawSection?.syncedBlockId) {
      updateReusableSyncedBlock(rawSection.syncedBlockId, (template: any) => ({
        ...template,
        type: field === 'type' ? value : template.type,
        section: {
          ...(template.section || {}),
          [field]: value
        }
      }))
      return
    }

    if (activeTab === 'Custom Pages') {
      updatePageSection(index, field, value)
    } else {
      updateBuiltInSection(activeBuiltInPageKey, index, field, value)
    }
  }
  const removeActiveSection = (index: number) => activeTab === 'Custom Pages' ? removePageSection(index) : removeBuiltInSection(activeBuiltInPageKey, index)
  const duplicateActiveSection = (index: number) => activeTab === 'Custom Pages' ? duplicatePageSection(index) : duplicateBuiltInSection(activeBuiltInPageKey, index)
  const addReusableSection = (template: any) => {
    recordHistory()
    const templateSections = template.kind === 'synced'
      ? [makeSyncedSectionInstance(template)]
      : Array.isArray(template.sections) && template.sections.length > 0
        ? template.sections.map((section: any) => cloneSectionWithNewIds(section))
        : [cloneSectionWithNewIds(template.section || template)]
    if (activeTab === 'Custom Pages') {
      setPageDraft((current: any) => ({ ...current, sections: [...(current.sections || []), ...templateSections] }))
    } else {
      updateBuiltInSections(activeBuiltInPageKey, [...getBuiltInSections(activeBuiltInPageKey), ...templateSections])
    }
    if (templateSections[0]?.id) markNewSection(templateSections[0].id)
    setMessage(`${template.kind === 'layout' ? 'Layout template' : template.kind === 'synced' ? 'Synced block' : 'Reusable block'} added. Save the page to keep it.`)
  }
  const saveSelectedSectionAsTemplate = () => {
    if (!selectedSection) return
    const name = window.prompt('Block template name', getSectionTitle(selectedSection, selectedSectionIndex))
    if (!name) return
    recordHistory()
    const template = {
      id: crypto.randomUUID(),
      name,
      kind: 'block',
      type: selectedSection.type || 'section',
      sectionCount: 1,
      sourcePage: activePageLabel,
      section: cloneSectionWithNewIds(stripSyncedBlockMeta(selectedSection))
    }
    setSettings(prev => ({ ...prev, reusableSections: [...(prev.reusableSections || []), template] }))
    setMessage('Reusable block saved. Save the page to keep it.')
  }
  const saveSelectedSectionAsSyncedBlock = () => {
    if (!selectedSection) return
    const name = window.prompt('Synced block name', getSectionTitle(selectedSection, selectedSectionIndex))
    if (!name) return
    recordHistory()
    const template = {
      id: crypto.randomUUID(),
      name,
      kind: 'synced',
      type: selectedSection.type || 'section',
      sectionCount: 1,
      sourcePage: activePageLabel,
      updatedAt: new Date().toISOString(),
      section: cloneSectionWithNewIds(stripSyncedBlockMeta(selectedSection))
    }
    setSettings(prev => ({ ...prev, reusableSections: [...(prev.reusableSections || []), template] }))
    setMessage('Synced block saved. Add it anywhere to keep every instance linked.')
  }
  const saveCurrentPageAsTemplate = () => {
    if (!activeSectionsRaw.length) return
    const name = window.prompt('Layout template name', `${activePageLabel} Layout`)
    if (!name) return
    recordHistory()
    const template = {
      id: crypto.randomUUID(),
      name,
      kind: 'layout',
      type: 'layout',
      sectionCount: activeSectionsRaw.length,
      sourcePage: activePageLabel,
      sections: activeSectionsRaw.map((section: any) => cloneSectionWithNewIds(stripSyncedBlockMeta(section)))
    }
    setSettings(prev => ({ ...prev, reusableSections: [...(prev.reusableSections || []), template] }))
    setMessage('Layout template saved. Save the page to keep it.')
  }
  const deleteReusableSection = (templateId: string) => {
    recordHistory()
    setSettings(prev => ({ ...prev, reusableSections: (prev.reusableSections || []).filter((template: any) => template.id !== templateId) }))
    setMessage('Reusable template removed. Save the page to keep it removed.')
  }
  const moveActiveSection = (fromIndex: number, toIndex: number) => activeTab === 'Custom Pages'
    ? movePageSection(fromIndex, toIndex)
    : moveBuiltInSection(activeBuiltInPageKey, fromIndex, toIndex)
  const handlePreviewDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const sectionType = e.dataTransfer.getData('application/x-section-type')
    if (sectionType) {
      addActiveSection(sectionType)
      return
    }
    if (draggingSectionIndex !== null && activeSections.length > 0) {
      moveActiveSection(draggingSectionIndex, activeSections.length - 1)
      setDraggingSectionIndex(null)
    }
  }
  const selectedSectionIndex = activeSections.findIndex((section: any, index: number) => (section.id || String(index)) === editingSectionId)
  const selectedSection = selectedSectionIndex >= 0 ? activeSections[selectedSectionIndex] : null
  const selectedSectionRaw = selectedSectionIndex >= 0 ? activeSectionsRaw[selectedSectionIndex] : null
  const saveActivePage = () => activeTab === 'Custom Pages' ? saveCustomPageEdits() : saveBuiltInPageEdits()
  const editorGridColumns = `minmax(0, 1fr) ${sectionsPanelOpen ? '23rem' : '3.25rem'}`
  const activePageSnapshot = useMemo(() => JSON.stringify(activeTab === 'Custom Pages' ? pageDraft : getActivePayload(settings, activeTab)), [activeTab, pageDraft, settings])
  const autosaveStorageKey = useMemo(() => getAutosaveStorageKey(activeTab, selectedPageId), [activeTab, selectedPageId])
  const hasUnsavedChanges = Boolean(savedSnapshot) && savedSnapshot !== activePageSnapshot
  const starterTemplates = useMemo(() => (settings.reusableSections || []).filter((template: any) => template.kind === 'layout' || Array.isArray(template.sections)), [settings.reusableSections])
  const starterDemos = useMemo(() => siteDemos.filter((demo: any) => demoStarterSections[demo.slug]), [siteDemos])
  const applySnapshot = (snapshot: string) => {
    const parsed = JSON.parse(snapshot)
    if (activeTab === 'Custom Pages') {
      setPageDraft(parsed)
    } else {
      setSettings(prev => ({ ...prev, ...parsed }))
    }
  }
  const recordHistory = () => {
    setUndoStack(current => current[current.length - 1] === activePageSnapshot ? current : [...current.slice(-24), activePageSnapshot])
    setRedoStack([])
  }
  const undoPageChange = () => {
    setUndoStack(current => {
      if (current.length === 0) return current
      const previous = current[current.length - 1]
      setRedoStack(redo => [activePageSnapshot, ...redo.slice(0, 24)])
      applySnapshot(previous)
      return current.slice(0, -1)
    })
  }
  const redoPageChange = () => {
    setRedoStack(current => {
      if (current.length === 0) return current
      const next = current[0]
      setUndoStack(undo => [...undo.slice(-24), activePageSnapshot])
      applySnapshot(next)
      return current.slice(1)
    })
  }
  const saveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveCustomPageEdits()
  }

  useEffect(() => {
    if (!loading) {
      setSavedSnapshot(activePageSnapshot)
      lastAutosavedSnapshotRef.current = activePageSnapshot
      setUndoStack([])
      setRedoStack([])
    }
  }, [loading, activePageSnapshot, activeTab, selectedPageId])

  useEffect(() => {
    if (loading) return
    const autosaveEntry = loadAutosaveEntry(autosaveStorageKey)
    if (!autosaveEntry?.snapshot || autosaveEntry.snapshot === activePageSnapshot) {
      setDraftRecoveryPrompt((current) => current.key === autosaveStorageKey ? { open: false, key: '', label: '' } : current)
      return
    }

    setDraftRecoveryPrompt({
      open: true,
      key: autosaveStorageKey,
      label: activePageLabel,
      updatedAt: autosaveEntry.updatedAt,
      data: autosaveEntry.data
    })
  }, [activePageLabel, activePageSnapshot, autosaveStorageKey, loading])

  useEffect(() => {
    if (loading || !savedSnapshot || !hasUnsavedChanges) {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
      return
    }

    if (lastAutosavedSnapshotRef.current === activePageSnapshot) return

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      const payload = activeTab === 'Custom Pages' ? pageDraft : getActivePayload(settings, activeTab)
      saveAutosaveEntry(autosaveStorageKey, {
        snapshot: activePageSnapshot,
        updatedAt: new Date().toISOString(),
        label: activePageLabel,
        type: activeTab === 'Custom Pages' ? 'custom' : 'built-in',
        data: payload
      })
      lastAutosavedSnapshotRef.current = activePageSnapshot
      setAutosaveMessage(`Draft autosaved at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`)
    }, PAGE_AUTOSAVE_DELAY)

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
    }
  }, [activePageLabel, activePageSnapshot, activeTab, autosaveStorageKey, hasUnsavedChanges, loading, pageDraft, savedSnapshot, settings])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges || unsavedPrompt.open) return
      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (!href || href.startsWith('#') || link.target === '_blank') return
      const nextUrl = new URL(link.href)
      if (nextUrl.origin !== window.location.origin) return
      const currentPath = `${location.pathname}${location.search}`
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`
      if (currentPath === nextPath) return
      event.preventDefault()
      event.stopPropagation()
      setUnsavedPrompt({ open: true, href: nextPath })
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [hasUnsavedChanges, location.pathname, location.search, unsavedPrompt.open])

  const closeUnsavedPrompt = () => setUnsavedPrompt({ open: false })
  const dismissDraftRecoveryPrompt = () => {
    clearAutosaveEntry(autosaveStorageKey)
    lastAutosavedSnapshotRef.current = activePageSnapshot
    setDraftRecoveryPrompt({ open: false, key: '', label: '' })
    setAutosaveMessage('')
  }
  const restoreDraftRecovery = () => {
    if (!draftRecoveryPrompt.data) return
    if (activeTab === 'Custom Pages') {
      setPageDraft(draftRecoveryPrompt.data)
    } else {
      setSettings((prev) => ({ ...prev, ...draftRecoveryPrompt.data }))
    }
    setDraftRecoveryPrompt({ open: false, key: '', label: '' })
    setMessage(`Recovered an autosaved draft for ${activePageLabel}.`)
  }

  const leaveWithUnsavedChanges = () => {
    const prompt = unsavedPrompt
    setSavedSnapshot(activePageSnapshot)
    setUnsavedPrompt({ open: false })
    if (prompt.href) navigate(prompt.href)
    prompt.action?.()
  }

  const saveFromUnsavedPrompt = async () => {
    await saveActivePage()
    const prompt = unsavedPrompt
    setUnsavedPrompt({ open: false })
    if (prompt.href) navigate(prompt.href)
    prompt.action?.()
  }

  const saveCustomPageEdits = async () => {
    try {
      setError('')
      setMessage('Saving page...')
      const savedPage = selectedPageId === 'new'
        ? await adminAPI.createPage(pageDraft)
        : await adminAPI.updatePage(selectedPageId, pageDraft)

      setPages(current => {
        const withoutSaved = current.filter(page => page.id !== savedPage.id)
        return [...withoutSaved, savedPage].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      })
      setSelectedPageId(String(savedPage.id))
      setPageDraft({ ...savedPage, showPageHeader: savedPage.showPageHeader !== false, previewToken: savedPage.previewToken || '' })
      setSavedSnapshot(JSON.stringify(savedPage))
      clearAutosaveEntry(getAutosaveStorageKey('Custom Pages', String(savedPage.id)))
      clearAutosaveEntry(getAutosaveStorageKey('Custom Pages', selectedPageId))
      lastAutosavedSnapshotRef.current = JSON.stringify(savedPage)
      setAutosaveMessage('')
      setUndoStack([])
      setRedoStack([])
      navigate(`/admin/pages?custom=${savedPage.id}`)
      window.dispatchEvent(new Event('admin-pages-refresh'))
      setMessage('Custom page saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save custom page')
    }
  }

  const deleteCustomPage = async () => {
    if (selectedPageId === 'new') return

      try {
        await adminAPI.deletePage(selectedPageId)
        clearAutosaveEntry(getAutosaveStorageKey('Custom Pages', selectedPageId))
        setAutosaveMessage('')
        setPages(current => current.filter(page => String(page.id) !== selectedPageId))
        startNewPage(true, false)
        window.dispatchEvent(new Event('admin-pages-refresh'))
        setMessage('Custom page deleted')
      } catch (err: any) {
      setError(err.error || 'Failed to delete custom page')
    }
  }

  const buildPrivatePreviewUrl = (token?: string) => {
    if (!token || typeof window === 'undefined') return ''
    return `${window.location.origin}/preview/page/${token}`
  }

  const syncSavedPage = (savedPage: any) => {
    if (!savedPage) return savedPage
    setPages(current => current.map(page => String(page.id) === String(savedPage.id) ? savedPage : page))
    setPageDraft((current: any) => ({
      ...current,
      ...savedPage,
      showPageHeader: savedPage.showPageHeader !== false,
      previewToken: savedPage.previewToken || current.previewToken || '',
      sections: Array.isArray(savedPage.sections) ? savedPage.sections : current.sections || []
    }))
    return savedPage
  }

  const ensurePrivatePreviewLink = async () => {
    if (selectedPageId === 'new') return null
    if (pageDraft.previewToken) return pageDraft
    const savedPage = await adminAPI.ensurePagePreviewLink(selectedPageId)
    return syncSavedPage(savedPage)
  }

  const copyPrivatePreviewLink = async () => {
    if (selectedPageId === 'new') {
      setError('Save the page first, then we can generate a private preview link.')
      return
    }
    try {
      setError('')
      const savedPage = await ensurePrivatePreviewLink()
      const previewUrl = buildPrivatePreviewUrl(savedPage?.previewToken || pageDraft.previewToken)
      if (!previewUrl) throw new Error('Preview link is not ready yet.')
      await navigator.clipboard.writeText(previewUrl)
      setMessage('Private preview link copied')
    } catch (err: any) {
      setError(err.error || err.message || 'Failed to copy preview link')
    }
  }

  const regeneratePrivatePreviewLink = async () => {
    if (selectedPageId === 'new') {
      setError('Save the page first, then regenerate its private preview link.')
      return
    }
    try {
      setError('')
      const savedPage = await adminAPI.regeneratePagePreviewLink(selectedPageId)
      syncSavedPage(savedPage)
      const previewUrl = buildPrivatePreviewUrl(savedPage.previewToken)
      if (previewUrl) await navigator.clipboard.writeText(previewUrl)
      setMessage('Private preview link regenerated and copied')
    } catch (err: any) {
      setError(err.error || 'Failed to regenerate preview link')
    }
  }

  const pageSettingsEditor = activeTab === 'Custom Pages' ? (
    <CustomPageSettingsEditor
      pageDraft={pageDraft}
      updatePageDraft={updatePageDraft}
      selectedPageId={selectedPageId}
      previewUrl={buildPrivatePreviewUrl(pageDraft.previewToken)}
      copyPreviewLink={copyPrivatePreviewLink}
      regeneratePreviewLink={regeneratePrivatePreviewLink}
    />
  ) : activeBuiltInPageKey ? (
    <PageMetadataEditor
      page={activeBuiltInPageKey}
      fallback={publicPages.find(page => page.id === activeBuiltInPageKey)}
      metadata={settings.pageMetadata?.[activeBuiltInPageKey] || {}}
      legacyHeader={settings.pageHeaders?.[activeBuiltInPageKey] || {}}
      updatePageMetadata={updatePageMetadata}
      updatePageHeader={updatePageHeader}
    />
  ) : null

  return (
    <AdminLayout title="Website Pages">
      {message && <div className="mx-2 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mx-4 md:mb-6">{message}</div>}
      {autosaveMessage && !message && <div className="mx-2 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 md:mx-4 md:mb-6">{autosaveMessage}</div>}
      {error && <div className="mx-2 mb-4 rounded-lg border border-red-400 bg-red-100 p-4 text-sm text-red-700 md:mx-4 md:mb-6">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 items-start gap-3 transition-all duration-300 xl:grid-cols-[var(--editor-grid)]" style={{ '--editor-grid': editorGridColumns } as any}>
          <div className="space-y-4 px-1 md:space-y-6">
            <section className="z-20 rounded-lg border bg-white p-3 shadow-sm xl:sticky xl:top-0 xl:p-4">
              <SectionBlockLibrary
                addSection={addActiveSection}
                reusableSections={settings.reusableSections || []}
                addReusableSection={addReusableSection}
                saveSelectedSectionAsTemplate={saveSelectedSectionAsTemplate}
                saveSelectedSectionAsSyncedBlock={saveSelectedSectionAsSyncedBlock}
                saveCurrentPageAsTemplate={saveCurrentPageAsTemplate}
                deleteReusableSection={deleteReusableSection}
                hasSelectedSection={Boolean(selectedSection)}
                hasSections={activeSectionsRaw.length > 0}
              />
            </section>

          {activeTab === 'Custom Pages' ? (
            <section className="block">
              <div className="hidden">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sections</h3>
                  <p className="text-sm text-gray-600">Add, drag, and jump to sections.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sectionTypeOptions.map(option => (
                    <button key={option.value} type="button" onClick={() => addPageSection(option.value)} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">{option.label}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  {(pageDraft.sections || []).map((section: any, index: number) => (
                    <div
                      key={section.id || index}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingSectionIndex !== null) movePageSection(draggingSectionIndex, index)
                        setDraggingSectionIndex(null)
                      }}
                      className={`rounded-lg border bg-white p-2 transition duration-200 ${draggingSectionIndex === index ? 'scale-[0.98] opacity-60 shadow-lg ring-2 ring-blue-500' : editingSectionId === section.id ? 'ring-2 ring-blue-500' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                    >
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => {
                          setEditingSectionId(section.id || String(index))
                          document.getElementById(`page-section-${section.id || index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }} className="min-w-0 flex-1 text-left">
                          <span className="block truncate font-semibold text-gray-900">{getSectionTitle(section, index)}</span>
                          <span className="block text-xs text-gray-500">#{index + 1}</span>
                        </button>
                        <button type="button" onClick={() => movePageSection(index, index - 1)} disabled={index === 0} className="inline-flex h-8 w-8 items-center justify-center rounded border text-gray-700 disabled:opacity-40" title="Move up" aria-label="Move section up"><FiArrowUp /></button>
                        <button type="button" onClick={() => movePageSection(index, index + 1)} disabled={index === (pageDraft.sections || []).length - 1} className="inline-flex h-8 w-8 items-center justify-center rounded border text-gray-700 disabled:opacity-40" title="Move down" aria-label="Move section down"><FiArrowDown /></button>
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            setDraggingSectionIndex(index)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDraggingSectionIndex(null)}
                          className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded border text-gray-700 active:cursor-grabbing"
                          title="Drag to reorder"
                          aria-label="Drag section to reorder"
                        >
                          <FiMove />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={saveCustomPage} className="card p-6 space-y-6">
                <div className="hidden">
                  <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
                  <p className="text-gray-600">Set the page basics before arranging the live preview.</p>
                </div>
                <div className="hidden grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Page title" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', normalizeCustomSlug(e.target.value))} placeholder="page-url" className="px-4 py-2 border rounded-lg" required />
                  <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Header title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="Sort order" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Header subtitle" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input value={pageDraft.metaTitle || ''} onChange={(e) => updatePageDraft('metaTitle', e.target.value)} placeholder="SEO title" className="px-4 py-2 border rounded-lg" />
                  <input value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="SEO description" className="px-4 py-2 border rounded-lg" />
                  <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Fallback page content" rows={5} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <div className="hidden">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Page Sections</h3>
                    <p className="text-gray-600">Use the section navigation to add, reorder, and jump between sections.</p>
                  </div>
                  <div className="space-y-3">
                    {(pageDraft.sections || []).map((section: any, index: number) => (
                      <div
                        key={section.id || index}
                        id={`page-section-${section.id || index}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggingSectionIndex !== null) movePageSection(draggingSectionIndex, index)
                          setDraggingSectionIndex(null)
                        }}
                        onClick={() => setEditingSectionId(section.id || String(index))}
                        className={`rounded-lg border bg-gray-50 p-4 transition duration-200 ${draggingSectionIndex === index ? 'scale-[0.98] opacity-60 shadow-xl ring-2 ring-blue-500' : editingSectionId === section.id ? 'ring-2 ring-blue-500' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select value={section.type || 'paragraph'} onChange={(e) => updatePageSection(index, 'type', e.target.value)} className="px-4 py-2 border rounded-lg">
                              {sectionTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => movePageSection(index, index - 1)}
                              disabled={index === 0}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 hover:bg-white disabled:opacity-40"
                              aria-label="Move section up"
                              title="Move up"
                            >
                              <FiArrowUp />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePageSection(index, index + 1)}
                              disabled={index === (pageDraft.sections || []).length - 1}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 hover:bg-white disabled:opacity-40"
                              aria-label="Move section down"
                              title="Move down"
                            >
                              <FiArrowDown />
                            </button>
                            <button
                              type="button"
                              onClick={() => removePageSection(index)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-red-600 hover:bg-red-50"
                              aria-label="Remove section"
                              title="Remove section"
                            >
                              <FiTrash2 />
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingSectionIndex(index)
                                e.dataTransfer.effectAllowed = 'move'
                              }}
                              onDragEnd={() => setDraggingSectionIndex(null)}
                              className="inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-lg border bg-white text-gray-700 active:cursor-grabbing"
                              aria-label="Drag section to reorder"
                              title="Drag to reorder"
                            >
                              <FiMove />
                            </button>
                          </div>
                        </div>

                        <SectionSpacingControls section={section} index={index} updateSection={updatePageSection} />

                        {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay' || section.type === 'button') && (
                          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {section.type !== 'button' && <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Heading" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            {section.type !== 'button' && <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Text" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            <input value={section.buttonLabel || ''} onChange={(e) => updatePageSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
                            <input value={section.buttonUrl || ''} onChange={(e) => updatePageSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
                            {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updatePageSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />}
                            {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updatePageSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />}
                            {section.type !== 'cta' && section.type !== 'button' && <input value={section.imageUrl || ''} onChange={(e) => updatePageSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            {section.type !== 'cta' && section.type !== 'button' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url) => updatePageSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            {section.imageUrl && section.type !== 'cta' && section.type !== 'button' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
                          </div>
                        )}

                        {(section.type === 'header' || section.type === 'section' || section.type === 'services') && (
                          <div className="mb-3 space-y-3">
                            <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
                            {section.type === 'header' && (
                              <select value={section.headingTag || 'h2'} onChange={(e) => updatePageSection(index, 'headingTag', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                                <option value="h1">H1</option>
                                <option value="h2">H2</option>
                                <option value="h3">H3</option>
                                <option value="h4">H4</option>
                                <option value="h5">H5</option>
                                <option value="h6">H6</option>
                              </select>
                            )}
                          </div>
                        )}

                        {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services') && (
                          <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Text content" rows={4} className="mb-3 w-full px-4 py-2 border rounded-lg" />
                        )}

                        {section.type === 'portfolio' && (
                          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updatePageSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                            <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updatePageSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="px-4 py-2 border rounded-lg" />
                          </div>
                        )}

                        {section.type === 'gallery' && (
                          <>
                            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                              <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Gallery title" className="px-4 py-2 border rounded-lg" />
                              <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updatePageSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                              <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Gallery description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                            </div>
                            <SectionItemsEditor section={section} index={index} updateSection={updatePageSection} uploadImageToField={uploadImageToField} />
                          </>
                        )}

                        {section.type === 'services' && (
                          <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updatePageSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="mb-3 w-full px-4 py-2 border rounded-lg" />
                        )}

                        {section.type === 'siteDemos' && (
                          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
                            <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updatePageSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                            <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Section description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                            <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updatePageSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Demos to show" className="px-4 py-2 border rounded-lg md:col-span-2" />
                          </div>
                        )}

                        {(section.type === 'image' || section.type === 'section') && (
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input value={section.imageUrl || ''} onChange={(e) => updatePageSection(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
                            <input value={section.alt || ''} onChange={(e) => updatePageSection(index, 'alt', e.target.value)} placeholder="Alt text" className="px-4 py-2 border rounded-lg" />
                            <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url) => updatePageSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />
                            {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || 'Section image'} className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
                          </div>
                        )}

                        {section.type === 'plugin' && (
                          <div className="grid grid-cols-1 gap-3">
                            <select value={section.pluginSlug || 'restaurant'} onChange={(e) => updatePageSection(index, 'pluginSlug', e.target.value)} className="px-4 py-2 border rounded-lg">
                              {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <PagePreviewPanel
                  title={activePageLabel}
                  sections={activeSections}
                  draggingSectionIndex={draggingSectionIndex}
                  setDraggingSectionIndex={setDraggingSectionIndex}
                  moveSection={moveActiveSection}
                  setEditingSectionId={setEditingSectionId}
                  clearSelection={() => setEditingSectionId('')}
                  highlightedSectionId={highlightedSectionId}
                  previewMode={previewMode}
                  setPreviewMode={setPreviewMode}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  undoPageChange={undoPageChange}
                  redoPageChange={redoPageChange}
                  onDrop={handlePreviewDrop}
                  emptyText={pageDraft.content || 'Drag a section from the right panel into the preview.'}
                  insights={pageInsights}
                  selectedSectionId={editingSectionId}
                  updateSelectedSection={(field: string, value: any) => selectedSectionIndex >= 0 && updateActiveSection(selectedSectionIndex, field, value)}
                  openSectionSettings={() => setSectionsPanelOpen(true)}
                />
              </form>
            </section>
          ) : (
            <form onSubmit={saveSettingsTab} className="space-y-6">
              <div className="card p-6 space-y-6">
                <div className="hidden">
                  <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
                  <p className="text-gray-600">Manage page titles, URLs, headers, and SEO fields.</p>
                </div>
                {false && activeBuiltInPageKey && (
                  <PageMetadataEditor
                    page={activeBuiltInPageKey}
                    fallback={publicPages.find(page => page.id === activeBuiltInPageKey)}
                    metadata={settings.pageMetadata?.[activeBuiltInPageKey] || {}}
                    legacyHeader={settings.pageHeaders?.[activeBuiltInPageKey] || {}}
                    updatePageMetadata={updatePageMetadata}
                    updatePageHeader={updatePageHeader}
                  />
                )}

                {false && activeTab === 'home' && (
                  <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.heroTitle || ''} onChange={(e) => handleChange('heroTitle', e.target.value)} placeholder="Homepage headline" className="px-4 py-2 border rounded-lg md:col-span-2" />
                      <textarea value={settings.heroSubtitle || ''} onChange={(e) => handleChange('heroSubtitle', e.target.value)} placeholder="Homepage description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                      <input value={settings.heroPrimaryLabel || ''} onChange={(e) => handleChange('heroPrimaryLabel', e.target.value)} placeholder="Primary button label" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroPrimaryUrl || ''} onChange={(e) => handleChange('heroPrimaryUrl', e.target.value)} placeholder="Primary button URL" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroSecondaryLabel || ''} onChange={(e) => handleChange('heroSecondaryLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.heroSecondaryUrl || ''} onChange={(e) => handleChange('heroSecondaryUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />
                      <select value={settings.heroMediaType || 'none'} onChange={(e) => handleChange('heroMediaType', e.target.value)} className="px-4 py-2 border rounded-lg">
                        <option value="none">No media</option>
                        <option value="image">Image banner</option>
                        <option value="video">Video banner</option>
                      </select>
                      <input value={settings.heroMediaUrl || ''} onChange={(e) => handleChange('heroMediaUrl', e.target.value)} placeholder="Image or video URL" className="px-4 py-2 border rounded-lg" />
                      <label className="block md:col-span-2">
                        <span className="block text-sm font-semibold text-gray-700 mb-2">Upload banner image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadImageToField((url) => {
                            handleChange('heroMediaUrl', url)
                            handleChange('heroMediaType', 'image')
                          }, e.target.files?.[0])}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </label>
                      {settings.heroMediaUrl && (
                        <img
                          src={resolveAssetUrl(settings.heroMediaUrl)}
                          alt="Homepage banner preview"
                          className="h-48 w-full rounded-lg border object-cover md:col-span-2"
                        />
                      )}
                    </div>
                    <section className="rounded-lg border p-4">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">What We Do Header</h3>
                          <p className="text-gray-600">Editable heading for the image and name cards section.</p>
                        </div>
                        <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                          <input type="checkbox" checked={settings.whatWeDoEnabled !== false} onChange={(e) => handleChange('whatWeDoEnabled', e.target.checked)} />
                          Show section
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input value={settings.whatWeDoHeader?.title || ''} onChange={(e) => handleChange('whatWeDoHeader', { ...(settings.whatWeDoHeader || {}), title: e.target.value })} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
                        <input value={settings.whatWeDoHeader?.subtitle || ''} onChange={(e) => handleChange('whatWeDoHeader', { ...(settings.whatWeDoHeader || {}), subtitle: e.target.value })} placeholder="Section subtitle" className="px-4 py-2 border rounded-lg" />
                      </div>
                    </section>
                    <ListEditor title="Image and Name Cards" listKey="whatWeDo" items={settings.whatWeDo} fields={['title', 'desc', 'image']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                    <ListEditor title="Featured Work" listKey="featuredWork" items={settings.featuredWork} fields={['title', 'category', 'image', 'description']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}

                {false && ['portfolio', 'plugins', 'contact'].includes(activeTab) && (
                  <section className="space-y-4">
                    {activeTab === 'portfolio' && (
                      <SimpleCollectionEditor
                        title="Portfolio Items"
                        items={portfolioItems}
                        fields={['title', 'category', 'image', 'description', 'projectUrl', 'sortOrder']}
                        emptyItem={{ title: '', category: 'web-design', image: '', description: '', projectUrl: '', sortOrder: 0, isPublished: true }}
                        onCreate={async (item: any) => {
                          await adminAPI.createPortfolioItem({ ...item, sortOrder: Number(item.sortOrder || 0) })
                          setPortfolioItems(await adminAPI.getPortfolioItems())
                        }}
                        onUpdate={async (item: any) => {
                          await adminAPI.updatePortfolioItem(String(item.id), { ...item, sortOrder: Number(item.sortOrder || 0) })
                          setPortfolioItems(await adminAPI.getPortfolioItems())
                        }}
                        onDelete={async (item: any) => {
                          await adminAPI.deletePortfolioItem(String(item.id))
                          setPortfolioItems(await adminAPI.getPortfolioItems())
                        }}
                        uploadImageToField={uploadImageToField}
                      />
                    )}
                  </section>
                )}

                {false && activeTab === 'services' && (
                  <section className="space-y-6">
                    <ListEditor title="Services Sections" listKey="services" items={settings.services} fields={['title', 'description', 'features', 'url', 'image']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}
                {false && activeTab === 'pricing' && (
                  <section className="space-y-6">
                    <ListEditor title="Web Design Packages" listKey="webDesignPackages" items={settings.webDesignPackages} fields={['name', 'description', 'price', 'billingPeriod', 'features']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                    <SimpleCollectionEditor
                      title="A La Carte Services"
                      items={servicePackages}
                      fields={['service', 'description', 'price', 'unit', 'sortOrder']}
                      emptyItem={{ service: '', description: '', price: '', unit: 'project', sortOrder: 0, isActive: true }}
                      onCreate={async (item: any) => {
                        await adminAPI.createServicePackage({ ...item, price: Number(item.price || 0), sortOrder: Number(item.sortOrder || 0) })
                        setServicePackages(await adminAPI.getServicePackages())
                      }}
                      onUpdate={async (item: any) => {
                        await adminAPI.updateServicePackage(String(item.id), { ...item, price: Number(item.price || 0), sortOrder: Number(item.sortOrder || 0) })
                        setServicePackages(await adminAPI.getServicePackages())
                      }}
                      onDelete={async (item: any) => {
                        await adminAPI.deleteServicePackage(String(item.id))
                        setServicePackages(await adminAPI.getServicePackages())
                      }}
                      uploadImageToField={uploadImageToField}
                    />
                    <ListEditor title="FAQ" listKey="faqs" items={settings.faqs} fields={['q', 'a']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}
                {false && activeBuiltInPageKey && (
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">Testimonials Section Sources</h3>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={settings.googleReviewsEnabled} onChange={(e) => handleChange('googleReviewsEnabled', e.target.checked)} />
                      Pull testimonials from Google Reviews
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={settings.googlePlaceId || ''} onChange={(e) => handleChange('googlePlaceId', e.target.value)} placeholder="Google Place ID" className="px-4 py-2 border rounded-lg" />
                      <input value={settings.googleApiKey || ''} onChange={(e) => handleChange('googleApiKey', e.target.value)} placeholder="Google API Key" className="px-4 py-2 border rounded-lg" />
                    </div>
                    <ListEditor title="Manual Testimonials" listKey="testimonials" items={settings.testimonials} fields={['name', 'company', 'role', 'image', 'text']} updateListItem={updateListItem} addListItem={addListItem} removeListItem={removeListItem} uploadImageToField={uploadImageToField} />
                  </section>
                )}
                {false && activeBuiltInPageKey && (
                  <PageSectionEditor
                    title={`${activeBuiltInPageKey === 'home' ? 'Homepage' : pageHeaderLabels[activeBuiltInPageKey] || 'Page'} Additional Sections`}
                    sections={getBuiltInSections(activeBuiltInPageKey)}
                    editingSectionId={editingSectionId}
                    draggingSectionIndex={draggingSectionIndex}
                    setEditingSectionId={setEditingSectionId}
                    setDraggingSectionIndex={setDraggingSectionIndex}
                    addSection={(type: string) => addBuiltInSection(activeBuiltInPageKey, type)}
                    updateSection={(index: number, field: string, value: any) => updateBuiltInSection(activeBuiltInPageKey, index, field, value)}
                    removeSection={(index: number) => removeBuiltInSection(activeBuiltInPageKey, index)}
                    moveSection={(fromIndex: number, toIndex: number) => moveBuiltInSection(activeBuiltInPageKey, fromIndex, toIndex)}
                    uploadImageToField={uploadImageToField}
                  />
                )}
                {activeBuiltInPageKey && (
                  <PagePreviewPanel
                    title={activePageLabel}
                    sections={activeSections}
                    draggingSectionIndex={draggingSectionIndex}
                    setDraggingSectionIndex={setDraggingSectionIndex}
                    moveSection={moveActiveSection}
                    setEditingSectionId={setEditingSectionId}
                    clearSelection={() => setEditingSectionId('')}
                    highlightedSectionId={highlightedSectionId}
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                    canUndo={undoStack.length > 0}
                    canRedo={redoStack.length > 0}
                    undoPageChange={undoPageChange}
                  redoPageChange={redoPageChange}
                  onDrop={handlePreviewDrop}
                  emptyText="Drag a section from the right panel into the preview."
                  insights={pageInsights}
                  selectedSectionId={editingSectionId}
                  updateSelectedSection={(field: string, value: any) => selectedSectionIndex >= 0 && updateActiveSection(selectedSectionIndex, field, value)}
                  openSectionSettings={() => setSectionsPanelOpen(true)}
                />
                )}
              </div>
            </form>
          )}
          </div>

          <aside className={`overflow-hidden rounded-xl border bg-white shadow transition-all duration-300 ease-in-out md:max-h-[70vh] xl:sticky xl:top-4 xl:h-[calc(100vh-12rem)] xl:max-h-none xl:rounded-none xl:border-r-0 ${sectionsPanelOpen ? 'opacity-100' : 'opacity-95'}`}>
            {selectedSection ? (
              <SectionInspector
                title="Section Settings"
                section={selectedSection}
                rawSection={selectedSectionRaw}
                index={selectedSectionIndex}
                updateSection={updateActiveSection}
                removeSection={removeActiveSection}
                duplicateSection={duplicateActiveSection}
                uploadImageToField={uploadImageToField}
                openMediaPicker={openMediaPicker}
                isOpen={sectionsPanelOpen}
                setIsOpen={setSectionsPanelOpen}
              />
            ) : (
              <PageSettingsInspector
                title="General Settings"
                editor={pageSettingsEditor}
                isOpen={sectionsPanelOpen}
                setIsOpen={setSectionsPanelOpen}
              />
            )}
          </aside>
        </div>
      )}
      {mediaPicker.open && (
        <Suspense fallback={null}>
          <MediaPicker
            isOpen={mediaPicker.open}
            type={mediaPicker.type}
            onClose={() => setMediaPicker({ open: false, type: 'image', onSelect: null })}
            onSelect={(url) => {
              mediaPicker.onSelect?.(url)
              setMessage('Media selected. Save to publish it.')
            }}
          />
        </Suspense>
      )}
        <FloatingPageActions
          isCustomPage={activeTab === 'Custom Pages'}
          isSavedCustomPage={activeTab === 'Custom Pages' && selectedPageId !== 'new'}
          isPublished={Boolean(pageDraft.isPublished)}
          updatePublished={(value: boolean) => updatePageDraft('isPublished', value)}
          savePage={saveActivePage}
          deletePage={() => setDeletePromptOpen(true)}
        />
        {newPageTemplatePromptOpen && activeTab === 'Custom Pages' && selectedPageId === 'new' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="border-b px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Start with a template?</h2>
                    <p className="mt-1 text-sm text-gray-600">Choose a reusable layout, start from one of your demo sites, or jump in with a blank page.</p>
                  </div>
                  <button type="button" onClick={() => setNewPageTemplatePromptOpen(false)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    Start Blank
                  </button>
                </div>
              </div>
              <div className="grid max-h-[calc(85vh-5.5rem)] grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-2">
                <section className="border-b p-6 lg:border-b-0 lg:border-r">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Reusable Layouts</h3>
                      <p className="text-sm text-gray-600">Saved layouts from pages you've already built.</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{starterTemplates.length}</span>
                  </div>
                  <div className="space-y-3">
                    {starterTemplates.length > 0 ? starterTemplates.map((template: any) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplateToNewPage(template)}
                        className="w-full rounded-xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {(template.sectionCount || template.sections?.length || 1)} section{Number(template.sectionCount || template.sections?.length || 1) === 1 ? '' : 's'}
                              {template.sourcePage ? ` from ${template.sourcePage}` : ''}
                            </p>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            {template.kind === 'layout' ? 'Layout' : 'Template'}
                          </span>
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-dashed p-5 text-sm text-gray-600">
                        No reusable layouts yet. Save a page layout first and it will show up here.
                      </div>
                    )}
                  </div>
                </section>
                <section className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Demo Site Starters</h3>
                      <p className="text-sm text-gray-600">Use your demo site structures as a fast starting point.</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{starterDemos.length}</span>
                  </div>
                  <div className="space-y-3">
                    {starterDemos.length > 0 ? starterDemos.map((demo: any) => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => applyDemoStarterToNewPage(demo)}
                        className="w-full rounded-xl border p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{demo.name}</h4>
                            <p className="mt-1 text-sm text-gray-600">{demo.description || 'Use this demo as the structural starting point for your new page.'}</p>
                          </div>
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            Demo
                          </span>
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-dashed p-5 text-sm text-gray-600">
                        No demo starters are available yet. Activate or create site demos to use them here.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
        {deletePromptOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Delete this page?</h2>
            <p className="mt-3 text-gray-600">This will permanently remove the current custom page and its sections.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={async () => { setDeletePromptOpen(false); await deleteCustomPage() }} className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700">
                Delete page
              </button>
              <button type="button" onClick={() => setDeletePromptOpen(false)} className="inline-flex flex-1 items-center justify-center rounded-lg border px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {unsavedPrompt.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Unsaved changes</h2>
            <p className="mt-3 text-gray-600">You have unsaved page changes. Save before leaving, or leave anyway and discard them.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={saveFromUnsavedPrompt} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700">
                <FiSave />
                Save
              </button>
              <button type="button" onClick={leaveWithUnsavedChanges} className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700">
                Leave anyway
              </button>
              <button type="button" onClick={closeUnsavedPrompt} className="w-full rounded-lg border px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}
      {draftRecoveryPrompt.open && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Recover autosaved draft?</h2>
            <p className="mt-3 text-gray-600">
              We found a newer unsaved draft for <span className="font-semibold text-gray-900">{draftRecoveryPrompt.label}</span>
              {draftRecoveryPrompt.updatedAt ? ` from ${new Date(draftRecoveryPrompt.updatedAt).toLocaleString()}` : ''}.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Restore it to continue where you left off, or discard it and keep the last saved version.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={restoreDraftRecovery} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700">
                <FiRotateCcw />
                Restore draft
              </button>
              <button type="button" onClick={dismissDraftRecoveryPrompt} className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700">
                Discard draft
              </button>
              <button type="button" onClick={dismissDraftRecoveryPrompt} className="w-full rounded-lg border px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50">
                Keep saved version
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function FloatingPageActions({ isCustomPage, isSavedCustomPage, isPublished, updatePublished, savePage, deletePage }: any) {
  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-[90] lg:inset-x-auto lg:bottom-5 lg:right-5">
      <div className="ml-auto flex max-w-xl flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-2 shadow-2xl backdrop-blur md:gap-3 md:p-3">
        {isCustomPage && (
          <label className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-semibold text-gray-700 md:px-3 md:text-sm">
            <input type="checkbox" checked={Boolean(isPublished)} onChange={(e) => updatePublished(e.target.checked)} />
            Published
          </label>
        )}
        {isSavedCustomPage && (
          <button type="button" onClick={deletePage} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 lg:flex-none lg:py-3">
            <FiTrash2 />
            <span className="hidden sm:inline">Delete Page</span>
            <span className="sm:hidden">Delete</span>
          </button>
        )}
        <button type="button" onClick={savePage} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 lg:flex-none lg:py-3">
          <FiSave />
          <span className="hidden sm:inline">Save Page</span>
          <span className="sm:hidden">Save</span>
        </button>
      </div>
    </div>
  )
}

function PageScoreCard({ insights }: any) {
  const [displayOverall, setDisplayOverall] = useState(0)
  const [displaySeo, setDisplaySeo] = useState(0)
  const [displayMobile, setDisplayMobile] = useState(0)
  const [displaySpeed, setDisplaySpeed] = useState(0)
  const scoreTone = (value: number) => value >= 85 ? 'text-green-700 bg-green-100 ring-green-200' : value >= 65 ? 'text-orange-700 bg-orange-100 ring-orange-200' : 'text-red-700 bg-red-100 ring-red-200'
  const facts = insights?.facts || {}
  const diagnostics = insights?.diagnostics || { seo: [], mobile: [], speed: [] }
  const issueSectionCount = Object.keys(insights?.sectionIssueCounts || {}).length

  useEffect(() => {
    const animateValue = (setter: (value: number) => void, target: number, duration = 520) => {
      const started = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - started) / duration, 1)
        setter(Math.round(target * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) window.requestAnimationFrame(tick)
      }
      window.requestAnimationFrame(tick)
    }

    animateValue(setDisplayOverall, Number(insights?.overall || 0))
    animateValue(setDisplaySeo, Number(insights?.seo || 0), 460)
    animateValue(setDisplayMobile, Number(insights?.mobile || 0), 500)
    animateValue(setDisplaySpeed, Number(insights?.speed || 0), 540)
  }, [insights?.overall, insights?.seo, insights?.mobile, insights?.speed])

  return (
    <div className="rounded-lg border bg-white p-3 md:p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black ring-2 ${scoreTone(displayOverall)}`}>
          {displayOverall}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-900">Page Score</h3>
            <p className="text-xs text-gray-500">Live while editing</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ['SEO', displaySeo],
              ['Mobile', displayMobile],
              ['Speed', displaySpeed]
            ].map(([label, value]: any) => (
              <div key={label} className="rounded-lg bg-gray-50 px-2 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-0.5 text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <FactPill label="Words" value={facts.wordCount ?? 0} />
        <FactPill label="Images" value={facts.imageCount ?? 0} />
        <FactPill label="Missing Alt" value={facts.missingAltCount ?? 0} tone={(facts.missingAltCount || 0) === 0 ? 'good' : 'warn'} />
        <FactPill label="Bad Links" value={facts.brokenInternalLinks ?? 0} tone={(facts.brokenInternalLinks || 0) === 0 ? 'good' : 'bad'} />
        <FactPill label="Headings" value={facts.majorHeadingCount ?? 0} tone={(facts.majorHeadingCount || 0) <= 1 ? 'good' : 'warn'} />
        <FactPill label="Canonical" value={facts.canonicalVisible ? 'Ready' : 'Check'} tone={facts.canonicalVisible ? 'good' : 'warn'} />
      </div>
      <div className="mt-3 space-y-2">
        {issueSectionCount > 0 && (
          <p className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            {issueSectionCount} section{issueSectionCount === 1 ? '' : 's'} in the preview are highlighted for SEO follow-up.
          </p>
        )}
        {insights.suggestions.slice(0, 4).map((item: any, index: number) => (
          <div key={`${item.category}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{item.category}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {item.priority}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-700">{item.text}</p>
          </div>
        ))}
        {insights.suggestions.length === 0 && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">This page is in a solid place. Keep an eye on images and metadata as you publish updates.</p>}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-3">
        <DiagnosticList title="SEO Diagnostics" items={diagnostics.seo} />
        <DiagnosticList title="Mobile Diagnostics" items={diagnostics.mobile} />
        <DiagnosticList title="Speed Diagnostics" items={diagnostics.speed} />
      </div>
    </div>
  )
}

function FactPill({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const toneClass = tone === 'good'
    ? 'bg-green-50 text-green-700'
    : tone === 'warn'
      ? 'bg-orange-50 text-orange-700'
      : tone === 'bad'
        ? 'bg-red-50 text-red-700'
        : 'bg-gray-50 text-gray-700'

  return (
    <div className={`rounded-lg px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function DiagnosticList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-gray-700">
          {items.slice(0, 4).map((item, index) => (
            <li key={`${title}-${index}`} className="rounded bg-white px-2 py-1.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-gray-600">No issues flagged right now.</p>
      )}
    </div>
  )
}

const PreviewSectionContent = memo(function PreviewSectionContent({
  section,
  previewMode,
  isSelected,
  onTitleContentChange,
  onBodyContentChange
}: {
  section: any
  previewMode: 'desktop' | 'tablet' | 'mobile'
  isSelected?: boolean
  onTitleContentChange?: (html: string, text: string) => void
  onBodyContentChange?: (html: string, text: string) => void
}) {
  const previewSection = useMemo(() => {
    if (!isSelected) return section
    return {
      ...section,
      __liveEdit: {
        titleEditable: Boolean(onTitleContentChange && section?.title),
        onTitleChange: onTitleContentChange,
        bodyEditable: Boolean(onBodyContentChange && section?.body),
        onBodyChange: onBodyContentChange,
        syncFromDom: () => {
          if (onTitleContentChange && section?.title) {
            const headingEditor = document.getElementById(`editable-heading-${section.id}`) as HTMLSpanElement | null
            if (headingEditor) onTitleContentChange(headingEditor.innerHTML || '', extractPlainTextFromHtml(headingEditor.innerHTML || ''))
          }
          if (onBodyContentChange && section?.body) {
            const bodyEditor = document.getElementById(`editable-body-${section.id}`) as HTMLDivElement | null
            if (bodyEditor) onBodyContentChange(bodyEditor.innerHTML || '', extractPlainTextFromHtml(bodyEditor.innerHTML || ''))
          }
        }
      }
    }
  }, [section, isSelected, onTitleContentChange, onBodyContentChange])

  return (
    <Suspense fallback={<div className="min-h-[12rem] animate-pulse bg-gray-100" />}>
      <PageSections sections={[previewSection]} previewMode={previewMode} />
    </Suspense>
  )
})

function DeferredRichTextEditorField(props: any) {
  return (
    <Suspense fallback={<div className="min-h-[9rem] animate-pulse rounded-lg border border-blue-100 bg-blue-50/40" />}>
      <RichTextEditorField {...props} />
    </Suspense>
  )
}

function SeoTitleCounter({ value }: { value?: string }) {
  const length = String(value || '').trim().length
  const isHealthy = length >= 20 && length <= 60
  return (
    <div className={`text-xs font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
      {length}/60 characters
    </div>
  )
}

function SeoTitleField({ value, onChange, placeholder }: { value?: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 border rounded-lg" />
      <SeoTitleCounter value={value} />
    </div>
  )
}

function SectionPreviewToolbar({
  section,
  onUpdate,
  onSelectSectionSettings
}: {
  section: any
  onUpdate: (field: string, value: any) => void
  onSelectSectionSettings: () => void
}) {
  const savedRangeRef = useRef<Range | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [buttonShadowValue, setButtonShadowValue] = useState(section?.buttonBoxShadow || '')

  useEffect(() => {
    setLinkOpen(false)
    setLinkValue('')
    setButtonShadowValue(section?.buttonBoxShadow || '')
  }, [section?.id, section?.buttonBoxShadow])

  const supportsHeading = Boolean(section?.title) && !['button', 'paragraph', 'divider', 'contactForm', 'customForm'].includes(section?.type)
  const supportsVerticalAlign = ['hero', 'banner', 'imageOverlay', 'section'].includes(section?.type)
  const supportsInlineEditing = Boolean(section?.title || section?.body)
  const hasPrimaryButton = Boolean(section?.buttonLabel && section?.buttonUrl)

  const alignButtons = [
    { value: 'left', icon: FiAlignLeft, label: 'Align left' },
    { value: 'center', icon: FiAlignCenter, label: 'Align center' },
    { value: 'right', icon: FiAlignRight, label: 'Align right' }
  ]

  const verticalButtons = [
    { value: 'top', icon: FiArrowUp, label: 'Align top' },
    { value: 'center', icon: FiMove, label: 'Align middle' },
    { value: 'bottom', icon: FiArrowDown, label: 'Align bottom' }
  ]

  const buttonShadowPresets = [
    { label: 'None', value: '' },
    { label: 'Soft', value: '0 8px 18px rgba(15, 23, 42, 0.12)' },
    { label: 'Lift', value: '0 12px 24px rgba(15, 23, 42, 0.16)' },
    { label: 'Glow', value: '0 0 0 1px rgba(37, 99, 235, 0.08), 0 14px 30px rgba(37, 99, 235, 0.24)' }
  ]

  const getActiveEditableElement = () => {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!node) return null
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
    return element?.closest('[id^="editable-heading-"], [id^="editable-body-"]') as HTMLElement | null
  }

  const focusPreferredEditor = () => {
    const active = getActiveEditableElement()
    if (active) {
      active.focus()
      return active
    }
    const bodyEditor = document.getElementById(`editable-body-${section?.id}`) as HTMLElement | null
    if (bodyEditor) {
      bodyEditor.focus()
      return bodyEditor
    }
    const headingEditor = document.getElementById(`editable-heading-${section?.id}`) as HTMLElement | null
    headingEditor?.focus()
    return headingEditor
  }

  const saveCurrentSelection = () => {
    const editor = getActiveEditableElement() || focusPreferredEditor()
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return false
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return false
    savedRangeRef.current = range.cloneRange()
    return true
  }

  const restoreCurrentSelection = () => {
    const selection = window.getSelection()
    if (!selection || !savedRangeRef.current) return
    selection.removeAllRanges()
    selection.addRange(savedRangeRef.current)
  }

  const syncInlineEditors = () => {
    section?.__liveEdit?.syncFromDom?.()
  }

  const getActiveInlineLink = () => {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!node) return null
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement
    return element?.closest('a') || null
  }

  const applyInlineCommand = (command: string, commandValue?: string) => {
    const editor = focusPreferredEditor()
    if (!editor) return
    document.execCommand('styleWithCSS', false, command === 'foreColor' ? 'true' : 'false')
    document.execCommand(command, false, commandValue)
    window.setTimeout(syncInlineEditors, 0)
  }

  const openInlineLinkPopover = () => {
    const hasSelection = saveCurrentSelection()
    const activeLink = getActiveInlineLink()
    setLinkValue(activeLink?.getAttribute('href') || '')
    setLinkOpen(true)
    if (!hasSelection && !activeLink) focusPreferredEditor()
  }

  const applyInlineLink = () => {
    const editor = focusPreferredEditor()
    if (!editor) return
    restoreCurrentSelection()
    document.execCommand('styleWithCSS', false, 'false')
    if (linkValue.trim()) {
      document.execCommand('createLink', false, linkValue.trim())
    } else {
      document.execCommand('unlink')
    }
    window.setTimeout(() => {
      syncInlineEditors()
      setLinkOpen(false)
    }, 0)
  }

  return (
    <div
      className="absolute left-1/2 top-0 z-20 w-[min(calc(100%-1.5rem),52rem)] -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] rounded-xl border bg-white/96 p-2 shadow-2xl backdrop-blur"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
          {alignButtons.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('textAlign', value)}
              title={label}
              aria-label={label}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${section?.textAlign === value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-white'}`}
            >
              <Icon />
            </button>
          ))}
        </div>

        {supportsInlineEditing && (
          <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
            <button type="button" title="Bold" aria-label="Bold" onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineCommand('bold')} className="rounded-md px-2.5 py-2 text-sm font-bold text-gray-700 transition hover:bg-white">B</button>
            <button type="button" title="Italic" aria-label="Italic" onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineCommand('italic')} className="rounded-md px-2.5 py-2 text-sm italic text-gray-700 transition hover:bg-white">I</button>
            <button type="button" title="Underline" aria-label="Underline" onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineCommand('underline')} className="rounded-md px-2.5 py-2 text-sm underline text-gray-700 transition hover:bg-white">U</button>
            <button type="button" title="Add link" aria-label="Add link" onMouseDown={(event) => event.preventDefault()} onClick={openInlineLinkPopover} className="inline-flex items-center rounded-md px-2.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white">
              <FiLink />
            </button>
            <button type="button" title="Remove link" aria-label="Remove link" onMouseDown={(event) => event.preventDefault()} onClick={() => applyInlineCommand('unlink')} className="rounded-md px-2.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white">
              <FiLink className="opacity-50" />
            </button>
            <label className="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-white" title="Text color">
              <input type="color" onChange={(event) => applyInlineCommand('foreColor', event.target.value)} className="h-7 w-7 cursor-pointer rounded border p-0" />
            </label>
          </div>
        )}

        {supportsVerticalAlign && (
          <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
            {verticalButtons.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onUpdate('contentVerticalAlign', value)}
                title={label}
                aria-label={label}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition ${(section?.contentVerticalAlign || 'center') === value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-white'}`}
              >
                <Icon />
              </button>
            ))}
          </div>
        )}

        {supportsHeading && (
          <label className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2 py-1.5 text-sm font-semibold text-gray-700" title="Heading tag">
            <FiType className="text-gray-500" />
            <select
              value={section?.headingTag || (section?.type === 'hero' ? 'h1' : 'h2')}
              onChange={(event) => onUpdate('headingTag', event.target.value)}
              className="rounded-md border bg-white px-2 py-1 text-xs font-semibold text-gray-700"
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </select>
          </label>
        )}

        {hasPrimaryButton && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-gray-50 px-2 py-2">
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button text color">
              <input type="color" value={section?.buttonTextColor || '#ffffff'} onChange={(event) => onUpdate('buttonTextColor', event.target.value)} className="h-8 w-9 rounded border p-1" />
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button color">
              <input type="color" value={section?.buttonBackgroundColor || '#2563eb'} onChange={(event) => onUpdate('buttonBackgroundColor', event.target.value)} className="h-8 w-9 rounded border p-1" />
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button shadow">
              <select
                value={buttonShadowPresets.some((preset) => preset.value === buttonShadowValue) ? buttonShadowValue : '__custom__'}
                onChange={(event) => {
                  const nextValue = event.target.value === '__custom__' ? buttonShadowValue : event.target.value
                  setButtonShadowValue(nextValue)
                  onUpdate('buttonBoxShadow', nextValue)
                }}
                className="rounded-md border bg-white px-2 py-1 text-[11px] text-gray-700"
              >
                {buttonShadowPresets.map((preset) => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
                <option value="__custom__">Custom</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button effect">
              <select value={section?.buttonHoverEffect || 'lift'} onChange={(event) => onUpdate('buttonHoverEffect', event.target.value)} className="rounded-md border bg-white px-2 py-1 text-[11px] text-gray-700">
                <option value="none">None</option>
                <option value="lift">Lift</option>
                <option value="grow">Grow</option>
                <option value="glow">Glow</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button text shadow">
              <select value={section?.buttonTextShadow || ''} onChange={(event) => onUpdate('buttonTextShadow', event.target.value)} className="rounded-md border bg-white px-2 py-1 text-[11px] text-gray-700">
                <option value="">None</option>
                <option value="0 1px 2px rgba(15, 23, 42, 0.2)">Soft</option>
                <option value="0 2px 8px rgba(15, 23, 42, 0.3)">Glow</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Button radius">
              <FiSquare className="h-3.5 w-3.5" />
              <input type="range" min="0" max="40" value={Number(section?.buttonBorderRadius || 8)} onChange={(event) => onUpdate('buttonBorderRadius', event.target.value)} className="w-16 accent-blue-600" />
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Horizontal padding">
              <FiArrowLeft className="h-3.5 w-3.5" />
              <input type="range" min="8" max="40" value={Number(section?.buttonPaddingX || 24)} onChange={(event) => onUpdate('buttonPaddingX', event.target.value)} className="w-16 accent-blue-600" />
            </label>
            <label className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-700" title="Vertical padding">
              <FiArrowUp className="h-3.5 w-3.5" />
              <input type="range" min="6" max="28" value={Number(section?.buttonPaddingY || 12)} onChange={(event) => onUpdate('buttonPaddingY', event.target.value)} className="w-16 accent-blue-600" />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={onSelectSectionSettings}
          title="More controls"
          aria-label="More controls"
          className="ml-auto inline-flex items-center rounded-lg border px-2.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <FiFileText />
        </button>
      </div>
      {linkOpen && supportsInlineEditing && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-blue-50 p-3">
          <input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://example.com or /contact"
            className="min-w-[16rem] flex-1 rounded-md border bg-white px-3 py-2 text-sm text-gray-700"
          />
          <button type="button" onClick={applyInlineLink} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Apply</button>
          <button type="button" onClick={() => { setLinkValue(''); applyInlineLink() }} className="rounded-md border px-3 py-2 text-sm font-semibold text-gray-700">Remove</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="rounded-md border px-3 py-2 text-sm font-semibold text-gray-700">Close</button>
        </div>
      )}
    </div>
  )
}

function PagePreviewPanel({ title, sections, draggingSectionIndex, setDraggingSectionIndex, moveSection, setEditingSectionId, clearSelection, highlightedSectionId, previewMode, setPreviewMode, canUndo, canRedo, undoPageChange, redoPageChange, onDrop, emptyText, insights, selectedSectionId, updateSelectedSection, openSectionSettings }: any) {
  const previewModes = [
    { value: 'desktop', label: 'Desktop', icon: FiMonitor, width: 'w-full' },
    { value: 'tablet', label: 'Tablet', icon: FiTablet, width: 'max-w-[820px]' },
    { value: 'mobile', label: 'Mobile', icon: FiSmartphone, width: 'max-w-[390px]' }
  ]
  const activePreview = previewModes.find(mode => mode.value === previewMode) || previewModes[0]

  return (
    <section className="card space-y-4 p-4 md:space-y-6 md:p-6">
      <PageScoreCard insights={insights} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Live Preview</h2>
          <p className="text-sm text-gray-600 md:text-base">Drag section pieces here, reorder them in place, and click a section to edit it on the right.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <div className="flex w-full rounded-lg border bg-gray-50 p-1 sm:w-auto">
          {previewModes.map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPreviewMode(mode.value)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition sm:flex-none sm:text-sm ${previewMode === mode.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-white'}`}
              >
                <Icon />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            )
          })}
        </div>
          <div className="flex rounded-lg border bg-gray-50 p-1">
            <button type="button" onClick={undoPageChange} disabled={!canUndo} aria-label="Undo" title="Undo" className="rounded-md px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-white disabled:opacity-40">
              <FiRotateCcw size={18} />
            </button>
            <button type="button" onClick={redoPageChange} disabled={!canRedo} aria-label="Redo" title="Redo" className="rounded-md px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-white disabled:opacity-40">
              <FiRotateCw size={18} />
            </button>
          </div>
        </div>
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => clearSelection?.()}
        className="min-h-[26rem] overflow-auto rounded-lg border bg-gray-100 p-3 md:min-h-[calc(100vh-24rem)]"
      >
        <div className={`mx-auto min-h-[24rem] overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 md:min-h-[calc(100vh-26rem)] ${activePreview.width}`}>
        {(sections || []).length > 0 ? (
          <div>
            {(sections || []).map((section: any, index: number) => (
              (() => {
                const sectionKey = String(section.id || index)
                const seoIssueCount = Number(insights?.sectionIssueCounts?.[sectionKey] || 0)
                return (
              <div
                key={sectionKey}
                id={`preview-section-${section.id || index}`}
                draggable
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingSectionId(section.id || String(index))
                }}
                onDragStart={(e) => {
                  setDraggingSectionIndex(index)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggingSectionIndex !== null) moveSection(draggingSectionIndex, index)
                  setDraggingSectionIndex(null)
                }}
                onDragEnd={() => setDraggingSectionIndex(null)}
                className={`relative cursor-pointer transition ${draggingSectionIndex === index ? 'scale-[0.99] opacity-60 ring-2 ring-blue-500' : highlightedSectionId === sectionKey ? 'animate-pulse ring-4 ring-blue-500 ring-offset-2' : seoIssueCount > 0 ? 'ring-2 ring-orange-300 hover:ring-orange-400' : 'hover:ring-2 hover:ring-blue-300'}`}
                title={`Edit ${getSectionTitle(section, index)}`}
              >
                {selectedSectionId === sectionKey && (
                  <SectionPreviewToolbar
                    section={section}
                    onUpdate={(field, value) => updateSelectedSection?.(field, value)}
                    onSelectSectionSettings={() => openSectionSettings?.()}
                  />
                )}
                <div className="absolute left-3 top-3 z-10 rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white shadow">
                  {index + 1}
                </div>
                {seoIssueCount > 0 && (
                  <div className="absolute right-3 top-3 z-10 rounded bg-orange-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                    SEO {seoIssueCount}
                  </div>
                )}
                {section.isHidden ? (
                  <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    <FiEyeOff className="mx-auto mb-2" />
                    <p className="font-bold">{getSectionTitle(section, index)} is hidden</p>
                    <p className="text-sm">It will not appear on the live page until you show it again.</p>
                  </div>
                ) : (
                  <PreviewSectionContent
                    section={section}
                    previewMode={previewMode}
                    isSelected={selectedSectionId === sectionKey}
                    onTitleContentChange={(html: string, text: string) => {
                      updateSelectedSection?.('titleHtml', html)
                      updateSelectedSection?.('title', text)
                    }}
                    onBodyContentChange={(html: string) => {
                      updateSelectedSection?.('body', html)
                    }}
                  />
                )}
              </div>
                )
              })()
            ))}
          </div>
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center p-8 text-center text-gray-600 md:min-h-[calc(100vh-24rem)]">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="mt-2">{emptyText}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  )
}

function SectionBlockLibrary({ addSection, reusableSections = [], addReusableSection, saveSelectedSectionAsTemplate, saveSelectedSectionAsSyncedBlock, saveCurrentPageAsTemplate, deleteReusableSection, hasSelectedSection, hasSections }: any) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [sectionSearch, setSectionSearch] = useState('')
  const filteredSections = sectionTypeOptions.filter(option => option.label.toLowerCase().includes(sectionSearch.trim().toLowerCase()))
  const filteredTemplates = reusableSections.filter((template: any) => {
    const search = sectionSearch.trim().toLowerCase()
    if (!search) return true
    return String(template.name || '').toLowerCase().includes(search)
      || String(template.kind || '').toLowerCase().includes(search)
      || String(template.sourcePage || '').toLowerCase().includes(search)
  })
  const scrollSections = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -360 : 360, behavior: 'smooth' })
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sections</h2>
          <p className="text-sm text-gray-600">Drag into the preview or click to add.</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
          <button
            type="button"
            onClick={saveSelectedSectionAsTemplate}
            disabled={!hasSelectedSection}
            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Save Block
          </button>
          <button
            type="button"
            onClick={saveSelectedSectionAsSyncedBlock}
            disabled={!hasSelectedSection}
            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Save Synced
          </button>
          <button
            type="button"
            onClick={saveCurrentPageAsTemplate}
            disabled={!hasSections}
            className="rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            Save Layout
          </button>
          <label className="flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-600 lg:w-72">
            <FiSearch className="shrink-0" />
            <input
              value={sectionSearch}
              onChange={(e) => setSectionSearch(e.target.value)}
              placeholder="Search sections"
              className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
            />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => scrollSections('left')} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white text-gray-700 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Scroll sections left">
          <FiArrowLeft />
        </button>
        <div ref={scrollRef} className="no-scrollbar flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain pb-1">
          {filteredSections.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                draggable
                onClick={() => addSection(option.value)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-section-type', option.value)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="flex min-h-20 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition hover:bg-gray-50 hover:text-blue-700"
              >
                <Icon size={20} />
                <span className="leading-tight">{option.label}</span>
              </button>
            )
          })}
          {filteredSections.length === 0 && (
            <div className="flex min-h-20 min-w-48 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-gray-600">
              No sections found.
            </div>
          )}
        </div>
        <button type="button" onClick={() => scrollSections('right')} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white text-gray-700 transition hover:bg-blue-50 hover:text-blue-700" aria-label="Scroll sections right">
          <FiArrowRight />
        </button>
      </div>
      {reusableSections.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-900">Reusable Templates</h3>
            <span className="text-xs font-semibold text-gray-500">{reusableSections.length} saved</span>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {filteredTemplates.map((template: any) => {
              const Icon = template.kind === 'layout'
                ? FiColumns
                : sectionTypeOptions.find(option => option.value === template.type)?.icon || FiLayout
              return (
                <div key={template.id} className="w-40 shrink-0 rounded-lg border bg-white p-2 text-center">
                  <button type="button" onClick={() => addReusableSection(template)} className="flex min-h-20 w-full flex-col items-center justify-center gap-2 rounded-md text-xs font-semibold hover:bg-blue-50 hover:text-blue-700">
                    <Icon size={20} />
                    <span className="leading-tight">{template.name}</span>
                  </button>
                  <div className="mt-2 space-y-1 text-[11px] text-gray-500">
                    <p className="font-semibold uppercase tracking-wide">
                      {template.kind === 'layout' ? 'Layout Template' : template.kind === 'synced' ? 'Synced Block' : 'Block Template'}
                    </p>
                    <p>{template.sectionCount || 1} section{Number(template.sectionCount || 1) === 1 ? '' : 's'}</p>
                    {template.sourcePage && <p className="truncate">{template.sourcePage}</p>}
                  </div>
                  <button type="button" onClick={() => deleteReusableSection(template.id)} className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700">Remove</button>
                </div>
              )
            })}
            {filteredTemplates.length === 0 && (
              <div className="flex min-h-20 min-w-48 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-gray-600">
                No templates found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PageSettingsInspector({ title, editor, isOpen = true, setIsOpen = () => {} }: any) {
  return (
    <section className="flex h-full flex-col bg-white">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-gray-50" aria-label={isOpen ? 'Collapse general settings' : 'Expand general settings'} title={isOpen ? 'Collapse general settings' : 'Expand general settings'}>
        {isOpen ? (
          <span>
            <span className="block text-xl font-bold text-gray-900">{title}</span>
            <span className="block text-sm text-gray-600">Page details appear here until you select a section.</span>
          </span>
        ) : <span className="sr-only">{title}</span>}
        <FiArrowRight className={`text-blue-600 transition-transform duration-300 ease-in-out ${isOpen ? '' : 'rotate-180'}`} />
      </button>
      <div className={`min-h-0 flex-1 overflow-hidden border-t transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[calc(100vh-12rem)] opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}>
        <div className="h-full min-h-0 space-y-4 overflow-y-auto p-4 pb-8">
          {editor}
        </div>
      </div>
    </section>
  )
}

function SectionInspector({ title, section, rawSection, index, updateSection, removeSection, duplicateSection, uploadImageToField, openMediaPicker, isOpen = true, setIsOpen = () => {} }: any) {
  if (!section || index < 0) {
    return (
      <section className="h-full bg-white">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-gray-50" aria-label={isOpen ? 'Collapse section settings' : 'Expand section settings'} title={isOpen ? 'Collapse section settings' : 'Expand section settings'}>
          <span>
            <span className="block text-xl font-bold text-gray-900">{title}</span>
            <span className="block text-sm text-gray-600">Select a section in the preview to edit it here.</span>
          </span>
          <FiArrowRight className={`text-blue-600 transition-transform duration-300 ease-in-out ${isOpen ? '' : 'rotate-180'}`} />
        </button>
        <div className={`overflow-hidden border-t transition-all duration-300 ease-in-out ${isOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}>
          <div className="p-4 text-sm text-gray-600">No section selected.</div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex h-full flex-col bg-white">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-gray-50" aria-label={isOpen ? 'Collapse section settings' : 'Expand section settings'} title={isOpen ? 'Collapse section settings' : 'Expand section settings'}>
        {isOpen ? (
          <span>
            <span className="block text-xl font-bold text-gray-900">{title}</span>
            <span className="block text-sm text-gray-600">
              {getSectionTitle(section, index)}
              {rawSection?.syncedBlockId ? ` · Synced Block` : ''}
            </span>
          </span>
        ) : <span className="sr-only">{title}</span>}
        <FiArrowRight className={`text-blue-600 transition-transform duration-300 ease-in-out ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      <div className={`min-h-0 flex-1 overflow-hidden border-t transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[calc(100vh-12rem)] opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}>
      <div className="h-full min-h-0 space-y-4 overflow-y-auto p-4 pb-8">
        <div className="rounded-lg border bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-bold text-gray-700">Section Type</label>
          <select value={section.type || 'paragraph'} onChange={(e) => updateSection(index, 'type', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
            {sectionTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {rawSection?.syncedBlockId && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            This section is linked to the synced block <strong>{rawSection.syncedBlockName || section.title || 'Synced Block'}</strong>. Changes here will update every page using it.
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => duplicateSection(index)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            <FiCopy />
            Duplicate
          </button>
          <button type="button" onClick={() => updateSection(index, 'isHidden', !section.isHidden)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            {section.isHidden ? <FiEye /> : <FiEyeOff />}
            {section.isHidden ? 'Show' : 'Hide'}
          </button>
          <button type="button" onClick={() => removeSection(index)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50">
            <FiTrash2 />
            Delete
          </button>
        </div>

        <SectionSpacingControls section={section} index={index} updateSection={updateSection} />
        <SectionResponsiveControls section={section} index={index} updateSection={updateSection} />
        <SectionColorControls section={section} index={index} updateSection={updateSection} />
        {['banner', 'hero', 'cta', 'imageOverlay', 'button'].includes(section.type) && <SectionButtonControls section={section} index={index} updateSection={updateSection} />}
        <SectionTypographyControls section={section} index={index} updateSection={updateSection} />
        <SectionAnimationControls section={section} index={index} updateSection={updateSection} />

        {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay' || section.type === 'button') && (
          <div className="space-y-3">
            {section.type !== 'button' && <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Heading" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'button' && <DeferredRichTextEditorField label="Text" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Add text, links, and color..." minHeight={120} />}
            <input value={section.buttonLabel || ''} onChange={(e) => updateSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.buttonUrl || ''} onChange={(e) => updateSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="w-full px-4 py-2 border rounded-lg" />
            {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updateSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updateSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && section.type !== 'button' && <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && section.type !== 'button' && <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
            {section.type !== 'cta' && section.type !== 'button' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />}
            {section.imageUrl && section.type !== 'cta' && section.type !== 'button' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-40 w-full rounded-lg object-cover" />}
            {section.type === 'hero' && (
              <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
                <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Height</span>
                  <input type="range" min="320" max="1080" step="10" value={Number(section.heroHeight || (section.heroFormEnabled ? 520 : 640))} onChange={(e) => updateSection(index, 'heroHeight', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="320" max="1080" value={section.heroHeight || ''} onChange={(e) => updateSection(index, 'heroHeight', e.target.value)} placeholder={section.heroFormEnabled ? '520' : '640'} className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={Boolean(section.heroFormEnabled)} onChange={(e) => updateSection(index, 'heroFormEnabled', e.target.checked)} />
                  Show CRM form in hero
                </label>
                {section.heroFormEnabled && (
                  <>
                    <input value={section.crmFormTitle || ''} onChange={(e) => updateSection(index, 'crmFormTitle', e.target.value)} placeholder="Form title" className="w-full px-4 py-2 border rounded-lg" />
                    <textarea value={section.crmServices || ''} onChange={(e) => updateSection(index, 'crmServices', e.target.value)} placeholder="Services interested in, one per line" rows={4} className="w-full px-4 py-2 border rounded-lg" />
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">CRM background</span>
                      <input type="color" value={section.crmBackgroundColor || '#ffffff'} onChange={(e) => updateSection(index, 'crmBackgroundColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmBackgroundColor || ''} onChange={(e) => updateSection(index, 'crmBackgroundColor', e.target.value)} placeholder="#ffffff" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">CRM font color</span>
                      <input type="color" value={section.crmTextColor || '#111827'} onChange={(e) => updateSection(index, 'crmTextColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmTextColor || ''} onChange={(e) => updateSection(index, 'crmTextColor', e.target.value)} placeholder="#111827" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">CRM input color</span>
                      <input type="color" value={section.crmInputTextColor || '#111827'} onChange={(e) => updateSection(index, 'crmInputTextColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmInputTextColor || ''} onChange={(e) => updateSection(index, 'crmInputTextColor', e.target.value)} placeholder="#111827" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">Placeholder</span>
                      <input type="color" value={section.crmPlaceholderColor || '#6b7280'} onChange={(e) => updateSection(index, 'crmPlaceholderColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmPlaceholderColor || ''} onChange={(e) => updateSection(index, 'crmPlaceholderColor', e.target.value)} placeholder="#6b7280" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">Input background</span>
                      <input type="color" value={section.crmInputBackgroundColor || '#ffffff'} onChange={(e) => updateSection(index, 'crmInputBackgroundColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmInputBackgroundColor || ''} onChange={(e) => updateSection(index, 'crmInputBackgroundColor', e.target.value)} placeholder="#ffffff" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold">Input border</span>
                      <input type="color" value={section.crmInputBorderColor || '#d1d5db'} onChange={(e) => updateSection(index, 'crmInputBorderColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                      <input value={section.crmInputBorderColor || ''} onChange={(e) => updateSection(index, 'crmInputBorderColor', e.target.value)} placeholder="#d1d5db" className="w-full rounded-lg border px-2 py-1" />
                    </div>
                    <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                      <span className="font-semibold">Border</span>
                      <input type="range" min="0" max="6" step="1" value={Number(section.crmInputBorderWidth || 1)} onChange={(e) => updateSection(index, 'crmInputBorderWidth', e.target.value)} className="w-full accent-blue-600" />
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="12" value={section.crmInputBorderWidth || ''} onChange={(e) => updateSection(index, 'crmInputBorderWidth', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </label>
                    <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                      <span className="font-semibold">Radius</span>
                      <input type="range" min="0" max="36" step="1" value={Number(section.crmInputBorderRadius || 12)} onChange={(e) => updateSection(index, 'crmInputBorderRadius', e.target.value)} className="w-full accent-blue-600" />
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="72" value={section.crmInputBorderRadius || ''} onChange={(e) => updateSection(index, 'crmInputBorderRadius', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </label>
                    <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                      <span className="font-semibold">Pad X</span>
                      <input type="range" min="8" max="36" step="1" value={Number(section.crmInputPaddingX || 16)} onChange={(e) => updateSection(index, 'crmInputPaddingX', e.target.value)} className="w-full accent-blue-600" />
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="72" value={section.crmInputPaddingX || ''} onChange={(e) => updateSection(index, 'crmInputPaddingX', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </label>
                    <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                      <span className="font-semibold">Pad Y</span>
                      <input type="range" min="8" max="28" step="1" value={Number(section.crmInputPaddingY || 12)} onChange={(e) => updateSection(index, 'crmInputPaddingY', e.target.value)} className="w-full accent-blue-600" />
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="56" value={section.crmInputPaddingY || ''} onChange={(e) => updateSection(index, 'crmInputPaddingY', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                        <span className="text-xs text-gray-500">px</span>
                      </div>
                    </label>
                    <input value={section.crmBackgroundImageUrl || ''} onChange={(e) => updateSection(index, 'crmBackgroundImageUrl', e.target.value)} placeholder="CRM background image URL" className="w-full px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'crmBackgroundImageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose CRM background</button>
                    <textarea value={section.crmDetailsPlaceholder || ''} onChange={(e) => updateSection(index, 'crmDetailsPlaceholder', e.target.value)} placeholder="Details field placeholder" rows={3} className="w-full px-4 py-2 border rounded-lg" />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {(section.type === 'header' || section.type === 'hero' || section.type === 'banner' || section.type === 'section' || section.type === 'services' || section.type === 'map' || section.type === 'youtube' || section.type === 'imageOverlay' || section.type === 'cta') && (
          <div className="space-y-3">
            <input
              value={section.title || ''}
              onChange={(e) => {
                updateSection(index, 'title', e.target.value)
                updateSection(index, 'titleHtml', e.target.value)
              }}
              placeholder="Section title"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input value={section.titleLinkUrl || ''} onChange={(e) => updateSection(index, 'titleLinkUrl', e.target.value)} placeholder="Optional title link URL" className="w-full px-4 py-2 border rounded-lg" />
            {['header', 'hero', 'banner', 'section', 'services', 'map', 'youtube', 'imageOverlay', 'cta'].includes(section.type) && (
              <label className="block text-sm font-semibold text-gray-700">
                Heading tag
                <select value={section.headingTag || (section.type === 'hero' ? 'h1' : 'h2')} onChange={(e) => updateSection(index, 'headingTag', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                  <option value="h1">H1</option>
                  <option value="h2">H2</option>
                  <option value="h3">H3</option>
                  <option value="h4">H4</option>
                  <option value="h5">H5</option>
                  <option value="h6">H6</option>
                </select>
              </label>
            )}
            {['hero', 'banner', 'imageOverlay', 'section'].includes(section.type) && (
              <label className="block text-sm font-semibold text-gray-700">
                Vertical alignment
                <select value={section.contentVerticalAlign || 'center'} onChange={(e) => updateSection(index, 'contentVerticalAlign', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
            )}
          </div>
        )}

        {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services' || section.type === 'map' || section.type === 'youtube') && (
          <DeferredRichTextEditorField label="Text content" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Format certain words, add links, and set colors..." minHeight={160} />
        )}

        {section.type === 'portfolio' && <ListCountControls section={section} index={index} updateSection={updateSection} />}
        {section.type === 'services' && <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="w-full px-4 py-2 border rounded-lg" />}

        {section.type === 'gallery' && (
          <>
            <ListCountControls section={section} index={index} updateSection={updateSection} titlePlaceholder="Gallery title" />
            <SectionItemsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} openMediaPicker={openMediaPicker} />
          </>
        )}

        {section.type === 'imageCards' && (
          <>
            <ListCountControls section={section} index={index} updateSection={updateSection} titlePlaceholder="Section title" maxColumns={3} />
            <ImageCardsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} openMediaPicker={openMediaPicker} />
          </>
        )}

        {section.type === 'columns' && <ColumnsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} openMediaPicker={openMediaPicker} />}

        {section.type === 'siteDemos' && <ListCountControls section={section} index={index} updateSection={updateSection} titlePlaceholder="Section title" />}

        {section.type === 'faq' && (
          <>
            <ListCountControls section={section} index={index} updateSection={updateSection} titlePlaceholder="FAQ title" maxColumns={2} />
            <FaqItemsEditor section={section} index={index} updateSection={updateSection} />
          </>
        )}

        {section.type === 'divider' && (
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Width</span>
              <input type="range" min="10" max="100" step="1" value={Number(section.dividerWidth || 100)} onChange={(e) => updateSection(index, 'dividerWidth', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="10" max="100" value={section.dividerWidth ?? ''} onChange={(e) => updateSection(index, 'dividerWidth', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </label>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Height</span>
              <input type="range" min="1" max="20" step="1" value={Number(section.dividerHeight || 1)} onChange={(e) => updateSection(index, 'dividerHeight', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="1" max="20" value={section.dividerHeight ?? ''} onChange={(e) => updateSection(index, 'dividerHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Top</span>
              <input type="range" min="0" max="160" step="1" value={Number(section.dividerMarginTop || 0)} onChange={(e) => updateSection(index, 'dividerMarginTop', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="320" value={section.dividerMarginTop ?? ''} onChange={(e) => updateSection(index, 'dividerMarginTop', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Bottom</span>
              <input type="range" min="0" max="160" step="1" value={Number(section.dividerMarginBottom || 0)} onChange={(e) => updateSection(index, 'dividerMarginBottom', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="320" value={section.dividerMarginBottom ?? ''} onChange={(e) => updateSection(index, 'dividerMarginBottom', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Style
              <select value={section.dividerStyle || 'solid'} onChange={(e) => updateSection(index, 'dividerStyle', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-gray-700">
              Alignment
              <select value={section.dividerAlign || 'center'} onChange={(e) => updateSection(index, 'dividerAlign', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Line color</span>
              <input type="color" value={/^#[0-9A-F]{6}$/i.test(section.dividerColor || '') ? section.dividerColor : '#d1d5db'} onChange={(e) => updateSection(index, 'dividerColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
              <input value={section.dividerColor || ''} onChange={(e) => updateSection(index, 'dividerColor', e.target.value)} placeholder="#d1d5db" className="w-full rounded-lg border px-2 py-1" />
            </div>
          </div>
        )}

        {section.type === 'map' && (
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700">Map search / address</span>
              <input value={section.mapQuery || ''} onChange={(e) => updateSection(index, 'mapQuery', e.target.value)} placeholder="Indianapolis, IN or 123 Main St, Indianapolis, IN" className="w-full rounded-lg border px-4 py-2" />
              <p className="text-xs text-gray-500">Quick option: enter an address or city and we will build the embed automatically.</p>
            </label>
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700">Custom embed URL</span>
              <input value={section.mapEmbedUrl || ''} onChange={(e) => updateSection(index, 'mapEmbedUrl', e.target.value)} placeholder="https://www.google.com/maps/embed?..." className="w-full rounded-lg border px-4 py-2" />
              <p className="text-xs text-gray-500">Paste a Google Maps embed URL here if you want full control. This takes priority over the address field above.</p>
            </label>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Height</span>
              <input type="range" min="220" max="900" step="10" value={Number(section.mapHeight || 420)} onChange={(e) => updateSection(index, 'mapHeight', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="220" max="1200" value={section.mapHeight ?? ''} onChange={(e) => updateSection(index, 'mapHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
            <MapPinsEditor section={section} index={index} updateSection={updateSection} />
          </div>
        )}

        {section.type === 'youtube' && (
          <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700">YouTube URL</span>
              <input value={section.videoUrl || ''} onChange={(e) => updateSection(index, 'videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full rounded-lg border px-4 py-2" />
            </label>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Height</span>
              <input type="range" min="220" max="900" step="10" value={Number(section.videoHeight || 420)} onChange={(e) => updateSection(index, 'videoHeight', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="220" max="1200" value={section.videoHeight ?? ''} onChange={(e) => updateSection(index, 'videoHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
          </div>
        )}

        {section.type === 'section' && (
          <>
            <SectionPanelStyleControls section={section} index={index} updateSection={updateSection} prefix="textPanel" title="Text Panel" />
            <SectionPanelAnimationControls section={section} index={index} updateSection={updateSection} prefix="textPanel" title="Text Panel" />
            <SectionPanelStyleControls section={section} index={index} updateSection={updateSection} prefix="imagePanel" title="Image Panel" />
            <SectionPanelAnimationControls section={section} index={index} updateSection={updateSection} prefix="imagePanel" title="Image Panel" />
          </>
        )}

        {(section.type === 'image' || section.type === 'section') && (
          <div className="space-y-3">
            <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.alt || ''} onChange={(e) => updateSection(index, 'alt', e.target.value)} placeholder="Alt text" className="w-full px-4 py-2 border rounded-lg" />
            {section.type === 'section' && (
              <label className="space-y-2 text-sm text-gray-700">
                <span className="block font-semibold">Layout order</span>
                <select value={section.imageOrder || 'image-second'} onChange={(e) => updateSection(index, 'imageOrder', e.target.value)} className="w-full rounded-lg border px-4 py-2">
                  <option value="image-second">Text first, image second</option>
                  <option value="image-first">Image first, text second</option>
                </select>
              </label>
            )}
            {section.type === 'image' && (
              <>
                <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Width</span>
                  <input type="range" min="10" max="100" step="1" value={Number(section.imageWidth || 100)} onChange={(e) => updateSection(index, 'imageWidth', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="10" max="100" value={section.imageWidth || ''} onChange={(e) => updateSection(index, 'imageWidth', e.target.value)} placeholder="100" className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </label>
                <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Height</span>
                  <input type="range" min="120" max="1200" step="10" value={Number(section.imageHeight || 480)} onChange={(e) => updateSection(index, 'imageHeight', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="120" max="1200" value={section.imageHeight || ''} onChange={(e) => updateSection(index, 'imageHeight', e.target.value)} placeholder="480" className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-gray-700">
                    <span className="block font-semibold">Horizontal alignment</span>
                    <select value={section.imageAlignX || 'center'} onChange={(e) => updateSection(index, 'imageAlignX', e.target.value)} className="w-full rounded-lg border px-4 py-2">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    <span className="block font-semibold">Vertical alignment</span>
                    <select value={section.imageAlignY || 'center'} onChange={(e) => updateSection(index, 'imageAlignY', e.target.value)} className="w-full rounded-lg border px-4 py-2">
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>
            <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
            {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || 'Section image'} className="h-40 w-full rounded-lg object-cover" />}
          </div>
        )}

        {section.type === 'plugin' && (
          <div className="space-y-3">
            <select value={section.pluginSlug || 'restaurant'} onChange={(e) => updateSection(index, 'pluginSlug', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
              {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
            </select>
            <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional background image URL" className="w-full px-4 py-2 border rounded-lg" />
            <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose background</button>
            <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Overlay color</span>
              <input type="color" value={section.overlayColor || '#000000'} onChange={(e) => updateSection(index, 'overlayColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
              <input value={section.overlayColor || ''} onChange={(e) => updateSection(index, 'overlayColor', e.target.value)} placeholder="#000000" className="w-full rounded-lg border px-2 py-1" />
            </div>
            <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Overlay</span>
              <input type="range" min="0" max="95" step="5" value={Number(section.overlayOpacity ?? 55)} onChange={(e) => updateSection(index, 'overlayOpacity', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="95" value={section.overlayOpacity ?? ''} onChange={(e) => updateSection(index, 'overlayOpacity', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </label>
            {section.pluginSlug === 'crm' && (
              <>
                <input value={section.crmFormTitle || ''} onChange={(e) => updateSection(index, 'crmFormTitle', e.target.value)} placeholder="Form title" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={section.crmServices || ''} onChange={(e) => updateSection(index, 'crmServices', e.target.value)} placeholder="Services interested in, one per line" rows={4} className="w-full px-4 py-2 border rounded-lg" />
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Form background</span>
                  <input type="color" value={section.crmBackgroundColor || '#ffffff'} onChange={(e) => updateSection(index, 'crmBackgroundColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmBackgroundColor || ''} onChange={(e) => updateSection(index, 'crmBackgroundColor', e.target.value)} placeholder="#ffffff" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Text color</span>
                  <input type="color" value={section.crmTextColor || '#111827'} onChange={(e) => updateSection(index, 'crmTextColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmTextColor || ''} onChange={(e) => updateSection(index, 'crmTextColor', e.target.value)} placeholder="#111827" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Input text</span>
                  <input type="color" value={section.crmInputTextColor || '#111827'} onChange={(e) => updateSection(index, 'crmInputTextColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmInputTextColor || ''} onChange={(e) => updateSection(index, 'crmInputTextColor', e.target.value)} placeholder="#111827" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Placeholder</span>
                  <input type="color" value={section.crmPlaceholderColor || '#6b7280'} onChange={(e) => updateSection(index, 'crmPlaceholderColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmPlaceholderColor || ''} onChange={(e) => updateSection(index, 'crmPlaceholderColor', e.target.value)} placeholder="#6b7280" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Input background</span>
                  <input type="color" value={section.crmInputBackgroundColor || '#ffffff'} onChange={(e) => updateSection(index, 'crmInputBackgroundColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmInputBackgroundColor || ''} onChange={(e) => updateSection(index, 'crmInputBackgroundColor', e.target.value)} placeholder="#ffffff" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold">Input border</span>
                  <input type="color" value={section.crmInputBorderColor || '#d1d5db'} onChange={(e) => updateSection(index, 'crmInputBorderColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
                  <input value={section.crmInputBorderColor || ''} onChange={(e) => updateSection(index, 'crmInputBorderColor', e.target.value)} placeholder="#d1d5db" className="w-full rounded-lg border px-2 py-1" />
                </div>
                <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Border</span>
                  <input type="range" min="0" max="6" step="1" value={Number(section.crmInputBorderWidth || 1)} onChange={(e) => updateSection(index, 'crmInputBorderWidth', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="12" value={section.crmInputBorderWidth || ''} onChange={(e) => updateSection(index, 'crmInputBorderWidth', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Radius</span>
                  <input type="range" min="0" max="36" step="1" value={Number(section.crmInputBorderRadius || 12)} onChange={(e) => updateSection(index, 'crmInputBorderRadius', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="72" value={section.crmInputBorderRadius || ''} onChange={(e) => updateSection(index, 'crmInputBorderRadius', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Pad X</span>
                  <input type="range" min="8" max="36" step="1" value={Number(section.crmInputPaddingX || 16)} onChange={(e) => updateSection(index, 'crmInputPaddingX', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="72" value={section.crmInputPaddingX || ''} onChange={(e) => updateSection(index, 'crmInputPaddingX', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Pad Y</span>
                  <input type="range" min="8" max="28" step="1" value={Number(section.crmInputPaddingY || 12)} onChange={(e) => updateSection(index, 'crmInputPaddingY', e.target.value)} className="w-full accent-blue-600" />
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="56" value={section.crmInputPaddingY || ''} onChange={(e) => updateSection(index, 'crmInputPaddingY', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </label>
                <input value={section.crmBackgroundImageUrl || ''} onChange={(e) => updateSection(index, 'crmBackgroundImageUrl', e.target.value)} placeholder="Form background image URL" className="w-full px-4 py-2 border rounded-lg" />
                <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'crmBackgroundImageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose form background</button>
                <textarea value={section.crmDetailsPlaceholder || ''} onChange={(e) => updateSection(index, 'crmDetailsPlaceholder', e.target.value)} placeholder="Details field placeholder" rows={3} className="w-full px-4 py-2 border rounded-lg" />
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </section>
  )
}

function ListCountControls({ section, index, updateSection, titlePlaceholder = 'Section title', maxColumns = 6 }: any) {
  return (
    <div className="space-y-3">
      <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder={titlePlaceholder} className="w-full px-4 py-2 border rounded-lg" />
      <input type="number" min="1" max={maxColumns} value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="w-full px-4 py-2 border rounded-lg" />
      <DeferredRichTextEditorField label="Section description" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Section description..." minHeight={120} />
      <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="w-full px-4 py-2 border rounded-lg" />
    </div>
  )
}

function PageSectionEditor({ title, sections, editingSectionId, draggingSectionIndex, setEditingSectionId, setDraggingSectionIndex, addSection, updateSection, removeSection, moveSection, uploadImageToField, isOpen = true, setIsOpen = () => {} }: any) {
  if (!isOpen) {
    return (
      <section className="h-full overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-16 w-full items-center justify-center text-gray-900"
          aria-label="Expand sections panel"
          title="Expand sections panel"
        >
          <FiArrowLeft />
        </button>
      </section>
    )
  }

  return (
    <section className="h-full bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-4 text-left"
        aria-label="Collapse sections panel"
        title="Collapse sections panel"
      >
        <span>
          <span className="block text-xl font-bold text-gray-900">{title}</span>
          <span className="block text-sm text-gray-600">Drag section pieces into the preview, then edit them here.</span>
        </span>
        <FiArrowRight className="text-blue-600" />
      </button>
      <div className="space-y-4 border-t p-4">
      <div className="grid grid-cols-2 gap-2">
        {sectionTypeOptions.map(option => (
          (() => {
            const Icon = option.icon
            return (
          <button
            key={option.value}
            type="button"
            draggable
            onClick={() => addSection(option.value)}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/x-section-type', option.value)
              e.dataTransfer.effectAllowed = 'copy'
            }}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-xs font-semibold hover:bg-gray-50"
          >
            <Icon size={20} />
            {option.label}
          </button>
            )
          })()
        ))}
      </div>
      <div className="space-y-3">
        {(sections || []).map((section: any, index: number) => (
          <div
            key={section.id || index}
            id={`built-in-section-${section.id || index}`}
            onClick={() => setEditingSectionId(section.id || String(index))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggingSectionIndex !== null) moveSection(draggingSectionIndex, index)
              setDraggingSectionIndex(null)
            }}
            className={`rounded-lg border bg-gray-50 p-4 transition duration-200 ${draggingSectionIndex === index ? 'scale-[0.98] opacity-60 shadow-xl ring-2 ring-blue-500' : editingSectionId === section.id ? 'ring-2 ring-blue-500' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select value={section.type || 'paragraph'} onChange={(e) => updateSection(index, 'type', e.target.value)} className="px-4 py-2 border rounded-lg">
                  {sectionTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                <span className="text-sm font-semibold text-blue-600">{getSectionTitle(section, index)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveSection(index, index - 1)} disabled={index === 0} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 hover:bg-white disabled:opacity-40" aria-label="Move section up" title="Move up"><FiArrowUp /></button>
                <button type="button" onClick={() => moveSection(index, index + 1)} disabled={index === (sections || []).length - 1} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 hover:bg-white disabled:opacity-40" aria-label="Move section down" title="Move down"><FiArrowDown /></button>
                <button type="button" onClick={() => removeSection(index)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-red-600 hover:bg-red-50" aria-label="Remove section" title="Remove section"><FiTrash2 /></button>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDraggingSectionIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => setDraggingSectionIndex(null)}
                  className="inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-lg border bg-white text-gray-700 active:cursor-grabbing"
                  aria-label="Drag section to reorder"
                  title="Drag to reorder"
                >
                  <FiMove />
                </button>
              </div>
            </div>

            <SectionSpacingControls section={section} index={index} updateSection={updateSection} />

            {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay' || section.type === 'button') && (
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {section.type !== 'button' && <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Heading" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                {section.type !== 'button' && <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                <input value={section.buttonLabel || ''} onChange={(e) => updateSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
                <input value={section.buttonUrl || ''} onChange={(e) => updateSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
                {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updateSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />}
                {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updateSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />}
                {section.type !== 'cta' && section.type !== 'button' && <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                {section.type !== 'cta' && section.type !== 'button' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                {section.imageUrl && section.type !== 'cta' && section.type !== 'button' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
              </div>
            )}

            {(section.type === 'header' || section.type === 'section' || section.type === 'services' || section.type === 'map' || section.type === 'youtube') && (
              <div className="mb-3 space-y-3">
                <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
                {section.type === 'header' && (
                  <select value={section.headingTag || 'h2'} onChange={(e) => updateSection(index, 'headingTag', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="h4">H4</option>
                    <option value="h5">H5</option>
                    <option value="h6">H6</option>
                  </select>
                )}
              </div>
            )}

            {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services' || section.type === 'map') && (
              <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text content" rows={4} className="mb-3 w-full px-4 py-2 border rounded-lg" />
            )}

            {section.type === 'map' && (
              <div className="mb-3 grid grid-cols-1 gap-3">
                <input value={section.mapQuery || ''} onChange={(e) => updateSection(index, 'mapQuery', e.target.value)} placeholder="Map search / address" className="px-4 py-2 border rounded-lg" />
                <input value={section.mapEmbedUrl || ''} onChange={(e) => updateSection(index, 'mapEmbedUrl', e.target.value)} placeholder="Custom embed URL" className="px-4 py-2 border rounded-lg" />
                <input type="number" min="220" max="1200" value={section.mapHeight || ''} onChange={(e) => updateSection(index, 'mapHeight', e.target.value)} placeholder="Map height in px" className="px-4 py-2 border rounded-lg" />
              </div>
            )}

            {section.type === 'portfolio' && (
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="px-4 py-2 border rounded-lg" />
              </div>
            )}

            {section.type === 'gallery' && (
              <>
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Gallery title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                  <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Gallery description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <SectionItemsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} />
              </>
            )}

            {section.type === 'imageCards' && (
              <>
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" min="1" max="3" value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                  <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Section description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <ImageCardsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} />
              </>
            )}

            {section.type === 'columns' && (
              <ColumnsEditor section={section} index={index} updateSection={updateSection} uploadImageToField={uploadImageToField} />
            )}

            {section.type === 'services' && (
              <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Items to show" className="mb-3 w-full px-4 py-2 border rounded-lg" />
            )}

            {section.type === 'siteDemos' && (
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
                <input type="number" min="1" max="6" value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Section description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Demos to show" className="px-4 py-2 border rounded-lg md:col-span-2" />
              </div>
            )}

            {section.type === 'faq' && (
              <>
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="FAQ title" className="px-4 py-2 border rounded-lg" />
                  <input type="number" min="1" max="2" value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="px-4 py-2 border rounded-lg" />
                  <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="FAQ description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                  <input type="number" min="1" value={section.itemLimit || ''} onChange={(e) => updateSection(index, 'itemLimit', Number(e.target.value || 0))} placeholder="Questions to show" className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <FaqItemsEditor section={section} index={index} updateSection={updateSection} />
              </>
            )}

            {section.type === 'customForm' && (
              <>
                <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
                  <input value={section.customFormName || ''} onChange={(e) => updateSection(index, 'customFormName', e.target.value)} placeholder="Internal form name" className="px-4 py-2 border rounded-lg" />
                  <input value={section.customFormSubmitLabel || ''} onChange={(e) => updateSection(index, 'customFormSubmitLabel', e.target.value)} placeholder="Submit button label" className="px-4 py-2 border rounded-lg" />
                  <input value={section.customFormSuccessMessage || ''} onChange={(e) => updateSection(index, 'customFormSuccessMessage', e.target.value)} placeholder="Success message" className="px-4 py-2 border rounded-lg" />
                  <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Form description" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                </div>
                <CustomFormFieldsEditor section={section} index={index} updateSection={updateSection} />
              </>
            )}

            {(section.type === 'image' || section.type === 'section') && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
                <input value={section.alt || ''} onChange={(e) => updateSection(index, 'alt', e.target.value)} placeholder="Alt text" className="px-4 py-2 border rounded-lg" />
                <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />
                {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || 'Section image'} className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
              </div>
            )}

            {section.type === 'plugin' && (
              <div className="grid grid-cols-1 gap-3">
                <select value={section.pluginSlug || 'restaurant'} onChange={(e) => updateSection(index, 'pluginSlug', e.target.value)} className="px-4 py-2 border rounded-lg">
                  {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
                </select>
                <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional background image URL" className="px-4 py-2 border rounded-lg" />
              </div>
            )}
          </div>
        ))}
      </div>
      {(sections || []).length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-gray-600">No extra sections yet. Add one above to place reusable content on this page.</div>}
      </div>
    </section>
  )
}

function ImageCardsEditor({ section, index, updateSection, uploadImageToField, openMediaPicker }: any) {
  const items = Array.isArray(section.items) ? section.items : []
  const updateItem = (itemIndex: number, field: string, value: any) => {
    updateSection(index, 'items', items.map((item: any, currentIndex: number) => currentIndex === itemIndex ? { ...item, [field]: value } : item))
  }
  const addItem = () => updateSection(index, 'items', [...items, makeImageCard()])
  const removeItem = (itemIndex: number) => updateSection(index, 'items', items.filter((_: any, currentIndex: number) => currentIndex !== itemIndex))

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-gray-900">Image Cards</h4>
        <button type="button" onClick={addItem} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Card</button>
      </div>
      {items.map((item: any, itemIndex: number) => (
        <div key={item.id || itemIndex} className="grid grid-cols-1 gap-3 rounded-lg border p-3">
          <input value={item.category || ''} onChange={(e) => updateItem(itemIndex, 'category', e.target.value)} placeholder="Category / small heading" className="px-4 py-2 border rounded-lg" />
          <input value={item.title || ''} onChange={(e) => updateItem(itemIndex, 'title', e.target.value)} placeholder="Header" className="px-4 py-2 border rounded-lg" />
          <textarea value={item.description || ''} onChange={(e) => updateItem(itemIndex, 'description', e.target.value)} placeholder="Subtext" rows={2} className="px-4 py-2 border rounded-lg" />
          <input value={item.image || ''} onChange={(e) => updateItem(itemIndex, 'image', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
          {openMediaPicker && <button type="button" onClick={() => openMediaPicker((url: string) => updateItem(itemIndex, 'image', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
          <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateItem(itemIndex, 'image', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg" />
          {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || 'Image card'} className="h-36 w-full rounded-lg object-cover" />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={item.buttonLabel || ''} onChange={(e) => updateItem(itemIndex, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
            <input value={item.buttonUrl || ''} onChange={(e) => updateItem(itemIndex, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
          </div>
          <button type="button" onClick={() => removeItem(itemIndex)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove Card</button>
        </div>
      ))}
    </div>
  )
}

function ColumnsEditor({ section, index, updateSection, uploadImageToField, openMediaPicker }: any) {
  const count = Number(section.columns || 2)
  const columns = makeColumns(count, Array.isArray(section.items) ? section.items : [])
  const updateColumns = (nextColumns: any[]) => updateSection(index, 'items', nextColumns)
  const setColumnCount = (nextCount: number) => {
    updateSection(index, 'columns', nextCount)
    updateSection(index, 'items', makeColumns(nextCount, columns))
  }
  const addBlock = (columnIndex: number, type: string) => {
    updateColumns(columns.map((column, currentIndex) => currentIndex === columnIndex ? { ...column, sections: [...(column.sections || []), makeNestedBlock(type)] } : column))
  }
  const updateBlock = (columnIndex: number, blockIndex: number, field: string, value: any) => {
    updateColumns(columns.map((column, currentIndex) => currentIndex === columnIndex ? {
      ...column,
      sections: (column.sections || []).map((block: any, currentBlockIndex: number) => currentBlockIndex === blockIndex ? { ...block, [field]: value } : block)
    } : column))
  }
  const removeBlock = (columnIndex: number, blockIndex: number) => {
    updateColumns(columns.map((column, currentIndex) => currentIndex === columnIndex ? {
      ...column,
      sections: (column.sections || []).filter((_: any, currentBlockIndex: number) => currentBlockIndex !== blockIndex)
    } : column))
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="px-4 py-2 border rounded-lg" />
        <select value={count} onChange={(e) => setColumnCount(Number(e.target.value))} className="px-4 py-2 border rounded-lg">
          <option value={1}>1 column</option>
          <option value={2}>Split columns</option>
          <option value={3}>Three columns</option>
        </select>
        <div className="md:col-span-2">
          <DeferredRichTextEditorField label="Section description" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Section description..." minHeight={120} />
        </div>
      </div>
      {columns.map((column, columnIndex) => (
        <div key={column.id || columnIndex} className="space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-bold text-gray-900">Column {columnIndex + 1}</h4>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              + Add as many blocks as you want
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {nestedBlockOptions.map(option => {
              const Icon = option.icon
              return (
                <button key={option.value} type="button" onClick={() => addBlock(columnIndex, option.value)} className="flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-50">
                  <Icon size={18} />
                  {option.label}
                </button>
              )
            })}
          </div>
          {(column.sections || []).map((block: any, blockIndex: number) => (
            <NestedBlockEditor key={block.id || blockIndex} block={block} columnIndex={columnIndex} blockIndex={blockIndex} updateBlock={updateBlock} removeBlock={removeBlock} uploadImageToField={uploadImageToField} openMediaPicker={openMediaPicker} />
          ))}
        </div>
      ))}
    </div>
  )
}

function NestedBlockEditor({ block, columnIndex, blockIndex, updateBlock, removeBlock, uploadImageToField, openMediaPicker }: any) {
  const hasTitle = ['header', 'imageCard', 'hero', 'banner', 'cta', 'imageOverlay', 'section', 'services', 'map', 'youtube', 'pluginsList', 'siteDemos', 'faq', 'customForm'].includes(block.type)
  const hasBody = ['paragraph', 'header', 'hero', 'banner', 'cta', 'imageOverlay', 'section', 'services', 'map', 'youtube', 'pluginsList', 'siteDemos', 'faq', 'customForm'].includes(block.type)
  const hasButton = ['button', 'hero', 'banner', 'cta', 'imageOverlay'].includes(block.type)

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-gray-900">{block.type}</strong>
        <button type="button" onClick={() => removeBlock(columnIndex, blockIndex)} className="text-sm font-semibold text-red-600">Remove</button>
      </div>
      {hasTitle && <input value={block.title || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'title', e.target.value)} placeholder="Header / section title" className="w-full px-4 py-2 border rounded-lg" />}
      {block.type === 'imageCard' && <input value={block.category || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'category', e.target.value)} placeholder="Category / small heading" className="w-full px-4 py-2 border rounded-lg" />}
      {hasBody && <DeferredRichTextEditorField label="Text" value={block.body || ''} onChange={(value: string) => updateBlock(columnIndex, blockIndex, 'body', value)} placeholder="Format text..." minHeight={120} />}
      {hasButton && (
        <>
          <input value={block.buttonLabel || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonLabel', e.target.value)} placeholder="Button label" className="w-full px-4 py-2 border rounded-lg" />
          <input value={block.buttonUrl || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonUrl', e.target.value)} placeholder="Button URL" className="w-full px-4 py-2 border rounded-lg" />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <select value={block.buttonIcon || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonIcon', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
              {buttonIconOptions.map(option => <option key={option.value || 'none'} value={option.value}>{option.label}</option>)}
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={Boolean(block.buttonIconOnly)} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonIconOnly', e.target.checked)} />
              Icon only
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={block.buttonShowArrow !== false} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonShowArrow', e.target.checked)} />
              Show arrow
            </label>
          </div>
        </>
      )}
      {(block.type === 'pluginsList' || block.type === 'siteDemos') && (
        <>
          <input value={block.title || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
          <DeferredRichTextEditorField label="Text" value={block.body || ''} onChange={(value: string) => updateBlock(columnIndex, blockIndex, 'body', value)} placeholder="Optional description..." minHeight={120} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input type="number" min="1" max="6" value={block.columns || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="w-full px-4 py-2 border rounded-lg" />
            <input type="number" min="1" value={block.itemLimit || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'itemLimit', Number(e.target.value || 0))} placeholder={block.type === 'siteDemos' ? 'Demos to show' : 'Plugins to show'} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </>
      )}
      {block.type === 'imageCard' && <textarea value={block.description || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'description', e.target.value)} placeholder="Subtext" rows={2} className="w-full px-4 py-2 border rounded-lg" />}
      {(block.type === 'image' || block.type === 'imageCard' || block.type === 'hero' || block.type === 'banner' || block.type === 'imageOverlay' || block.type === 'section') && (
        <>
          <input value={block.imageUrl || block.image || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', e.target.value)} placeholder="Image URL" className="w-full px-4 py-2 border rounded-lg" />
          {openMediaPicker && <button type="button" onClick={() => openMediaPicker((url: string) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', url), 'image')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
          <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
          {(block.imageUrl || block.image) && <img src={resolveAssetUrl(block.imageUrl || block.image)} alt={block.title || ''} className="h-32 w-full rounded-lg object-cover" />}
        </>
      )}
      {block.type === 'map' && (
        <>
          <input value={block.mapQuery || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'mapQuery', e.target.value)} placeholder="Map search / address" className="w-full px-4 py-2 border rounded-lg" />
          <input value={block.mapEmbedUrl || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'mapEmbedUrl', e.target.value)} placeholder="Custom embed URL" className="w-full px-4 py-2 border rounded-lg" />
          <input type="number" min="220" max="1200" value={block.mapHeight || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'mapHeight', e.target.value)} placeholder="Map height in px" className="w-full px-4 py-2 border rounded-lg" />
        </>
      )}
      {block.type === 'youtube' && (
        <>
          <input value={block.videoUrl || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'videoUrl', e.target.value)} placeholder="YouTube URL" className="w-full px-4 py-2 border rounded-lg" />
          <input type="number" min="220" max="1200" value={block.videoHeight || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'videoHeight', e.target.value)} placeholder="Video height in px" className="w-full px-4 py-2 border rounded-lg" />
        </>
      )}
      {block.type === 'plugin' && (
        <select value={block.pluginSlug || 'restaurant'} onChange={(e) => updateBlock(columnIndex, blockIndex, 'pluginSlug', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
          {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
        </select>
      )}
      {block.type === 'imageCard' && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input value={block.buttonLabel || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
          <input value={block.buttonUrl || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
        </div>
      )}
    </div>
  )
}

function SectionItemsEditor({ section, index, updateSection, uploadImageToField, openMediaPicker }: any) {
  const items = Array.isArray(section.items) ? section.items : []
  const updateItem = (itemIndex: number, field: string, value: any) => {
    const nextItems = items.map((item: any, currentIndex: number) => currentIndex === itemIndex ? { ...item, [field]: value } : item)
    updateSection(index, 'items', nextItems)
  }
  const addItem = () => updateSection(index, 'items', [...items, { id: crypto.randomUUID(), title: '', description: '', image: '' }])
  const removeItem = (itemIndex: number) => updateSection(index, 'items', items.filter((_: any, currentIndex: number) => currentIndex !== itemIndex))

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-gray-900">Gallery Images</h4>
        <button type="button" onClick={addItem} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Image</button>
      </div>
      {items.map((item: any, itemIndex: number) => (
        <div key={item.id || itemIndex} className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-2">
          <input value={item.title || ''} onChange={(e) => updateItem(itemIndex, 'title', e.target.value)} placeholder="Image title" className="px-4 py-2 border rounded-lg" />
          <input value={item.image || ''} onChange={(e) => updateItem(itemIndex, 'image', e.target.value)} placeholder="Image URL" className="px-4 py-2 border rounded-lg" />
          <textarea value={item.description || ''} onChange={(e) => updateItem(itemIndex, 'description', e.target.value)} placeholder="Image description" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
          {openMediaPicker && <button type="button" onClick={() => openMediaPicker((url: string) => updateItem(itemIndex, 'image', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 md:col-span-2"><FiImage /> Choose from Media Library</button>}
          <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateItem(itemIndex, 'image', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />
          {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || 'Gallery image'} className="h-40 w-full rounded-lg object-cover md:col-span-2" />}
          <button type="button" onClick={() => removeItem(itemIndex)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 md:col-span-2">Remove Image</button>
        </div>
      ))}
      {items.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-gray-600">No gallery images yet.</div>}
    </div>
  )
}

function CustomFormFieldsEditor({ section, index, updateSection }: any) {
  const fields = Array.isArray(section.formFields) ? section.formFields : []

  const updateField = (fieldIndex: number, field: string, value: any) => {
    updateSection(index, 'formFields', fields.map((item: any, currentIndex: number) => currentIndex === fieldIndex ? { ...item, [field]: value } : item))
  }

  const addField = (type = 'text') => {
    updateSection(index, 'formFields', [...fields, makeCustomFormField(type, { label: 'New Field' })])
  }

  const removeField = (fieldIndex: number) => {
    updateSection(index, 'formFields', fields.filter((_: any, currentIndex: number) => currentIndex !== fieldIndex))
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-gray-900">Form Fields</h4>
          <p className="text-sm text-gray-600">Build the questions this form should collect from visitors.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addField('text')} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Text</button>
          <button type="button" onClick={() => addField('textarea')} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Textarea</button>
          <button type="button" onClick={() => addField('select')} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Select</button>
          <button type="button" onClick={() => addField('checkbox')} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Checkbox</button>
        </div>
      </div>
      {fields.map((field: any, fieldIndex: number) => (
        <div key={field.id || fieldIndex} className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={field.label || ''} onChange={(e) => updateField(fieldIndex, 'label', e.target.value)} placeholder="Field label" className="px-4 py-2 border rounded-lg" />
            <select value={field.type || 'text'} onChange={(e) => updateField(fieldIndex, 'type', e.target.value)} className="px-4 py-2 border rounded-lg bg-white">
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
            </select>
            <input value={field.placeholder || ''} onChange={(e) => updateField(fieldIndex, 'placeholder', e.target.value)} placeholder="Placeholder / helper prompt" className="px-4 py-2 border rounded-lg md:col-span-2" />
            {field.type === 'select' && (
              <textarea
                value={field.options || ''}
                onChange={(e) => updateField(fieldIndex, 'options', e.target.value)}
                placeholder="Options, one per line"
                rows={4}
                className="px-4 py-2 border rounded-lg md:col-span-2"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={Boolean(field.required)} onChange={(e) => updateField(fieldIndex, 'required', e.target.checked)} />
              Required
            </label>
            <button type="button" onClick={() => removeField(fieldIndex)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove Field</button>
          </div>
        </div>
      ))}
      {fields.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-600">No fields yet. Add the first field above.</div>}
    </div>
  )
}

function FaqItemsEditor({ section, index, updateSection }: any) {
  const items = Array.isArray(section.items) ? section.items : []
  const updateItem = (itemIndex: number, field: string, value: any) => {
    updateSection(index, 'items', items.map((item: any, currentIndex: number) => currentIndex === itemIndex ? { ...item, [field]: value } : item))
  }
  const addItem = () => updateSection(index, 'items', [...items, { id: crypto.randomUUID(), q: '', a: '' }])
  const removeItem = (itemIndex: number) => updateSection(index, 'items', items.filter((_: any, currentIndex: number) => currentIndex !== itemIndex))

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-bold text-gray-900">Questions and Answers</h4>
        <button type="button" onClick={addItem} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Question</button>
      </div>
      {items.map((item: any, itemIndex: number) => (
        <div key={item.id || itemIndex} className="grid grid-cols-1 gap-3 rounded-lg border p-3">
          <input
            value={item.q ?? item.question ?? ''}
            onChange={(e) => updateItem(itemIndex, 'q', e.target.value)}
            placeholder="Question"
            className="px-4 py-2 border rounded-lg"
          />
          <textarea
            value={item.a ?? item.answer ?? ''}
            onChange={(e) => updateItem(itemIndex, 'a', e.target.value)}
            placeholder="Answer"
            rows={4}
            className="px-4 py-2 border rounded-lg"
          />
          <button type="button" onClick={() => removeItem(itemIndex)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove Question</button>
        </div>
      ))}
      {items.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-gray-600">No questions yet. Add your first question and answer.</div>}
    </div>
  )
}

function MapPinsEditor({ section, index, updateSection }: any) {
  const pins = Array.isArray(section.mapPins) ? section.mapPins : []
  const updatePin = (pinIndex: number, field: string, value: any) => {
    updateSection(index, 'mapPins', pins.map((item: any, currentIndex: number) => currentIndex === pinIndex ? { ...item, [field]: value } : item))
  }
  const addPin = () => updateSection(index, 'mapPins', [...pins, makeMapPin({ label: `Location ${pins.length + 1}` })])
  const removePin = (pinIndex: number) => updateSection(index, 'mapPins', pins.filter((_: any, currentIndex: number) => currentIndex !== pinIndex))

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-gray-900">Map Pins</h4>
          <p className="text-sm text-gray-600">Add saved locations with a pin and place label pill over the map.</p>
        </div>
        <button type="button" onClick={addPin} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50">Add Pin</button>
      </div>
      {pins.map((pin: any, pinIndex: number) => (
        <div key={pin.id || pinIndex} className="space-y-3 rounded-lg border p-3">
          <input value={pin.label || ''} onChange={(e) => updatePin(pinIndex, 'label', e.target.value)} placeholder="Place name" className="w-full rounded-lg border px-4 py-2" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="grid grid-cols-[4rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">X</span>
              <input type="range" min="0" max="100" step="1" value={Number(pin.x || 50)} onChange={(e) => updatePin(pinIndex, 'x', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="100" value={pin.x ?? ''} onChange={(e) => updatePin(pinIndex, 'x', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </label>
            <label className="grid grid-cols-[4rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">Y</span>
              <input type="range" min="0" max="100" step="1" value={Number(pin.y || 50)} onChange={(e) => updatePin(pinIndex, 'y', e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="100" value={pin.y ?? ''} onChange={(e) => updatePin(pinIndex, 'y', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </label>
          </div>
          <button type="button" onClick={() => removePin(pinIndex)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Remove Pin</button>
        </div>
      ))}
      {pins.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-gray-600">No pins yet. Add a pin to show a saved location pill on top of the map.</div>}
    </div>
  )
}

function SectionSpacingControls({ section, index, updateSection }: any) {
  const spacingGroups = [
    {
      title: 'Margin',
      fields: [
        { key: 'marginTop', label: 'Top' },
        { key: 'marginRight', label: 'Right' },
        { key: 'marginBottom', label: 'Bottom' },
        { key: 'marginLeft', label: 'Left' }
      ]
    },
    {
      title: 'Padding',
      fields: [
        { key: 'paddingTop', label: 'Top' },
        { key: 'paddingRight', label: 'Right' },
        { key: 'paddingBottom', label: 'Bottom' },
        { key: 'paddingLeft', label: 'Left' }
      ]
    }
  ]

  const getNumericValue = (key: string) => {
    const value = Number(section[key] || 0)
    return Number.isFinite(value) ? value : 0
  }

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Spacing</summary>
      <div className="mt-3 space-y-5">
        {spacingGroups.map(group => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">{group.title}</h4>
            {group.fields.map(field => (
              <label key={field.key} className="grid grid-cols-[4rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                <span className="font-semibold">{field.label}</span>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="1"
                  value={getNumericValue(field.key)}
                  onChange={(e) => updateSection(index, field.key, e.target.value)}
                  className="w-full accent-blue-600"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="320"
                    value={section[field.key] ?? ''}
                    onChange={(e) => updateSection(index, field.key, e.target.value)}
                    className="w-full rounded-lg border px-2 py-1 text-right"
                    aria-label={`${group.title} ${field.label} pixels`}
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </label>
            ))}
          </div>
        ))}
      </div>
    </details>
  )
}

function SectionResponsiveControls({ section, index, updateSection }: any) {
  const devices: Array<{ key: 'tablet' | 'mobile'; label: string }> = [
    { key: 'tablet', label: 'Tablet' },
    { key: 'mobile', label: 'Mobile' }
  ]
  const spacingFields = [
    { key: 'marginTop', label: 'Margin top' },
    { key: 'marginBottom', label: 'Margin bottom' },
    { key: 'paddingTop', label: 'Padding top' },
    { key: 'paddingBottom', label: 'Padding bottom' }
  ]
  const hasColumns = ['columns', 'gallery', 'imageCards', 'portfolio', 'siteDemos', 'pluginsList', 'faq'].includes(section.type)
  const hasImageSizing = section.type === 'image'
  const hasTypography = !['divider'].includes(section.type)
  const getFieldKey = (device: 'tablet' | 'mobile', key: string) => `${device}${key.charAt(0).toUpperCase()}${key.slice(1)}`
  const getNumericValue = (device: 'tablet' | 'mobile', key: string, fallback = 0) => {
    const value = Number(section[getFieldKey(device, key)] || fallback)
    return Number.isFinite(value) ? value : fallback
  }
  const sliderControl = (device: 'tablet' | 'mobile', key: string, label: string, min: number, max: number, suffix = 'px') => (
    <label className="grid grid-cols-[6rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
      <span className="font-semibold">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={getNumericValue(device, key)}
        onChange={(e) => updateSection(index, getFieldKey(device, key), e.target.value)}
        className="w-full accent-blue-600"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max * 2}
          value={section[getFieldKey(device, key)] ?? ''}
          onChange={(e) => updateSection(index, getFieldKey(device, key), e.target.value)}
          className="w-full rounded-lg border px-2 py-1 text-right"
        />
        <span className="text-xs text-gray-500">{suffix}</span>
      </div>
    </label>
  )

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Responsive</summary>
      <div className="mt-3 space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={Boolean(section.hideOnDesktop)} onChange={(e) => updateSection(index, 'hideOnDesktop', e.target.checked)} />
            Hide on desktop
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={Boolean(section.hideOnTablet)} onChange={(e) => updateSection(index, 'hideOnTablet', e.target.checked)} />
            Hide on tablet
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={Boolean(section.hideOnMobile)} onChange={(e) => updateSection(index, 'hideOnMobile', e.target.checked)} />
            Hide on mobile
          </label>
        </div>

        {devices.map((device) => (
          <div key={device.key} className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <h4 className="text-sm font-bold text-gray-900">{device.label} Overrides</h4>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Text alignment
                <select value={section[getFieldKey(device.key, 'textAlign')] || ''} onChange={(e) => updateSection(index, getFieldKey(device.key, 'textAlign'), e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                  <option value="">Use default</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">Spacing</h5>
              {spacingFields.map((field) => sliderControl(device.key, field.key, field.label, 0, 160))}
            </div>

            {hasTypography && (
              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">Typography</h5>
                {sliderControl(device.key, 'headingFontSize', 'Heading', 16, 96)}
                {sliderControl(device.key, 'bodyFontSize', 'Body', 12, 36)}
                {sliderControl(device.key, 'buttonFontSize', 'Button', 12, 28)}
                {section.type === 'siteDemos' && (
                  <>
                    {sliderControl(device.key, 'cardMetaFontSize', 'Category', 10, 22)}
                    {sliderControl(device.key, 'cardHeadingFontSize', 'Card title', 14, 48)}
                    {sliderControl(device.key, 'cardBodyFontSize', 'Card body', 12, 28)}
                  </>
                )}
              </div>
            )}

            {hasColumns && (
              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">Layout</h5>
                <label className="grid grid-cols-[6rem_1fr] items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">Columns</span>
                  <select value={section[getFieldKey(device.key, 'columns')] || ''} onChange={(e) => updateSection(index, getFieldKey(device.key, 'columns'), e.target.value)} className="rounded-lg border px-3 py-2">
                    <option value="">Use default</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                  </select>
                </label>
              </div>
            )}

            {hasImageSizing && (
              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">Image</h5>
                {sliderControl(device.key, 'imageWidth', 'Width', 10, 100, '%')}
                {sliderControl(device.key, 'imageHeight', 'Height', 120, 1200)}
              </div>
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function SectionColorControls({ section, index, updateSection }: any) {
  const colorFields = [
    { key: 'backgroundColor', label: 'Background' },
    { key: 'headingColor', label: 'Headings' },
    { key: 'textColor', label: 'Text' },
    { key: 'buttonBackgroundColor', label: 'Button background' },
    { key: 'buttonTextColor', label: 'Button text' }
  ]
  const colorValue = (value: string) => /^#[0-9A-F]{6}$/i.test(value || '') ? value : '#000000'
  const radiusFields = [
    { key: 'borderTopLeftRadius', label: 'Top left' },
    { key: 'borderTopRightRadius', label: 'Top right' },
    { key: 'borderBottomRightRadius', label: 'Bottom right' },
    { key: 'borderBottomLeftRadius', label: 'Bottom left' }
  ]
  const getNumericValue = (key: string) => {
    const value = Number(section[key] || 0)
    return Number.isFinite(value) ? value : 0
  }
  const shadowPresets = [
    { label: 'No shadow', value: '' },
    { label: 'Soft', value: '0 10px 25px rgba(15, 23, 42, 0.12)' },
    { label: 'Medium', value: '0 18px 40px rgba(15, 23, 42, 0.18)' },
    { label: 'Large', value: '0 28px 70px rgba(15, 23, 42, 0.24)' },
    { label: 'Inner', value: 'inset 0 2px 14px rgba(15, 23, 42, 0.16)' }
  ]

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Colors</summary>
      <div className="mt-3 space-y-5">
        <div className="space-y-3">
        {colorFields.map(field => (
          <label key={field.key} className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">{field.label}</span>
            <input
              type="color"
              value={colorValue(section[field.key])}
              onChange={(e) => updateSection(index, field.key, e.target.value)}
              className="h-10 w-12 rounded border p-1"
            />
            <input
              value={section[field.key] || ''}
              onChange={(e) => updateSection(index, field.key, e.target.value)}
              placeholder="#000000"
              className="w-full rounded-lg border px-2 py-1"
            />
          </label>
        ))}
        </div>
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Additional CSS</h4>
          <label className="block text-sm font-semibold text-gray-700">
            Box shadow
            <select value={section.boxShadow || ''} onChange={(e) => updateSection(index, 'boxShadow', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
              {shadowPresets.map(preset => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
            </select>
          </label>
          <input value={section.boxShadow || ''} onChange={(e) => updateSection(index, 'boxShadow', e.target.value)} placeholder="Custom box-shadow" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Border color</span>
            <input type="color" value={colorValue(section.borderColor)} onChange={(e) => updateSection(index, 'borderColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
            <input value={section.borderColor || ''} onChange={(e) => updateSection(index, 'borderColor', e.target.value)} placeholder="#000000" className="w-full rounded-lg border px-2 py-1" />
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Border style
            <select value={section.borderStyle || 'solid'} onChange={(e) => updateSection(index, 'borderStyle', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
          </label>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Border</span>
            <input type="range" min="0" max="24" step="1" value={getNumericValue('borderWidth')} onChange={(e) => updateSection(index, 'borderWidth', e.target.value)} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="80" value={section.borderWidth ?? ''} onChange={(e) => updateSection(index, 'borderWidth', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </label>
          {radiusFields.map(field => (
            <label key={field.key} className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">{field.label}</span>
              <input type="range" min="0" max="80" step="1" value={getNumericValue(field.key)} onChange={(e) => updateSection(index, field.key, e.target.value)} className="w-full accent-blue-600" />
              <div className="flex items-center gap-1">
                <input type="number" min="0" max="240" value={section[field.key] ?? ''} onChange={(e) => updateSection(index, field.key, e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </details>
  )
}

function SectionPanelStyleControls({ section, index, updateSection, prefix, title }: any) {
  const colorValue = (value: string) => /^#[0-9A-F]{6}$/i.test(value || '') ? value : '#000000'
  const radiusFields = [
    { key: 'BorderTopLeftRadius', label: 'Top left' },
    { key: 'BorderTopRightRadius', label: 'Top right' },
    { key: 'BorderBottomRightRadius', label: 'Bottom right' },
    { key: 'BorderBottomLeftRadius', label: 'Bottom left' }
  ]
  const getNumericValue = (key: string) => {
    const value = Number(section[`${prefix}${key}`] || 0)
    return Number.isFinite(value) ? value : 0
  }
  const shadowPresets = [
    { label: 'No shadow', value: '' },
    { label: 'Soft', value: '0 10px 25px rgba(15, 23, 42, 0.12)' },
    { label: 'Medium', value: '0 18px 40px rgba(15, 23, 42, 0.18)' },
    { label: 'Large', value: '0 28px 70px rgba(15, 23, 42, 0.24)' },
    { label: 'Inner', value: 'inset 0 2px 14px rgba(15, 23, 42, 0.16)' }
  ]

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">{title} Border And Shadow</summary>
      <div className="mt-3 space-y-5">
        <label className="block text-sm font-semibold text-gray-700">
          Box shadow
          <select value={section[`${prefix}BoxShadow`] || ''} onChange={(e) => updateSection(index, `${prefix}BoxShadow`, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            {shadowPresets.map(preset => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
          </select>
        </label>
        <input value={section[`${prefix}BoxShadow`] || ''} onChange={(e) => updateSection(index, `${prefix}BoxShadow`, e.target.value)} placeholder="Custom box-shadow" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold">Border color</span>
          <input type="color" value={colorValue(section[`${prefix}BorderColor`])} onChange={(e) => updateSection(index, `${prefix}BorderColor`, e.target.value)} className="h-10 w-12 rounded border p-1" />
          <input value={section[`${prefix}BorderColor`] || ''} onChange={(e) => updateSection(index, `${prefix}BorderColor`, e.target.value)} placeholder="#000000" className="w-full rounded-lg border px-2 py-1" />
        </div>
        <label className="block text-sm font-semibold text-gray-700">
          Border style
          <select value={section[`${prefix}BorderStyle`] || 'solid'} onChange={(e) => updateSection(index, `${prefix}BorderStyle`, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </label>
        <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
          <span className="font-semibold">Border</span>
          <input type="range" min="0" max="24" step="1" value={getNumericValue('BorderWidth')} onChange={(e) => updateSection(index, `${prefix}BorderWidth`, e.target.value)} className="w-full accent-blue-600" />
          <div className="flex items-center gap-1">
            <input type="number" min="0" max="80" value={section[`${prefix}BorderWidth`] ?? ''} onChange={(e) => updateSection(index, `${prefix}BorderWidth`, e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
            <span className="text-xs text-gray-500">px</span>
          </div>
        </label>
        {radiusFields.map(field => (
          <label key={field.key} className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">{field.label}</span>
            <input type="range" min="0" max="80" step="1" value={getNumericValue(field.key)} onChange={(e) => updateSection(index, `${prefix}${field.key}`, e.target.value)} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="240" value={section[`${prefix}${field.key}`] ?? ''} onChange={(e) => updateSection(index, `${prefix}${field.key}`, e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </label>
        ))}
      </div>
    </details>
  )
}

function SectionButtonControls({ section, index, updateSection }: any) {
  const colorValue = (value: string, fallback = '#2563eb') => /^#[0-9A-F]{6}$/i.test(value || '') ? value : fallback
  const getNumericValue = (key: string, fallback = 0) => {
    const value = Number(section[key] || fallback)
    return Number.isFinite(value) ? value : fallback
  }
  const renderButtonOverrideControls = ({
    prefix,
    title,
    backgroundFallback,
    textFallback
  }: {
    prefix: 'button' | 'secondaryButton'
    title: string
    backgroundFallback: string
    textFallback: string
  }) => {
    const backgroundKey = `${prefix}BackgroundColor`
    const textKey = `${prefix}TextColor`
    const hoverKey = `${prefix}HoverBackgroundColor`
    const radiusKey = `${prefix}BorderRadius`
    const paddingXKey = `${prefix}PaddingX`
    const paddingYKey = `${prefix}PaddingY`
    const hoverEffectKey = `${prefix}HoverEffect`
    const iconKey = `${prefix}Icon`
    const iconOnlyKey = `${prefix}IconOnly`
    const showArrowKey = `${prefix}ShowArrow`

    return (
      <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          {prefix === 'secondaryButton' && <p className="mt-1 text-xs text-gray-600">Leave these blank to keep the global secondary button style.</p>}
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Icon
            <select value={section[iconKey] || ''} onChange={(e) => updateSection(index, iconKey, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
              {buttonIconOptions.map(option => <option key={option.value || 'none'} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={Boolean(section[iconOnlyKey])} onChange={(e) => updateSection(index, iconOnlyKey, e.target.checked)} />
              Icon only
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={prefix === 'secondaryButton' ? Boolean(section[showArrowKey]) : section[showArrowKey] !== false} onChange={(e) => updateSection(index, showArrowKey, e.target.checked)} />
              Show arrow
            </label>
          </div>
          <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Background</span>
            <input type="color" value={colorValue(section[backgroundKey], backgroundFallback)} onChange={(e) => updateSection(index, backgroundKey, e.target.value)} className="h-10 w-12 rounded border p-1" />
            <input value={section[backgroundKey] || ''} onChange={(e) => updateSection(index, backgroundKey, e.target.value)} placeholder={backgroundFallback} className="w-full rounded-lg border px-2 py-1" />
          </div>
          <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Text</span>
            <input type="color" value={colorValue(section[textKey], textFallback)} onChange={(e) => updateSection(index, textKey, e.target.value)} className="h-10 w-12 rounded border p-1" />
            <input value={section[textKey] || ''} onChange={(e) => updateSection(index, textKey, e.target.value)} placeholder={textFallback} className="w-full rounded-lg border px-2 py-1" />
          </div>
          <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Hover background</span>
            <input type="color" value={colorValue(section[hoverKey], section[backgroundKey] || backgroundFallback)} onChange={(e) => updateSection(index, hoverKey, e.target.value)} className="h-10 w-12 rounded border p-1" />
            <input value={section[hoverKey] || ''} onChange={(e) => updateSection(index, hoverKey, e.target.value)} placeholder={section[backgroundKey] || backgroundFallback} className="w-full rounded-lg border px-2 py-1" />
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Hover effect
            <select value={section[hoverEffectKey] || (prefix === 'secondaryButton' ? 'none' : 'lift')} onChange={(e) => updateSection(index, hoverEffectKey, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
              <option value="lift">Lift</option>
              <option value="grow">Grow</option>
              <option value="glow">Glow</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        <div className="space-y-3 border-t pt-4">
          <h5 className="text-xs font-bold uppercase tracking-wide text-gray-500">Shape And Padding</h5>
          {sliderControl(radiusKey, 'Radius', 0, 48, prefix === 'secondaryButton' ? 8 : 8)}
          {sliderControl(paddingXKey, 'Pad X', 8, 48, prefix === 'secondaryButton' ? 24 : 24)}
          {sliderControl(paddingYKey, 'Pad Y', 8, 28, prefix === 'secondaryButton' ? 12 : 12)}
        </div>
      </div>
    )
  }
  const sliderControl = (key: string, label: string, min: number, max: number, fallback = 0) => (
    <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
      <span className="font-semibold">{label}</span>
      <input type="range" min={min} max={max} step="1" value={getNumericValue(key, fallback)} onChange={(e) => updateSection(index, key, e.target.value)} className="w-full accent-blue-600" />
      <div className="flex items-center gap-1">
        <input type="number" min={min} max={max * 2} value={section[key] ?? ''} onChange={(e) => updateSection(index, key, e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
        <span className="text-xs text-gray-500">px</span>
      </div>
    </label>
  )

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Button</summary>
      <div className="mt-3 space-y-5">
        {renderButtonOverrideControls({
          prefix: 'button',
          title: section.type === 'hero' ? 'Primary Button Overrides' : 'Button Overrides',
          backgroundFallback: '#2563eb',
          textFallback: '#ffffff'
        })}
        {section.type === 'hero' && renderButtonOverrideControls({
          prefix: 'secondaryButton',
          title: 'Secondary Button Overrides',
          backgroundFallback: '#e5e7eb',
          textFallback: '#111827'
        })}
      </div>
    </details>
  )
}

function SectionTypographyControls({ section, index, updateSection }: any) {
  const getNumericValue = (key: string, fallback = 0) => {
    const value = Number(section[key] || fallback)
    return Number.isFinite(value) ? value : fallback
  }
  const fontWeights = [
    { label: 'Default', value: '' },
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Semibold', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'Black', value: '900' }
  ]

  const sizeControl = (key: string, label: string, min: number, max: number) => (
    <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
      <span className="font-semibold">{label}</span>
      <input type="range" min={min} max={max} step="1" value={getNumericValue(key)} onChange={(e) => updateSection(index, key, e.target.value)} className="w-full accent-blue-600" />
      <div className="flex items-center gap-1">
        <input type="number" min={min} max={max * 2} value={section[key] ?? ''} onChange={(e) => updateSection(index, key, e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
        <span className="text-xs text-gray-500">px</span>
      </div>
    </label>
  )

  const textShadowPresets = [
    { label: 'None', value: '' },
    { label: 'Soft', value: '0 1px 2px rgba(15, 23, 42, 0.18)' },
    { label: 'Medium', value: '0 2px 6px rgba(15, 23, 42, 0.24)' },
    { label: 'Strong', value: '0 4px 12px rgba(15, 23, 42, 0.32)' }
  ]

  const textShadowControl = (key: string, label: string) => {
    const currentValue = section[key] || ''
    const selectedValue = textShadowPresets.some((preset) => preset.value === currentValue) ? currentValue : '__custom__'
    return (
      <div className="grid gap-2 md:grid-cols-[5rem_1fr] md:items-center">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="space-y-2">
          <select value={selectedValue} onChange={(e) => updateSection(index, key, e.target.value === '__custom__' ? currentValue : e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
            {textShadowPresets.map((preset) => <option key={preset.label} value={preset.value}>{preset.label}</option>)}
            <option value="__custom__">Custom</option>
          </select>
          <input value={currentValue} onChange={(e) => updateSection(index, key, e.target.value)} placeholder="Custom text-shadow, e.g. 0 2px 8px rgba(0,0,0,0.25)" className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      </div>
    )
  }

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Typography</summary>
      <div className="mt-3 space-y-5">
        <label className="block text-sm font-semibold text-gray-700">
          Text alignment
          <select value={section.textAlign || ''} onChange={(e) => updateSection(index, 'textAlign', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            <option value="">Default</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Font Size</h4>
          {sizeControl('headingFontSize', 'Heading', 16, 96)}
          {sizeControl('bodyFontSize', 'Body', 12, 36)}
          {sizeControl('buttonFontSize', 'Button', 12, 28)}
        </div>

        {section.type === 'siteDemos' && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Demo Card Text</h4>
            {sizeControl('cardMetaFontSize', 'Category', 10, 22)}
            {sizeControl('cardHeadingFontSize', 'Card title', 14, 48)}
            {sizeControl('cardBodyFontSize', 'Card body', 12, 28)}
          </div>
        )}

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Text Shadow</h4>
          {textShadowControl('headingTextShadow', 'Heading')}
          {textShadowControl('bodyTextShadow', 'Body')}
          {textShadowControl('buttonTextShadow', 'Button')}
          {section.type === 'siteDemos' && (
            <>
              {textShadowControl('cardMetaTextShadow', 'Category')}
              {textShadowControl('cardHeadingTextShadow', 'Card title')}
              {textShadowControl('cardBodyTextShadow', 'Card body')}
            </>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Weight</h4>
          {[
            ['headingFontWeight', 'Heading'],
            ['bodyFontWeight', 'Body'],
            ['buttonFontWeight', 'Button'],
            ...(section.type === 'siteDemos' ? [['cardHeadingFontWeight', 'Card title'], ['cardBodyFontWeight', 'Card body']] : [])
          ].map(([key, label]) => (
            <label key={key} className="grid grid-cols-[5rem_1fr] items-center gap-3 text-sm text-gray-700">
              <span className="font-semibold">{label}</span>
              <select value={section[key] || ''} onChange={(e) => updateSection(index, key, e.target.value)} className="rounded-lg border px-3 py-2">
                {fontWeights.map(weight => <option key={weight.label} value={weight.value}>{weight.label}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Line Height</h4>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Heading</span>
            <input type="range" min="0.8" max="2" step="0.05" value={getNumericValue('headingLineHeight', 0)} onChange={(e) => updateSection(index, 'headingLineHeight', e.target.value)} className="w-full accent-blue-600" />
            <input type="number" min="0.8" max="3" step="0.05" value={section.headingLineHeight ?? ''} onChange={(e) => updateSection(index, 'headingLineHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
          </label>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Body</span>
            <input type="range" min="1" max="2.4" step="0.05" value={getNumericValue('bodyLineHeight', 0)} onChange={(e) => updateSection(index, 'bodyLineHeight', e.target.value)} className="w-full accent-blue-600" />
            <input type="number" min="1" max="3" step="0.05" value={section.bodyLineHeight ?? ''} onChange={(e) => updateSection(index, 'bodyLineHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
          </label>
          {section.type === 'siteDemos' && (
            <>
              <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                <span className="font-semibold">Card title</span>
                <input type="range" min="0.9" max="2" step="0.05" value={getNumericValue('cardHeadingLineHeight', 0)} onChange={(e) => updateSection(index, 'cardHeadingLineHeight', e.target.value)} className="w-full accent-blue-600" />
                <input type="number" min="0.8" max="3" step="0.05" value={section.cardHeadingLineHeight ?? ''} onChange={(e) => updateSection(index, 'cardHeadingLineHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
              </label>
              <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
                <span className="font-semibold">Card body</span>
                <input type="range" min="1" max="2.4" step="0.05" value={getNumericValue('cardBodyLineHeight', 0)} onChange={(e) => updateSection(index, 'cardBodyLineHeight', e.target.value)} className="w-full accent-blue-600" />
                <input type="number" min="1" max="3" step="0.05" value={section.cardBodyLineHeight ?? ''} onChange={(e) => updateSection(index, 'cardBodyLineHeight', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
              </label>
            </>
          )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Letter Spacing</h4>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Text</span>
            <input type="range" min="0" max="6" step="0.1" value={getNumericValue('letterSpacing')} onChange={(e) => updateSection(index, 'letterSpacing', e.target.value)} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="12" step="0.1" value={section.letterSpacing ?? ''} onChange={(e) => updateSection(index, 'letterSpacing', e.target.value)} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">px</span>
            </div>
          </label>
        </div>
      </div>
    </details>
  )
}

function SectionAnimationControls({ section, index, updateSection }: any) {
  const getNumericValue = (key: string, fallback = 0) => {
    const value = Number(section[key] ?? fallback)
    return Number.isFinite(value) ? value : fallback
  }
  const animationOptions = [
    { label: 'None', value: '' },
    { label: 'Fade in', value: 'fade-in' },
    { label: 'Slide up', value: 'slide-up' },
    { label: 'Slide left', value: 'slide-left' },
    { label: 'Slide right', value: 'slide-right' },
    { label: 'Zoom in', value: 'zoom-in' }
  ]
  const easingOptions = [
    { label: 'Ease out', value: 'ease-out' },
    { label: 'Ease in out', value: 'ease-in-out' },
    { label: 'Smooth', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { label: 'Snappy', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { label: 'Linear', value: 'linear' }
  ]

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">Animation</summary>
      <div className="mt-3 space-y-5">
        <label className="block text-sm font-semibold text-gray-700">
          Entrance animation
          <select value={section.animationType || ''} onChange={(e) => updateSection(index, 'animationType', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            {animationOptions.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          Trigger
          <select value={section.animationTrigger || 'viewport'} onChange={(e) => updateSection(index, 'animationTrigger', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            <option value="viewport">When section enters viewport</option>
            <option value="load">On page load</option>
          </select>
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          Easing
          <select value={section.animationEasing || 'ease-out'} onChange={(e) => updateSection(index, 'animationEasing', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            {easingOptions.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <div className="space-y-3 border-t pt-4">
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Duration</span>
            <input type="range" min="150" max="2000" step="50" value={getNumericValue('animationDuration', 650)} onChange={(e) => updateSection(index, 'animationDuration', Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="5000" step="50" value={section.animationDuration ?? 650} onChange={(e) => updateSection(index, 'animationDuration', Number(e.target.value || 0))} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </label>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Delay</span>
            <input type="range" min="0" max="1500" step="50" value={getNumericValue('animationDelay', 0)} onChange={(e) => updateSection(index, 'animationDelay', Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="5000" step="50" value={section.animationDelay ?? 0} onChange={(e) => updateSection(index, 'animationDelay', Number(e.target.value || 0))} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </label>
        </div>
      </div>
    </details>
  )
}

function SectionPanelAnimationControls({ section, index, updateSection, prefix, title }: any) {
  const getNumericValue = (key: string, fallback = 0) => {
    const value = Number(section[`${prefix}${key}`] ?? fallback)
    return Number.isFinite(value) ? value : fallback
  }
  const animationOptions = [
    { label: 'None', value: '' },
    { label: 'Fade in', value: 'fade-in' },
    { label: 'Slide up', value: 'slide-up' },
    { label: 'Slide left', value: 'slide-left' },
    { label: 'Slide right', value: 'slide-right' },
    { label: 'Zoom in', value: 'zoom-in' }
  ]
  const easingOptions = [
    { label: 'Ease out', value: 'ease-out' },
    { label: 'Ease in out', value: 'ease-in-out' },
    { label: 'Smooth', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { label: 'Snappy', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { label: 'Linear', value: 'linear' }
  ]

  return (
    <details className="mb-3 rounded-lg border bg-white p-3">
      <summary className="cursor-pointer text-sm font-bold text-gray-800">{title} Animation</summary>
      <div className="mt-3 space-y-5">
        <label className="block text-sm font-semibold text-gray-700">
          Entrance animation
          <select value={section[`${prefix}AnimationType`] || ''} onChange={(e) => updateSection(index, `${prefix}AnimationType`, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            {animationOptions.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Easing
          <select value={section[`${prefix}AnimationEasing`] || 'ease-out'} onChange={(e) => updateSection(index, `${prefix}AnimationEasing`, e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
            {easingOptions.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="space-y-3 border-t pt-4">
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Duration</span>
            <input type="range" min="150" max="2000" step="50" value={getNumericValue('AnimationDuration', 650)} onChange={(e) => updateSection(index, `${prefix}AnimationDuration`, Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="5000" step="50" value={section[`${prefix}AnimationDuration`] ?? 650} onChange={(e) => updateSection(index, `${prefix}AnimationDuration`, Number(e.target.value || 0))} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </label>
          <label className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold">Delay</span>
            <input type="range" min="0" max="1500" step="50" value={getNumericValue('AnimationDelay', 0)} onChange={(e) => updateSection(index, `${prefix}AnimationDelay`, Number(e.target.value))} className="w-full accent-blue-600" />
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="5000" step="50" value={section[`${prefix}AnimationDelay`] ?? 0} onChange={(e) => updateSection(index, `${prefix}AnimationDelay`, Number(e.target.value || 0))} className="w-full rounded-lg border px-2 py-1 text-right" />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </label>
        </div>
      </div>
    </details>
  )
}

function CustomPageSettingsEditor({ pageDraft, updatePageDraft, selectedPageId, previewUrl, copyPreviewLink, regeneratePreviewLink }: any) {
  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900">Page Settings</h3>
        <p className="mt-1 text-sm text-gray-600">Set the page basics, SEO details, and optional page header before arranging sections.</p>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Page title</span>
            <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Westfield" className="w-full rounded-lg border px-4 py-3" required />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Page URL</span>
            <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', normalizeCustomSlug(e.target.value))} placeholder="westfield" className="w-full rounded-lg border px-4 py-3" required />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Header title</span>
            <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Westfield" className="w-full rounded-lg border px-4 py-3" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Sort order</span>
            <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="20" className="w-full rounded-lg border px-4 py-3" />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-gray-700">Header subtitle</span>
          <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Short supporting text below the page heading" rows={4} className="min-h-28 w-full rounded-lg border px-4 py-3" />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">SEO title</span>
            <SeoTitleField value={pageDraft.metaTitle || ''} onChange={(value) => updatePageDraft('metaTitle', value)} placeholder="Web Design & Development" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">SEO description</span>
            <textarea value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="Describe what this page helps visitors find." rows={4} className="min-h-28 w-full rounded-lg border px-4 py-3" />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-gray-700">Fallback page content</span>
          <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Used if this page has no custom sections yet" rows={6} className="min-h-40 w-full rounded-lg border px-4 py-3" />
        </label>

        <label className="flex items-start gap-3 rounded-lg border bg-gray-50 px-4 py-4 font-semibold text-gray-700">
          <input className="mt-1" type="checkbox" checked={pageDraft.showPageHeader !== false} onChange={(e) => updatePageDraft('showPageHeader', e.target.checked)} />
          <span>
            <span className="block">Show top page header banner</span>
            <span className="mt-1 block text-sm font-normal text-gray-500">Turn this off if the page should begin directly with the first custom section.</span>
          </span>
        </label>

        <div className="rounded-lg border bg-blue-50 px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900">Private client preview</h4>
              <p className="mt-1 text-sm text-gray-600">
                Share an unpublished test page with a client using a private link. Only someone with the exact link can open it.
              </p>
              {selectedPageId === 'new' ? (
                <p className="mt-3 text-sm font-semibold text-blue-700">Save this page first to generate a private preview link.</p>
              ) : previewUrl ? (
                <div className="mt-3 space-y-2">
                  <input readOnly value={previewUrl} className="w-full rounded-lg border bg-white px-4 py-3 text-sm text-gray-700" />
                  <p className="text-xs text-gray-500">Tip: keep the page unpublished if you only want the private preview link to work.</p>
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-blue-700">Generate a private preview link for this page.</p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto">
              <button type="button" onClick={copyPreviewLink} disabled={selectedPageId === 'new'} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {previewUrl ? 'Copy Preview Link' : 'Generate Preview Link'}
              </button>
              {selectedPageId !== 'new' && (
                <button type="button" onClick={regeneratePreviewLink} className="rounded-lg border bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                  Regenerate Link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PageMetadataEditor({ page, fallback, metadata, legacyHeader, updatePageMetadata, updatePageHeader }: any) {
  const pageTitle = metadata.pageTitle || fallback?.label || ''
  const pageUrl = metadata.pageUrl || fallback?.url || ''
  const description = metadata.description || ''
  const headerTitle = metadata.headerTitle || legacyHeader.title || ''
  const headerSubtitle = metadata.headerSubtitle || legacyHeader.subtitle || ''

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900">Page Settings</h3>
        <p className="mt-1 text-sm text-gray-600">Fine-tune the public page title, heading copy, and SEO details for this built-in page.</p>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Page title</span>
            <input value={pageTitle} onChange={(e) => updatePageMetadata(page, 'pageTitle', e.target.value)} placeholder="Services" className="w-full rounded-lg border px-4 py-3" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Page URL</span>
            <input value={pageUrl} onChange={(e) => updatePageMetadata(page, 'pageUrl', normalizePagePath(e.target.value))} placeholder="/services" className="w-full rounded-lg border px-4 py-3" />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-gray-700">Page description</span>
          <textarea value={description} onChange={(e) => updatePageMetadata(page, 'description', e.target.value)} placeholder="Short summary for the page and preview sections" rows={4} className="min-h-28 w-full rounded-lg border px-4 py-3" />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Header title</span>
            <input
              value={headerTitle}
              onChange={(e) => {
                updatePageMetadata(page, 'headerTitle', e.target.value)
                updatePageHeader(page, 'title', e.target.value)
              }}
              placeholder="Custom Websites & Branding"
              className="w-full rounded-lg border px-4 py-3"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">SEO title</span>
            <SeoTitleField value={metadata.metaTitle || ''} onChange={(value) => updatePageMetadata(page, 'metaTitle', value)} placeholder="SEO Title" />
          </label>
        </div>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-gray-700">Header text</span>
          <textarea
            value={headerSubtitle}
            onChange={(e) => {
              updatePageMetadata(page, 'headerSubtitle', e.target.value)
              updatePageHeader(page, 'subtitle', e.target.value)
            }}
            placeholder="Supporting copy for the page heading"
            rows={4}
            className="min-h-28 w-full rounded-lg border px-4 py-3"
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-semibold text-gray-700">SEO description</span>
          <textarea value={metadata.metaDescription || ''} onChange={(e) => updatePageMetadata(page, 'metaDescription', e.target.value)} placeholder="Search result description for this page" rows={4} className="min-h-28 w-full rounded-lg border px-4 py-3" />
        </label>
      </div>
    </section>
  )
}

function SimpleCollectionEditor({ title, items, fields, emptyItem, onCreate, onUpdate, onDelete, uploadImageToField }: any) {
  const [drafts, setDrafts] = useState<any[]>([])

  useEffect(() => {
    setDrafts(items || [])
  }, [items])

  const updateDraft = (index: number, field: string, value: any) => {
    setDrafts(current => {
      const next = [...current]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addDraft = () => setDrafts(current => [...current, { ...emptyItem }])

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-gray-600">Add, edit, or remove items for this page section.</p>
        </div>
        <button type="button" onClick={addDraft} className="btn-secondary">Add Item</button>
      </div>
      <div className="space-y-3">
        {drafts.map((item, index) => (
          <div key={item.id || index} className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-2">
            {fields.map((field: string) => (
              <div key={field} className={field === 'description' ? 'md:col-span-2' : ''}>
                <textarea
                  value={item[field] || ''}
                  onChange={(e) => updateDraft(index, field, e.target.value)}
                  placeholder={field}
                  rows={field === 'description' ? 3 : 1}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                {field === 'image' && (
                  <div className="mt-2 space-y-2">
                    <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateDraft(index, 'image', url), e.target.files?.[0])} className="w-full px-3 py-2 border rounded-lg" />
                    {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || item.service || title} className="h-32 w-full rounded-lg object-cover" />}
                  </div>
                )}
              </div>
            ))}
            {'isPublished' in item && (
              <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                <input type="checkbox" checked={item.isPublished !== false} onChange={(e) => updateDraft(index, 'isPublished', e.target.checked)} />
                Published
              </label>
            )}
            {'isActive' in item && (
              <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                <input type="checkbox" checked={item.isActive !== false} onChange={(e) => updateDraft(index, 'isActive', e.target.checked)} />
                Active
              </label>
            )}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button type="button" onClick={() => item.id ? onUpdate(item) : onCreate(item)} className="btn-primary">{item.id ? 'Save Item' : 'Create Item'}</button>
              {item.id ? (
                <button type="button" onClick={() => onDelete(item)} className="btn-secondary text-red-600">Delete</button>
              ) : (
                <button type="button" onClick={() => setDrafts(current => current.filter((_, i) => i !== index))} className="btn-secondary text-red-600">Remove Draft</button>
              )}
            </div>
          </div>
        ))}
        {drafts.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600">No items yet.</div>}
      </div>
    </section>
  )
}

function ListEditor({ title, listKey, items, fields, updateListItem, addListItem, removeListItem, uploadImageToField }: any) {
  const getFeatures = (item: any) => Array.isArray(item.features)
    ? item.features
    : String(item.features || '').split('\n').filter(Boolean)

  const updateFeature = (index: number, featureIndex: number, value: string) => {
    const currentItem = items[index] || {}
    const features = [...getFeatures(currentItem)]
    features[featureIndex] = value
    updateListItem(listKey, index, 'features', features)
  }

  const addFeature = (index: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', [...getFeatures(currentItem), ''])
  }

  const removeFeature = (index: number, featureIndex: number) => {
    const currentItem = items[index] || {}
    updateListItem(listKey, index, 'features', getFeatures(currentItem).filter((_: string, i: number) => i !== featureIndex))
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {(items || []).map((item: any, index: number) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-lg p-3">
            {fields.map((field: string) => (
              <div key={field}>
                {field === 'features' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Features</p>
                    {getFeatures(item).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex gap-2">
                        <input value={feature} onChange={(e) => updateFeature(index, featureIndex, e.target.value)} placeholder="Feature" className="min-w-0 flex-1 px-4 py-2 border rounded-lg" />
                        <button type="button" onClick={() => removeFeature(index, featureIndex)} className="px-3 py-2 border rounded-lg text-red-600 hover:bg-red-50">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addFeature(index)} className="btn-secondary">Add Feature</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={Array.isArray(item[field]) ? item[field].join('\n') : item[field] || ''}
                      onChange={(e) => updateListItem(listKey, index, field, e.target.value)}
                      placeholder={field}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={field === 'description' || field === 'text' ? 3 : 1}
                    />
                    {field === 'image' && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadImageToField((url: string) => updateListItem(listKey, index, 'image', url), e.target.files?.[0])}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        {item.image && (
                          <img src={resolveAssetUrl(item.image)} alt={item.title || title} className="h-32 w-full rounded-lg object-cover" />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => removeListItem(listKey, index)} className="btn-secondary">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => addListItem(listKey)} className="btn-secondary">Add {title}</button>
      </div>
    </section>
  )
}

