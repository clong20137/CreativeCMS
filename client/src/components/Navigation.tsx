import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi'
import { pluginsAPI, resolveAssetUrl, siteSettingsAPI } from '../services/api'
import { applyThemeSettings } from '../utils/theme'

type NavigationItem = {
  label: string
  url: string
  isActive: boolean
  sortOrder: number
  children: NavigationItem[]
}

function normalizeNavigationPath(url: string) {
  const value = String(url || '/').trim()
  if (!value || value === '/') return '/'
  const prefixed = value.startsWith('/') ? value : `/${value}`
  const normalized = prefixed.replace(/\/{2,}/g, '/')
  return normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

const defaultNavigationItems: NavigationItem[] = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0, children: [] },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10, children: [] },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20, children: [] },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30, children: [] },
  { label: 'Plugins', url: '/plugins', isActive: true, sortOrder: 40, children: [] },
  { label: 'Contact', url: '/contact', isActive: true, sortOrder: 50, children: [] }
]

function normalizeNavigationItem(item: any, index = 0): NavigationItem {
  return {
    label: item?.label || 'New Page',
    url: normalizeNavigationPath(item?.url || '/new-page'),
    isActive: item?.isActive !== false,
    sortOrder: Number(item?.sortOrder ?? index * 10),
    children: Array.isArray(item?.children) ? item.children.map((child: any, childIndex: number): NavigationItem => normalizeNavigationItem(child, childIndex)) : []
  }
}

function sortNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return [...items]
    .map((item: NavigationItem): NavigationItem => ({ ...item, children: sortNavigationItems(Array.isArray(item.children) ? item.children : []) }))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
}

function isExternalUrl(url: string) {
  return /^(https?:)?\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url)
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null)
  const [desktopOpenDropdown, setDesktopOpenDropdown] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'))
  const [siteName, setSiteName] = useState('Creative by Caleb')
  const [clientPortalName, setClientPortalName] = useState('Client Portal')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoSize, setLogoSize] = useState(40)
  const [announcementBar, setAnnouncementBar] = useState({
    enabled: false,
    text: '',
    linkLabel: '',
    linkUrl: '',
    backgroundColor: '#111827',
    textColor: '#ffffff'
  })
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(defaultNavigationItems)
  const [hasActivePlugins, setHasActivePlugins] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('siteTheme') || 'light')
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
  const isSectionActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`)
  const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/client-dashboard'

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'))
    setIsOpen(false)
    setMobileOpenDropdown(null)
    setDesktopOpenDropdown(null)
  }, [location.pathname])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        applyThemeSettings(settings)
        setSiteName(settings.siteName || 'Creative by Caleb')
        setClientPortalName(settings.clientPortalName || 'Client Portal')
        setLogoUrl(resolveAssetUrl(settings.logoUrl))
        setLogoSize(Number(settings.logoSize) || 40)
        setAnnouncementBar({
          enabled: settings.announcementBarEnabled === true,
          text: String(settings.announcementBarText || ''),
          linkLabel: String(settings.announcementBarLinkLabel || ''),
          linkUrl: String(settings.announcementBarLinkUrl || ''),
          backgroundColor: String(settings.announcementBarBackgroundColor || '#111827'),
          textColor: String(settings.announcementBarTextColor || '#ffffff')
        })
        if (Array.isArray(settings.navigationItems) && settings.navigationItems.length) {
          setNavigationItems(settings.navigationItems.map(normalizeNavigationItem))
        } else if (settings.pageMetadata) {
          setNavigationItems(defaultNavigationItems.map(item => {
            const key = item.url === '/' ? 'home' : item.url.replace('/', '')
            const page = settings.pageMetadata?.[key] || {}
            return {
              ...item,
              label: page.pageTitle || item.label,
              url: normalizeNavigationPath(page.pageUrl || item.url),
              children: []
            }
          }))
        }
      } catch (error) {
        console.error('Error loading site settings:', error)
      }
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const plugins = await pluginsAPI.getPlugins()
        setHasActivePlugins(plugins.length > 0)
      } catch (error) {
        console.error('Error loading plugin navigation:', error)
      }
    }

    fetchPlugins()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark')
    localStorage.setItem('siteTheme', theme)
  }, [theme])

  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => sortNavigationItems(items)
    .filter((item: NavigationItem) => item.isActive !== false)
    .filter((item: NavigationItem) => item.url !== '/plugins' || hasActivePlugins)
    .map((item: NavigationItem): NavigationItem => ({
      ...item,
      children: filterNavigationItems(Array.isArray(item.children) ? item.children : [])
    }))

  const visibleNavigationItems = filterNavigationItems(navigationItems)
  const showAnnouncementBar = announcementBar.enabled && Boolean(announcementBar.text.trim())
  const announcementLinkUrl = String(announcementBar.linkUrl || '').trim()

  const linkClassName = (url: string) => {
    const active = url === '/plugins' ? isSectionActive(url) : isActive(url)
    return `site-nav-link inline-flex h-10 items-center border-b-2 border-transparent transition ${active ? 'site-nav-link-active' : ''}`
  }

  return (
    <nav className="site-nav sticky top-0 z-50 shadow-lg">
      {showAnnouncementBar && (
        <div
          className="site-announcement-bar border-b"
          style={{
            backgroundColor: announcementBar.backgroundColor,
            color: announcementBar.textColor,
            borderColor: 'rgba(255,255,255,0.12)'
          }}
        >
          <div className="container py-3">
            <div className="flex flex-col gap-2 text-center md:flex-row md:items-center md:justify-between md:text-left">
              <p className="text-sm font-semibold" style={{ color: announcementBar.textColor }}>
                {announcementBar.text}
              </p>
              {announcementBar.linkLabel.trim() && announcementLinkUrl && (
                isExternalUrl(announcementLinkUrl) ? (
                  <a
                    href={announcementLinkUrl}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition"
                    style={{
                      color: announcementBar.textColor,
                      borderColor: announcementBar.textColor
                    }}
                  >
                    {announcementBar.linkLabel}
                  </a>
                ) : (
                  <Link
                    to={announcementLinkUrl}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition"
                    style={{
                      color: announcementBar.textColor,
                      borderColor: announcementBar.textColor
                    }}
                  >
                    {announcementBar.linkLabel}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}
      <div className="container">
        <div className="flex justify-between items-center min-h-16 py-2">
          <Link to="/" className="site-nav-brand flex items-center text-2xl font-bold">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="w-auto object-contain"
                style={{ height: `${Math.min(Math.max(logoSize, 24), 96)}px` }}
              />
            ) : siteName}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {visibleNavigationItems.map(item => {
              const children = Array.isArray(item.children) ? item.children : []
              const dropdownKey = `${item.label}-${item.url}`
              if (children.length === 0) {
                return (
                  <Link key={dropdownKey} to={item.url} className={linkClassName(item.url)}>
                    {item.label}
                  </Link>
                )
              }

              const isParentActive = isSectionActive(item.url) || children.some((child: NavigationItem) => isActive(child.url) || isSectionActive(child.url))

              return (
                <div
                  key={dropdownKey}
                  className="relative"
                  onMouseEnter={() => setDesktopOpenDropdown(dropdownKey)}
                  onMouseLeave={() => setDesktopOpenDropdown(current => current === dropdownKey ? null : current)}
                >
                  <div className="flex items-center gap-1">
                    <Link to={item.url} className={`site-nav-link inline-flex h-10 items-center border-b-2 border-transparent transition ${isParentActive ? 'site-nav-link-active' : ''}`}>
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDesktopOpenDropdown(current => current === dropdownKey ? null : dropdownKey)}
                      className={`site-nav-link inline-flex h-10 items-center justify-center transition ${isParentActive ? 'site-nav-link-active' : ''}`}
                      aria-label={`Toggle ${item.label} submenu`}
                    >
                      <FiChevronDown className={`transition-transform ${desktopOpenDropdown === dropdownKey ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <div className={`absolute left-0 top-full z-50 min-w-[14rem] pt-2 transition ${desktopOpenDropdown === dropdownKey ? 'visible opacity-100 translate-y-0' : 'invisible -translate-y-1 opacity-0'}`}>
                    <div className="site-nav-panel rounded-lg border p-2 shadow-xl">
                      {children.map((child: NavigationItem) => (
                        <Link key={`${child.label}-${child.url}`} to={child.url} className={`site-nav-submenu-link block rounded-md px-3 py-2 text-sm font-medium transition ${isActive(child.url) || isSectionActive(child.url) ? 'site-nav-submenu-link-active bg-blue-50' : 'hover:bg-gray-50'}`}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
              <Link
                to={userRole ? dashboardPath : '/login'}
                className="btn-primary site-nav-action-button inline-flex items-center justify-center whitespace-nowrap px-5 py-3 text-sm font-bold"
              >
                {userRole ? 'Dashboard' : clientPortalName}
              </Link>
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="site-nav-icon-button inline-flex h-10 w-10 items-center justify-center transition"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="site-nav-mobile-button md:hidden inline-flex h-10 w-10 items-center justify-center transition"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="site-nav-mobile-panel md:hidden pb-5 space-y-2">
            {visibleNavigationItems.map(item => {
              const children = Array.isArray(item.children) ? item.children : []
              const dropdownKey = `${item.label}-${item.url}`
              const isParentActive = isSectionActive(item.url) || children.some((child: NavigationItem) => isActive(child.url) || isSectionActive(child.url))

              if (children.length === 0) {
                return (
                  <Link
                    key={dropdownKey}
                    to={item.url}
                    className={`site-nav-link block rounded-xl px-3 py-3 text-base font-medium transition ${
                      isParentActive ? 'site-nav-link-active bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <div key={dropdownKey} className="site-nav-mobile-group rounded-2xl p-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      to={item.url}
                      className={`site-nav-link min-w-0 flex-1 rounded-xl px-3 py-3 text-base font-semibold transition ${
                        isParentActive ? 'site-nav-link-active bg-white shadow-sm' : 'hover:bg-white'
                      }`}
                    >
                      <span className="block truncate">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileOpenDropdown(current => current === dropdownKey ? null : dropdownKey)}
                      className={`site-nav-mobile-button inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        mobileOpenDropdown === dropdownKey || isParentActive
                          ? 'site-nav-link-active bg-white shadow-sm'
                          : 'hover:bg-white'
                      }`}
                      aria-label={`Toggle ${item.label} submenu`}
                      aria-expanded={mobileOpenDropdown === dropdownKey}
                    >
                      <FiChevronDown className={`transition-transform ${mobileOpenDropdown === dropdownKey ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {mobileOpenDropdown === dropdownKey && (
                    <div className="site-nav-panel mt-2 space-y-1 rounded-xl p-2 shadow-sm">
                      {children.map((child: NavigationItem) => (
                        <Link
                          key={`${child.label}-${child.url}`}
                          to={child.url}
                          className={`site-nav-submenu-link block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive(child.url) || isSectionActive(child.url)
                              ? 'site-nav-submenu-link-active bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div className="site-nav-mobile-actions grid grid-cols-2 gap-3 pt-2">
              <Link to={userRole ? dashboardPath : '/login'} className="btn-primary site-nav-action-button inline-flex w-full items-center justify-center whitespace-nowrap px-5 py-3 text-sm font-bold">
                {userRole ? 'Dashboard' : clientPortalName}
              </Link>
              <button
                onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
                className="site-nav-icon-button inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-4 text-sm font-semibold transition"
              >
                {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
