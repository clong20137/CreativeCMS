import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiColumns, FiCopy, FiEye, FiEyeOff, FiFileText, FiGrid, FiImage, FiLayout, FiLink, FiList, FiMonitor, FiMove, FiRotateCcw, FiRotateCw, FiSave, FiSearch, FiSmartphone, FiTablet, FiTrash2, FiType } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import MediaPicker from '../components/MediaPicker'
import PageSections from '../components/PageSections'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'
import { normalizeRichTextHtml, sanitizeRichTextHtml } from '../utils/richText'

const publicPages = [
  { id: 'home', label: 'Homepage', url: '/' },
  { id: 'portfolio', label: 'Portfolio', url: '/portfolio' },
  { id: 'services', label: 'Services', url: '/services' },
  { id: 'pricing', label: 'Pricing', url: '/pricing' },
  { id: 'plugins', label: 'Plugins', url: '/plugins' },
  { id: 'contact', label: 'Contact', url: '/contact' }
]

const emptySettings = {
  heroTitle: '',
  heroSubtitle: '',
  heroPrimaryLabel: '',
  heroPrimaryUrl: '',
  heroSecondaryLabel: '',
  heroSecondaryUrl: '',
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
  contact: 'Contact'
}

const pluginOptions = [
  { value: 'restaurant', label: 'Restaurant Menu' },
  { value: 'real-estate', label: 'Real Estate Listings' },
  { value: 'booking', label: 'Booking Appointments' },
  { value: 'events', label: 'Events' },
  { value: 'protected-content', label: 'Protected Content' },
  { value: 'crm', label: 'CRM Quote System' }
]

const sectionTypeOptions = [
  { value: 'hero', label: 'Hero', icon: FiLayout },
  { value: 'banner', label: 'Banner', icon: FiLayout },
  { value: 'columns', label: 'Columns', icon: FiColumns },
  { value: 'header', label: 'Header', icon: FiType },
  { value: 'paragraph', label: 'Paragraph', icon: FiFileText },
  { value: 'image', label: 'Image', icon: FiImage },
  { value: 'imageCards', label: 'Image Cards', icon: FiGrid },
  { value: 'imageOverlay', label: 'Image Overlay', icon: FiImage },
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
  { value: 'cta', label: 'CTA', icon: FiLayout }
]

const nestedBlockOptions = [
  { value: 'header', label: 'Header', icon: FiType },
  { value: 'paragraph', label: 'Paragraph', icon: FiFileText },
  { value: 'image', label: 'Image', icon: FiImage },
  { value: 'imageCard', label: 'Image Card', icon: FiGrid },
  { value: 'pluginsList', label: 'Plugins List', icon: FiGrid },
  { value: 'siteDemos', label: 'Site Demos', icon: FiMonitor }
]

const MAX_IMAGE_WIDTH = 1200
const MAX_IMAGE_HEIGHT = 800
const MAX_UPLOAD_DATA_URL_LENGTH = 640_000

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

    throw new Error('This image is still too large after compression. Please use a smaller image.')
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
    body: '',
    imageUrl: '',
    mediaType: 'image',
    alt: '',
    pluginSlug: 'restaurant',
    buttonLabel: 'Get Started',
    buttonUrl: '/contact',
    secondaryButtonLabel: '',
    secondaryButtonUrl: '',
    buttonHoverBackgroundColor: '',
    buttonBorderRadius: '',
    buttonPaddingX: '',
    buttonPaddingY: '',
    buttonHoverEffect: 'lift',
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

function makeNestedBlock(type: string) {
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
    buttonUrl: '/contact'
  }

  if (type === 'pluginsList') {
    return {
      ...base,
      title: 'Plugins',
      body: '',
      columns: 1,
      itemLimit: 6
    }
  }

  if (type === 'siteDemos') {
    return {
      ...base,
      title: 'Site Demos',
      body: '',
      columns: 1,
      itemLimit: 3
    }
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

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildPageEditorInsights(page: any, sections: any[] = []) {
  let seo = 100
  let mobile = 100
  let speed = 100
  const suggestions: Array<{ category: 'SEO' | 'Mobile' | 'Speed'; text: string; priority: 'high' | 'medium' }> = []

  const title = String(page?.title || page?.pageTitle || '').trim()
  const metaTitle = String(page?.metaTitle || '').trim()
  const metaDescription = String(page?.metaDescription || '').trim()
  const slug = String(page?.slug || page?.pageUrl || '').trim()
  const headerTitle = String(page?.headerTitle || '').trim()
  const bodyText = sections.map(section => stripHtml(section?.body || '')).join(' ').trim()
  const heroSections = sections.filter(section => section?.type === 'hero')
  const imageSections = sections.filter(section => ['image', 'gallery', 'imageCards', 'imageOverlay', 'portfolio', 'portfolioGallery'].includes(section?.type))
  const missingAltCount = sections.filter(section => section?.imageUrl && !String(section?.alt || '').trim()).length

  if (!title || title.length < 4) {
    seo -= 18
    suggestions.push({ category: 'SEO', priority: 'high', text: 'Add a clear page title so search engines and visitors know what this page is about.' })
  }
  if (!metaTitle || metaTitle.length < 20 || metaTitle.length > 60) {
    seo -= 14
    suggestions.push({ category: 'SEO', priority: 'high', text: 'Keep the SEO title between about 20 and 60 characters so it has a better chance of showing cleanly in Google.' })
  }
  if (!metaDescription || metaDescription.length < 70 || metaDescription.length > 160) {
    seo -= 12
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Write a meta description around 70 to 160 characters to improve click-through rate from search.' })
  }
  if (!slug || !slug.startsWith('/')) {
    seo -= 8
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Use a clean URL path that starts with a slash, like /services or /locations.' })
  }
  if (!headerTitle && !heroSections.length) {
    seo -= 10
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'Add a visible heading or hero title so the page has a strong main heading.' })
  }
  if (bodyText.length < 140) {
    seo -= 10
    suggestions.push({ category: 'SEO', priority: 'medium', text: 'This page is still light on content. Add more useful copy to help it rank for real searches.' })
  }
  if (missingAltCount > 0) {
    seo -= Math.min(12, missingAltCount * 4)
    suggestions.push({ category: 'SEO', priority: 'medium', text: `Add alt text to ${missingAltCount} image${missingAltCount === 1 ? '' : 's'} so the page is more accessible and better described.` })
  }

  if (heroSections.some(section => Number(section?.heroHeight || 0) > 760)) {
    mobile -= 14
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'The hero is very tall. Shortening it a bit will show more content above the fold on phones.' })
  }
  if (sections.some(section => Number(section?.columns || 1) >= 3)) {
    mobile -= 10
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'Three-column layouts can feel cramped on phones. Check mobile preview and reduce columns where needed.' })
  }
  if (sections.length > 10) {
    mobile -= 8
    speed -= 6
    suggestions.push({ category: 'Mobile', priority: 'medium', text: 'This page is getting long. Combine lighter sections where possible to keep mobile scrolling focused.' })
  }

  if (heroSections.some(section => section?.mediaType === 'video')) {
    speed -= 18
    suggestions.push({ category: 'Speed', priority: 'high', text: 'Hero videos are expensive on mobile. Use them sparingly or fall back to a compressed image.' })
  }
  if (imageSections.length >= 4) {
    speed -= 10
    suggestions.push({ category: 'Speed', priority: 'medium', text: 'This page uses a lot of imagery. Make sure uploaded images are compressed and sized close to how they render.' })
  }
  if (sections.some(section => section?.animationType && section.animationType !== 'none')) {
    speed -= 6
    suggestions.push({ category: 'Speed', priority: 'medium', text: 'Multiple entrance animations can add extra work on slower devices. Use them where they matter most.' })
  }

  return {
    overall: clampScore((seo + mobile + speed) / 3),
    seo: clampScore(seo),
    mobile: clampScore(mobile),
    speed: clampScore(speed),
    suggestions: suggestions.slice(0, 6)
  }
}

function RichTextEditorField({ label, value, onChange, placeholder = 'Start typing...', minHeight = 140 }: any) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const normalized = normalizeRichTextHtml(value)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTarget, setLinkTarget] = useState<'_self' | '_blank'>('_self')
  const [linkColor, setLinkColor] = useState('#2563eb')

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized
  }, [normalized])

  const emitChange = () => {
    const nextValue = sanitizeRichTextHtml(editorRef.current?.innerHTML || '')
    onChange(nextValue)
  }

  const getActiveLink = () => {
    const selection = window.getSelection()
    const node = selection?.anchorNode
    if (!node) return null
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement
    return element?.closest('a') || null
  }

  const saveCurrentSelection = () => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return false
    const range = selection.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) return false
    savedRangeRef.current = range.cloneRange()
    return true
  }

  const restoreSelection = () => {
    const range = savedRangeRef.current
    const selection = window.getSelection()
    if (!range || !selection) return
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const applyCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand('styleWithCSS', false, command === 'foreColor' ? 'true' : 'false')
    document.execCommand(command, false, commandValue)
    emitChange()
  }

  const openLinkPopover = () => {
    const hasSelection = saveCurrentSelection()
    const activeLink = getActiveLink()
    setLinkUrl(activeLink?.getAttribute('href') || '')
    setLinkTarget(activeLink?.getAttribute('target') === '_blank' ? '_blank' : '_self')
    setLinkColor(activeLink?.style.color || '#2563eb')
    setLinkPopoverOpen(true)
    if (!hasSelection && !activeLink) {
      editorRef.current?.focus()
    }
  }

  const applyLinkSettings = () => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    restoreSelection()
    document.execCommand('styleWithCSS', false, 'false')
    if (linkUrl.trim()) {
      document.execCommand('createLink', false, linkUrl.trim())
      const activeLink = getActiveLink()
      if (activeLink) {
        if (linkTarget === '_blank') {
          activeLink.setAttribute('target', '_blank')
          activeLink.setAttribute('rel', 'noreferrer noopener')
        } else {
          activeLink.removeAttribute('target')
          activeLink.removeAttribute('rel')
        }
        activeLink.style.color = linkColor
      }
    }
    emitChange()
    setLinkPopoverOpen(false)
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-gray-700">{label}</label>}
      <div className="overflow-hidden rounded-lg border border-blue-200 shadow-sm">
        <div className="border-b bg-blue-50 px-3 py-2">
          <p className="text-sm font-bold text-blue-900">Formatting Toolbar</p>
          <p className="mt-1 text-xs text-blue-700">Highlight text, then use bold, italic, underline, links, and color.</p>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 border-b bg-gray-50 p-2">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('bold')} className="rounded border bg-white px-3 py-1 text-sm font-bold text-gray-800 hover:bg-gray-100" title="Bold">B</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('italic')} className="rounded border bg-white px-3 py-1 text-sm italic text-gray-800 hover:bg-gray-100" title="Italic">I</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('underline')} className="rounded border bg-white px-3 py-1 text-sm underline text-gray-800 hover:bg-gray-100" title="Underline">U</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('insertUnorderedList')} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Bullet list"><FiList size={14} /> Bullets</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('insertOrderedList')} className="rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Numbered list">1.</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={openLinkPopover} className="inline-flex items-center gap-1 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Add hyperlink"><FiLink size={14} /> Link</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand('unlink')} className="rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100" title="Remove hyperlink">Unlink</button>
          <label className="inline-flex items-center gap-2 rounded border bg-white px-3 py-1 text-sm font-semibold text-gray-800">
            Text Color
            <input type="color" onChange={(e) => applyCommand('foreColor', e.target.value)} className="h-7 w-8 cursor-pointer rounded border p-0" title="Change text color" />
          </label>
          {linkPopoverOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setLinkPopoverOpen(false)}>
              <div className="w-full max-w-md rounded-lg border bg-white p-4 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Link URL</label>
                  <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com or /contact" className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Open Link In</label>
                  <div className="flex gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" checked={linkTarget === '_self'} onChange={() => setLinkTarget('_self')} />
                      Existing tab
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input type="radio" checked={linkTarget === '_blank'} onChange={() => setLinkTarget('_blank')} />
                      New tab
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-600">Link Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="h-10 w-12 rounded border p-1" />
                    <input value={linkColor} onChange={(e) => setLinkColor(e.target.value)} className="flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setLinkPopoverOpen(false)} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="button" onClick={applyLinkSettings} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Apply Link</button>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emitChange}
          className="rich-text-editor min-h-[140px] bg-white px-4 py-3 text-gray-900 focus:outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  )
}

export default function AdminPages() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [settings, setSettings] = useState(emptySettings)
  const [pages, setPages] = useState<any[]>([])
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [servicePackages, setServicePackages] = useState<any[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('new')
  const [pageDraft, setPageDraft] = useState<any>({
    title: '',
    slug: '',
    headerTitle: '',
    headerSubtitle: '',
    showPageHeader: true,
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
  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null)
  const [editingSectionId, setEditingSectionId] = useState('')
  const [highlightedSectionId, setHighlightedSectionId] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [sectionsPanelOpen, setSectionsPanelOpen] = useState(true)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [unsavedPrompt, setUnsavedPrompt] = useState<{ open: boolean; href?: string; action?: () => void }>({ open: false })
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; type: string; onSelect: null | ((url: string) => void) }>({ open: false, type: 'image', onSelect: null })

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
  const activeBuiltInMetadata: Record<string, any> = activeBuiltInPageKey ? (settings.pageMetadata?.[activeBuiltInPageKey] || {}) : {}
  const activeBuiltInHeader: Record<string, any> = activeBuiltInPageKey ? (settings.pageHeaders?.[activeBuiltInPageKey] || {}) : {}
  const activeBuiltInSections = activeBuiltInPageKey ? getBuiltInSections(activeBuiltInPageKey) : []
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
        const [settingsData, pagesData] = await Promise.all([adminAPI.getSiteSettings(), adminAPI.getPages()])
        setSettings({ ...emptySettings, ...settingsData })
        setPages(pagesData)
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
    setSettings(prev => ({
      ...prev,
      pageMetadata: {
        ...(prev.pageMetadata || {}),
        [page]: {
          ...(prev.pageMetadata?.[page] || {}),
          [field]: value
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
      setUndoStack([])
      setRedoStack([])
      setMessage('Page edits saved')
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to save page edits')
    }
  }

  const startNewPage = (syncUrl = true) => {
    setActiveTab('Custom Pages')
    setSelectedPageId('new')
    setPageDraft({
      title: '',
      slug: '',
      headerTitle: '',
      headerSubtitle: '',
      showPageHeader: true,
      content: '',
      sections: [],
      metaTitle: '',
      metaDescription: '',
      isPublished: false,
      sortOrder: pages.length * 10
    })
    if (syncUrl) navigate('/admin/pages?page=new')
  }

  useEffect(() => {
    if (loading) return

    const params = new URLSearchParams(location.search)
    const pageParam = params.get('page')
    const customParam = params.get('custom')

    if (pageParam === 'new') {
      setEditingSectionId('')
      startNewPage(false)
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
        setPageDraft({ ...customPage, showPageHeader: customPage.showPageHeader !== false, sections: Array.isArray(customPage.sections) ? customPage.sections : [] })
      }
    }
  }, [location.search, loading, pages])

  const updatePageDraft = (field: string, value: any) => {
    recordHistory()
    setPageDraft((current: any) => ({
      ...current,
      [field]: value,
      ...(field === 'title' && !current.slug ? { slug: makeSlug(value) } : {})
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

  function getBuiltInSections(pageKey: string) {
    return Array.isArray(settings.pageSections?.[pageKey]) ? settings.pageSections[pageKey] : []
  }

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

  const activeSections = activeTab === 'Custom Pages' ? (pageDraft.sections || []) : activeBuiltInPageKey ? getBuiltInSections(activeBuiltInPageKey) : []
  const activePageLabel = activeTab === 'Custom Pages'
    ? (selectedPageId === 'new' ? 'New Custom Page' : pageDraft.title || 'Custom Page')
    : activeBuiltInPageKey === 'home'
      ? 'Homepage'
      : pageHeaderLabels[activeBuiltInPageKey] || 'Page'
  const addActiveSection = (type: string) => activeTab === 'Custom Pages' ? addPageSection(type) : addBuiltInSection(activeBuiltInPageKey, type)
  const updateActiveSection = (index: number, field: string, value: any) => activeTab === 'Custom Pages'
    ? updatePageSection(index, field, value)
    : updateBuiltInSection(activeBuiltInPageKey, index, field, value)
  const removeActiveSection = (index: number) => activeTab === 'Custom Pages' ? removePageSection(index) : removeBuiltInSection(activeBuiltInPageKey, index)
  const duplicateActiveSection = (index: number) => activeTab === 'Custom Pages' ? duplicatePageSection(index) : duplicateBuiltInSection(activeBuiltInPageKey, index)
  const addReusableSection = (template: any) => {
    recordHistory()
    const section = cloneSectionWithNewIds(template.section || template)
    if (activeTab === 'Custom Pages') {
      setPageDraft((current: any) => ({ ...current, sections: [...(current.sections || []), section] }))
    } else {
      updateBuiltInSections(activeBuiltInPageKey, [...getBuiltInSections(activeBuiltInPageKey), section])
    }
    markNewSection(section.id)
  }
  const saveSelectedSectionAsTemplate = () => {
    if (!selectedSection) return
    const name = window.prompt('Template name', getSectionTitle(selectedSection, selectedSectionIndex))
    if (!name) return
    recordHistory()
    const template = {
      id: crypto.randomUUID(),
      name,
      type: selectedSection.type || 'section',
      section: cloneSectionWithNewIds(selectedSection)
    }
    setSettings(prev => ({ ...prev, reusableSections: [...(prev.reusableSections || []), template] }))
    setMessage('Section saved as a reusable template. Save the page to keep it.')
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
  const saveActivePage = () => activeTab === 'Custom Pages' ? saveCustomPageEdits() : saveBuiltInPageEdits()
  const editorGridColumns = `minmax(0, 1fr) ${sectionsPanelOpen ? '23rem' : '3.25rem'}`
  const activePageSnapshot = useMemo(() => JSON.stringify(activeTab === 'Custom Pages' ? pageDraft : getActivePayload(settings, activeTab)), [activeTab, pageDraft, settings])
  const hasUnsavedChanges = Boolean(savedSnapshot) && savedSnapshot !== activePageSnapshot
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
  const pageSettingsEditor = activeTab === 'Custom Pages' ? (
    <CustomPageSettingsEditor pageDraft={pageDraft} updatePageDraft={updatePageDraft} />
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

  const saveCustomPage = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveCustomPageEdits()
  }

  useEffect(() => {
    if (!loading) {
      setSavedSnapshot(activePageSnapshot)
      setUndoStack([])
      setRedoStack([])
    }
  }, [loading, activeTab, selectedPageId])

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
      setPageDraft({ ...savedPage, showPageHeader: savedPage.showPageHeader !== false })
      setSavedSnapshot(JSON.stringify(savedPage))
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
      setPages(current => current.filter(page => String(page.id) !== selectedPageId))
      startNewPage()
      window.dispatchEvent(new Event('admin-pages-refresh'))
      setMessage('Custom page deleted')
    } catch (err: any) {
      setError(err.error || 'Failed to delete custom page')
    }
  }

  return (
    <AdminLayout title="Website Pages">
      {message && <div className="mx-2 mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mx-4 md:mb-6">{message}</div>}
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
                deleteReusableSection={deleteReusableSection}
                hasSelectedSection={Boolean(selectedSection)}
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
                  <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', makeSlug(e.target.value))} placeholder="page-url" className="px-4 py-2 border rounded-lg" required />
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

                        {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay') && (
                          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Heading" className="px-4 py-2 border rounded-lg md:col-span-2" />
                            <textarea value={section.body || ''} onChange={(e) => updatePageSection(index, 'body', e.target.value)} placeholder="Text" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                            <input value={section.buttonLabel || ''} onChange={(e) => updatePageSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
                            <input value={section.buttonUrl || ''} onChange={(e) => updatePageSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
                            {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updatePageSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />}
                            {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updatePageSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />}
                            {section.type !== 'cta' && <input value={section.imageUrl || ''} onChange={(e) => updatePageSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            {section.type !== 'cta' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url) => updatePageSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                            {section.imageUrl && section.type !== 'cta' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
                          </div>
                        )}

                        {(section.type === 'header' || section.type === 'section' || section.type === 'services') && (
                          <input value={section.title || ''} onChange={(e) => updatePageSection(index, 'title', e.target.value)} placeholder="Section title" className="mb-3 w-full px-4 py-2 border rounded-lg" />
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
      <MediaPicker
        isOpen={mediaPicker.open}
        type={mediaPicker.type}
        onClose={() => setMediaPicker({ open: false, type: 'image', onSelect: null })}
        onSelect={(url) => {
          mediaPicker.onSelect?.(url)
          setMessage('Media selected. Save to publish it.')
        }}
      />
      <FloatingPageActions
        isCustomPage={activeTab === 'Custom Pages'}
        isSavedCustomPage={activeTab === 'Custom Pages' && selectedPageId !== 'new'}
        isPublished={Boolean(pageDraft.isPublished)}
        updatePublished={(value: boolean) => updatePageDraft('isPublished', value)}
        savePage={saveActivePage}
        deletePage={deleteCustomPage}
      />
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
    </AdminLayout>
  )
}

function FloatingPageActions({ isCustomPage, isSavedCustomPage, isPublished, updatePublished, savePage, deletePage }: any) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-[90] lg:inset-x-auto lg:bottom-5 lg:right-5">
      <div className="ml-auto flex max-w-xl flex-wrap items-center gap-2 rounded-xl border bg-white/95 p-2.5 shadow-2xl backdrop-blur md:gap-3 md:p-3">
        {isCustomPage && (
          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 md:text-sm">
            <input type="checkbox" checked={Boolean(isPublished)} onChange={(e) => updatePublished(e.target.checked)} />
            Published
          </label>
        )}
        {isSavedCustomPage && (
          <button type="button" onClick={deletePage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-red-700 lg:flex-none">
            <FiTrash2 />
            <span className="hidden sm:inline">Delete Page</span>
            <span className="sm:hidden">Delete</span>
          </button>
        )}
        <button type="button" onClick={savePage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-blue-700 lg:flex-none">
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
    <div className="rounded-lg border bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
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
      <div className="mt-3 space-y-2">
        {insights.suggestions.slice(0, 3).map((item: any, index: number) => (
          <div key={`${item.category}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{item.category}</p>
            <p className="mt-1 text-xs text-gray-700">{item.text}</p>
          </div>
        ))}
        {insights.suggestions.length === 0 && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">This page is in a solid place. Keep an eye on images and metadata as you publish updates.</p>}
      </div>
    </div>
  )
}

function PagePreviewPanel({ title, sections, draggingSectionIndex, setDraggingSectionIndex, moveSection, setEditingSectionId, clearSelection, highlightedSectionId, previewMode, setPreviewMode, canUndo, canRedo, undoPageChange, redoPageChange, onDrop, emptyText, insights }: any) {
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
              <div
                key={section.id || index}
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
                className={`relative cursor-pointer transition ${draggingSectionIndex === index ? 'scale-[0.99] opacity-60 ring-2 ring-blue-500' : highlightedSectionId === (section.id || String(index)) ? 'animate-pulse ring-4 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-blue-300'}`}
                title={`Edit ${getSectionTitle(section, index)}`}
              >
                <div className="absolute left-3 top-3 z-10 rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white shadow">
                  {index + 1}
                </div>
                {section.isHidden ? (
                  <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-600">
                    <FiEyeOff className="mx-auto mb-2" />
                    <p className="font-bold">{getSectionTitle(section, index)} is hidden</p>
                    <p className="text-sm">It will not appear on the live page until you show it again.</p>
                  </div>
                ) : <PageSections sections={[section]} />}
              </div>
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

function SectionBlockLibrary({ addSection, reusableSections = [], addReusableSection, saveSelectedSectionAsTemplate, deleteReusableSection, hasSelectedSection }: any) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [sectionSearch, setSectionSearch] = useState('')
  const filteredSections = sectionTypeOptions.filter(option => option.label.toLowerCase().includes(sectionSearch.trim().toLowerCase()))
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
            Save Selected
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
            {reusableSections.map((template: any) => {
              const Icon = sectionTypeOptions.find(option => option.value === template.type)?.icon || FiLayout
              return (
                <div key={template.id} className="w-32 shrink-0 rounded-lg border bg-white p-2 text-center">
                  <button type="button" onClick={() => addReusableSection(template)} className="flex min-h-20 w-full flex-col items-center justify-center gap-2 rounded-md text-xs font-semibold hover:bg-blue-50 hover:text-blue-700">
                    <Icon size={20} />
                    <span className="leading-tight">{template.name}</span>
                  </button>
                  <button type="button" onClick={() => deleteReusableSection(template.id)} className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700">Remove</button>
                </div>
              )
            })}
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
        <div className="space-y-4 overflow-auto p-4 pb-8">
          {editor}
        </div>
      </div>
    </section>
  )
}

function SectionInspector({ title, section, index, updateSection, removeSection, duplicateSection, uploadImageToField, openMediaPicker, isOpen = true, setIsOpen = () => {} }: any) {
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
            <span className="block text-sm text-gray-600">{getSectionTitle(section, index)}</span>
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
        <SectionColorControls section={section} index={index} updateSection={updateSection} />
        {['banner', 'hero', 'cta', 'imageOverlay'].includes(section.type) && <SectionButtonControls section={section} index={index} updateSection={updateSection} />}
        <SectionTypographyControls section={section} index={index} updateSection={updateSection} />
        <SectionAnimationControls section={section} index={index} updateSection={updateSection} />

        {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay') && (
          <div className="space-y-3">
            <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Heading" className="w-full px-4 py-2 border rounded-lg" />
            <RichTextEditorField label="Text" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Add text, links, and color..." minHeight={120} />
            <input value={section.buttonLabel || ''} onChange={(e) => updateSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.buttonUrl || ''} onChange={(e) => updateSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="w-full px-4 py-2 border rounded-lg" />
            {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updateSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updateSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
            {section.type !== 'cta' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />}
            {section.imageUrl && section.type !== 'cta' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-40 w-full rounded-lg object-cover" />}
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
                    <input value={section.crmBackgroundImageUrl || ''} onChange={(e) => updateSection(index, 'crmBackgroundImageUrl', e.target.value)} placeholder="CRM background image URL" className="w-full px-4 py-2 border rounded-lg" />
                    <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'crmBackgroundImageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose CRM background</button>
                    <textarea value={section.crmServices || ''} onChange={(e) => updateSection(index, 'crmServices', e.target.value)} placeholder="Services, one per line" rows={4} className="w-full px-4 py-2 border rounded-lg" />
                    <textarea value={section.crmDetailsPlaceholder || ''} onChange={(e) => updateSection(index, 'crmDetailsPlaceholder', e.target.value)} placeholder="Details field placeholder" rows={3} className="w-full px-4 py-2 border rounded-lg" />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {(section.type === 'header' || section.type === 'section' || section.type === 'services') && (
          <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
        )}

        {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services') && (
          <RichTextEditorField label="Text content" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Format certain words, add links, and set colors..." minHeight={160} />
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
                <input value={section.crmEyebrow || ''} onChange={(e) => updateSection(index, 'crmEyebrow', e.target.value)} placeholder="CRM eyebrow" className="w-full px-4 py-2 border rounded-lg" />
                <input value={section.crmPanelTitle || ''} onChange={(e) => updateSection(index, 'crmPanelTitle', e.target.value)} placeholder="Left panel title" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={section.crmPanelText || ''} onChange={(e) => updateSection(index, 'crmPanelText', e.target.value)} placeholder="Left panel text" rows={3} className="w-full px-4 py-2 border rounded-lg" />
                <input value={section.crmFormTitle || ''} onChange={(e) => updateSection(index, 'crmFormTitle', e.target.value)} placeholder="Form title" className="w-full px-4 py-2 border rounded-lg" />
                <textarea value={section.crmServices || ''} onChange={(e) => updateSection(index, 'crmServices', e.target.value)} placeholder="Services, one per line" rows={5} className="w-full px-4 py-2 border rounded-lg" />
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
      <RichTextEditorField label="Section description" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Section description..." minHeight={120} />
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

            {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay') && (
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Heading" className="px-4 py-2 border rounded-lg md:col-span-2" />
                <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text" rows={3} className="px-4 py-2 border rounded-lg md:col-span-2" />
                <input value={section.buttonLabel || ''} onChange={(e) => updateSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="px-4 py-2 border rounded-lg" />
                <input value={section.buttonUrl || ''} onChange={(e) => updateSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="px-4 py-2 border rounded-lg" />
                {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updateSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="px-4 py-2 border rounded-lg" />}
                {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updateSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="px-4 py-2 border rounded-lg" />}
                {section.type !== 'cta' && <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="px-4 py-2 border rounded-lg md:col-span-2" />}
                {section.type !== 'cta' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="px-4 py-2 border rounded-lg md:col-span-2" />}
                {section.imageUrl && section.type !== 'cta' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-48 w-full rounded-lg object-cover md:col-span-2" />}
              </div>
            )}

            {(section.type === 'header' || section.type === 'section' || section.type === 'services') && (
              <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="mb-3 w-full px-4 py-2 border rounded-lg" />
            )}

            {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services') && (
              <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text content" rows={4} className="mb-3 w-full px-4 py-2 border rounded-lg" />
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
          <RichTextEditorField label="Section description" value={section.body || ''} onChange={(value: string) => updateSection(index, 'body', value)} placeholder="Section description..." minHeight={120} />
        </div>
      </div>
      {columns.map((column, columnIndex) => (
        <div key={column.id || columnIndex} className="space-y-3 rounded-lg border p-3">
          <h4 className="font-bold text-gray-900">Column {columnIndex + 1}</h4>
          <div className="grid grid-cols-2 gap-2">
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
  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm text-gray-900">{block.type}</strong>
        <button type="button" onClick={() => removeBlock(columnIndex, blockIndex)} className="text-sm font-semibold text-red-600">Remove</button>
      </div>
      {(block.type === 'header' || block.type === 'imageCard') && <input value={block.title || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'title', e.target.value)} placeholder="Header" className="w-full px-4 py-2 border rounded-lg" />}
      {block.type === 'imageCard' && <input value={block.category || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'category', e.target.value)} placeholder="Category / small heading" className="w-full px-4 py-2 border rounded-lg" />}
      {(block.type === 'paragraph' || block.type === 'header') && <RichTextEditorField label="Text" value={block.body || ''} onChange={(value: string) => updateBlock(columnIndex, blockIndex, 'body', value)} placeholder="Format text..." minHeight={120} />}
      {(block.type === 'pluginsList' || block.type === 'siteDemos') && (
        <>
          <input value={block.title || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
          <RichTextEditorField label="Text" value={block.body || ''} onChange={(value: string) => updateBlock(columnIndex, blockIndex, 'body', value)} placeholder="Optional description..." minHeight={120} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input type="number" min="1" max="6" value={block.columns || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="w-full px-4 py-2 border rounded-lg" />
            <input type="number" min="1" value={block.itemLimit || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'itemLimit', Number(e.target.value || 0))} placeholder={block.type === 'siteDemos' ? 'Demos to show' : 'Plugins to show'} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </>
      )}
      {block.type === 'imageCard' && <textarea value={block.description || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'description', e.target.value)} placeholder="Subtext" rows={2} className="w-full px-4 py-2 border rounded-lg" />}
      {(block.type === 'image' || block.type === 'imageCard') && (
        <>
          <input value={block.imageUrl || block.image || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', e.target.value)} placeholder="Image URL" className="w-full px-4 py-2 border rounded-lg" />
          {openMediaPicker && <button type="button" onClick={() => openMediaPicker((url: string) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', url), 'image')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
          <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateBlock(columnIndex, blockIndex, block.type === 'imageCard' ? 'image' : 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
          {(block.imageUrl || block.image) && <img src={resolveAssetUrl(block.imageUrl || block.image)} alt={block.title || ''} className="h-32 w-full rounded-lg object-cover" />}
        </>
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
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_3rem_6rem] items-center gap-2 text-sm text-gray-700">
            <span className="font-semibold">Hover background</span>
            <input type="color" value={colorValue(section.buttonHoverBackgroundColor, section.buttonBackgroundColor || '#1d4ed8')} onChange={(e) => updateSection(index, 'buttonHoverBackgroundColor', e.target.value)} className="h-10 w-12 rounded border p-1" />
            <input value={section.buttonHoverBackgroundColor || ''} onChange={(e) => updateSection(index, 'buttonHoverBackgroundColor', e.target.value)} placeholder="#1d4ed8" className="w-full rounded-lg border px-2 py-1" />
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Hover effect
            <select value={section.buttonHoverEffect || 'lift'} onChange={(e) => updateSection(index, 'buttonHoverEffect', e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
              <option value="lift">Lift</option>
              <option value="grow">Grow</option>
              <option value="glow">Glow</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Shape And Padding</h4>
          {sliderControl('buttonBorderRadius', 'Radius', 0, 48, 8)}
          {sliderControl('buttonPaddingX', 'Pad X', 8, 48, 24)}
          {sliderControl('buttonPaddingY', 'Pad Y', 8, 28, 12)}
        </div>
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

function CustomPageSettingsEditor({ pageDraft, updatePageDraft }: any) {
  return (
    <section className="rounded-lg border p-5">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Page Settings</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Page title" className="px-4 py-3 border rounded-lg" required />
        <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', makeSlug(e.target.value))} placeholder="page-url" className="px-4 py-3 border rounded-lg" required />
        <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Header title" className="px-4 py-3 border rounded-lg" />
        <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="Sort order" className="px-4 py-3 border rounded-lg" />
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Header subtitle</label>
          <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Short supporting text below the page heading" rows={4} className="min-h-28 w-full px-4 py-3 border rounded-lg" />
        </div>
        <input value={pageDraft.metaTitle || ''} onChange={(e) => updatePageDraft('metaTitle', e.target.value)} placeholder="SEO title" className="px-4 py-3 border rounded-lg" />
        <input value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="SEO description" className="px-4 py-3 border rounded-lg" />
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Fallback page content</label>
          <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Used if this page has no custom sections yet" rows={6} className="min-h-40 w-full px-4 py-3 border rounded-lg" />
        </div>
        <label className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 font-semibold text-gray-700">
          <input type="checkbox" checked={pageDraft.showPageHeader !== false} onChange={(e) => updatePageDraft('showPageHeader', e.target.checked)} />
          Show top page header banner
        </label>
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
    <section className="rounded-lg border p-5">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Page Settings</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input value={pageTitle} onChange={(e) => updatePageMetadata(page, 'pageTitle', e.target.value)} placeholder="Page Title" className="px-4 py-3 border rounded-lg" />
        <input value={pageUrl} onChange={(e) => updatePageMetadata(page, 'pageUrl', e.target.value)} placeholder="Page URL" className="px-4 py-3 border rounded-lg" />
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Page description</label>
          <textarea value={description} onChange={(e) => updatePageMetadata(page, 'description', e.target.value)} placeholder="Short summary for the page and preview sections" rows={4} className="min-h-28 w-full px-4 py-3 border rounded-lg" />
        </div>
        <input
          value={headerTitle}
          onChange={(e) => {
            updatePageMetadata(page, 'headerTitle', e.target.value)
            updatePageHeader(page, 'title', e.target.value)
          }}
          placeholder="Header Title"
          className="px-4 py-3 border rounded-lg"
        />
        <input value={metadata.metaTitle || ''} onChange={(e) => updatePageMetadata(page, 'metaTitle', e.target.value)} placeholder="SEO Title" className="px-4 py-3 border rounded-lg" />
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">Header text</label>
          <textarea
            value={headerSubtitle}
            onChange={(e) => {
              updatePageMetadata(page, 'headerSubtitle', e.target.value)
              updatePageHeader(page, 'subtitle', e.target.value)
            }}
            placeholder="Supporting copy for the page heading"
            rows={4}
            className="min-h-28 w-full px-4 py-3 border rounded-lg"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700">SEO description</label>
          <textarea value={metadata.metaDescription || ''} onChange={(e) => updatePageMetadata(page, 'metaDescription', e.target.value)} placeholder="Search result description for this page" rows={4} className="min-h-28 w-full px-4 py-3 border rounded-lg" />
        </div>
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
