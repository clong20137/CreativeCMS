import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCamera, FiCheck, FiMail, FiMapPin, FiMessageSquare, FiMonitor, FiPenTool, FiPhone, FiVideo } from 'react-icons/fi'
import Testimonials from './Testimonials'
import TurnstileWidget from './TurnstileWidget'
import { contactMessagesAPI, formSubmissionsAPI, pluginsAPI, portfolioAPI, resolveAssetUrl, servicePackagesAPI, siteDemosAPI, siteSettingsAPI } from '../services/api'
import { normalizeRichTextHtml, sanitizeRichTextHtml } from '../utils/richText'

declare global {
  interface Window {
    L?: any
    __creativeCmsLeafletLoader?: Promise<any>
  }
}

const pluginLabels: Record<string, string> = {
  restaurant: 'Restaurant Menu',
  'real-estate': 'Real Estate Listings',
  booking: 'Booking Appointments',
  events: 'Events',
  blog: 'Blog & Articles',
  'protected-content': 'Protected Content',
  crm: 'CRM Quote System',
  plugins: 'Website Plugins'
}

const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

function escapeHtmlForAttribute(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function loadLeafletLibrary() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet can only load in the browser'))
  if (window.L) return Promise.resolve(window.L)
  if (window.__creativeCmsLeafletLoader) return window.__creativeCmsLeafletLoader

  window.__creativeCmsLeafletLoader = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = LEAFLET_CSS_URL
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector(`script[src="${LEAFLET_SCRIPT_URL}"]`) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L))
      existingScript.addEventListener('error', () => reject(new Error('Leaflet failed to load')))
      return
    }

    const script = document.createElement('script')
    script.src = LEAFLET_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Leaflet failed to load'))
    document.body.appendChild(script)
  })

  return window.__creativeCmsLeafletLoader
}

async function geocodeLocation(query: string) {
  const trimmed = String(query || '').trim()
  if (!trimmed || typeof window === 'undefined') return null
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmed)}`, {
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) return null
    const results = await response.json()
    const match = Array.isArray(results) ? results[0] : null
    if (!match) return null
    return {
      lat: Number(match.lat),
      lng: Number(match.lon)
    }
  } catch (error) {
    return null
  }
}

function clampColumns(value: any, fallback = 1) {
  const numeric = Number(value || fallback)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(6, Math.max(1, Math.round(numeric)))
}

function getResponsiveGridStyle(section: any, fallback = 1) {
  const desktop = clampColumns(section?.columns, fallback)
  const tablet = clampColumns(section?.tabletColumns, desktop)
  const mobile = clampColumns(section?.mobileColumns, 1)

  return {
    '--responsive-cols-desktop': String(desktop),
    '--responsive-cols-tablet': String(tablet),
    '--responsive-cols-mobile': String(mobile)
  } as CSSProperties
}

type ResponsiveMode = 'desktop' | 'tablet' | 'mobile'

const RESPONSIVE_FIELD_KEYS = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'textAlign',
  'headingFontSize',
  'bodyFontSize',
  'buttonFontSize',
  'cardMetaFontSize',
  'cardHeadingFontSize',
  'cardBodyFontSize',
  'columns',
  'imageWidth',
  'imageHeight',
  'imageAlignX',
  'imageAlignY'
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getResponsiveModeFromWidth(width: number): ResponsiveMode {
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function getResponsiveValue(section: any, key: string, mode: ResponsiveMode) {
  if (mode === 'desktop') return section?.[key]
  const overrideKey = `${mode}${capitalize(key)}`
  const overrideValue = section?.[overrideKey]
  return overrideValue === '' || overrideValue === null || overrideValue === undefined ? section?.[key] : overrideValue
}

function isExternalOrSpecialUrl(value?: string) {
  const url = String(value || '').trim()
  return url.startsWith('http://')
    || url.startsWith('https://')
    || url.startsWith('mailto:')
    || url.startsWith('tel:')
    || url.startsWith('#')
}

function getVerticalAlignmentClass(value?: string) {
  if (value === 'top') return 'items-start'
  if (value === 'bottom') return 'items-end'
  return 'items-center'
}

function renderLinkedHeading(url: string | undefined, content: ReactNode, className: string) {
  const href = String(url || '').trim()
  if (!href) return <span className={className}>{content}</span>
  if (isExternalOrSpecialUrl(href)) {
    return <a href={href} className={className}>{content}</a>
  }
  return <Link to={href} className={className}>{content}</Link>
}

function extractPlainText(value: string) {
  if (!value) return ''
  if (typeof window === 'undefined') return value.replace(/<[^>]+>/g, ' ').trim()
  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<div>${value}</div>`, 'text/html')
  return documentNode.body.textContent?.replace(/\s+/g, ' ').trim() || ''
}

function EditableHeadingText({ section, fallbackText = '' }: { section: any; fallbackText?: string }) {
  const editorRef = useRef<HTMLSpanElement | null>(null)
  const editableMeta = section?.__liveEdit
  const isEditable = Boolean(editableMeta?.titleEditable)
  const rawHtml = section?.titleHtml || section?.title || fallbackText
  const normalized = normalizeRichTextHtml(rawHtml)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !isEditable) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized
  }, [normalized, isEditable])

  if (isEditable) {
    return (
      <span
        id={`editable-heading-${section.id}`}
        ref={editorRef}
        contentEditable
        draggable={false}
        suppressContentEditableWarning
        data-placeholder="Double-click and start typing..."
        className="preview-editable-heading inline-block min-w-[2rem] rounded px-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => {
          event.stopPropagation()
          editorRef.current?.focus()
        }}
        onInput={() => {
          const html = sanitizeRichTextHtml(editorRef.current?.innerHTML || '')
          editableMeta?.onTitleChange?.(html, extractPlainText(html))
        }}
        dangerouslySetInnerHTML={{ __html: normalized || fallbackText || '' }}
      />
    )
  }

  if (section?.titleHtml) {
    return <span className="inline" dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(section.titleHtml) }} />
  }

  return <>{section?.title || fallbackText}</>
}

function EditableRichTextContent({
  section,
  className = '',
  fallbackHtml = ''
}: {
  section: any
  className?: string
  fallbackHtml?: string
}) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const editableMeta = section?.__liveEdit
  const isEditable = Boolean(editableMeta?.bodyEditable)
  const rawHtml = section?.body || fallbackHtml
  const normalized = normalizeRichTextHtml(rawHtml)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !isEditable) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== normalized) editor.innerHTML = normalized
  }, [normalized, isEditable])

  if (isEditable) {
    return (
      <div
        id={`editable-body-${section.id}`}
        ref={editorRef}
        contentEditable
        draggable={false}
        suppressContentEditableWarning
        data-placeholder="Double-click and edit text..."
        className={`preview-editable-body rich-text-content rounded px-1 focus:outline-none focus:ring-2 focus:ring-blue-300 ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => {
          event.stopPropagation()
          editorRef.current?.focus()
        }}
        onInput={() => {
          const html = sanitizeRichTextHtml(editorRef.current?.innerHTML || '')
          editableMeta?.onBodyChange?.(html, extractPlainText(html))
        }}
        dangerouslySetInnerHTML={{ __html: normalized }}
      />
    )
  }

  return <RichTextContent html={rawHtml} className={className} />
}

function resolveResponsiveSection(section: any, mode: ResponsiveMode) {
  if (!section || mode === 'desktop') return section
  const nextSection = { ...section }
  RESPONSIVE_FIELD_KEYS.forEach((key) => {
    nextSection[key] = getResponsiveValue(section, key, mode)
  })
  return nextSection
}

function isSectionVisible(section: any, mode: ResponsiveMode) {
  if (!section || section.isHidden) return false
  if (mode === 'mobile' && section.hideOnMobile) return false
  if (mode === 'tablet' && section.hideOnTablet) return false
  if (mode === 'desktop' && section.hideOnDesktop) return false
  return true
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

function resolveSyncedSection(section: any, reusableSections: any[] = []) {
  if (!section?.syncedBlockId) return section
  const template = reusableSections.find((item: any) => item.id === section.syncedBlockId && item.kind === 'synced')
  if (!template?.section) return section
  return {
    ...stripSyncedBlockMeta(template.section),
    id: section.id || template.section.id,
    syncedBlockId: template.id,
    syncedBlockName: template.name || template.section.title || 'Synced Block',
    isSyncedBlockInstance: true,
    syncedBlockUpdatedAt: template.updatedAt || section.syncedBlockUpdatedAt || ''
  }
}

export default function PageSections({
  sections,
  previewMode,
  reusableSections: reusableSectionsProp,
  selectedSectionId,
  onSelectNestedSection
}: {
  sections?: any[]
  previewMode?: ResponsiveMode
  reusableSections?: any[]
  selectedSectionId?: string
  onSelectNestedSection?: (sectionId: string) => void
}) {
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>(() => previewMode || (typeof window !== 'undefined' ? getResponsiveModeFromWidth(window.innerWidth) : 'desktop'))
  const [reusableSections, setReusableSections] = useState<any[]>(() => Array.isArray(reusableSectionsProp) ? reusableSectionsProp : [])

  useEffect(() => {
    if (previewMode) {
      setResponsiveMode(previewMode)
      return
    }
    if (typeof window === 'undefined') return
    const handleResize = () => setResponsiveMode(getResponsiveModeFromWidth(window.innerWidth))
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [previewMode])

  useEffect(() => {
    if (Array.isArray(reusableSectionsProp)) {
      setReusableSections(reusableSectionsProp)
      return
    }
    const hasSyncedSections = Array.isArray(sections) && sections.some((section: any) => section?.syncedBlockId)
    if (!hasSyncedSections) return
    siteSettingsAPI.getSettings()
      .then((settings) => setReusableSections(Array.isArray(settings?.reusableSections) ? settings.reusableSections : []))
      .catch(() => setReusableSections([]))
  }, [reusableSectionsProp, sections])

  const visibleSections = useMemo(() => {
    const list = Array.isArray(sections) ? sections : []
    return list
      .map(section => resolveSyncedSection(section, reusableSections))
      .filter(section => isSectionVisible(section, responsiveMode))
      .map(section => resolveResponsiveSection(section, responsiveMode))
  }, [sections, reusableSections, responsiveMode])

  if (visibleSections.length === 0) return null

  return (
    <div>
      {visibleSections.map((section, index) => (
        <AnimatedSection key={section.id || index} section={section}>
          <PageSection section={section} selectedSectionId={selectedSectionId} onSelectNestedSection={onSelectNestedSection} />
        </AnimatedSection>
      ))}
    </div>
  )
}

function getAlignmentClasses(textAlign?: string) {
  if (textAlign === 'left') return { container: 'text-left', body: '' }
  if (textAlign === 'right') return { container: 'text-right', body: 'ml-auto' }
  return { container: 'text-center', body: 'mx-auto' }
}

function getButtonIcon(icon?: string) {
  if (icon === 'phone') return FiPhone
  if (icon === 'mail') return FiMail
  if (icon === 'message') return FiMessageSquare
  if (icon === 'map') return FiMapPin
  if (icon === 'video') return FiVideo
  if (icon === 'monitor') return FiMonitor
  return null
}

function ButtonContent({
  label,
  icon,
  iconOnly,
  showArrow
}: {
  label?: string
  icon?: string
  iconOnly?: boolean
  showArrow?: boolean
}) {
  const Icon = getButtonIcon(icon)
  const text = label || 'Button'

  return (
    <>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {!iconOnly ? <span>{text}</span> : <span className="sr-only">{text}</span>}
      {showArrow ? <FiArrowRight aria-hidden="true" /> : null}
    </>
  )
}

function getYoutubeEmbedUrl(value?: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw.includes('/embed/')) return raw

  try {
    const url = new URL(raw)
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace(/\//g, '')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
  } catch {
    return ''
  }

  return ''
}

function getImageLayout(section: any) {
  const width = Math.min(100, Math.max(10, Number(section.imageWidth || 100)))
  const height = Math.min(1200, Math.max(120, Number(section.imageHeight || 480)))
  const horizontal = ['left', 'center', 'right'].includes(section.imageAlignX) ? section.imageAlignX : 'center'
  const vertical = ['top', 'center', 'bottom'].includes(section.imageAlignY) ? section.imageAlignY : 'center'

  return {
    width,
    height,
    horizontal,
    vertical,
    wrapperClass:
      horizontal === 'left'
        ? 'justify-start'
        : horizontal === 'right'
          ? 'justify-end'
          : 'justify-center',
    objectPosition:
      `${horizontal === 'left' ? 'left' : horizontal === 'right' ? 'right' : 'center'} ${vertical === 'top' ? 'top' : vertical === 'bottom' ? 'bottom' : 'center'}`
  }
}

function getPanelStyle(section: any, prefix: 'textPanel' | 'imagePanel') {
  const toPixels = (value: any) => {
    if (value === '' || value === null || value === undefined) return undefined
    const number = Number(value)
    return Number.isFinite(number) ? `${number}px` : undefined
  }

  return {
    boxShadow: section[`${prefix}BoxShadow`] || undefined,
    borderWidth: toPixels(section[`${prefix}BorderWidth`]),
    borderColor: section[`${prefix}BorderColor`] || undefined,
    borderStyle: section[`${prefix}BorderWidth`] ? (section[`${prefix}BorderStyle`] || 'solid') : undefined,
    borderTopLeftRadius: toPixels(section[`${prefix}BorderTopLeftRadius`]),
    borderTopRightRadius: toPixels(section[`${prefix}BorderTopRightRadius`]),
    borderBottomRightRadius: toPixels(section[`${prefix}BorderBottomRightRadius`]),
    borderBottomLeftRadius: toPixels(section[`${prefix}BorderBottomLeftRadius`]),
    overflow: (
      section[`${prefix}BorderTopLeftRadius`] ||
      section[`${prefix}BorderTopRightRadius`] ||
      section[`${prefix}BorderBottomRightRadius`] ||
      section[`${prefix}BorderBottomLeftRadius`]
    ) ? 'hidden' : undefined
  } as CSSProperties
}

function getChildAnimationProps(section: any, prefix: 'textPanel' | 'imagePanel') {
  const animationType = section[`${prefix}AnimationType`] || ''
  const animationDuration = Number(section[`${prefix}AnimationDuration`] || 650)
  const animationDelay = Number(section[`${prefix}AnimationDelay`] || 0)
  const animationEasing = section[`${prefix}AnimationEasing`] || 'ease-out'

  return {
    className: animationType ? 'section-child-animated is-visible' : '',
    dataAnimation: animationType || 'none',
    style: {
      '--section-animation-duration': `${animationDuration}ms`,
      '--section-animation-delay': `${animationDelay}ms`,
      '--section-animation-easing': animationEasing
    } as CSSProperties
  }
}

function AnimatedSection({ section, children }: { section: any; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const hasAnimation = Boolean(section.animationType && section.animationType !== 'none')
  const [isVisible, setIsVisible] = useState(!hasAnimation || section.animationTrigger !== 'viewport')

  useEffect(() => {
    if (!hasAnimation || section.animationTrigger !== 'viewport') {
      setIsVisible(true)
      return
    }

    const target = ref.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.18 })

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasAnimation, section.animationTrigger, section.animationType])

  return (
    <div
      ref={ref}
      className={`page-section-render ${hasAnimation ? 'page-section-animated' : ''} ${isVisible ? 'is-visible' : ''}`}
      data-animation={section.animationType || 'none'}
      style={getSectionSpacingStyle(section)}
    >
      {children}
    </div>
  )
}

function getSectionSpacingStyle(section: any) {
  const toPixels = (value: any) => {
    if (value === '' || value === null || value === undefined) return undefined
    const number = Number(value)
    return Number.isFinite(number) ? `${number}px` : undefined
  }
  const toUnitless = (value: any) => {
    if (value === '' || value === null || value === undefined) return undefined
    const number = Number(value)
    return Number.isFinite(number) ? String(number) : undefined
  }
  const hoverEffect = section.buttonHoverEffect || 'lift'
  const hoverTransform = hoverEffect === 'grow'
    ? 'scale(1.04)'
    : hoverEffect === 'glow'
      ? 'translateY(-1px)'
      : hoverEffect === 'none'
        ? 'none'
        : 'translateY(-2px)'
  const hoverShadow = hoverEffect === 'glow'
    ? '0 16px 36px rgba(37, 99, 235, 0.28)'
    : hoverEffect === 'lift'
      ? '0 12px 24px rgba(15, 23, 42, 0.16)'
      : hoverEffect === 'grow'
        ? '0 10px 20px rgba(15, 23, 42, 0.14)'
        : 'none'
  const secondaryHoverEffect = section.secondaryButtonHoverEffect || 'none'
  const secondaryHoverTransform = secondaryHoverEffect === 'grow'
    ? 'scale(1.04)'
    : secondaryHoverEffect === 'glow'
      ? 'translateY(-1px)'
      : secondaryHoverEffect === 'lift'
        ? 'translateY(-2px)'
        : 'none'
  const secondaryHoverShadow = secondaryHoverEffect === 'glow'
    ? '0 16px 36px rgba(37, 99, 235, 0.28)'
    : secondaryHoverEffect === 'lift'
      ? '0 12px 24px rgba(15, 23, 42, 0.16)'
      : secondaryHoverEffect === 'grow'
        ? '0 10px 20px rgba(15, 23, 42, 0.14)'
        : 'none'
  const defaultVerticalPadding = ['hero', 'banner', 'imageOverlay'].includes(section.type) ? undefined : 'calc(4rem * var(--theme-spacing-scale, 1))'
  const resolvedPaddingTop = toPixels(section.paddingTop) ?? defaultVerticalPadding
  const resolvedPaddingBottom = toPixels(section.paddingBottom) ?? defaultVerticalPadding

  return {
    marginTop: toPixels(section.marginTop),
    marginRight: toPixels(section.marginRight),
    marginBottom: toPixels(section.marginBottom),
    marginLeft: toPixels(section.marginLeft),
    paddingTop: resolvedPaddingTop,
    paddingRight: toPixels(section.paddingRight),
    paddingBottom: resolvedPaddingBottom,
    paddingLeft: toPixels(section.paddingLeft),
    backgroundColor: section.backgroundColor || undefined,
    color: section.textColor || undefined,
    boxShadow: section.boxShadow || undefined,
    borderWidth: toPixels(section.borderWidth),
    borderColor: section.borderColor || undefined,
    borderStyle: section.borderWidth ? (section.borderStyle || 'solid') : undefined,
    borderTopLeftRadius: toPixels(section.borderTopLeftRadius),
    borderTopRightRadius: toPixels(section.borderTopRightRadius),
    borderBottomRightRadius: toPixels(section.borderBottomRightRadius),
    borderBottomLeftRadius: toPixels(section.borderBottomLeftRadius),
    overflow: (section.borderTopLeftRadius || section.borderTopRightRadius || section.borderBottomRightRadius || section.borderBottomLeftRadius) ? 'hidden' : undefined,
    '--section-heading-color': section.headingColor || undefined,
    '--section-text-color': section.textColor || undefined,
    '--section-button-bg': section.buttonBackgroundColor || undefined,
    '--section-button-text': section.buttonTextColor || undefined,
    '--section-button-hover-bg': section.buttonHoverBackgroundColor || section.buttonBackgroundColor || undefined,
    '--section-button-box-shadow': section.buttonBoxShadow || undefined,
    '--section-button-radius': toPixels(section.buttonBorderRadius),
    '--section-button-px': toPixels(section.buttonPaddingX),
    '--section-button-py': toPixels(section.buttonPaddingY),
    '--section-button-hover-transform': hoverTransform,
    '--section-button-hover-shadow': hoverShadow,
    '--section-secondary-button-bg': section.secondaryButtonBackgroundColor || undefined,
    '--section-secondary-button-text': section.secondaryButtonTextColor || undefined,
    '--section-secondary-button-hover-bg': section.secondaryButtonHoverBackgroundColor || section.secondaryButtonBackgroundColor || undefined,
    '--section-secondary-button-radius': toPixels(section.secondaryButtonBorderRadius),
    '--section-secondary-button-px': toPixels(section.secondaryButtonPaddingX),
    '--section-secondary-button-py': toPixels(section.secondaryButtonPaddingY),
    '--section-secondary-button-hover-transform': secondaryHoverTransform,
    '--section-secondary-button-hover-shadow': secondaryHoverShadow,
    '--section-text-align': section.textAlign || undefined,
    '--section-heading-size': toPixels(section.headingFontSize),
    '--section-body-size': toPixels(section.bodyFontSize),
    '--section-button-size': toPixels(section.buttonFontSize),
    '--section-card-meta-size': toPixels(section.cardMetaFontSize),
    '--section-card-heading-size': toPixels(section.cardHeadingFontSize),
    '--section-card-body-size': toPixels(section.cardBodyFontSize),
    '--section-heading-shadow': section.headingTextShadow || undefined,
    '--section-body-shadow': section.bodyTextShadow || undefined,
    '--section-button-shadow': section.buttonTextShadow || undefined,
    '--section-card-meta-shadow': section.cardMetaTextShadow || undefined,
    '--section-card-heading-shadow': section.cardHeadingTextShadow || undefined,
    '--section-card-body-shadow': section.cardBodyTextShadow || undefined,
    '--section-heading-weight': section.headingFontWeight || undefined,
    '--section-body-weight': section.bodyFontWeight || undefined,
    '--section-button-weight': section.buttonFontWeight || undefined,
    '--section-card-heading-weight': section.cardHeadingFontWeight || undefined,
    '--section-card-body-weight': section.cardBodyFontWeight || undefined,
    '--section-heading-line-height': toUnitless(section.headingLineHeight),
    '--section-body-line-height': toUnitless(section.bodyLineHeight),
    '--section-card-heading-line-height': toUnitless(section.cardHeadingLineHeight),
    '--section-card-body-line-height': toUnitless(section.cardBodyLineHeight),
    '--section-letter-spacing': toPixels(section.letterSpacing),
    '--section-animation-duration': `${Number(section.animationDuration || 650)}ms`,
    '--section-animation-delay': `${Number(section.animationDelay || 0)}ms`,
    '--section-animation-easing': section.animationEasing || 'ease-out'
  } as CSSProperties
}

function PageSection({
  section,
  selectedSectionId,
  onSelectNestedSection
}: {
  section: any
  selectedSectionId?: string
  onSelectNestedSection?: (sectionId: string) => void
}) {
  if (section.type === 'banner') {
    const HeadingTag = (section.headingTag || 'h2') as ElementType
    const verticalClass = getVerticalAlignmentClass(section.contentVerticalAlign)
    const alignment = getAlignmentClasses(section.textAlign)
    return (
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-blue-950/55"></div>
        <div className={`container relative flex min-h-[30rem] ${verticalClass} py-20 md:min-h-[36rem] md:py-28 ${alignment.container}`}>
          <div className="max-w-3xl">
            <HeadingTag className="text-4xl font-bold md:text-6xl">
              {section.titleHtml
                ? <EditableHeadingText section={section} />
                : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
            </HeadingTag>
            {section.body && <EditableRichTextContent section={section} className={`${alignment.body} mt-6 text-xl text-blue-100`.trim()} />}
            {section.buttonLabel && section.buttonUrl && (
              <Link to={section.buttonUrl} className="section-button mt-8 inline-flex items-center justify-center gap-2" aria-label={section.buttonLabel || 'Button'}>
                <ButtonContent label={section.buttonLabel} icon={section.buttonIcon} iconOnly={section.buttonIconOnly} showArrow={section.buttonShowArrow} />
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === 'header') {
    const alignment = getAlignmentClasses(section.textAlign)
    const HeadingTag = (section.headingTag || 'h2') as ElementType
    return (
      <section className="section-padding">
        <div className={`container ${alignment.container}`}>
          <HeadingTag className="mb-12 text-4xl font-bold text-gray-900">
            {section.titleHtml
              ? <EditableHeadingText section={section} />
              : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
          </HeadingTag>
          {section.body && <EditableRichTextContent section={section} className={`${alignment.body} -mt-8 max-w-3xl text-lg text-gray-600`.trim()} />}
        </div>
      </section>
    )
  }

  if (section.type === 'image') {
    const imageLayout = getImageLayout(section)
    return (
      <section className="section-padding">
        <div className={`container flex max-w-5xl ${imageLayout.wrapperClass}`}>
          <figure>
            <img
              src={resolveAssetUrl(section.imageUrl)}
              alt={section.alt || section.title || ''}
              loading="lazy"
              decoding="async"
              className="rounded-lg object-cover"
              style={{
                width: `${imageLayout.width}%`,
                height: `${imageLayout.height}px`,
                objectPosition: imageLayout.objectPosition
              }}
            />
            {(section.title || section.body) && (
              <figcaption className="mt-3 text-sm text-gray-600">
                {section.title && <strong className="text-gray-900">{section.title}</strong>} {section.body}
              </figcaption>
            )}
          </figure>
        </div>
      </section>
    )
  }

  if (section.type === 'button') {
    return <ButtonSection section={section} />
  }

  if (section.type === 'map') {
    return <InteractiveMapSection section={section} />
  }

  if (section.type === 'youtube') {
    return <YoutubeSection section={section} />
  }

  if (section.type === 'imageStrip') {
    return <ImageStripSection section={section} />
  }

  if (section.type === 'divider') {
    const width = Math.min(100, Math.max(10, Number(section.dividerWidth || 100)))
    const height = Math.min(20, Math.max(1, Number(section.dividerHeight || 1)))
    const marginTop = Math.max(0, Number(section.dividerMarginTop || 0))
    const marginBottom = Math.max(0, Number(section.dividerMarginBottom || 0))
    const justifyClass = section.dividerAlign === 'left'
      ? 'justify-start'
      : section.dividerAlign === 'right'
        ? 'justify-end'
        : 'justify-center'

    return (
      <section className="section-padding">
        <div className={`container flex ${justifyClass}`}>
          <div
            aria-hidden="true"
            className="w-full"
            style={{
              width: `${width}%`,
              marginTop: `${marginTop}px`,
              marginBottom: `${marginBottom}px`,
              borderTopWidth: `${height}px`,
              borderTopStyle: section.dividerStyle || 'solid',
              borderTopColor: section.dividerColor || '#d1d5db'
            }}
          />
        </div>
      </section>
    )
  }

  if (section.type === 'plugin') return <EmbeddedPluginSection section={section} />
  if (section.type === 'testimonials') return <TestimonialsSection />
  if (section.type === 'portfolio') return <PortfolioSection section={section} />
  if (section.type === 'services') return <ServicesSection section={section} />
  if (section.type === 'hero') return <HeroSection section={section} />
  if (section.type === 'columns') return <ColumnsSection section={section} selectedSectionId={selectedSectionId} onSelectNestedSection={onSelectNestedSection} />
  if (section.type === 'imageCards') return <ImageCardsSection section={section} />
  if (section.type === 'imageOverlay') return <ImageOverlaySection section={section} />
  if (section.type === 'gallery') return <GallerySection section={section} />
  if (section.type === 'whatWeDo') return <WhatWeDoSection section={section} />
  if (section.type === 'featuredWork') return <FeaturedWorkSection section={section} />
  if (section.type === 'portfolioGallery') return <PortfolioGallerySection section={section} />
  if (section.type === 'servicesList') return <ServicesListSection section={section} />
  if (section.type === 'pricingPackages') return <PricingPackagesSection section={section} />
  if (section.type === 'servicePricing') return <ServicePricingSection section={section} />
  if (section.type === 'faq') return <FaqSection section={section} />
  if (section.type === 'pluginsList') return <PluginsListSection section={section} />
  if (section.type === 'siteDemos') return <SiteDemosSection section={section} />
  if (section.type === 'contactForm') return <ContactFormSection />
  if (section.type === 'customForm') return <CustomFormSection section={section} />
  if (section.type === 'cta') return <CtaSection section={section} />

  if (section.type === 'section') {
    const isImageFirst = section.imageOrder === 'image-first'
    const textPanelStyle = getPanelStyle(section, 'textPanel')
    const imagePanelStyle = getPanelStyle(section, 'imagePanel')
    const textAnimation = getChildAnimationProps(section, 'textPanel')
    const imageAnimation = getChildAnimationProps(section, 'imagePanel')
    const alignment = getAlignmentClasses(section.textAlign)
    const HeadingTag = (section.headingTag || 'h2') as ElementType
    const verticalClass = section.contentVerticalAlign === 'top'
      ? 'md:items-start'
      : section.contentVerticalAlign === 'bottom'
        ? 'md:items-end'
        : 'md:items-center'
    const textBlock = (
      <div className={`${textAnimation.className} ${alignment.container}`.trim()} data-animation={textAnimation.dataAnimation} style={{ ...textPanelStyle, ...textAnimation.style }}>
        {section.title && (
          <HeadingTag className="text-3xl font-bold text-gray-900">
            {section.titleHtml
              ? <EditableHeadingText section={section} />
              : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
          </HeadingTag>
        )}
        {section.body && <EditableRichTextContent section={section} className={`${alignment.body} mt-3 text-gray-600`.trim()} />}
      </div>
    )
    const imageBlock = section.imageUrl
      ? (
        <div className={imageAnimation.className} data-animation={imageAnimation.dataAnimation} style={{ ...imagePanelStyle, ...imageAnimation.style }}>
          <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || ''} className="w-full rounded-lg object-cover" />
        </div>
      )
      : null

    return (
      <section className="section-padding">
        <div className="container">
          <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${verticalClass}`}>
            {isImageFirst ? imageBlock : textBlock}
            {isImageFirst ? textBlock : imageBlock}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-padding">
      <div className="container max-w-4xl">
        <RichTextContent html={section.body} className="text-lg leading-relaxed text-gray-700" />
      </div>
    </section>
  )
}

export function RichTextContent({ html, className = '' }: { html?: string; className?: string }) {
  const normalized = normalizeRichTextHtml(html)
  if (!normalized) return null
  return <div className={`rich-text-content ${className}`.trim()} dangerouslySetInnerHTML={{ __html: normalized }} />
}

function ColumnsSection({ section, selectedSectionId, onSelectNestedSection }: { section: any; selectedSectionId?: string; onSelectNestedSection?: (sectionId: string) => void }) {
  const count = Math.min(6, Math.max(1, Number(section.columns || 2)))
  const rowCount = Math.min(6, Math.max(1, Number(section.rows || 1)))
  const existingCells = Array.isArray(section.items) ? section.items : []
  const cells = Array.from({ length: count * rowCount }, (_, index) => {
    const row = Math.floor(index / count)
    const column = index % count
    const matchedCell = existingCells.find((item: any) => Number(item?.row) === row && Number(item?.column) === column) || existingCells[index] || {}
    return {
      id: matchedCell.id || `${row}-${column}`,
      row,
      column,
      sections: Array.isArray(matchedCell.sections) ? matchedCell.sections : []
    }
  })

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        <div className="responsive-grid gap-6" style={getResponsiveGridStyle(section, count || 2)}>
          {cells.map((cell: any, index: number) => (
            <div key={cell.id || index} className="space-y-5">
              {(cell.sections || []).map((block: any, blockIndex: number) => (
                <ColumnBlock key={block.id || blockIndex} block={block} selectedSectionId={selectedSectionId} onSelectNestedSection={onSelectNestedSection} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PreviewSelectableBlock({ block, children }: { block: any; children: ReactNode }) {
  const selection = block?.__previewSelection

  if (!selection) return <>{children}</>

  return (
    <div className={`group relative rounded-lg transition ${selection.isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-blue-300/80 hover:ring-offset-2'}`}>
      {!selection.isSelected && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            selection.onSelect?.()
          }}
          className="absolute inset-0 z-10 rounded-lg"
          aria-label={`Edit ${block?.title || block?.buttonLabel || block?.type || 'block'}`}
        />
      )}
      <div className={selection.isSelected ? 'relative z-20' : ''}>{children}</div>
    </div>
  )
}

function ColumnBlock({ block, selectedSectionId, onSelectNestedSection }: { block: any; selectedSectionId?: string; onSelectNestedSection?: (sectionId: string) => void }) {
  const renderWithSelection = (content: ReactNode) => {
    if (!content) return null
    return <PreviewSelectableBlock block={block}>{content}</PreviewSelectableBlock>
  }

  if (block.type === 'header') {
    const HeadingTag = (block.headingTag || 'h3') as ElementType
    return renderWithSelection(
      <div>
        {block.title && (
          <HeadingTag className="text-2xl font-bold text-gray-900">
            {block.titleHtml
              ? <EditableHeadingText section={block} />
              : renderLinkedHeading(block.titleLinkUrl, <EditableHeadingText section={block} />, 'inline')}
          </HeadingTag>
        )}
        {block.body && <EditableRichTextContent section={block} className="mt-2 text-gray-600" />}
      </div>
    )
  }

  if (block.type === 'image') {
    return block.imageUrl ? renderWithSelection(<img src={resolveAssetUrl(block.imageUrl)} alt={block.alt || block.title || ''} loading="lazy" decoding="async" className="w-full rounded-lg object-cover" />) : null
  }

  if (block.type === 'button') {
    return block.buttonLabel && block.buttonUrl
      ? renderWithSelection(
        <Link to={block.buttonUrl} className="section-button inline-flex items-center justify-center gap-2" aria-label={block.buttonLabel || 'Button'}>
          <ButtonContent label={block.buttonLabel} icon={block.buttonIcon} iconOnly={block.buttonIconOnly} showArrow={block.buttonShowArrow} />
        </Link>
      )
      : null
  }

  if (block.type === 'imageCard') {
    return renderWithSelection(<ImageCard item={block} />)
  }

  if (block.type === 'pluginsList') {
    return renderWithSelection(<ColumnPluginsListBlock block={block} />)
  }

  if (block.type === 'siteDemos') {
    return renderWithSelection(<ColumnSiteDemosBlock block={block} />)
  }

  if (block.type === 'map') {
    return renderWithSelection(<InteractiveMapSection section={block} inColumn />)
  }

  if (block.type === 'youtube') {
    return renderWithSelection(<YoutubeSection section={block} inColumn />)
  }

  if (block.type === 'imageStrip') {
    return renderWithSelection(<ImageStripSection section={block} inColumn />)
  }

  if (block.type !== 'paragraph') {
    return renderWithSelection(<PageSection section={block} selectedSectionId={selectedSectionId} onSelectNestedSection={onSelectNestedSection} />)
  }

  return renderWithSelection(<EditableRichTextContent section={block} className="text-gray-700" />)
}

function ButtonSection({ section }: { section: any }) {
  const justifyClass = section.textAlign === 'left'
    ? 'justify-start'
    : section.textAlign === 'right'
      ? 'justify-end'
      : 'justify-center'
  const buttons = Array.isArray(section.buttons) && section.buttons.length > 0
    ? section.buttons
    : (section.buttonLabel && section.buttonUrl
        ? [{
            id: section.id || 'primary',
            buttonLabel: section.buttonLabel,
            buttonUrl: section.buttonUrl,
            buttonIcon: section.buttonIcon,
            buttonIconOnly: section.buttonIconOnly,
            buttonShowArrow: section.buttonShowArrow
          }]
        : [])

  if (buttons.length === 0) return null

  return (
    <section className="section-padding">
      <div className={`container flex flex-wrap ${justifyClass}`} style={{ gap: `${Math.max(8, Number(section.buttonGroupGap || 12))}px` }}>
        {buttons.map((button: any, index: number) => (
          <Link key={button.id || index} to={button.buttonUrl} className="section-button inline-flex items-center justify-center gap-2" aria-label={button.buttonLabel || 'Button'}>
            <ButtonContent label={button.buttonLabel} icon={button.buttonIcon} iconOnly={button.buttonIconOnly} showArrow={button.buttonShowArrow} />
          </Link>
        ))}
      </div>
    </section>
  )
}

function getMapEmbedSrc(section: any) {
  const embedUrl = String(section?.mapEmbedUrl || '').trim()
  if (embedUrl) return embedUrl
  const query = String(section?.mapQuery || '').trim()
  if (!query) return ''
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`
}

function LeafletLocationMap({ section, height }: { section: any; height: number }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const zoomSyncRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)
  const [resolvedLocations, setResolvedLocations] = useState<any[]>([])
  const onZoomChange = section?.__liveMap?.onZoomChange

  const pins = useMemo(() => Array.isArray(section.mapPins) ? section.mapPins : [], [section.mapPins])

  useEffect(() => {
    let isMounted = true

    const resolveLocations = async () => {
      const nextLocations = await Promise.all(pins.map(async (pin: any) => {
        const lat = Number(pin.lat)
        const lng = Number(pin.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { ...pin, lat, lng }
        }
        const geocoded = await geocodeLocation(pin.query || pin.label || '')
        if (!geocoded) return null
        return { ...pin, ...geocoded }
      }))
      if (isMounted) setResolvedLocations(nextLocations.filter(Boolean))
    }

    resolveLocations()
    return () => {
      isMounted = false
    }
  }, [pins])

  useEffect(() => {
    let isMounted = true
    loadLeafletLibrary()
      .then(() => {
        if (isMounted) setReady(true)
      })
      .catch(() => {
        if (isMounted) setReady(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!ready || !mapElementRef.current || !window.L) return

    if (!mapRef.current) {
      mapRef.current = window.L.map(mapElementRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: true
      })
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current)
      markerLayerRef.current = window.L.layerGroup().addTo(mapRef.current)
      mapRef.current.on('zoomend', () => {
        const nextZoom = Number(mapRef.current?.getZoom?.())
        if (!Number.isFinite(nextZoom) || zoomSyncRef.current === nextZoom) return
        zoomSyncRef.current = nextZoom
        onZoomChange?.(nextZoom)
      })
    }

    const map = mapRef.current
    const markerLayer = markerLayerRef.current
    markerLayer.clearLayers()

    const points = resolvedLocations
      .map((pin: any) => [Number(pin.lat), Number(pin.lng)] as [number, number])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))

    resolvedLocations.forEach((pin: any) => {
      if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return
      const marker = window.L.marker([pin.lat, pin.lng], {
        icon: window.L.divIcon({
          className: 'creativecms-leaflet-pin-wrap',
          html: `<span class="creativecms-leaflet-pin" style="--map-pin-color:${escapeHtmlForAttribute(pin.pinColor || '#2563eb')}"><span class="creativecms-leaflet-pin-dot"></span></span>`,
          iconSize: [28, 36],
          iconAnchor: [14, 34],
          tooltipAnchor: [0, -26]
        })
      }).addTo(markerLayer)
      marker.bindTooltip(
        `<span class="creativecms-map-pill-inner" style="background:${escapeHtmlForAttribute(pin.pillBackgroundColor || '#ffffff')};color:${escapeHtmlForAttribute(pin.pillTextColor || '#111827')};border-color:${escapeHtmlForAttribute(pin.pinColor || '#2563eb')}">${escapeHtmlForAttribute(pin.label || 'Location')}</span>`,
        {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
        className: 'creativecms-map-pill',
        opacity: 1
      })
    })

    if (points.length > 1) {
      map.fitBounds(points, { padding: [30, 30] })
      if (Number.isFinite(Number(section.mapZoom))) map.setZoom(Number(section.mapZoom))
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(12, Number(section.mapZoom || 14)))
    } else if (section.mapQuery) {
      geocodeLocation(section.mapQuery).then((center) => {
        if (center) map.setView([center.lat, center.lng], Math.max(10, Number(section.mapZoom || 13)))
      })
    } else {
      map.setView([39.8283, -98.5795], 4)
    }

    window.setTimeout(() => map.invalidateSize(), 0)
    zoomSyncRef.current = Number(map.getZoom?.())

    return () => {
      if (markerLayerRef.current) markerLayerRef.current.clearLayers()
    }
  }, [ready, resolvedLocations, section.mapQuery, section.mapZoom, onZoomChange])

  useEffect(() => () => {
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  return <div ref={mapElementRef} className="w-full" style={{ height: `${height}px` }} />
}

function ImageStripSection({ section, inColumn = false }: { section: any; inColumn?: boolean }) {
  const items = Array.isArray(section.items) ? section.items : []
  const justifyClass = section.imageStripJustify === 'left'
    ? 'justify-start'
    : section.imageStripJustify === 'right'
      ? 'justify-end'
      : 'justify-center'
  const alignClass = section.imageStripAlign === 'top'
    ? 'items-start'
    : section.imageStripAlign === 'bottom'
      ? 'items-end'
      : 'items-center'
  const gap = Math.max(8, Number(section.imageStripGap || 24))
  const imageHeight = Math.max(40, Number(section.imageStripHeight || 96))

  const content = (
    <>
      <SectionHeading section={section} fallbackTitle={inColumn ? '' : 'Image Strip'} compact={inColumn} />
      <div className={`flex flex-wrap ${justifyClass} ${alignClass}`} style={{ gap: `${gap}px` }}>
        {items.map((item: any, index: number) => {
          const image = String(item.image || '').trim()
          if (!image) return null
          const imageElement = (
            <img
              src={resolveAssetUrl(image)}
              alt={item.alt || item.title || `Image ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="w-auto object-contain"
              style={{ maxHeight: `${imageHeight}px` }}
            />
          )
          const href = String(item.url || '').trim()
          return (
            <div key={item.id || index} className="flex items-center justify-center">
              {href ? (
                isExternalOrSpecialUrl(href)
                  ? <a href={href} className="inline-flex items-center justify-center" target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}>{imageElement}</a>
                  : <Link to={href} className="inline-flex items-center justify-center">{imageElement}</Link>
              ) : imageElement}
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-gray-600">
            Add images in the page builder to create a linked image strip here.
          </div>
        )}
      </div>
    </>
  )

  if (inColumn) return content

  return (
    <section className="section-padding">
      <div className="container">
        {content}
      </div>
    </section>
  )
}

function InteractiveMapSection({ section, inColumn = false }: { section: any; inColumn?: boolean }) {
  const src = getMapEmbedSrc(section)
  const height = Math.min(1200, Math.max(220, Number(section.mapHeight || 420)))
  const pins = Array.isArray(section.mapPins) ? section.mapPins : []
  const hasLocationPins = pins.some((pin: any) => String(pin.query || '').trim() || (pin.lat !== '' && pin.lng !== ''))
  const content = (
    <>
      <SectionHeading section={section} fallbackTitle="Find Us" compact={inColumn} />
      {hasLocationPins ? (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <LeafletLocationMap section={section} height={height} />
        </div>
      ) : src ? (
        <div className="relative overflow-hidden rounded-lg border bg-white shadow-sm">
          <iframe
            title={section.title || section.mapQuery || 'Interactive map'}
            src={src}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full border-0"
            style={{ height: `${height}px` }}
          />
          {pins.length > 0 && (
            <div className="pointer-events-none absolute inset-0">
              {pins.map((pin: any, index: number) => {
                const left = Math.min(95, Math.max(5, Number(pin.x || 50)))
                const top = Math.min(92, Math.max(8, Number(pin.y || 50)))
                return (
                  <div
                    key={pin.id || index}
                    className="absolute -translate-x-1/2 -translate-y-full"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <div
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 ring-black/5"
                      style={{
                        backgroundColor: pin.pillBackgroundColor || 'rgba(255,255,255,0.95)',
                        color: pin.pillTextColor || '#111827'
                      }}
                    >
                      <FiMapPin style={{ color: pin.pinColor || '#2563eb' }} />
                      <span>{pin.label || 'Location'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-gray-600">
          Add a map address or embed URL in the page builder to show an interactive map here.
        </div>
      )}
    </>
  )

  if (inColumn) return <div className="space-y-4">{content}</div>

  return <section className="section-padding"><div className="container">{content}</div></section>
}

function YoutubeSection({ section, inColumn = false }: { section: any; inColumn?: boolean }) {
  const src = getYoutubeEmbedUrl(section.videoUrl)
  const height = Math.min(1200, Math.max(220, Number(section.videoHeight || 420)))
  const content = (
    <>
      <SectionHeading section={section} fallbackTitle="Watch Video" compact={inColumn} />
      {src ? (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <iframe
            title={section.title || 'YouTube video'}
            src={src}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full border-0"
            style={{ height: `${height}px` }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-gray-600">
          Add a YouTube URL in the page builder to show an embedded video here.
        </div>
      )}
    </>
  )

  if (inColumn) return <div className="space-y-4">{content}</div>

  return <section className="section-padding"><div className="container">{content}</div></section>
}

function ColumnPluginsListBlock({ block }: { block: any }) {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const limit = Number(block.itemLimit || 6)
  const count = Number(block.columns || 1)

  useEffect(() => {
    pluginsAPI.getPlugins()
      .then(setPlugins)
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <SectionHeading section={block} fallbackTitle="Plugins" />
      {loading ? (
        <div className="text-gray-600">Loading plugins...</div>
      ) : (
        <div className="responsive-grid gap-4" style={getResponsiveGridStyle(block, count || 1)}>
          {plugins.slice(0, limit).map((plugin) => (
            <div key={plugin.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">{plugin.name}</h3>
              {plugin.description && <p className="mt-2 text-gray-600">{plugin.description}</p>}
              {plugin.demoUrl && <Link to={plugin.demoUrl} className="btn-primary mt-4 inline-flex">View Demo</Link>}
            </div>
          ))}
          {plugins.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-gray-600">No plugins are available yet.</div>}
        </div>
      )}
    </div>
  )
}

function ColumnSiteDemosBlock({ block }: { block: any }) {
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const limit = Number(block.itemLimit || 3)
  const count = Number(block.columns || 1)

  useEffect(() => {
    siteDemosAPI.getDemos()
      .then(setDemos)
      .catch(() => setDemos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <SectionHeading section={block} fallbackTitle="Site Demos" />
      {loading ? (
        <div className="text-gray-600">Loading site demos...</div>
      ) : (
        <div className="responsive-grid gap-4" style={getResponsiveGridStyle(block, count || 1)}>
          {demos.slice(0, limit).map((demo) => (
            <article key={demo.id || demo.slug} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              {demo.previewImage && <img src={resolveAssetUrl(demo.previewImage)} alt={demo.name} loading="lazy" decoding="async" className="h-48 w-full object-cover" />}
              <div className="p-5">
                <p className="site-demo-card-meta text-xs font-bold uppercase tracking-wide text-blue-600">{demo.category}</p>
                <h3 className="site-demo-card-heading mt-2 text-2xl font-bold text-gray-900">{demo.name}</h3>
                {demo.description && <p className="site-demo-card-body mt-3 text-gray-600">{demo.description}</p>}
                <Link to={demo.demoUrl} className="btn-primary mt-4 inline-flex items-center gap-2">
                  View Demo <FiArrowRight />
                </Link>
              </div>
            </article>
          ))}
          {demos.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-gray-600">No site demos are available yet.</div>}
        </div>
      )}
    </div>
  )
}

function ImageCardsSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Image Cards" />
        <div className="responsive-grid gap-8" style={getResponsiveGridStyle(section, 2)}>
          {items.map((item: any, index: number) => <ImageCard key={item.id || index} item={item} />)}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2">No image cards have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function ImageCard({ item }: { item: any }) {
  return (
    <article className="card overflow-hidden">
      {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || ''} loading="lazy" decoding="async" className="h-64 w-full object-cover" />}
      {item.imageUrl && !item.image && <img src={resolveAssetUrl(item.imageUrl)} alt={item.title || ''} loading="lazy" decoding="async" className="h-64 w-full object-cover" />}
      <div className="p-6">
        {(item.category || item.subtitle) && <p className="text-sm font-semibold text-blue-600">{item.category || item.subtitle}</p>}
        {item.title && <h3 className="mt-2 text-2xl font-bold text-gray-900">{item.title}</h3>}
        {(item.description || item.body) && <p className="mt-3 text-gray-600">{item.description || item.body}</p>}
        {item.buttonLabel && item.buttonUrl && (
          <Link to={item.buttonUrl} className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800">
            {item.buttonLabel} <FiArrowRight />
          </Link>
        )}
      </div>
    </article>
  )
}

function ImageOverlaySection({ section }: { section: any }) {
  const HeadingTag = (section.headingTag || 'h2') as ElementType
  const verticalClass = getVerticalAlignmentClass(section.contentVerticalAlign)
  const alignment = getAlignmentClasses(section.textAlign)
  return (
    <section className="relative min-h-[30rem] overflow-hidden bg-gray-950 text-white">
      {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-black/55"></div>
      <div className={`container relative flex min-h-[30rem] ${verticalClass} py-16 ${alignment.container}`}>
        <div className="max-w-2xl">
          {section.title && (
            <HeadingTag className="text-4xl font-bold md:text-6xl">
              {section.titleHtml
                ? <EditableHeadingText section={section} />
                : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
            </HeadingTag>
          )}
          {section.body && <EditableRichTextContent section={section} className={`${alignment.body} mt-5 text-lg text-gray-100 md:text-xl`.trim()} />}
          {section.buttonLabel && section.buttonUrl && (
            <Link to={section.buttonUrl} className="section-button mt-8 inline-flex items-center justify-center gap-2" aria-label={section.buttonLabel || 'Button'}>
              <ButtonContent label={section.buttonLabel} icon={section.buttonIcon} iconOnly={section.buttonIconOnly} showArrow={section.buttonShowArrow} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Gallery" />
        <div className="responsive-grid gap-4" style={getResponsiveGridStyle(section, 3)}>
          {items.map((item: any, index: number) => (
            <figure key={item.id || index} className="group overflow-hidden rounded-lg bg-gray-100">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title || section.title || ''} loading="lazy" decoding="async" className="h-72 w-full object-cover transition duration-300 group-hover:scale-105" />}
              {(item.title || item.description) && (
                <figcaption className="p-4">
                  {item.title && <h3 className="font-bold text-gray-900">{item.title}</h3>}
                  {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                </figcaption>
              )}
            </figure>
          ))}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No gallery images have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function HeroSection({ section }: { section: any }) {
  const hasHeroForm = Boolean(section.heroFormEnabled)
  const heroMinHeight = Number(section.heroHeight || 0)
  const HeadingTag = (section.headingTag || 'h1') as ElementType
  const verticalClass = getVerticalAlignmentClass(section.contentVerticalAlign)
  const alignment = getAlignmentClasses(section.textAlign)
  const heroMediaEffect = section.heroMediaEffect || 'none'
  const heroMediaClass = section.mediaType === 'video'
    ? `hero-media hero-media-video ${heroMediaEffect !== 'none' ? `hero-media--${heroMediaEffect}` : ''}`.trim()
    : `hero-media ${heroMediaEffect !== 'none' ? `hero-media--${heroMediaEffect}` : ''}`.trim()
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 text-white ${hasHeroForm ? 'py-12 md:py-16' : 'py-20 md:py-32'}`}
      style={heroMinHeight > 0 ? { minHeight: `${heroMinHeight}px` } : undefined}
    >
      {section.imageUrl && section.mediaType !== 'video' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className={`absolute inset-0 h-full w-full object-cover ${heroMediaClass}`.trim()} />}
      {section.imageUrl && section.mediaType === 'video' && <video src={resolveAssetUrl(section.imageUrl)} className={`absolute inset-0 h-full w-full object-cover ${heroMediaClass}`.trim()} autoPlay muted loop playsInline />}
      <div className="absolute inset-0 bg-blue-950/55"></div>
      <div className={`container relative flex ${verticalClass}`} style={heroMinHeight > 0 ? { minHeight: `${heroMinHeight}px` } : undefined}>
        <div className={`grid grid-cols-1 items-center gap-10 ${hasHeroForm ? 'lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]' : ''}`}>
          <div className={`max-w-3xl ${alignment.container}`}>
            <HeadingTag className="text-4xl font-bold md:text-6xl">
              {section.titleHtml
                ? <EditableHeadingText section={section} />
                : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
            </HeadingTag>
            {section.body && <EditableRichTextContent section={section} className={`${alignment.body} mt-6 text-xl text-blue-100 md:text-2xl`.trim()} />}
            <div className="mt-8 flex flex-wrap gap-4">
              {section.buttonLabel && section.buttonUrl && (
                <Link to={section.buttonUrl} className="section-button inline-flex items-center justify-center gap-2" aria-label={section.buttonLabel || 'Button'}>
                  <ButtonContent label={section.buttonLabel} icon={section.buttonIcon} iconOnly={section.buttonIconOnly} showArrow={section.buttonShowArrow} />
                </Link>
              )}
              {section.secondaryButtonLabel && section.secondaryButtonUrl && (
                <Link to={section.secondaryButtonUrl} className="btn-secondary section-secondary-button inline-flex items-center justify-center gap-2" aria-label={section.secondaryButtonLabel || 'Secondary button'}>
                  <ButtonContent label={section.secondaryButtonLabel} icon={section.secondaryButtonIcon} iconOnly={section.secondaryButtonIconOnly} showArrow={section.secondaryButtonShowArrow} />
                </Link>
              )}
            </div>
          </div>
          {hasHeroForm && (
            <CrmQuoteForm
              section={{
                ...section,
                crmPanelTitle: '',
                crmPanelText: '',
                crmEyebrow: '',
                crmFormCardClassName: 'backdrop-blur',
                crmButtonClassName: 'w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700'
              }}
              compact
            />
          )}
        </div>
      </div>
    </section>
  )
}

function WhatWeDoSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="What We Do" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item: any, index: number) => (
            <div key={item.id || index} className="card p-8">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} className="mb-4 h-32 w-full rounded-lg object-cover" />}
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-gray-600">{item.desc || item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedWorkSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Featured Work" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {items.map((work: any, index: number) => (
            <div key={work.id || index} className="card overflow-hidden transition hover:shadow-2xl">
              {work.image && <img src={resolveAssetUrl(work.image)} alt={work.title} loading="lazy" decoding="async" className="h-64 w-full object-cover transition-transform duration-300 hover:scale-105" />}
              <div className="p-6">
                <span className="text-sm font-semibold text-blue-600">{work.category}</span>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">{work.title}</h3>
                <p className="mt-3 text-gray-600">{work.description}</p>
                <Link to={work.url || '/portfolio'} className="mt-4 flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800">
                  {work.buttonLabel || 'View Case Study'} <FiArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionHeading({ section, fallbackTitle, compact = false }: { section: any; fallbackTitle: string; compact?: boolean }) {
  if (!section.title && !section.body) return null
  const alignment = getAlignmentClasses(section.textAlign)
  const HeadingTag = (section.headingTag || 'h2') as ElementType

  return (
    <div className={`${compact ? 'mb-4' : 'mb-10'} ${alignment.container}`.trim()}>
      <HeadingTag className="text-3xl font-bold text-gray-900">
        {section.titleHtml
          ? <EditableHeadingText section={section} fallbackText={fallbackTitle} />
          : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} fallbackText={fallbackTitle} />, 'inline')}
      </HeadingTag>
      {section.body && <EditableRichTextContent section={section} className={`${alignment.body} ${compact ? 'mt-2' : 'mt-3'} max-w-3xl text-gray-600`.trim()} />}
    </div>
  )
}

function TestimonialsSection() {
  return (
    <section>
      <Testimonials />
    </section>
  )
}

function PortfolioSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItems(await portfolioAPI.getPortfolio())
      } catch (error) {
        setItems([])
      }
    }

    fetchItems()
  }, [])

  return (
    <section className="section-padding">
      <div className="container">
        <div className="responsive-grid gap-6" style={getResponsiveGridStyle(section, 4)}>
          {items.slice(0, Number(section.itemLimit || 8)).map((item) => (
            <article key={item.id} className="card overflow-hidden">
              {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} className="h-56 w-full object-contain p-2" />}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-blue-600">{item.category}</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h3>
                {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
                <Link to={`/portfolio/${item.id}`} className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">
                  View Details
                </Link>
              </div>
            </article>
          ))}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-4">No portfolio items have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function ServicesSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItems(await servicePackagesAPI.getServices())
      } catch (error) {
        setItems([])
      }
    }

    fetchItems()
  }, [])

  return (
    <section className="section-padding bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Services" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, Number(section.itemLimit || 6)).map((item) => (
            <article key={item.id || item.service} className="card p-6">
              <h3 className="text-xl font-bold text-gray-900">{item.service}</h3>
              {item.description && <p className="mt-3 text-gray-600">{item.description}</p>}
              <div className="mt-5 flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">${item.price}</span>
                {item.unit && <span className="ml-2 text-gray-600">per {item.unit}</span>}
              </div>
              <Link to="/contact" className="btn-primary mt-6 inline-flex">Inquire Now</Link>
            </article>
          ))}
          {items.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function PortfolioGallerySection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    portfolioAPI.getPortfolio().then(setItems).catch(() => setItems([]))
  }, [])

  const categories = [
    { id: 'all', label: 'All Work' },
    { id: 'web-design', label: 'Web Design' },
    { id: 'photography', label: 'Photography' },
    { id: 'videography', label: 'Videography' },
    { id: 'branding', label: 'Branding' }
  ]
  const filteredItems = selectedCategory === 'all' ? items : items.filter(item => item.category === selectedCategory)

  return (
    <>
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(category => (
              <button key={category.id} type="button" onClick={() => setSelectedCategory(category.id)} className={`rounded-lg px-6 py-2 font-semibold transition ${selectedCategory === category.id ? 'bg-blue-600 text-white' : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-600'}`}>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container">
          <SectionHeading section={section} fallbackTitle="" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map(item => (
              <div key={item.id} className="card group cursor-pointer overflow-hidden transition hover:shadow-2xl">
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {item.image && <img src={resolveAssetUrl(item.image)} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Link to={`/portfolio/${item.id}`} className="btn-primary">View Details</Link>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs font-semibold uppercase text-blue-600">{categories.find(category => category.id === item.category)?.label}</span>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600 md:col-span-2 lg:col-span-4">No portfolio items have been added yet.</div>}
          </div>
        </div>
      </section>
    </>
  )
}

function ServicesListSection({ section }: { section: any }) {
  const icons = [FiMonitor, FiCamera, FiVideo, FiPenTool]
  const items = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        <div className="space-y-16">
          {items.map((service: any, index: number) => {
            const IconComponent = icons[index % icons.length]
            const isEven = index % 2 === 0

            return (
              <div key={service.id || `${service.title}-${index}`} className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                <div className={isEven ? 'order-1' : 'order-2'}>
                  <div className="mb-6">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                      <IconComponent size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                  </div>
                  <p className="mb-8 text-lg text-gray-600">{service.description}</p>
                  <div className="space-y-3">
                    {(service.features || []).map((feature: string, featureIndex: number) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={service.url || '/contact'} className="btn-primary mt-8 inline-block">Learn More</Link>
                </div>
                <div className={isEven ? 'order-2' : 'order-1'}>
                  {service.image ? (
                    <img src={resolveAssetUrl(service.image)} alt={service.title} className="h-96 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-96 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                      <IconComponent size={120} className="text-blue-200" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {items.length === 0 && <div className="rounded-lg border p-6 text-center text-gray-600">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function PricingPackagesSection({ section }: { section: any }) {
  const plans = Array.isArray(section.items) ? section.items : []

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Web Design Packages" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan: any, index: number) => (
            <div key={plan.id || index} className={`card overflow-hidden transition ${plan.popular ? 'scale-105 ring-2 ring-blue-600' : ''}`}>
              {plan.popular && <div className="bg-blue-600 px-4 py-2 text-center font-bold text-white">MOST POPULAR</div>}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <div className="my-8">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="ml-2 text-gray-600">({plan.billingPeriod})</span>
                </div>
                <Link to="/contact" className={`mb-8 block w-full rounded-lg py-3 text-center font-bold transition ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Get Started</Link>
                <div className="space-y-4">
                  {(plan.features || []).map((feature: any, featureIndex: number) => {
                    const featureName = typeof feature === 'string' ? feature : feature.name
                    const included = typeof feature === 'string' ? true : feature.included
                    return (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded ${included ? 'bg-green-100' : 'bg-gray-100'}`}>{included && <FiCheck className="text-green-600" />}</div>
                        <span className={included ? 'text-gray-900' : 'text-gray-400 line-through'}>{featureName}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicePricingSection({ section }: { section: any }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    servicePackagesAPI.getServices().then(setItems).catch(() => setItems([]))
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="A La Carte Services" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((pkg, index) => (
            <div key={pkg.id || index} className="card p-6">
              <h3 className="text-xl font-bold text-gray-900">{pkg.service}</h3>
              {pkg.description && <p className="mt-2 text-sm text-gray-600">{pkg.description}</p>}
              <div className="my-4 flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">${pkg.price}</span>
                <span className="ml-2 text-gray-600">per {pkg.unit}</span>
              </div>
              <Link to="/contact" className="btn-primary block w-full text-center">Inquire Now</Link>
            </div>
          ))}
          {items.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-gray-600 md:col-span-2 lg:col-span-3">No services have been added yet.</div>}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ section }: { section: any }) {
  const items = Array.isArray(section.items) ? section.items : []
  const limit = Number(section.itemLimit || items.length || 0)
  const visibleItems = limit > 0 ? items.slice(0, limit) : items
  const columns = Number(section.columns || 1)
  return (
    <section className="py-16">
      <div className={`container ${columns > 1 ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <SectionHeading section={section} fallbackTitle="Frequently Asked Questions" />
        <div className="responsive-grid gap-6" style={getResponsiveGridStyle(section, columns > 1 ? 2 : 1)}>
          {visibleItems.map((faq: any, index: number) => {
            const editableFaq = { ...faq, id: faq.id || `${section?.id || 'faq'}-${index}` }
            return (
            <div key={index} className="card p-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editableFaq.titleHtml
                  ? <EditableHeadingText section={editableFaq} fallbackText={editableFaq.q || editableFaq.question || ''} />
                  : <EditableHeadingText section={{ ...editableFaq, title: editableFaq.q || editableFaq.question || '' }} fallbackText={editableFaq.q || editableFaq.question || ''} />}
              </h3>
              <EditableRichTextContent section={{ ...editableFaq, body: editableFaq.body || editableFaq.a || editableFaq.answer || '' }} className="mt-3 text-gray-600" />
            </div>
          )})}
          {visibleItems.length === 0 && (
            <div className="rounded-lg border border-dashed bg-white p-8 text-center text-gray-600 md:col-span-2">
              No FAQ questions have been added yet.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function EmbeddedPluginSection({ section }: { section: any }) {
  const pluginLabel = pluginLabels[section.pluginSlug] || pluginLabels.plugins
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPluginData = async () => {
      try {
        setLoading(true)
        if (section.pluginSlug === 'restaurant') {
          setData(await pluginsAPI.getRestaurantMenu())
        } else if (section.pluginSlug === 'real-estate') {
          setData(await pluginsAPI.getRealEstateListings())
        } else if (section.pluginSlug === 'booking') {
          setData(await pluginsAPI.getBookingSlots())
        } else if (section.pluginSlug === 'events') {
          setData(await pluginsAPI.getEvents())
        } else if (section.pluginSlug === 'blog') {
          setData(await pluginsAPI.getBlogPosts())
        } else if (section.pluginSlug === 'protected-content') {
          setData(await pluginsAPI.getProtectedContentItems())
        } else if (section.pluginSlug === 'crm') {
          setData(await pluginsAPI.getCrmPlugin())
        } else {
          setData({ plugins: await pluginsAPI.getPlugins() })
        }
      } catch (error) {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPluginData()
  }, [section.pluginSlug])

  const hasBackground = Boolean(section.imageUrl)
  const overlayColor = section.overlayColor || '#000000'
  const overlayOpacity = Math.min(95, Math.max(0, Number(section.overlayOpacity ?? 55)))

  return (
    <section className={`section-padding relative overflow-hidden ${hasBackground ? 'text-white' : ''}`}>
      {hasBackground && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {hasBackground && <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }} />}
      <div className="container relative">
        {loading ? (
          <div className="text-gray-600">Loading {pluginLabel}...</div>
        ) : (
          <>
            <SectionHeading section={section} fallbackTitle="" />
            <PluginContent pluginSlug={section.pluginSlug || 'plugins'} data={data} section={section} />
          </>
        )}
      </div>
    </section>
  )
}

function PluginsListSection({ section }: { section: any }) {
  const [plugins, setPlugins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pluginsAPI.getPlugins()
      .then(setPlugins)
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="" />
        {loading ? (
          <div className="text-gray-600">Loading plugins...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plugins.map(plugin => (
              <div key={plugin.id} className="card p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{plugin.name}</h2>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${plugin.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {plugin.isEnabled ? 'Demo active' : 'Demo inactive'}
                  </span>
                </div>
                <p className="mb-6 text-gray-600">{plugin.description}</p>
                {plugin.demoUrl && <Link to={plugin.demoUrl} className="btn-primary inline-flex">View Demo</Link>}
              </div>
            ))}
            {plugins.length === 0 && <div className="card p-8 text-center text-gray-600 md:col-span-2">No active plugin demos are available yet.</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function SiteDemosSection({ section }: { section: any }) {
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const limit = Number(section.itemLimit || 6)

  useEffect(() => {
    siteDemosAPI.getDemos()
      .then(setDemos)
      .catch(() => setDemos([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <SectionHeading section={section} fallbackTitle="Site Demos" />
        {loading ? (
          <div className="text-gray-600">Loading site demos...</div>
        ) : (
          <div className="responsive-grid gap-6" style={getResponsiveGridStyle(section, 3)}>
            {demos.slice(0, limit).map(demo => (
              <article key={demo.id || demo.slug} className="group overflow-hidden rounded-lg bg-white shadow transition hover:-translate-y-1 hover:shadow-xl">
                {demo.previewImage && <img src={resolveAssetUrl(demo.previewImage)} alt={demo.name} loading="lazy" decoding="async" className="h-64 w-full object-cover transition duration-300 group-hover:scale-105" />}
                <div className="p-6">
                  <p className="site-demo-card-meta text-xs font-bold uppercase tracking-wide text-blue-600">{demo.category}</p>
                  <h3 className="site-demo-card-heading mt-2 text-2xl font-bold text-gray-900">{demo.name}</h3>
                  {demo.description && <p className="site-demo-card-body mt-3 text-gray-600">{demo.description}</p>}
                  <Link to={demo.demoUrl} className="btn-primary mt-6 inline-flex items-center gap-2">
                    View Demo <FiArrowRight />
                  </Link>
                </div>
              </article>
            ))}
            {demos.length === 0 && <div className="rounded-lg border bg-white p-8 text-center text-gray-600 md:col-span-2 lg:col-span-3">No active site demos are available yet.</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactFormSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', service: '', message: '' })
  const [settings, setSettings] = useState<any>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    siteSettingsAPI.getSettings().then(setSettings).catch(() => setSettings({}))
  }, [])

  const socialLinks = [
    ['Facebook', settings.facebookUrl],
    ['Instagram', settings.instagramUrl],
    ['Twitter', settings.twitterUrl],
    ['LinkedIn', settings.linkedinUrl]
  ].filter(([, url]) => url)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (isSubmitted) setIsSubmitted(false)
    if (submitError) setSubmitError('')
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSubmitted(false)
    setSubmitError('')

    try {
      await contactMessagesAPI.createMessage({ ...formData, turnstileToken })
      setIsSubmitted(true)
      setTurnstileToken('')
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' })
    } catch (error) {
      setSubmitError('We could not send your message. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            <ContactInfo icon={<FiMail className="text-blue-600" size={24} />} label="Email" value={settings.contactEmail || 'hello@creativestudio.com'} note="We reply within 24 hours" />
            <ContactInfo icon={<FiPhone className="text-blue-600" size={24} />} label="Phone" value={settings.phone || '+1 (555) 123-4567'} note={settings.hours || 'Mon-Fri, 9am-6pm EST'} />
            <ContactInfo icon={<FiMapPin className="text-blue-600" size={24} />} label="Location" value={settings.locationLine1 || '123 Creative Street'} note={settings.locationLine2 || 'New York, NY 10001'} />
            {socialLinks.length > 0 && (
              <div className="border-t pt-8">
                <h3 className="mb-4 font-bold text-gray-900">Follow Us</h3>
                <div className="flex gap-4">
                  {socialLinks.map(([social, url], index) => (
                    <a key={index} href={url || '#'} className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                      {social[0]}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Send us a Message</h2>
              {isSubmitted && <div role="status" className="mb-6 rounded-lg border border-green-400 bg-green-100 p-4 text-green-700">Message sent. Thank you for reaching out. We will get back to you soon.</div>}
              {submitError && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{submitError}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field id="name" label="Your Name *" value={formData.name} onChange={handleChange} required />
                  <Field id="email" label="Email Address *" type="email" value={formData.email} onChange={handleChange} required />
                  <Field id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} />
                  <Field id="company" label="Company" value={formData.company} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="service" className="mb-2 block font-semibold text-gray-700">Service Interested In *</label>
                  <select id="service" name="service" value={formData.service} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="">Select a service...</option>
                    <option value="web-design">Web Design</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="branding">Branding</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="mb-2 block font-semibold text-gray-700">Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={5} className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Tell us about your project..."></textarea>
                </div>
                {settings.turnstileSiteKey && <TurnstileWidget siteKey={settings.turnstileSiteKey} onVerify={setTurnstileToken} />}
                <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Message'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CustomFormSection({ section }: { section: any }) {
  const rawFields = Array.isArray(section.formFields) ? section.formFields : []
  const fields = rawFields.filter((field: any) => String(field?.label || '').trim())
  const initialState = useMemo(() => fields.reduce((acc: Record<string, any>, field: any) => {
    acc[field.id] = field.type === 'checkbox' ? false : ''
    return acc
  }, {}), [fields])
  const [formData, setFormData] = useState<Record<string, any>>(initialState)
  const [settings, setSettings] = useState<any>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    setFormData(initialState)
  }, [initialState])

  useEffect(() => {
    siteSettingsAPI.getSettings().then(setSettings).catch(() => setSettings({}))
  }, [])

  const handleChange = (fieldId: string, value: any) => {
    if (isSubmitted) setIsSubmitted(false)
    if (submitError) setSubmitError('')
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setIsSubmitted(false)
    setSubmitError('')

    try {
      await formSubmissionsAPI.createSubmission({
        formName: section.customFormName || section.title || 'Website Inquiry',
        pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
        pageTitle: section.title || '',
        turnstileToken,
        fields: fields.map((field: any) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          required: Boolean(field.required),
          value: formData[field.id]
        }))
      })
      setIsSubmitted(true)
      setTurnstileToken('')
      setFormData(initialState)
    } catch (error) {
      setSubmitError('We could not send this form right now. Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <div className="card p-8">
            <SectionHeading section={section} fallbackTitle="Get in Touch" />
            {isSubmitted && (
              <div role="status" className="mb-6 rounded-lg border border-green-400 bg-green-100 p-4 text-green-700">
                {section.customFormSuccessMessage || 'Thanks. Your submission has been sent.'}
              </div>
            )}
            {submitError && <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{submitError}</div>}
            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                Add form fields in the page editor to start collecting submissions here.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field: any) => (
                  <CustomFormField
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => handleChange(field.id, value)}
                  />
                ))}
                {settings.turnstileSiteKey && <TurnstileWidget siteKey={settings.turnstileSiteKey} onVerify={setTurnstileToken} />}
                <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : (section.customFormSubmitLabel || 'Submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaSection({ section }: { section: any }) {
  const HeadingTag = (section.headingTag || 'h2') as ElementType
  const alignment = getAlignmentClasses(section.textAlign)
  return (
    <section className="bg-blue-600 py-16 text-white">
      <div className={`container ${alignment.container}`}>
        <HeadingTag className="text-3xl font-bold md:text-4xl">
          {section.titleHtml
            ? <EditableHeadingText section={section} />
            : renderLinkedHeading(section.titleLinkUrl, <EditableHeadingText section={section} />, 'inline')}
        </HeadingTag>
        {section.body && <EditableRichTextContent section={section} className={`${alignment.body} mt-6 max-w-2xl text-xl text-blue-100`.trim()} />}
        {section.buttonLabel && section.buttonUrl && (
          <Link to={section.buttonUrl} className="section-button mt-8 inline-flex items-center justify-center gap-2" aria-label={section.buttonLabel || 'Button'}>
            <ButtonContent label={section.buttonLabel} icon={section.buttonIcon} iconOnly={section.buttonIconOnly} showArrow={section.buttonShowArrow} />
          </Link>
        )}
      </div>
    </section>
  )
}

function CustomFormField({ field, value, onChange }: { field: any; value: any; onChange: (value: any) => void }) {
  const label = `${field.label}${field.required ? ' *' : ''}`
  const commonClassName = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600'

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={field.id} className="mb-2 block font-semibold text-gray-700">{label}</label>
        <textarea
          id={field.id}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          required={Boolean(field.required)}
          rows={5}
          className={commonClassName}
          placeholder={field.placeholder || ''}
        />
      </div>
    )
  }

  if (field.type === 'select') {
    const options = String(field.options || '')
      .split('\n')
      .map((option: string) => option.trim())
      .filter(Boolean)
    return (
      <div>
        <label htmlFor={field.id} className="mb-2 block font-semibold text-gray-700">{label}</label>
        <select
          id={field.id}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          required={Boolean(field.required)}
          className={commonClassName}
        >
          <option value="">{field.placeholder || 'Select an option...'}</option>
          {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          required={Boolean(field.required)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </label>
    )
  }

  return (
    <Field
      id={field.id}
      label={label}
      type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
      value={value || ''}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      required={Boolean(field.required)}
      inputClassName=""
      inputStyle={undefined}
      labelStyle={undefined}
      placeholder={field.placeholder || ''}
    />
  )
}

function ContactInfo({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">{icon}</div>
      <div>
        <h3 className="font-bold text-gray-900">{label}</h3>
        <p className="text-gray-600">{value}</p>
        {note && <p className="text-sm text-gray-600">{note}</p>}
      </div>
    </div>
  )
}

function Field({ id, label, type = 'text', value, onChange, required = false, labelStyle, inputStyle, inputClassName = '', placeholder = '' }: any) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-semibold text-gray-700" style={labelStyle}>{label}</label>
      <input type={type} id={id} name={id} value={value} onChange={onChange} required={required} placeholder={placeholder} className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${inputClassName}`.trim()} style={inputStyle} />
    </div>
  )
}

function PluginContent({ pluginSlug, data, section = {} }: { pluginSlug: string; data: any; section?: any }) {
  if (!data) return <div className="text-gray-600">This plugin content is not available right now.</div>

  if (pluginSlug === 'restaurant') {
    const items = data.items || []
    if (items.length === 0) return <div className="text-gray-600">No menu items have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, 6).map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {item.image && <img src={resolveAssetUrl(item.image)} alt={item.name} loading="lazy" decoding="async" className="h-40 w-full object-cover" />}
            <div className="p-4">
              <div className="flex justify-between gap-3">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <p className="font-bold text-blue-600">${Number(item.price || 0).toFixed(2)}</p>
              </div>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'real-estate') {
    const listings = data.listings || []
    if (listings.length === 0) return <div className="text-gray-600">No listings have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {listings.slice(0, 4).map((listing: any) => (
          <article key={listing.id} className="overflow-hidden rounded-lg bg-white shadow">
            {listing.image && <img src={resolveAssetUrl(listing.image)} alt={listing.title} loading="lazy" decoding="async" className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="font-bold text-blue-600">{formatCurrency(listing.price)}</p>
              <h3 className="mt-1 font-bold text-gray-900">{listing.title}</h3>
              {listing.address && <p className="mt-1 text-sm text-gray-500">{listing.address}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'booking') {
    const slots = data.slots || []
    if (slots.length === 0) return <div className="text-gray-600">No appointment times are currently available.</div>

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {slots.slice(0, 6).map((slot: any) => (
          <div key={slot.id} className="rounded-lg bg-white p-4 shadow">
            <p className="font-bold text-gray-900">{formatDate(slot.date)}</p>
            <p className="text-gray-600">{slot.startTime} - {slot.endTime}</p>
            {Array.isArray(slot.locationTypes) && slot.locationTypes.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">{slot.locationTypes.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'events') {
    const events = data.events || []
    if (events.length === 0) return <div className="text-gray-600">No events have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {events.slice(0, 4).map((event: any) => (
          <article key={event.id} className="overflow-hidden rounded-lg bg-white shadow">
            {event.image && <img src={resolveAssetUrl(event.image)} alt={event.title} loading="lazy" decoding="async" className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="text-sm font-bold uppercase text-blue-600">{formatDate(event.eventDate)}</p>
              <h3 className="mt-1 font-bold text-gray-900">{event.title}</h3>
              {event.description && <p className="mt-2 text-sm text-gray-600">{event.description}</p>}
              {event.buttonLabel && event.buttonUrl && <a href={event.buttonUrl} className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">{event.buttonLabel}</a>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'blog') {
    const posts = data.posts || []
    if (posts.length === 0) return <div className="text-gray-600">No blog articles have been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {posts.slice(0, Number(section.itemLimit || 4)).map((post: any) => (
          <article key={post.id} className="overflow-hidden rounded-lg bg-white shadow">
            {post.featuredImage && (
              <img
                src={resolveAssetUrl(post.featuredImage)}
                alt={post.title}
                loading="lazy"
                decoding="async"
                className="h-48 w-full object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                {post.category && <span>{post.category}</span>}
                {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
              </div>
              <h3 className="mt-2 text-xl font-bold text-gray-900">{post.title}</h3>
              {post.excerpt && <p className="mt-2 text-sm text-gray-600">{post.excerpt}</p>}
              <Link to={`/plugins/blog/${post.slug}`} className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">
                {post.buttonLabel || 'Read Article'}
              </Link>
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'protected-content') {
    const items = data.items || []
    if (items.length === 0) return <div className="text-gray-600">No protected content has been added yet.</div>

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.slice(0, 4).map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
            {item.previewImage && <img src={resolveAssetUrl(item.previewImage)} alt={item.title} loading="lazy" decoding="async" className="h-44 w-full object-cover" />}
            <div className="p-4">
              <p className="text-sm font-bold uppercase text-blue-600">{item.contentType}</p>
              <h3 className="mt-1 font-bold text-gray-900">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
              <Link to="/plugins/protected-content" className="mt-4 inline-flex font-semibold text-blue-600 hover:text-blue-800">
                {item.isUnlocked ? 'View Content' : item.buttonLabel || 'Unlock Access'}
              </Link>
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (pluginSlug === 'crm') {
    return <CrmQuoteForm section={section} />
  }

  const plugins = data.plugins || []
  if (plugins.length === 0) return <div className="text-gray-600">No plugins are active right now.</div>

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {plugins.slice(0, 4).map((plugin: any) => (
        <div key={plugin.id || plugin.slug} className="rounded-lg bg-white p-4 shadow">
          <h3 className="font-bold text-gray-900">{plugin.name}</h3>
          <p className="mt-2 text-sm text-gray-600">{plugin.description}</p>
        </div>
      ))}
    </div>
  )
}

function CrmQuoteForm({ section, compact = false }: { section: any; compact?: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  })
  const [settings, setSettings] = useState<any>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const services = String(section.crmServices || 'Web Design\nPhotography\nVideography\nBranding\nGeneral Inquiry')
    .split('\n')
    .map((item: string) => item.trim())
    .filter(Boolean)

  useEffect(() => {
    siteSettingsAPI.getSettings().then(setSettings).catch(() => setSettings({}))
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData(current => ({ ...current, [name]: value }))
    if (isSubmitted) setIsSubmitted(false)
    if (error) setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      if (compact) {
        await contactMessagesAPI.createMessage({
          ...formData,
          turnstileToken
        })
        setTurnstileToken('')
      } else {
        await pluginsAPI.createCrmLead({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          serviceTitle: formData.service,
          description: formData.message,
          inquiryType: section.crmInquiryType || 'quote',
          sourcePage: window.location.pathname,
          metadata: {
            sectionTitle: section.title || ''
          }
        })
      }
      setIsSubmitted(true)
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' })
    } catch (err: any) {
      setError(err.error || `We could not send ${compact ? 'your message' : 'this quote request'}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const crmBorderWidth = Math.max(0, Number(section.crmInputBorderWidth || 1))
  const crmBorderRadius = Math.max(0, Number(section.crmInputBorderRadius || 12))
  const crmInputPaddingX = Math.max(0, Number(section.crmInputPaddingX || 16))
  const crmInputPaddingY = Math.max(0, Number(section.crmInputPaddingY || 12))
  const formBackgroundStyle = {
    backgroundColor: section.crmBackgroundColor || 'rgba(255,255,255,0.96)',
    backgroundImage: section.crmBackgroundImageUrl ? `url(${resolveAssetUrl(section.crmBackgroundImageUrl)})` : undefined,
    backgroundSize: section.crmBackgroundImageUrl ? 'cover' : undefined,
    backgroundPosition: section.crmBackgroundImageUrl ? 'center' : undefined
  }
  const crmTextColor = section.crmTextColor || '#111827'
  const crmMutedTextColor = section.crmTextColor || '#374151'
  const crmInputTextColor = section.crmInputTextColor || '#111827'
  const crmPlaceholderColor = section.crmPlaceholderColor || '#6b7280'
  const crmFieldStyle = {
    color: crmInputTextColor,
    WebkitTextFillColor: crmInputTextColor,
    backgroundColor: section.crmInputBackgroundColor || '#ffffff',
    borderColor: section.crmInputBorderColor || '#d1d5db',
    borderWidth: `${crmBorderWidth}px`,
    borderRadius: `${crmBorderRadius}px`,
    paddingLeft: `${crmInputPaddingX}px`,
    paddingRight: `${crmInputPaddingX}px`,
    paddingTop: `${crmInputPaddingY}px`,
    paddingBottom: `${crmInputPaddingY}px`,
    '--crm-input-color': crmInputTextColor,
    '--crm-placeholder-color': crmPlaceholderColor
  } as CSSProperties
  const crmLabelStyle = { color: crmMutedTextColor }

  return (
    <div className={`mx-auto grid ${compact ? 'max-w-none grid-cols-1' : 'max-w-3xl grid-cols-1'}`}>
      <form onSubmit={handleSubmit} className={`${section.crmFormCardClassName || 'rounded-lg bg-white p-6'} text-gray-900 shadow-xl ${compact ? 'rounded-lg p-5 md:p-6' : ''}`} style={{ ...formBackgroundStyle, color: crmTextColor }}>
        <h3 className={`font-bold ${compact ? 'text-xl md:text-2xl' : 'text-2xl'}`} style={{ color: crmTextColor }}>{section.crmFormTitle || 'Send us a Message'}</h3>
        {isSubmitted && <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">Message sent. Thank you for reaching out. We will get back to you soon.</div>}
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field id="name" label="Your Name *" value={formData.name} onChange={handleChange} required labelStyle={crmLabelStyle} inputStyle={crmFieldStyle} inputClassName="crm-form-input" />
          <Field id="email" label="Email Address *" type="email" value={formData.email} onChange={handleChange} required labelStyle={crmLabelStyle} inputStyle={crmFieldStyle} inputClassName="crm-form-input" />
          <Field id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} labelStyle={crmLabelStyle} inputStyle={crmFieldStyle} inputClassName="crm-form-input" />
          <Field id="company" label="Company" value={formData.company} onChange={handleChange} labelStyle={crmLabelStyle} inputStyle={crmFieldStyle} inputClassName="crm-form-input" />
          <div>
            <label htmlFor="service" className="mb-2 block font-semibold text-gray-700" style={crmLabelStyle}>Service Interested In *</label>
            <select id="service" name="service" value={formData.service} onChange={handleChange} required className="crm-form-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600" style={crmFieldStyle}>
              <option value="">Select a service...</option>
              {services.map(service => <option key={service} value={service}>{service}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="message" className="mb-2 block font-semibold text-gray-700" style={crmLabelStyle}>Message *</label>
            <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={compact ? 4 : 5} className="crm-form-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600" style={crmFieldStyle} placeholder={section.crmDetailsPlaceholder || 'Tell us about your project...'}></textarea>
          </div>
        </div>
        {compact && settings.turnstileSiteKey && <div className="mt-4"><TurnstileWidget siteKey={settings.turnstileSiteKey} onVerify={setTurnstileToken} /></div>}
        <button type="submit" disabled={isSubmitting} className={`${section.crmButtonClassName || 'btn-primary mt-5 w-full'} mt-5 disabled:cursor-not-allowed disabled:opacity-60`}>
          {isSubmitting ? 'Sending...' : section.buttonLabel || 'Send Message'}
        </button>
      </form>
    </div>
  )
}

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

function formatDate(value: string) {
  if (!value) return 'Available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
