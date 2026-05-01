import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiBarChart, FiBell, FiBriefcase, FiCheckCircle, FiChevronDown, FiChevronRight, FiCopy, FiCreditCard, FiEdit2, FiEye, FiEyeOff, FiFileText, FiGrid, FiHelpCircle, FiHome, FiImage, FiInbox, FiLogOut, FiMenu, FiMonitor, FiMoon, FiMove, FiSearch, FiSettings, FiSun, FiTrash2, FiUsers, FiX } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { adminAPI, resolveAssetUrl, ticketsAPI } from '../services/api'

const primaryLinks = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
  { label: 'Clients', path: '/admin/clients', icon: FiUsers },
  { label: 'Projects', path: '/admin/projects', icon: FiBriefcase }
]

const builtInPageLinks = [
  { label: 'Homepage', page: 'home' },
  { label: 'Portfolio', page: 'portfolio' },
  { label: 'Services', page: 'services' },
  { label: 'Pricing', page: 'pricing' },
  { label: 'Plugins', page: 'plugins' },
  { label: 'Contact', page: 'contact' }
]

const adminGroups = [
  {
    label: 'Pages',
    icon: FiFileText,
    links: [
      { label: 'Navigation', path: '/admin/navigation', icon: FiGrid }
    ]
  },
  {
    label: 'Revenue',
    icon: FiBarChart,
    links: [
      { label: 'Invoices', path: '/admin/invoices', icon: FiBarChart },
      { label: 'Subscriptions', path: '/admin/subscriptions', icon: FiCreditCard }
    ]
  },
  {
    label: 'Website',
    icon: FiGrid,
    links: [
      { label: 'Services', path: '/admin/services', icon: FiGrid },
      { label: 'Portfolio', path: '/admin/portfolio', icon: FiImage },
      { label: 'Media Library', path: '/admin/media', icon: FiImage },
      { label: 'Plugins', path: '/admin/plugins', icon: FiGrid },
      { label: 'Site Demos', path: '/admin/site-demos', icon: FiImage }
    ]
  },
  {
    label: 'Support',
    icon: FiInbox,
    links: [
      { label: 'Messages', path: '/admin/messages', icon: FiInbox, badgeKey: 'newMessages' },
      { label: 'Tickets', path: '/admin/tickets', icon: FiHelpCircle, badgeKey: 'newTickets' },
      { label: 'Activity Log', path: '/admin/activity-log', icon: FiAlertCircle }
    ]
  }
]

const utilityLinks = [
  { label: 'Settings', path: '/admin/settings', icon: FiSettings }
]

const mobilePrimaryLinks = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
  { label: 'Clients', path: '/admin/clients', icon: FiUsers },
  { label: 'Pages', path: '/admin/pages?page=home', icon: FiFileText },
  { label: 'Website', path: '/admin/plugins', icon: FiGrid },
  { label: 'Settings', path: '/admin/settings', icon: FiSettings }
]

const ADMIN_SIDEBAR_WIDTH_KEY = 'creative-admin-sidebar-width'
const ADMIN_SIDEBAR_MIN_WIDTH = 256
const ADMIN_SIDEBAR_MAX_WIDTH = 420
const ADMIN_SIDEBAR_DEFAULT_WIDTH = 288
const ONBOARDING_BANNER_DISMISSED_KEY = 'creative-onboarding-banner-dismissed'

type PageNavLink = {
  title: string
  path: string
  active: boolean
  isAction?: boolean
  isPublished?: boolean
  seoScore?: number
}

function stripHtml(value: string) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(value: string) {
  const text = stripHtml(value)
  return text ? text.split(/\s+/).length : 0
}

function collectPageText(section: any): string[] {
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

  if (Array.isArray(section.items)) {
    section.items.forEach((item: any) => {
      maybePush(item?.title)
      maybePush(item?.body)
      maybePush(item?.description)
      maybePush(item?.desc)
      maybePush(item?.q)
      maybePush(item?.a)
      if (Array.isArray(item?.sections)) {
        item.sections.forEach((nested: any) => values.push(...collectPageText(nested)))
      }
    })
  }

  return values
}

function collectImageStats(section: any) {
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
        const nested = collectImageStats({ items: item.sections })
        total += nested.total
        missingAlt += nested.missingAlt
      }
    })
  }

  return { total, missingAlt }
}

function collectLinks(section: any): string[] {
  if (!section || typeof section !== 'object') return []
  const html = [section.body, section.description, section.content].map(value => String(value || '')).join(' ')
  const links = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map(match => String(match[1] || '').trim())
  if (section.buttonUrl) links.push(String(section.buttonUrl))
  if (section.secondaryButtonUrl) links.push(String(section.secondaryButtonUrl))
  if (section.url) links.push(String(section.url))
  if (Array.isArray(section.items)) {
    section.items.forEach((item: any) => {
      if (item?.buttonUrl) links.push(String(item.buttonUrl))
      if (item?.url) links.push(String(item.url))
      if (Array.isArray(item?.sections)) item.sections.forEach((nested: any) => links.push(...collectLinks(nested)))
    })
  }
  return links.filter(Boolean)
}

function looksBrokenInternalLink(value: string) {
  const link = String(value || '').trim()
  if (!link || link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('#')) return false
  return !link.startsWith('/')
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function computeNavSeoScore(page: any, sections: any[] = []) {
  let score = 100
  const title = String(page?.title || page?.pageTitle || '').trim()
  const metaTitle = String(page?.metaTitle || '').trim()
  const metaDescription = String(page?.metaDescription || '').trim()
  const slug = String(page?.slug || page?.pageUrl || '').trim()
  const headerTitle = String(page?.headerTitle || '').trim()
  const bodyText = sections.flatMap(section => collectPageText(section)).join(' ').trim()
  const wordCount = countWords(bodyText)
  const imageStats = sections.reduce((totals, section) => {
    const next = collectImageStats(section)
    totals.total += next.total
    totals.missingAlt += next.missingAlt
    return totals
  }, { total: 0, missingAlt: 0 })
  const brokenLinks = sections.flatMap(section => collectLinks(section)).filter(looksBrokenInternalLink)
  const h1Sections = sections.filter(section => (
    ['hero', 'banner'].includes(section?.type) || (section?.type === 'header' && (section?.headingTag || 'h2') === 'h1')
  ) && String(section?.title || '').trim())

  if (!title || title.length < 4) score -= 18
  if (!metaTitle || metaTitle.length < 20 || metaTitle.length > 60) score -= 14
  if (!metaDescription || metaDescription.length < 70 || metaDescription.length > 160) score -= 12
  if (!slug || !(slug.startsWith('/') || /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i.test(slug))) score -= 8
  if (!headerTitle && h1Sections.length === 0) score -= 10
  if (h1Sections.length > 1) score -= 6
  if (bodyText.length < 140 || wordCount < 60) score -= 10
  if (imageStats.missingAlt > 0) score -= Math.min(12, imageStats.missingAlt * 4)
  if (brokenLinks.length > 0) score -= Math.min(10, brokenLinks.length * 3)

  return clampScore(score)
}

function scoreTone(score: number) {
  return score >= 85 ? 'good' : score >= 65 ? 'medium' : 'bad'
}

function scoreStroke(score: number) {
  const tone = scoreTone(score)
  return tone === 'good' ? '#16a34a' : tone === 'medium' ? '#ea580c' : '#dc2626'
}

function PageScoreBadge({ score, inverse = false }: { score: number; inverse?: boolean }) {
  const normalized = clampScore(score)
  const radius = 12
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - normalized / 100)

  return (
    <div className="relative h-8 w-8 shrink-0" title={`SEO score ${normalized}`}>
      <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
        <circle cx="16" cy="16" r={radius} fill="none" stroke={inverse ? 'rgba(255,255,255,0.32)' : '#94a3b8'} strokeWidth="3" />
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke={scoreStroke(normalized)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${inverse ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
        {normalized}
      </span>
    </div>
  )
}

function getOutlineSectionTitle(section: any, index: number) {
  const fallback = typeof section?.type === 'string'
    ? section.type.replace(/([A-Z])/g, ' $1').replace(/^./, (value: string) => value.toUpperCase())
    : 'Section'
  return String(section?.outlineLabel || section?.title || section?.buttonLabel || `${fallback} ${index + 1}`)
}

function getOutlineSectionsForPage({
  location,
  siteSettings,
  customPages
}: {
  location: ReturnType<typeof useLocation>
  siteSettings: any
  customPages: any[]
}) {
  if (location.pathname !== '/admin/pages') return []
  const params = new URLSearchParams(location.search)
  const builtInPage = params.get('page')
  const customPageId = params.get('custom')
  if (customPageId) {
    const matchedPage = customPages.find((page: any) => String(page.id) === String(customPageId))
    return Array.isArray(matchedPage?.sections) ? matchedPage.sections : []
  }
  if (!builtInPage || builtInPage === 'new') return []
  return Array.isArray(siteSettings?.pageSections?.[builtInPage]) ? siteSettings.pageSections[builtInPage] : []
}

export default function AdminLayout({ title, children, headerActions }: { title: string; children: ReactNode; headerActions?: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPageEditor = location.pathname === '/admin/pages'
  const [notifications, setNotifications] = useState({ newMessages: 0, newTickets: 0, total: 0 })
  const [customPages, setCustomPages] = useState<any[]>([])
  const [siteSettings, setSiteSettings] = useState<any>({})
  const [builderOutlineState, setBuilderOutlineState] = useState<{ pageKey: string; sections: any[] }>({ pageKey: '', sections: [] })
  const [builderOutlineActiveState, setBuilderOutlineActiveState] = useState<{ pageKey: string; sectionId: string; topLevelId: string }>({ pageKey: '', sectionId: '', topLevelId: '' })
  const [theme, setTheme] = useState(() => localStorage.getItem('siteTheme') || 'light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = Number(window.localStorage.getItem(ADMIN_SIDEBAR_WIDTH_KEY) || ADMIN_SIDEBAR_DEFAULT_WIDTH)
    return Number.isFinite(stored) ? Math.min(ADMIN_SIDEBAR_MAX_WIDTH, Math.max(ADMIN_SIDEBAR_MIN_WIDTH, stored)) : ADMIN_SIDEBAR_DEFAULT_WIDTH
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationItems, setNotificationItems] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [setupBannerDismissed, setSetupBannerDismissed] = useState(() => localStorage.getItem(ONBOARDING_BANNER_DISMISSED_KEY) === 'true')
  const [outlineEditingId, setOutlineEditingId] = useState('')
  const [outlineDrafts, setOutlineDrafts] = useState<Record<string, string>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Pages: true,
    Revenue: true,
    Website: true,
    Support: true
  })
  const sidebarResizeStateRef = useRef<{ startX: number; startWidth: number; active: boolean }>({ startX: 0, startWidth: 0, active: false })
  const brandSiteName = siteSettings?.siteName || 'Creative by Caleb'
  const adminPortalName = siteSettings?.adminPortalName || 'Admin Portal'
  const brandLogoUrl = resolveAssetUrl(siteSettings?.logoUrl)
  const brandLogoSize = Math.min(Math.max(Number(siteSettings?.logoSize) || 40, 24), 72)
  const showPoweredBy = siteSettings?.showPoweredBy !== false
  const poweredByText = siteSettings?.poweredByText || 'Powered by Creative CMS'

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'admin') {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark')
    localStorage.setItem('siteTheme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SIDEBAR_WIDTH_KEY, String(sidebarWidth))
  }, [sidebarWidth])

  useEffect(() => {
    setMobileSidebarOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (siteSettings?.setupWizardCompleted === true) {
      setSetupBannerDismissed(false)
      window.localStorage.removeItem(ONBOARDING_BANNER_DISMISSED_KEY)
    }
  }, [siteSettings?.setupWizardCompleted])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const state = sidebarResizeStateRef.current
      if (!state.active) return
      const nextWidth = Math.min(ADMIN_SIDEBAR_MAX_WIDTH, Math.max(ADMIN_SIDEBAR_MIN_WIDTH, state.startWidth + (event.clientX - state.startX)))
      setSidebarWidth(nextWidth)
    }

    const handleMouseUp = () => {
      sidebarResizeStateRef.current = { startX: 0, startWidth: 0, active: false }
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchAdminChrome = async () => {
      try {
        const [notificationData, pagesData, settingsData] = await Promise.all([
          adminAPI.getNotifications(),
          adminAPI.getPages(),
          adminAPI.getSiteSettings()
        ])
        if (isMounted) {
          setNotifications(notificationData)
          setCustomPages(Array.isArray(pagesData) ? pagesData : [])
          setSiteSettings(settingsData || {})
        }
      } catch (error) {
        console.error('Error loading admin navigation:', error)
      }
    }

    const refreshNotifications = async () => {
      try {
        const data = await adminAPI.getNotifications()
        if (isMounted) setNotifications(data)
      } catch (error) {
        console.error('Error loading admin notifications:', error)
      }
    }

    fetchAdminChrome()
    window.addEventListener('admin-notifications-refresh', refreshNotifications)
    window.addEventListener('admin-pages-refresh', fetchAdminChrome)
    window.addEventListener('focus', refreshNotifications)

    const intervalId = window.setInterval(refreshNotifications, 60000)

    return () => {
      isMounted = false
      window.removeEventListener('admin-notifications-refresh', refreshNotifications)
      window.removeEventListener('admin-pages-refresh', fetchAdminChrome)
      window.removeEventListener('focus', refreshNotifications)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleOutlineSync = (event: Event) => {
      const detail = (event as CustomEvent<{ pageKey?: string; sections?: any[] }>).detail
      setBuilderOutlineState({
        pageKey: String(detail?.pageKey || ''),
        sections: Array.isArray(detail?.sections) ? detail.sections : []
      })
    }

    const handleOutlineActive = (event: Event) => {
      const detail = (event as CustomEvent<{ pageKey?: string; sectionId?: string; topLevelId?: string }>).detail
      setBuilderOutlineActiveState({
        pageKey: String(detail?.pageKey || ''),
        sectionId: String(detail?.sectionId || ''),
        topLevelId: String(detail?.topLevelId || '')
      })
    }

    window.addEventListener('creative-builder-outline-sync', handleOutlineSync as EventListener)
    window.addEventListener('creative-builder-outline-active', handleOutlineActive as EventListener)
    return () => {
      window.removeEventListener('creative-builder-outline-sync', handleOutlineSync as EventListener)
      window.removeEventListener('creative-builder-outline-active', handleOutlineActive as EventListener)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  const isGroupActive = (links: Array<{ path: string }>) => {
    return links.some(link => location.pathname === link.path || location.pathname.startsWith(`${link.path}/`))
  }

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'newMessages') return notifications.newMessages
    if (badgeKey === 'newTickets') return notifications.newTickets
    return 0
  }

  const isPageLinkActive = (page: string) => {
    if (location.pathname !== '/admin/pages') return false
    const params = new URLSearchParams(location.search)
    if (!params.get('page') && !params.get('custom')) return page === 'home'
    return params.get('page') === page
  }

  const isCustomPageLinkActive = (pageId: string) => {
    if (location.pathname !== '/admin/pages') return false
    return new URLSearchParams(location.search).get('custom') === pageId
  }
  const isMobilePrimaryActive = (path: string) => {
    if (path.startsWith('/admin/pages')) return location.pathname === '/admin/pages'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }
  const builtInPageNavLinks: PageNavLink[] = builtInPageLinks.map((link) => {
    const metadata = siteSettings?.pageMetadata?.[link.page] || {}
    const sections = Array.isArray(siteSettings?.pageSections?.[link.page]) ? siteSettings.pageSections[link.page] : []
    return {
      title: metadata.pageTitle || link.label,
      path: `/admin/pages?page=${link.page}`,
      active: isPageLinkActive(link.page),
      isPublished: true,
      seoScore: computeNavSeoScore({
        title: metadata.pageTitle || link.label,
        metaTitle: metadata.metaTitle || '',
        metaDescription: metadata.metaDescription || '',
        pageUrl: metadata.pageUrl || `/${link.page === 'home' ? '' : link.page}`,
        headerTitle: metadata.headerTitle || ''
      }, sections)
    }
  })
  const customPageNavLinks: PageNavLink[] = customPages.map((page) => ({
    title: page.title || 'Custom Page',
    path: `/admin/pages?custom=${page.id}`,
    active: isCustomPageLinkActive(String(page.id)),
    isPublished: page.isPublished !== false,
    seoScore: computeNavSeoScore(page, Array.isArray(page.sections) ? page.sections : [])
  }))
  const activePageParams = new URLSearchParams(location.search)
  const activePageKey = activePageParams.get('custom')
    ? `custom:${activePageParams.get('custom')}`
    : `builtIn:${activePageParams.get('page') || 'home'}`
  const fallbackOutlineSections = getOutlineSectionsForPage({ location, siteSettings, customPages })
  const currentOutlineSections = builderOutlineState.pageKey === activePageKey ? builderOutlineState.sections : fallbackOutlineSections
  const activeOutlineSectionId = builderOutlineActiveState.pageKey === activePageKey ? builderOutlineActiveState.sectionId : ''
  const activeOutlineTopLevelId = builderOutlineActiveState.pageKey === activePageKey ? builderOutlineActiveState.topLevelId : ''

  const emitBuilderOutlineEvent = useCallback((name: string, detail: Record<string, any>) => {
    window.dispatchEvent(new CustomEvent(name, { detail }))
  }, [])

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ease-in-out ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
    }`
  const collapsedLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex h-10 items-center justify-center rounded-lg transition-all duration-200 ease-in-out ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
    }`
  const searchTerm = menuSearch.trim().toLowerCase()
  const matchesSearch = (label: string) => !searchTerm || label.toLowerCase().includes(searchTerm)
  const toggleGroup = (label: string) => setOpenGroups(current => ({ ...current, [label]: !(current[label] ?? true) }))
  const openNotifications = async () => {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    if (!nextOpen) return

    try {
      setNotificationsLoading(true)
      const [messages, tickets] = await Promise.all([
        adminAPI.getContactMessages(),
        ticketsAPI.getAdminTickets()
      ])
      const messageItems = (messages || [])
        .filter((message: any) => message.status === 'new')
        .slice(0, 5)
        .map((message: any) => ({
          id: `message-${message.id}`,
          title: message.name ? `New message from ${message.name}` : 'New contact message',
          body: message.subject || message.message || message.email || 'Contact message waiting for review.',
          to: '/admin/messages'
        }))
      const ticketItems = (tickets || [])
        .filter((ticket: any) => ticket.status === 'pending')
        .slice(0, 5)
        .map((ticket: any) => ({
          id: `ticket-${ticket.id}`,
          title: ticket.subject || 'Pending support ticket',
          body: ticket.client?.name || ticket.message || 'Support ticket waiting for review.',
          to: '/admin/tickets'
        }))
      setNotificationItems([...messageItems, ...ticketItems])
    } catch (error) {
      setNotificationItems([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  const startSidebarResize = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!sidebarOpen) return
    event.preventDefault()
    event.stopPropagation()
    sidebarResizeStateRef.current = {
      startX: event.clientX,
      startWidth: sidebarWidth,
      active: true
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarOpen, sidebarWidth])

  const dismissSetupBanner = useCallback(() => {
    setSetupBannerDismissed(true)
    window.localStorage.setItem(ONBOARDING_BANNER_DISMISSED_KEY, 'true')
  }, [])

  const startOutlineRename = useCallback((sectionId: string, currentName: string) => {
    setOutlineEditingId(sectionId)
    setOutlineDrafts((current) => ({ ...current, [sectionId]: currentName }))
  }, [])

  const updateOutlineDraft = useCallback((sectionId: string, value: string) => {
    setOutlineDrafts((current) => ({ ...current, [sectionId]: value }))
  }, [])

  const cancelOutlineRename = useCallback(() => {
    setOutlineEditingId('')
  }, [])

  const commitOutlineRename = useCallback((sectionId: string) => {
    const nextName = String(outlineDrafts[sectionId] || '').trim()
    if (nextName) emitBuilderOutlineEvent('creative-builder-outline-rename', { sectionId, name: nextName })
    setOutlineEditingId('')
  }, [emitBuilderOutlineEvent, outlineDrafts])

  const renderPageOutline = (pageLink: PageNavLink) => {
    if (location.pathname !== '/admin/pages' || !pageLink.active || pageLink.isAction || currentOutlineSections.length === 0) return null
    return (
      <div className="mt-2 ml-4 space-y-1 border-l border-gray-200 pl-3">
        {currentOutlineSections.map((section: any, index: number) => {
          const sectionId = String(section?.id || index)
          const isTopLevelSelected = activeOutlineTopLevelId === sectionId || activeOutlineSectionId === sectionId
          const nestedBlocks = section?.type === 'columns'
            ? (Array.isArray(section?.items) ? section.items.flatMap((item: any) => Array.isArray(item?.sections) ? item.sections : []) : [])
            : []
          return (
            <div key={sectionId} className="space-y-1">
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-outline-section-id', sectionId)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceId = event.dataTransfer.getData('application/x-outline-section-id')
                  if (!sourceId || sourceId === sectionId) return
                  emitBuilderOutlineEvent('creative-builder-outline-move', { sourceId, targetId: sectionId })
                }}
                className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
                  isTopLevelSelected ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <FiMove className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {outlineEditingId === sectionId ? (
                  <input
                    autoFocus
                    value={outlineDrafts[sectionId] ?? getOutlineSectionTitle(section, index)}
                    onChange={(event) => updateOutlineDraft(sectionId, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitOutlineRename(sectionId)
                      } else if (event.key === 'Escape') {
                        event.preventDefault()
                        cancelOutlineRename()
                      }
                    }}
                    onBlur={() => commitOutlineRename(sectionId)}
                    className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-sm font-semibold text-gray-800 outline-none ring-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => emitBuilderOutlineEvent('creative-builder-outline-select', { sectionId })}
                    className="min-w-0 flex flex-1 items-center gap-2 text-left"
                  >
                    <span className={`truncate ${section?.isHidden ? 'text-gray-400 line-through' : ''}`}>{getOutlineSectionTitle(section, index)}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => emitBuilderOutlineEvent('creative-builder-outline-visibility', { sectionId })}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-blue-700"
                  aria-label={section?.isHidden ? 'Show section' : 'Hide section'}
                  title={section?.isHidden ? 'Show section' : 'Hide section'}
                >
                  {section?.isHidden ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => emitBuilderOutlineEvent('creative-builder-outline-duplicate', { sectionId })}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-blue-700"
                  aria-label="Duplicate section"
                  title="Duplicate section"
                >
                  <FiCopy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startOutlineRename(sectionId, getOutlineSectionTitle(section, index))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-blue-700"
                  aria-label="Rename section"
                  title="Rename section"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => emitBuilderOutlineEvent('creative-builder-outline-delete', { sectionId })}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete section"
                  title="Delete section"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {nestedBlocks.length > 0 && (
                <div className="ml-4 space-y-1 border-l border-gray-100 pl-3">
                  {nestedBlocks.map((block: any, blockIndex: number) => {
                    const blockId = String(block?.id || `${sectionId}-nested-${blockIndex}`)
                    const isBlockSelected = activeOutlineSectionId === blockId
                    return (
                      <div key={blockId} className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                        isBlockSelected ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {outlineEditingId === blockId ? (
                          <input
                            autoFocus
                            value={outlineDrafts[blockId] ?? getOutlineSectionTitle(block, blockIndex)}
                            onChange={(event) => updateOutlineDraft(blockId, event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                commitOutlineRename(blockId)
                              } else if (event.key === 'Escape') {
                                event.preventDefault()
                                cancelOutlineRename()
                              }
                            }}
                            onBlur={() => commitOutlineRename(blockId)}
                            className="min-w-0 flex-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-gray-800 outline-none ring-0"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => emitBuilderOutlineEvent('creative-builder-outline-select', { sectionId: blockId })}
                            className="min-w-0 flex flex-1 items-center gap-2 text-left"
                          >
                            <span className={`truncate ${block?.isHidden ? 'text-gray-400 line-through' : ''}`}>{getOutlineSectionTitle(block, blockIndex)}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => emitBuilderOutlineEvent('creative-builder-outline-visibility', { sectionId: blockId })}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-white hover:text-blue-700"
                          aria-label={block?.isHidden ? 'Show block' : 'Hide block'}
                          title={block?.isHidden ? 'Show block' : 'Hide block'}
                        >
                          {block?.isHidden ? <FiEyeOff className="h-3 w-3" /> : <FiEye className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => emitBuilderOutlineEvent('creative-builder-outline-duplicate', { sectionId: blockId })}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-white hover:text-blue-700"
                          aria-label="Duplicate block"
                          title="Duplicate block"
                        >
                          <FiCopy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startOutlineRename(blockId, getOutlineSectionTitle(block, blockIndex))}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-white hover:text-blue-700"
                          aria-label="Rename block"
                          title="Rename block"
                        >
                          <FiEdit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => emitBuilderOutlineEvent('creative-builder-outline-delete', { sectionId: blockId })}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete block"
                          title="Delete block"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="admin-shell min-h-screen bg-gray-50 lg:flex">
      {mobileSidebarOpen && <button type="button" aria-label="Close admin navigation" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-gray-950/45 lg:hidden" />}
      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-full max-w-[22rem] flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-gray-200 px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{adminPortalName}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">{adminPortalName}</h2>
              <p className="mt-1 text-sm text-gray-500">{brandSiteName}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              aria-label="Close admin navigation"
            >
              <FiX size={18} />
            </button>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            <FiSearch className="shrink-0" />
            <input
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search admin"
              className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
            />
          </label>
        </div>

        <div className="grid grid-cols-4 gap-2 border-b border-gray-200 px-4 py-3">
          {[
            { label: 'Menu', value: String(primaryLinks.length + adminGroups.length + utilityLinks.length) },
            { label: 'Pages', value: String(customPages.length + builtInPageLinks.length) },
            { label: 'Alerts', value: String(notifications.total) },
            { label: 'Theme', value: theme === 'dark' ? 'Dark' : 'Light' }
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-gray-50 px-2 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-5 grid grid-cols-2 gap-2">
            {primaryLinks.filter(link => matchesSearch(link.label)).map((link) => {
              const Icon = link.icon
              const active = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </div>

          <div className="space-y-4">
            {adminGroups.map((group) => {
              const GroupIcon = group.icon
              const groupActive = group.label === 'Pages' ? location.pathname.startsWith('/admin/pages') || isGroupActive(group.links) : isGroupActive(group.links)
              const pageLinks: PageNavLink[] = group.label === 'Pages'
                ? [
                    { title: 'Add New Page', path: '/admin/pages?page=new', active: isPageLinkActive('new'), isAction: true },
                    ...builtInPageNavLinks,
                    ...customPageNavLinks,
                  ]
                : []
              const filteredPageLinks = pageLinks.filter(link => matchesSearch(link.title))
              const filteredGroupLinks = group.links.filter(link => matchesSearch(link.label))
              const groupHasResults = matchesSearch(group.label) || filteredPageLinks.length > 0 || filteredGroupLinks.length > 0
              if (!groupHasResults) return null
              const groupExpanded = searchTerm ? true : (openGroups[group.label] ?? true)

              return (
                <div key={`mobile-${group.label}`} className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${groupActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        <GroupIcon size={17} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-gray-900">{group.label}</span>
                        <span className="block text-xs text-gray-500">
                          {group.label === 'Pages'
                            ? `${filteredPageLinks.length} page destinations`
                            : `${filteredGroupLinks.length} shortcuts`}
                        </span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {group.label === 'Support' && notifications.total > 0 && (
                        <span className="min-w-6 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white">
                          {notifications.total > 99 ? '99+' : notifications.total}
                        </span>
                      )}
                      {groupExpanded ? <FiChevronDown size={16} className="text-gray-500" /> : <FiChevronRight size={16} className="text-gray-500" />}
                    </span>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${groupExpanded ? 'max-h-[60rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-2 px-2 pb-2">
                      {group.label === 'Pages' && filteredPageLinks.length > 0 && (
                        <div className="grid gap-2">
                          {filteredPageLinks.map((link) => (
                            <div key={link.path}>
                              <Link
                                to={link.path}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                                  link.active ? 'bg-blue-600 text-white' : link.isAction ? 'border border-dashed border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                              >
                                {link.isAction ? <FiFileText size={16} /> : link.isPublished === false ? <FiAlertCircle size={16} className="shrink-0 text-red-500" /> : <FiCheckCircle size={16} className="shrink-0 text-green-500" />}
                                <span className="min-w-0 flex-1 truncate">{link.title}</span>
                                {!link.isAction && typeof link.seoScore === 'number' && <PageScoreBadge score={link.seoScore} inverse={link.active} />}
                              </Link>
                              {renderPageOutline(link)}
                            </div>
                          ))}
                        </div>
                      )}

                      {filteredGroupLinks.map((link) => {
                        const Icon = link.icon
                        const badgeCount = getBadgeCount('badgeKey' in link ? (link as any).badgeKey : undefined)
                        return (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                                isActive ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                              }`
                            }
                          >
                            <span className="inline-flex items-center gap-3">
                              <Icon size={16} />
                              <span>{link.label}</span>
                            </span>
                            {badgeCount > 0 && (
                              <span className="min-w-6 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white">
                                {badgeCount > 99 ? '99+' : badgeCount}
                              </span>
                            )}
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4" />
      </aside>
      <aside className={`admin-sidebar hidden fixed inset-y-0 left-0 z-50 max-w-[88vw] overflow-visible bg-white shadow-sm transition-transform duration-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:translate-x-0 lg:transition-all ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarOpen ? '' : 'lg:w-16'}`} style={sidebarOpen ? { width: `${sidebarWidth}px` } : undefined}>
        <div className="hidden w-full flex-col border-b border-gray-200 lg:flex lg:h-full lg:border-b-0 lg:border-r">
          <div className={`border-b border-gray-200 ${sidebarOpen ? 'p-5' : 'p-3'}`}>
            <div className={`flex ${sidebarOpen ? 'items-center justify-between gap-3' : 'flex-col items-center gap-2'}`}>
              <Link to="/admin/dashboard" className={`inline-flex min-w-0 items-center gap-2 text-lg font-black text-gray-900 ${sidebarOpen ? '' : 'justify-center'}`} title={adminPortalName}>
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} alt={brandSiteName} className="w-auto object-contain shrink-0" style={{ height: `${sidebarOpen ? brandLogoSize : 28}px` }} />
                ) : (
                  <FiGrid className="shrink-0 text-blue-600" />
                )}
                {sidebarOpen && <span className="truncate">{adminPortalName}</span>}
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(current => !current)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                aria-label={sidebarOpen ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
                title={sidebarOpen ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
              >
                {sidebarOpen ? <FiArrowLeft /> : <FiArrowRight />}
              </button>
            </div>
            {sidebarOpen && (
              <label className="mt-4 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-600">
                <FiSearch className="shrink-0" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu"
                  className="w-full border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
                />
              </label>
            )}
          </div>

          <nav className={`flex-1 overflow-auto ${sidebarOpen ? 'space-y-5 p-4' : 'space-y-2 p-3'}`}>
            <div className="space-y-1">
              {primaryLinks.filter(link => matchesSearch(link.label)).map((link) => {
                const Icon = link.icon
                return (
                  <NavLink key={link.path} to={link.path} onClick={() => setMobileSidebarOpen(false)} className={sidebarOpen ? sidebarLinkClass : collapsedLinkClass} title={link.label}>
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {sidebarOpen && link.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>

            {adminGroups.map((group) => {
              const GroupIcon = group.icon
              const groupActive = group.label === 'Pages' ? location.pathname.startsWith('/admin/pages') || isGroupActive(group.links) : isGroupActive(group.links)
              const pageLinks: PageNavLink[] = group.label === 'Pages'
                ? [
                    { title: 'Add New Page', path: '/admin/pages?page=new', active: isPageLinkActive('new'), isAction: true },
                    ...builtInPageNavLinks,
                    ...customPageNavLinks,
                  ]
                : []
              const filteredPageLinks = pageLinks.filter(link => matchesSearch(link.title))
              const filteredGroupLinks = group.links.filter(link => matchesSearch(link.label))
              const groupHasResults = matchesSearch(group.label) || filteredPageLinks.length > 0 || filteredGroupLinks.length > 0
              if (!groupHasResults) return null
              const groupExpanded = sidebarOpen && (searchTerm ? true : (openGroups[group.label] ?? true))

              return (
                <div key={group.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => sidebarOpen ? toggleGroup(group.label) : setSidebarOpen(true)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 ease-in-out ${groupActive ? 'text-blue-600' : 'text-gray-500'} ${sidebarOpen ? 'hover:bg-gray-100' : 'justify-center hover:bg-blue-50 hover:text-blue-700'}`}
                    aria-expanded={groupExpanded}
                    title={group.label}
                  >
                    <span className="inline-flex items-center gap-2">
                      <GroupIcon size={14} />
                      {sidebarOpen && group.label}
                    </span>
                    {sidebarOpen && group.label === 'Support' && notifications.total > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {notifications.total > 99 ? '99+' : notifications.total}
                      </span>
                    )}
                    {sidebarOpen && (groupExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />)}
                  </button>

                  {sidebarOpen && (
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${groupExpanded ? 'max-h-[44rem] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.label === 'Pages' && (
                    <div className="ml-4 border-l border-gray-200 pl-3">
                      {filteredPageLinks.find(link => link.isAction) && (
                        <div className="sticky top-0 z-10 mb-2 bg-white pb-2">
                          {filteredPageLinks.filter(link => link.isAction).map(link => (
                            <Link
                              key={link.path}
                              to={link.path}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                link.active
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-dashed border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <FiFileText size={16} />
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      )}
                      <div className="max-h-[22rem] space-y-1 overflow-y-auto pr-1">
                      {filteredPageLinks.filter(link => !link.isAction).map(link => (
                        <div key={link.path}>
                          <Link
                            to={link.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              link.active
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            {link.isPublished === false ? <FiAlertCircle size={16} className={`shrink-0 ${link.active ? 'text-white' : 'text-red-500'}`} /> : <FiCheckCircle size={16} className={`shrink-0 ${link.active ? 'text-white' : 'text-green-500'}`} />}
                            <span className="min-w-0 flex-1 truncate">{link.title}</span>
                            {typeof link.seoScore === 'number' && <PageScoreBadge score={link.seoScore} inverse={link.active} />}
                          </Link>
                          {renderPageOutline(link)}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {filteredGroupLinks.map((link) => {
                    const Icon = link.icon
                    const badgeCount = getBadgeCount('badgeKey' in link ? (link as any).badgeKey : undefined)
                    return (
                      <NavLink key={link.path} to={link.path} onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <span className="inline-flex items-center gap-2">
                          <Icon size={16} />
                          {link.label}
                        </span>
                        {badgeCount > 0 && (
                          <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="space-y-1">
              {utilityLinks.filter(link => matchesSearch(link.label)).map((link) => {
                const Icon = link.icon
                return (
                  <NavLink key={link.path} to={link.path} onClick={() => setMobileSidebarOpen(false)} className={sidebarOpen ? sidebarLinkClass : collapsedLinkClass} title={link.label}>
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {sidebarOpen && link.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </nav>

          <div className={`mt-auto space-y-2 border-t border-gray-200 ${sidebarOpen ? 'p-4' : 'p-3'}`}>
            {sidebarOpen && showPoweredBy && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">{poweredByText}</p>
            )}
          </div>
        </div>
        {sidebarOpen && (
          <button
            type="button"
            onMouseDown={startSidebarResize}
            className="absolute -right-[10px] top-1/2 hidden h-24 w-5 -translate-y-1/2 cursor-col-resize items-center justify-center xl:flex"
            aria-label="Resize navigation panel"
            title="Resize navigation panel"
          >
            <span className="h-14 w-1.5 rounded-full bg-gray-300 transition hover:bg-blue-500" />
          </button>
        )}
      </aside>

      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <div className="admin-topbar sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className={isPageEditor ? 'px-4 py-4' : 'container py-4 md:py-5'}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 lg:hidden" aria-label="Open admin navigation">
                  <FiMenu size={18} />
                </button>
                <div>
                  <Link to="/admin/dashboard" className="hidden text-sm font-semibold text-blue-600 hover:text-blue-800 sm:inline-flex">
                    {adminPortalName}
                  </Link>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">{title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                <div className="mx-1 hidden h-8 w-px bg-gray-200 md:block" aria-hidden="true" />
                <div className="relative">
                  <button
                    type="button"
                    onClick={openNotifications}
                    className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`${notifications.total} new admin notifications`}
                    title={`${notifications.newMessages} new messages, ${notifications.newTickets} new tickets`}
                  >
                    <FiBell size={20} />
                    {notifications.total > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                        {notifications.total > 99 ? '99+' : notifications.total}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 top-12 z-50 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border bg-white shadow-xl">
                      <div className="border-b p-4">
                        <h2 className="font-bold text-gray-900">Notifications</h2>
                        <p className="text-sm text-gray-600">{notifications.total} item{notifications.total === 1 ? '' : 's'} need attention</p>
                      </div>
                      <div className="max-h-96 overflow-auto p-2">
                        {notificationsLoading && <div className="p-3 text-sm text-gray-600">Loading notifications...</div>}
                        {!notificationsLoading && notificationItems.length === 0 && <div className="p-3 text-sm text-gray-600">No new notifications.</div>}
                        {!notificationsLoading && notificationItems.map(item => (
                          <Link
                            key={item.id}
                            to={item.to}
                            onClick={() => setNotificationsOpen(false)}
                            className="block rounded-lg p-3 transition hover:bg-blue-50"
                          >
                            <span className="block text-sm font-bold text-gray-900">{item.title}</span>
                            <span className="mt-1 line-clamp-2 block text-xs text-gray-600">{item.body}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                </button>
                <Link
                  to="/"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                  aria-label="Back to website"
                  title="Back to website"
                >
                  <FiMonitor size={18} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                  aria-label="Logout"
                  title="Logout"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {siteSettings?.setupWizardCompleted !== true && !setupBannerDismissed && (
          <div className="border-b border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
            <div className={`${isPageEditor ? 'w-full' : 'container'} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div>
                <div className="text-sm font-semibold">Finish your onboarding setup wizard</div>
                <p className="text-sm text-blue-800">Brand the site, pick a starter demo, review homepage and navigation, then check launch readiness.</p>
                </div>
                <button
                  type="button"
                  onClick={dismissSetupBanner}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-100 hover:text-blue-900"
                  aria-label="Dismiss setup wizard notification"
                  title="Dismiss setup wizard notification"
                >
                  <FiX size={18} />
                </button>
              </div>
              <Link to="/admin/settings?tab=Setup%20Wizard" className="btn-primary justify-center sm:justify-start">
                Open Setup Wizard
              </Link>
            </div>
          </div>
        )}

        <div className={isPageEditor ? 'w-full px-4 py-5 md:py-6' : 'container py-6 md:py-8'}>{children}</div>
      </main>

      <nav className="admin-mobile-footer fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryLinks.map((link) => {
            const Icon = link.icon
            const active = isMobilePrimaryActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon size={18} />
                <span className="text-center leading-tight">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
