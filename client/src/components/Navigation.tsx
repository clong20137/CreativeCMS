import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi'
import { pluginsAPI, resolveAssetUrl, siteSettingsAPI } from '../services/api'

const defaultNavigationItems = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0, children: [] },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10, children: [] },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20, children: [] },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30, children: [] },
  { label: 'Plugins', url: '/plugins', isActive: true, sortOrder: 40, children: [] },
  { label: 'Contact', url: '/contact', isActive: true, sortOrder: 50, children: [] }
]

function normalizeNavigationItem(item: any, index = 0): any {
  return {
    label: item?.label || 'New Page',
    url: item?.url || '/new-page',
    isActive: item?.isActive !== false,
    sortOrder: Number(item?.sortOrder ?? index * 10),
    children: Array.isArray(item?.children) ? item.children.map((child: any, childIndex: number) => normalizeNavigationItem(child, childIndex)) : []
  }
}

function sortNavigationItems(items: any[]) {
  return [...items]
    .map(item => ({ ...item, children: sortNavigationItems(Array.isArray(item.children) ? item.children : []) }))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState<string | null>(null)
  const [desktopOpenDropdown, setDesktopOpenDropdown] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'))
  const [siteName, setSiteName] = useState('Creative by Caleb')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoSize, setLogoSize] = useState(40)
  const [navigationItems, setNavigationItems] = useState(defaultNavigationItems)
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
        setSiteName(settings.siteName || 'Creative by Caleb')
        setLogoUrl(resolveAssetUrl(settings.logoUrl))
        setLogoSize(Number(settings.logoSize) || 40)
        if (Array.isArray(settings.navigationItems) && settings.navigationItems.length) {
          setNavigationItems(settings.navigationItems.map(normalizeNavigationItem))
        } else if (settings.pageMetadata) {
          setNavigationItems(defaultNavigationItems.map(item => {
            const key = item.url === '/' ? 'home' : item.url.replace('/', '')
            const page = settings.pageMetadata?.[key] || {}
            return {
              ...item,
              label: page.pageTitle || item.label,
              url: page.pageUrl || item.url,
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

  const filterNavigationItems = (items: any[]) => sortNavigationItems(items)
    .filter(item => item.isActive !== false)
    .filter(item => item.url !== '/plugins' || hasActivePlugins)
    .map(item => ({
      ...item,
      children: filterNavigationItems(Array.isArray(item.children) ? item.children : [])
    }))

  const visibleNavigationItems = filterNavigationItems(navigationItems)

  const linkClassName = (url: string) => {
    const active = url === '/plugins' ? isSectionActive(url) : isActive(url)
    return `inline-flex h-10 items-center ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center min-h-16 py-2">
          <Link to="/" className="flex items-center text-2xl font-bold text-blue-600">
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

              const isParentActive = isSectionActive(item.url) || children.some((child: any) => isActive(child.url) || isSectionActive(child.url))

              return (
                <div
                  key={dropdownKey}
                  className="relative"
                  onMouseEnter={() => setDesktopOpenDropdown(dropdownKey)}
                  onMouseLeave={() => setDesktopOpenDropdown(current => current === dropdownKey ? null : current)}
                >
                  <div className="flex items-center gap-1">
                    <Link to={item.url} className={`inline-flex h-10 items-center ${isParentActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}>
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDesktopOpenDropdown(current => current === dropdownKey ? null : dropdownKey)}
                      className={`inline-flex h-10 items-center justify-center ${isParentActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
                      aria-label={`Toggle ${item.label} submenu`}
                    >
                      <FiChevronDown className={`transition-transform ${desktopOpenDropdown === dropdownKey ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <div className={`absolute left-0 top-full z-50 mt-2 min-w-[14rem] rounded-lg border bg-white p-2 shadow-xl transition ${desktopOpenDropdown === dropdownKey ? 'visible opacity-100 translate-y-0' : 'invisible -translate-y-1 opacity-0'}`}>
                    {children.map((child: any) => (
                      <Link key={`${child.label}-${child.url}`} to={child.url} className={`block rounded-md px-3 py-2 text-sm font-medium transition ${isActive(child.url) || isSectionActive(child.url) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
            <Link
              to={userRole ? dashboardPath : '/login'}
              className="btn-secondary text-sm inline-flex h-10 items-center"
            >
              {userRole ? 'Dashboard' : 'Client Login'}
            </Link>
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {visibleNavigationItems.map(item => {
              const children = Array.isArray(item.children) ? item.children : []
              const dropdownKey = `${item.label}-${item.url}`

              if (children.length === 0) {
                return (
                  <Link key={dropdownKey} to={item.url} className="block py-2 text-gray-700 hover:text-blue-600">
                    {item.label}
                  </Link>
                )
              }

              return (
                <div key={dropdownKey} className="rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={item.url} className="block py-1 text-gray-700 hover:text-blue-600">
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileOpenDropdown(current => current === dropdownKey ? null : dropdownKey)}
                      className="inline-flex h-8 w-8 items-center justify-center text-gray-700"
                      aria-label={`Toggle ${item.label} submenu`}
                    >
                      <FiChevronDown className={`transition-transform ${mobileOpenDropdown === dropdownKey ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {mobileOpenDropdown === dropdownKey && (
                    <div className="mt-2 space-y-1 border-t pt-2">
                      {children.map((child: any) => (
                        <Link key={`${child.label}-${child.url}`} to={child.url} className="block rounded-md px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <Link to={userRole ? dashboardPath : '/login'} className="block py-2 btn-secondary w-full text-left">
              {userRole ? 'Dashboard' : 'Client Login'}
            </Link>
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
