import { Link } from 'react-router-dom'
import { FiArrowLeft, FiHome } from 'react-icons/fi'
import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 px-4">
      <SEO
        title="Page Not Found"
        description="The page you requested could not be found."
        path={window.location.pathname}
        noIndex
      />
      <div className="text-center">
        {/* 404 Text */}
        <div className="mb-8">
          <div className="text-9xl md:text-[150px] font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Sorry, the page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-12">
          <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <div className="text-blue-400 text-6xl">🔍</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <FiHome size={20} />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <FiArrowLeft size={20} />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Need help?</p>
          <Link
            to="/contact"
            className="text-blue-600 font-semibold hover:text-blue-800 transition"
          >
            Contact our support team →
          </Link>
        </div>
      </div>
    </div>
  )
}
