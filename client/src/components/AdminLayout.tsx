import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiBarChart, FiBell, FiCreditCard, FiFileText, FiGrid, FiHelpCircle, FiHome, FiImage, FiInbox, FiLogOut, FiSettings, FiUsers } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'

const adminLinks = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
  { label: 'Clients', path: '/admin/clients', icon: FiUsers },
  { label: 'Projects', path: '/admin/projects', icon: FiFileText },
  { label: 'Invoices', path: '/admin/invoices', icon: FiBarChart },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: FiCreditCard },
  { label: 'Services', path: '/admin/services', icon: FiGrid },
  { label: 'Portfolio', path: '/admin/portfolio', icon: FiImage },
  { label: 'Messages', path: '/admin/messages', icon: FiInbox },
  { label: 'Tickets', path: '/admin/tickets', icon: FiHelpCircle },
  { label: 'Plugins', path: '/admin/plugins', icon: FiGrid },
  { label: 'Settings', path: '/admin/settings', icon: FiSettings }
]

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState({ newMessages: 0, newTickets: 0, total: 0 })

  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'admin') {
      navigate('/login')
    }
  }, [navigate])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
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
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {adminLinks.map((link) => {
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
