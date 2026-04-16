import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiBarChart, FiBell, FiCreditCard, FiFileText, FiGrid, FiHelpCircle, FiHome, FiImage, FiInbox, FiLogOut, FiMoon, FiSettings, FiSun, FiUsers } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'

const primaryLinks = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
  { label: 'Clients', path: '/admin/clients', icon: FiUsers },
  { label: 'Projects', path: '/admin/projects', icon: FiFileText }
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
      { label: 'Plugins', path: '/admin/plugins', icon: FiGrid },
      { label: 'Site Demos', path: '/admin/site-demos', icon: FiImage }
    ]
  },
  {
    label: 'Support',
    icon: FiInbox,
    links: [
      { label: 'Messages', path: '/admin/messages', icon: FiInbox, badgeKey: 'newMessages' },
      { label: 'Tickets', path: '/admin/tickets', icon: FiHelpCircle, badgeKey: 'newTickets' }
    ]
  }
]

const utilityLinks = [
  { label: 'Settings', path: '/admin/settings', icon: FiSettings }
]

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPageEditor = location.pathname === '/admin/pages'
  const [notifications, setNotifications] = useState({ newMessages: 0, newTickets: 0, total: 0 })
  const [customPages, setCustomPages] = useState<any[]>([])
  const [theme, setTheme] = useState(() => localStorage.getItem('siteTheme') || 'light')

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
    let isMounted = true

    const fetchAdminChrome = async () => {
      try {
        const [notificationData, pagesData] = await Promise.all([
          adminAPI.getNotifications(),
          adminAPI.getPages()
        ])
        if (isMounted) {
          setNotifications(notificationData)
          setCustomPages(Array.isArray(pagesData) ? pagesData : [])
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

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
    }`

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="flex bg-white shadow-sm lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col">
        <div className="flex w-full flex-col border-b border-gray-200 lg:h-full lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-200 p-5">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-lg font-black text-gray-900">
              <FiGrid className="text-blue-600" />
              Admin Portal
            </Link>
          </div>

          <nav className="flex-1 space-y-5 overflow-auto p-4">
            <div className="space-y-1">
              {primaryLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink key={link.path} to={link.path} className={sidebarLinkClass}>
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {link.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>

            {adminGroups.map((group) => {
              const GroupIcon = group.icon
              const groupActive = group.label === 'Pages' ? location.pathname.startsWith('/admin/pages') || isGroupActive(group.links) : isGroupActive(group.links)

              return (
                <div key={group.label} className="space-y-1">
                  <div className={`flex items-center justify-between px-3 text-xs font-bold uppercase tracking-wide ${groupActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    <span className="inline-flex items-center gap-2">
                      <GroupIcon size={14} />
                      {group.label}
                    </span>
                    {group.label === 'Support' && notifications.total > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {notifications.total > 99 ? '99+' : notifications.total}
                      </span>
                    )}
                  </div>

                  {group.label === 'Pages' && (
                    <div className="space-y-1 border-l border-gray-200 ml-4 pl-3">
                      {builtInPageLinks.map(link => (
                        <Link
                          key={link.page}
                          to={`/admin/pages?page=${link.page}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isPageLinkActive(link.page)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <FiFileText size={16} />
                          {link.label}
                        </Link>
                      ))}
                      {customPages.map(page => (
                        <Link
                          key={page.id}
                          to={`/admin/pages?custom=${page.id}`}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            isCustomPageLinkActive(String(page.id))
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <FiFileText size={16} />
                          {page.title || 'Custom Page'}
                        </Link>
                      ))}
                      <Link
                        to="/admin/pages?page=new"
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          isPageLinkActive('new')
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <FiFileText size={16} />
                        Add New Page
                      </Link>
                    </div>
                  )}

                  {group.links.map((link) => {
                    const Icon = link.icon
                    const badgeCount = getBadgeCount('badgeKey' in link ? link.badgeKey : undefined)
                    return (
                      <NavLink key={link.path} to={link.path} className={sidebarLinkClass}>
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
              )
            })}

            <div className="space-y-1">
              {utilityLinks.map((link) => {
                const Icon = link.icon
                return (
                  <NavLink key={link.path} to={link.path} className={sidebarLinkClass}>
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {link.label}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </nav>

          <div className="mt-auto space-y-2 border-t border-gray-200 p-4">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <FiHome />
              Back to Website
            </Link>
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-gray-200 bg-white">
          <div className={isPageEditor ? 'px-4 py-5' : 'container py-5'}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link to="/admin/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Admin Panel
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              </div>
              <Link
                to={notifications.newMessages > 0 ? '/admin/messages' : '/admin/tickets'}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                aria-label={`${notifications.total} new admin notifications`}
                title={`${notifications.newMessages} new messages, ${notifications.newTickets} new tickets`}
              >
                <FiBell size={20} />
                {notifications.total > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                    {notifications.total > 99 ? '99+' : notifications.total}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <div className={isPageEditor ? 'w-full px-4 py-6' : 'container py-8'}>{children}</div>
      </main>
    </div>
  )
}
