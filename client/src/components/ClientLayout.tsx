import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiFileText, FiHelpCircle, FiHome, FiLogOut, FiSettings } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

const clientLinks = [
  { label: 'Dashboard', path: '/client-dashboard', icon: FiHome },
  { label: 'Billing', path: '/client-dashboard/billing', icon: FiFileText },
  { label: 'Tickets', path: '/client-dashboard/tickets', icon: FiHelpCircle },
  { label: 'Settings', path: '/client-dashboard/settings', icon: FiSettings }
]

export default function ClientLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('authToken') || localStorage.getItem('userRole') !== 'client') {
      navigate('/login')
    }
  }, [navigate])

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
              <Link to="/client-dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                Client Portal
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FiLogOut /> Logout
            </button>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {clientLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/client-dashboard'}
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
