import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiClock, FiFileText, FiGrid, FiHelpCircle, FiHome, FiKey, FiLogOut, FiSettings } from 'react-icons/fi'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { licensesAPI } from '../services/api'

const clientLinks = [
  { label: 'Dashboard', path: '/client-dashboard', icon: FiHome },
  { label: 'License', path: '/client-dashboard/license', icon: FiKey },
  { label: 'Billing', path: '/client-dashboard/billing', icon: FiFileText },
  { label: 'Plugins', path: '/client-dashboard/plugins', icon: FiGrid },
  { label: 'Updates', path: '/client-dashboard/updates', icon: FiClock },
  { label: 'Tickets', path: '/client-dashboard/tickets', icon: FiHelpCircle },
  { label: 'Settings', path: '/client-dashboard/settings', icon: FiSettings }
]

export default function ClientLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [licenseState, setLicenseState] = useState<{ loading: boolean; hasActiveLicense: boolean; license: any | null }>({
    loading: true,
    hasActiveLicense: false,
    license: null
  })
  const currentPath = location.pathname

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    if (!token || localStorage.getItem('userRole') !== 'client' || !userId) {
      navigate('/login')
      return
    }

    let cancelled = false
    licensesAPI.getClientLicense(userId)
      .then((data: any) => {
        if (cancelled) return
        setLicenseState({
          loading: false,
          hasActiveLicense: Boolean(data?.hasActiveLicense),
          license: data?.license || null
        })
      })
      .catch(() => {
        if (cancelled) return
        setLicenseState({ loading: false, hasActiveLicense: false, license: null })
      })

    return () => {
      cancelled = true
    }
  }, [currentPath, navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  return (
    <div className="client-portal-shell min-h-screen pb-24 md:pb-8">
      <div className="client-portal-topbar sticky top-0 z-20 border-b shadow-sm backdrop-blur">
        <div className="container py-3 md:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/client-dashboard" className="client-portal-link text-sm font-semibold">
                Client Portal
              </Link>
              <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className={`client-license-pill inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                  licenseState.hasActiveLicense
                    ? 'client-license-pill-active'
                    : licenseState.loading
                      ? 'client-license-pill-loading'
                      : 'client-license-pill-inactive'
                }`}>
                  {licenseState.loading
                    ? 'Checking license...'
                    : licenseState.hasActiveLicense
                      ? 'CMS License Active'
                      : 'License Required'}
                </span>
                {licenseState.license?.renewalDate && (
                  <span className="client-portal-muted">
                    Renewal {new Date(licenseState.license.renewalDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 md:inline-flex"
            >
              <FiLogOut /> Logout
            </button>
          </div>

          <nav className="client-portal-nav mt-4 hidden gap-2 overflow-x-auto pb-1 md:flex">
            {clientLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/client-dashboard'}
                  className={({ isActive }) =>
                    `client-portal-nav-link inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'btn-primary text-white'
                        : 'client-portal-nav-link-idle'
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

      <div className="container py-8">
        {!licenseState.loading && !licenseState.hasActiveLicense && (
          <div className="client-license-banner mb-6 rounded-lg border p-4">
            Your CMS license is inactive. You can still navigate the client portal, and you can renew anytime from the license page.
          </div>
        )}
        {children}
      </div>

      <nav className="client-portal-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {clientLinks.map((link) => {
            const Icon = link.icon
            const isActive = currentPath === link.path
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/client-dashboard'}
                className={`client-portal-mobile-link flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                  isActive ? 'btn-primary text-white' : 'client-portal-nav-link-idle'
                }`}
              >
                <Icon size={18} />
                <span className="text-center leading-tight">{link.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
