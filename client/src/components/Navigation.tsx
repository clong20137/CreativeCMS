import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi'
import { pluginsAPI, siteSettingsAPI } from '../services/api'

const defaultNavigationItems = [
  { label: 'Home', url: '/', isActive: true, sortOrder: 0 },
  { label: 'Portfolio', url: '/portfolio', isActive: true, sortOrder: 10 },
  { label: 'Services', url: '/services', isActive: true, sortOrder: 20 },
  { label: 'Pricing', url: '/pricing', isActive: true, sortOrder: 30 },
  { label: 'Plugins', url: '/plugins', isActive: true, sortOrder: 40 },
  { label: 'Contact', url: '/contact', isActive: true, sortOrder: 50 }
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
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
  }, [location.pathname])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        setSiteName(settings.siteName || 'Creative by Caleb')
        setLogoUrl(settings.logoUrl || '')
        setLogoSize(Number(settings.logoSize) || 40)
        if (Array.isArray(settings.navigationItems) && settings.navigationItems.length) {
          setNavigationItems(settings.navigationItems)
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

  const visibleNavigationItems = navigationItems
    .filter(item => item.isActive !== false)
    .filter(item => item.url !== '/plugins' || hasActivePlugins)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))

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
            {visibleNavigationItems.map(item => (
              <Link key={`${item.label}-${item.url}`} to={item.url} className={linkClassName(item.url)}>
                {item.label}
              </Link>
            ))}
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
            {visibleNavigationItems.map(item => (
              <Link key={`${item.label}-${item.url}`} to={item.url} className="block py-2 text-gray-700 hover:text-blue-600">
                {item.label}
              </Link>
            ))}
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
