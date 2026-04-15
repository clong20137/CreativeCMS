import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Creative Studio
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`${isActive('/') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} pb-1 transition`}
            >
              Home
            </Link>
            <Link
              to="/portfolio"
              className={`${isActive('/portfolio') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} pb-1 transition`}
            >
              Portfolio
            </Link>
            <Link
              to="/services"
              className={`${isActive('/services') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} pb-1 transition`}
            >
              Services
            </Link>
            <Link
              to="/pricing"
              className={`${isActive('/pricing') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} pb-1 transition`}
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className={`${isActive('/contact') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'} pb-1 transition`}
            >
              Contact
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-sm"
            >
              Client Login
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
            <Link to="/login" className="block py-2 btn-secondary w-full text-left">
              Client Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
