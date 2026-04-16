import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiBarChart, FiBell, FiChevronDown, FiCreditCard, FiFileText, FiGrid, FiHelpCircle, FiHome, FiImage, FiInbox, FiLogOut, FiMoon, FiSettings, FiSun, FiUsers } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'

const primaryLinks = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
  { label: 'Clients', path: '/admin/clients', icon: FiUsers },
  { label: 'Projects', path: '/admin/projects', icon: FiFileText }
]

const adminGroups = [
  {
    label: 'Pages',
    icon: FiFileText,
    links: [
      { label: 'Web Pages', path: '/admin/pages', icon: FiFileText },
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
  const [notifications, setNotifications] = useState({ newMessages: 0, newTickets: 0, total: 0 })
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

    const fetchNotifications = async () => {
      try {
        const data = await adminAPI.getNotifications()
        if (isMounted) setNotifications(data)
      } catch (error) {
        console.error('Error loading admin notifications:', error)
      }
    }

    fetchNotifications()
    window.addEventListener('admin-notifications-refresh', fetchNotifications)
    window.addEventListener('focus', fetchNotifications)

    const intervalId = window.setInterval(fetchNotifications, 60000)

    return () => {
      isMounted = false
      window.removeEventListener('admin-notifications-refresh', fetchNotifications)
      window.removeEventListener('focus', fetchNotifications)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                Back to Main Site
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link to="/admin/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                Admin Panel
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={notifications.newMessages > 0 ? '/admin/messages' : '/admin/tickets'}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
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
              <button
                onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap items-center gap-2">
            {primaryLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              )
            })}

            {adminGroups.map((group) => {
              const GroupIcon = group.icon
              const groupActive = isGroupActive(group.links)

              return (
                <div key={group.label} className="relative group">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      groupActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <GroupIcon size={16} />
                    {group.label}
                    {group.label === 'Support' && notifications.total > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {notifications.total > 99 ? '99+' : notifications.total}
                      </span>
                    )}
                    <FiChevronDown size={14} />
                  </button>

                  <div className="absolute left-0 top-full z-50 hidden min-w-56 pt-2 group-hover:block group-focus-within:block">
                    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                      {group.links.map((link) => {
                        const Icon = link.icon
                        const badgeCount = getBadgeCount('badgeKey' in link ? link.badgeKey : undefined)
                        return (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                              `flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                              }`
                            }
                          >
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
                  </div>
                </div>
              )
            })}

            {utilityLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`
                  }
                >
                  <Icon size={16} />
                  {link.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="container py-8">{children}</div>
    </div>
  )
}
