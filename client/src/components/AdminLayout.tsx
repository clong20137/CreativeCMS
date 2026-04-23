import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiBarChart, FiBell, FiChevronDown, FiChevronRight, FiCreditCard, FiFileText, FiGrid, FiHelpCircle, FiHome, FiImage, FiInbox, FiLogOut, FiMenu, FiMonitor, FiMoon, FiSearch, FiSettings, FiSun, FiUsers, FiX } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { adminAPI, ticketsAPI } from '../services/api'

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
      { label: 'Tickets', path: '/admin/tickets', icon: FiHelpCircle, badgeKey: 'newTickets' }
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

type PageNavLink = {
  title: string
  path: string
  active: boolean
  isAction?: boolean
}

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPageEditor = location.pathname === '/admin/pages'
  const [notifications, setNotifications] = useState({ newMessages: 0, newTickets: 0, total: 0 })
  const [customPages, setCustomPages] = useState<any[]>([])
  const [theme, setTheme] = useState(() => localStorage.getItem('siteTheme') || 'light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationItems, setNotificationItems] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Pages: true,
    Revenue: true,
    Website: true,
    Support: true
  })

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
    setMobileSidebarOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname, location.search])

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
  const isMobilePrimaryActive = (path: string) => {
    if (path.startsWith('/admin/pages')) return location.pathname === '/admin/pages'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

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

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {mobileSidebarOpen && <button type="button" aria-label="Close admin navigation" onClick={() => setMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-gray-950/45 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-[22rem] flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-gray-200 px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Admin Portal</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">Studio Control</h2>
              <p className="mt-1 text-sm text-gray-500">Quick access for pages, clients, revenue, and support.</p>
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
                    ...builtInPageLinks.map(link => ({ title: link.label, path: `/admin/pages?page=${link.page}`, active: isPageLinkActive(link.page) })),
                    ...customPages.map(page => ({ title: page.title || 'Custom Page', path: `/admin/pages?custom=${page.id}`, active: isCustomPageLinkActive(String(page.id)) })),
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
                            <Link
                              key={link.path}
                              to={link.path}
                              onClick={() => setMobileSidebarOpen(false)}
                              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                                link.active ? 'bg-blue-600 text-white' : link.isAction ? 'border border-dashed border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              <FiFileText size={16} />
                              <span className="truncate">{link.title}</span>
                            </Link>
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

        <div className="space-y-2 border-t border-gray-200 p-4">
          <Link
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <FiMonitor />
            Back to Website
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </aside>
      <aside className={`hidden fixed inset-y-0 left-0 z-50 w-[17.5rem] max-w-[88vw] bg-white shadow-sm transition-transform duration-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:flex-col lg:translate-x-0 lg:transition-all ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarOpen ? 'lg:w-72' : 'lg:w-16'}`}>
        <div className="hidden w-full flex-col border-b border-gray-200 lg:flex lg:h-full lg:border-b-0 lg:border-r">
          <div className={`border-b border-gray-200 ${sidebarOpen ? 'p-5' : 'p-3'}`}>
            <div className={`flex ${sidebarOpen ? 'items-center justify-between gap-3' : 'flex-col items-center gap-2'}`}>
              <Link to="/admin/dashboard" className={`inline-flex min-w-0 items-center gap-2 text-lg font-black text-gray-900 ${sidebarOpen ? '' : 'justify-center'}`} title="Admin Portal">
                <FiGrid className="shrink-0 text-blue-600" />
                {sidebarOpen && <span className="truncate">Admin Portal</span>}
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
                    ...builtInPageLinks.map(link => ({ title: link.label, path: `/admin/pages?page=${link.page}`, active: isPageLinkActive(link.page) })),
                    ...customPages.map(page => ({ title: page.title || 'Custom Page', path: `/admin/pages?custom=${page.id}`, active: isCustomPageLinkActive(String(page.id)) })),
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
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            link.active
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <FiFileText size={16} />
                          {link.title}
                        </Link>
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
            <Link
              to="/"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              title="Back to Website"
            >
              <FiMonitor />
              {sidebarOpen && 'Back to Website'}
            </Link>
            <button
              onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
              {sidebarOpen && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <FiLogOut />
              {sidebarOpen && 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className={isPageEditor ? 'px-4 py-4' : 'container py-4 md:py-5'}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-blue-50 hover:text-blue-700 lg:hidden" aria-label="Open admin navigation">
                  <FiMenu size={18} />
                </button>
                <div>
                  <Link to="/admin/dashboard" className="hidden text-sm font-semibold text-blue-600 hover:text-blue-800 sm:inline-flex">
                    Admin Panel
                  </Link>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">{title}</h1>
                </div>
              </div>
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
            </div>
          </div>
        </div>

        <div className={isPageEditor ? 'w-full px-4 py-5 md:py-6' : 'container py-6 md:py-8'}>{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
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
