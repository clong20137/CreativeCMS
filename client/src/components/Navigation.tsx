import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { siteSettingsAPI } from '../services/api'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'))
  const [siteName, setSiteName] = useState('Creative by Caleb')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoSize, setLogoSize] = useState(40)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
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
      } catch (error) {
        console.error('Error loading site settings:', error)
      }
    }

    fetchSettings()
  }, [])

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
            <Link
              to="/"
              className={`inline-flex h-10 items-center ${isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
            >
              Home
            </Link>
            <Link
              to="/portfolio"
              className={`inline-flex h-10 items-center ${isActive('/portfolio') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
            >
              Portfolio
            </Link>
            <Link
              to="/services"
              className={`inline-flex h-10 items-center ${isActive('/services') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
            >
              Services
            </Link>
            <Link
              to="/pricing"
              className={`inline-flex h-10 items-center ${isActive('/pricing') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className={`inline-flex h-10 items-center ${isActive('/contact') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} transition`}
            >
              Contact
            </Link>
            <Link
              to={userRole ? dashboardPath : '/login'}
              className="btn-secondary text-sm inline-flex h-10 items-center"
            >
              {userRole ? 'Dashboard' : 'Client Login'}
            </Link>
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
            <Link to="/" className="block py-2 text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link to="/portfolio" className="block py-2 text-gray-700 hover:text-blue-600">
              Portfolio
            </Link>
            <Link to="/services" className="block py-2 text-gray-700 hover:text-blue-600">
              Services
            </Link>
            <Link to="/pricing" className="block py-2 text-gray-700 hover:text-blue-600">
              Pricing
            </Link>
            <Link to="/contact" className="block py-2 text-gray-700 hover:text-blue-600">
              Contact
            </Link>
            <Link to={userRole ? dashboardPath : '/login'} className="block py-2 btn-secondary w-full text-left">
              {userRole ? 'Dashboard' : 'Client Login'}
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
