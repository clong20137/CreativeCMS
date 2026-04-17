import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiColumns, FiCopy, FiEye, FiEyeOff, FiFileText, FiGrid, FiImage, FiLayout, FiMonitor, FiMove, FiSave, FiSearch, FiSmartphone, FiTablet, FiTrash2, FiType } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import MediaPicker from '../components/MediaPicker'
import PageSections from '../components/PageSections'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

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
  { value: 'protected-content', label: 'Protected Content' }
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
  { value: 'imageCard', label: 'Image Card', icon: FiGrid }
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
    items: defaultItems(),
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
  return {
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

  const activeBuiltInPageKey = publicPages.some(page => page.id === activeTab) ? activeTab : ''

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
        setPageDraft({ ...customPage, sections: Array.isArray(customPage.sections) ? customPage.sections : [] })
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

  const getBuiltInSections = (pageKey: string) => Array.isArray(settings.pageSections?.[pageKey]) ? settings.pageSections[pageKey] : []

  const updateBuiltInSections = (pageKey: string, sections: any[]) => {
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
      setPageDraft(savedPage)
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
      {message && <div className="mx-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mx-4 mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 items-start gap-4 transition-all duration-300 xl:grid-cols-[var(--editor-grid)]" style={{ '--editor-grid': editorGridColumns } as any}>
          <div className="space-y-6 px-1">
            <section className="sticky top-0 z-20 rounded-lg border bg-white p-4 shadow-sm">
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
                />
                <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
                  <input type="checkbox" checked={Boolean(pageDraft.isPublished)} onChange={(e) => updatePageDraft('isPublished', e.target.checked)} />
                  Publish this page
                </label>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="btn-primary">Save Page</button>
                  {selectedPageId !== 'new' && <button type="button" onClick={deleteCustomPage} className="btn-secondary text-red-600">Delete Page</button>}
                </div>
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
                  />
                )}
              </div>
              <button type="submit" className="btn-primary">Save Page Edits</button>
            </form>
          )}
          </div>

          <aside className="h-[calc(100vh-12rem)] overflow-auto rounded-none border border-r-0 bg-white shadow transition-all duration-300 xl:sticky xl:top-4">
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
                savePage={saveActivePage}
                isOpen={sectionsPanelOpen}
                setIsOpen={setSectionsPanelOpen}
              />
            ) : (
              <PageSettingsInspector
                title="General Settings"
                editor={pageSettingsEditor}
                isCustomPage={activeTab === 'Custom Pages'}
                isSavedCustomPage={activeTab === 'Custom Pages' && selectedPageId !== 'new'}
                isPublished={Boolean(pageDraft.isPublished)}
                updatePublished={(value: boolean) => updatePageDraft('isPublished', value)}
                deletePage={deleteCustomPage}
                savePage={saveActivePage}
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

function PagePreviewPanel({ title, sections, draggingSectionIndex, setDraggingSectionIndex, moveSection, setEditingSectionId, clearSelection, highlightedSectionId, previewMode, setPreviewMode, canUndo, canRedo, undoPageChange, redoPageChange, onDrop, emptyText }: any) {
  const previewModes = [
    { value: 'desktop', label: 'Desktop', icon: FiMonitor, width: 'w-full' },
    { value: 'tablet', label: 'Tablet', icon: FiTablet, width: 'max-w-[820px]' },
    { value: 'mobile', label: 'Mobile', icon: FiSmartphone, width: 'max-w-[390px]' }
  ]
  const activePreview = previewModes.find(mode => mode.value === previewMode) || previewModes[0]

  return (
    <section className="card p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Preview</h2>
          <p className="text-gray-600">Drag section pieces here, reorder them in place, and click a section to edit it on the right.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg border bg-gray-50 p-1">
          {previewModes.map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPreviewMode(mode.value)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${previewMode === mode.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-white'}`}
              >
                <Icon />
                {mode.label}
              </button>
            )
          })}
        </div>
          <div className="flex rounded-lg border bg-gray-50 p-1">
            <button type="button" onClick={undoPageChange} disabled={!canUndo} className="rounded-md px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-white disabled:opacity-40">Undo</button>
            <button type="button" onClick={redoPageChange} disabled={!canRedo} className="rounded-md px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-white disabled:opacity-40">Redo</button>
          </div>
        </div>
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => clearSelection?.()}
        className="min-h-[calc(100vh-24rem)] overflow-auto rounded-lg border bg-gray-100 p-3"
      >
        <div className={`mx-auto min-h-[calc(100vh-26rem)] overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 ${activePreview.width}`}>
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
          <div className="flex min-h-[calc(100vh-24rem)] items-center justify-center p-8 text-center text-gray-600">
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

function PageSettingsInspector({ title, editor, isCustomPage, isSavedCustomPage, isPublished, updatePublished, deletePage, savePage, isOpen = true, setIsOpen = () => {} }: any) {
  if (!isOpen) {
    return (
      <section className="h-full overflow-hidden bg-white">
        <button type="button" onClick={() => setIsOpen(true)} className="flex h-16 w-full items-center justify-center text-gray-900" aria-label="Expand general settings" title="Expand general settings">
          <FiArrowLeft />
        </button>
      </section>
    )
  }

  return (
    <section className="flex h-full flex-col bg-white">
      <button type="button" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left" aria-label="Collapse general settings" title="Collapse general settings">
        <span>
          <span className="block text-xl font-bold text-gray-900">{title}</span>
          <span className="block text-sm text-gray-600">Page details appear here until you select a section.</span>
        </span>
        <FiArrowRight className="text-blue-600" />
      </button>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto border-t p-4 pb-8">
        {editor}
        {isCustomPage && (
          <label className="inline-flex items-center gap-2 font-semibold text-gray-700">
            <input type="checkbox" checked={isPublished} onChange={(e) => updatePublished(e.target.checked)} />
            Publish this page
          </label>
        )}
      </div>
      <div className="flex shrink-0 gap-3 border-t bg-white p-4">
        {isSavedCustomPage && (
          <button type="button" onClick={deletePage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700">
            <FiTrash2 />
            Delete
          </button>
        )}
        <button type="button" onClick={savePage} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700">
          <FiSave />
          Save
        </button>
      </div>
    </section>
  )
}

function SectionInspector({ title, section, index, updateSection, removeSection, duplicateSection, uploadImageToField, openMediaPicker, savePage, isOpen = true, setIsOpen = () => {} }: any) {
  if (!isOpen) {
    return (
      <section className="h-full overflow-hidden bg-white">
        <button type="button" onClick={() => setIsOpen(true)} className="flex h-16 w-full items-center justify-center text-gray-900" aria-label="Expand section settings" title="Expand section settings">
          <FiArrowLeft />
        </button>
      </section>
    )
  }

  if (!section || index < 0) {
    return (
      <section className="h-full bg-white">
        <button type="button" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left" aria-label="Collapse section settings" title="Collapse section settings">
          <span>
            <span className="block text-xl font-bold text-gray-900">{title}</span>
            <span className="block text-sm text-gray-600">Select a section in the preview to edit it here.</span>
          </span>
          <FiArrowRight className="text-blue-600" />
        </button>
        <div className="border-t p-4 text-sm text-gray-600">No section selected.</div>
      </section>
    )
  }

  return (
    <section className="flex h-full flex-col bg-white">
      <button type="button" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left" aria-label="Collapse section settings" title="Collapse section settings">
        <span>
          <span className="block text-xl font-bold text-gray-900">{title}</span>
          <span className="block text-sm text-gray-600">{getSectionTitle(section, index)}</span>
        </span>
        <FiArrowRight className="text-blue-600" />
      </button>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto border-t p-4 pb-8">
        <div className="rounded-lg border bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-bold text-gray-700">Section Type</label>
          <select value={section.type || 'paragraph'} onChange={(e) => updateSection(index, 'type', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
            {sectionTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => duplicateSection(index)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            <FiCopy />
            Duplicate
          </button>
          <button type="button" onClick={() => updateSection(index, 'isHidden', !section.isHidden)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
            {section.isHidden ? <FiEye /> : <FiEyeOff />}
            {section.isHidden ? 'Show' : 'Hide'}
          </button>
        </div>

        <SectionSpacingControls section={section} index={index} updateSection={updateSection} />
        <SectionColorControls section={section} index={index} updateSection={updateSection} />

        {(section.type === 'banner' || section.type === 'hero' || section.type === 'cta' || section.type === 'imageOverlay') && (
          <div className="space-y-3">
            <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Heading" className="w-full px-4 py-2 border rounded-lg" />
            <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text" rows={3} className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.buttonLabel || ''} onChange={(e) => updateSection(index, 'buttonLabel', e.target.value)} placeholder="Button label" className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.buttonUrl || ''} onChange={(e) => updateSection(index, 'buttonUrl', e.target.value)} placeholder="Button URL" className="w-full px-4 py-2 border rounded-lg" />
            {section.type === 'hero' && <input value={section.secondaryButtonLabel || ''} onChange={(e) => updateSection(index, 'secondaryButtonLabel', e.target.value)} placeholder="Secondary button label" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type === 'hero' && <input value={section.secondaryButtonUrl || ''} onChange={(e) => updateSection(index, 'secondaryButtonUrl', e.target.value)} placeholder="Secondary button URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Optional image URL" className="w-full px-4 py-2 border rounded-lg" />}
            {section.type !== 'cta' && <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>}
            {section.type !== 'cta' && <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />}
            {section.imageUrl && section.type !== 'cta' && <img src={resolveAssetUrl(section.imageUrl)} alt="" className="h-40 w-full rounded-lg object-cover" />}
          </div>
        )}

        {(section.type === 'header' || section.type === 'section' || section.type === 'services') && (
          <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Section title" className="w-full px-4 py-2 border rounded-lg" />
        )}

        {(section.type === 'paragraph' || section.type === 'section' || section.type === 'services') && (
          <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Text content" rows={4} className="w-full px-4 py-2 border rounded-lg" />
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

        {(section.type === 'image' || section.type === 'section') && (
          <div className="space-y-3">
            <input value={section.imageUrl || ''} onChange={(e) => updateSection(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="w-full px-4 py-2 border rounded-lg" />
            <input value={section.alt || ''} onChange={(e) => updateSection(index, 'alt', e.target.value)} placeholder="Alt text" className="w-full px-4 py-2 border rounded-lg" />
            <button type="button" onClick={() => openMediaPicker((url: string) => updateSection(index, 'imageUrl', url), 'image')} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"><FiImage /> Choose from Media Library</button>
            <input type="file" accept="image/*" onChange={(e) => uploadImageToField((url: string) => updateSection(index, 'imageUrl', url), e.target.files?.[0])} className="w-full px-4 py-2 border rounded-lg" />
            {section.imageUrl && <img src={resolveAssetUrl(section.imageUrl)} alt={section.alt || section.title || 'Section image'} className="h-40 w-full rounded-lg object-cover" />}
          </div>
        )}

        {section.type === 'plugin' && (
          <select value={section.pluginSlug || 'restaurant'} onChange={(e) => updateSection(index, 'pluginSlug', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
            {pluginOptions.map(plugin => <option key={plugin.value} value={plugin.value}>{plugin.label}</option>)}
          </select>
        )}
      </div>

      <div className="flex shrink-0 gap-3 border-t bg-white p-4">
        <button
          type="button"
          onClick={() => removeSection(index)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700"
        >
          <FiTrash2 />
          Delete
        </button>
        <button
          type="button"
          onClick={savePage}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
        >
          <FiSave />
          Save
        </button>
      </div>
    </section>
  )
}

function ListCountControls({ section, index, updateSection, titlePlaceholder = 'Section title', maxColumns = 6 }: any) {
  return (
    <div className="space-y-3">
      <input value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder={titlePlaceholder} className="w-full px-4 py-2 border rounded-lg" />
      <input type="number" min="1" max={maxColumns} value={section.columns || ''} onChange={(e) => updateSection(index, 'columns', Number(e.target.value || 0))} placeholder="Columns" className="w-full px-4 py-2 border rounded-lg" />
      <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Section description" rows={3} className="w-full px-4 py-2 border rounded-lg" />
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
        <textarea value={section.body || ''} onChange={(e) => updateSection(index, 'body', e.target.value)} placeholder="Section description" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
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
      {(block.type === 'paragraph' || block.type === 'header') && <textarea value={block.body || ''} onChange={(e) => updateBlock(columnIndex, blockIndex, 'body', e.target.value)} placeholder="Text" rows={3} className="w-full px-4 py-2 border rounded-lg" />}
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

function CustomPageSettingsEditor({ pageDraft, updatePageDraft }: any) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Page Settings</h3>
      <div className="grid grid-cols-1 gap-3">
        <input value={pageDraft.title || ''} onChange={(e) => updatePageDraft('title', e.target.value)} placeholder="Page title" className="px-4 py-2 border rounded-lg" required />
        <input value={pageDraft.slug || ''} onChange={(e) => updatePageDraft('slug', makeSlug(e.target.value))} placeholder="page-url" className="px-4 py-2 border rounded-lg" required />
        <input value={pageDraft.headerTitle || ''} onChange={(e) => updatePageDraft('headerTitle', e.target.value)} placeholder="Header title" className="px-4 py-2 border rounded-lg" />
        <input type="number" value={pageDraft.sortOrder ?? 0} onChange={(e) => updatePageDraft('sortOrder', Number(e.target.value))} placeholder="Sort order" className="px-4 py-2 border rounded-lg" />
        <textarea value={pageDraft.headerSubtitle || ''} onChange={(e) => updatePageDraft('headerSubtitle', e.target.value)} placeholder="Header subtitle" rows={2} className="px-4 py-2 border rounded-lg" />
        <input value={pageDraft.metaTitle || ''} onChange={(e) => updatePageDraft('metaTitle', e.target.value)} placeholder="SEO title" className="px-4 py-2 border rounded-lg" />
        <input value={pageDraft.metaDescription || ''} onChange={(e) => updatePageDraft('metaDescription', e.target.value)} placeholder="SEO description" className="px-4 py-2 border rounded-lg" />
        <textarea value={pageDraft.content || ''} onChange={(e) => updatePageDraft('content', e.target.value)} placeholder="Fallback page content" rows={5} className="px-4 py-2 border rounded-lg" />
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
    <section className="rounded-lg border p-4">
      <h3 className="mb-4 text-xl font-bold text-gray-900">Page Settings</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={pageTitle} onChange={(e) => updatePageMetadata(page, 'pageTitle', e.target.value)} placeholder="Page Title" className="px-4 py-2 border rounded-lg" />
        <input value={pageUrl} onChange={(e) => updatePageMetadata(page, 'pageUrl', e.target.value)} placeholder="Page URL" className="px-4 py-2 border rounded-lg" />
        <textarea value={description} onChange={(e) => updatePageMetadata(page, 'description', e.target.value)} placeholder="Page Description" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
        <input
          value={headerTitle}
          onChange={(e) => {
            updatePageMetadata(page, 'headerTitle', e.target.value)
            updatePageHeader(page, 'title', e.target.value)
          }}
          placeholder="Header Title"
          className="px-4 py-2 border rounded-lg"
        />
        <input value={metadata.metaTitle || ''} onChange={(e) => updatePageMetadata(page, 'metaTitle', e.target.value)} placeholder="SEO Title" className="px-4 py-2 border rounded-lg" />
        <textarea
          value={headerSubtitle}
          onChange={(e) => {
            updatePageMetadata(page, 'headerSubtitle', e.target.value)
            updatePageHeader(page, 'subtitle', e.target.value)
          }}
          placeholder="Header Text"
          rows={2}
          className="px-4 py-2 border rounded-lg md:col-span-2"
        />
        <textarea value={metadata.metaDescription || ''} onChange={(e) => updatePageMetadata(page, 'metaDescription', e.target.value)} placeholder="SEO Description" rows={2} className="px-4 py-2 border rounded-lg md:col-span-2" />
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
