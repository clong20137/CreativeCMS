import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLogOut, FiDownload, FiMessageSquare, FiCheckCircle, FiClock } from 'react-icons/fi'
import { projectsAPI } from '../services/api'
import { PageSkeleton } from '../components/SkeletonLoaders'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userId = localStorage.getItem('userId')
    const email = localStorage.getItem('userEmail')

    if (!token || !userId) {
      navigate('/login')
      return
    }

    setUserEmail(email || '')
    fetchProjects(userId)
  }, [navigate])

  const fetchProjects = async (userId: string) => {
    try {
      setLoading(true)
      setError('')
      const data = await projectsAPI.getClientProjects(userId)
      setProjects(data)
    } catch (err: any) {
      setError(err.error || 'Unable to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="inline mr-2" />
      case 'in-progress':
        return <FiClock className="inline mr-2" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Manage your projects here.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>

        {/* User Info */}
        <div className="card p-6 mb-8">
          <p className="text-gray-600">Logged in as: <span className="font-bold text-gray-900">{userEmail}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/client-dashboard/billing" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Billing
          </Link>
          <Link to="/client-dashboard/payment-methods" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Payment Methods
          </Link>
          <Link to="/client-dashboard/settings" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Account Settings
          </Link>
          <Link to="/client-dashboard/tickets" className="card p-4 font-semibold text-blue-600 hover:shadow-lg transition">
            Support Tickets
          </Link>
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <PageSkeleton />
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                    <p className="text-gray-600 mt-1">{project.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {(project.status || 'pending').replace('-', ' ').charAt(0).toUpperCase() + (project.status || 'pending').replace('-', ' ').slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-4 md:mb-0">
                    Due: <span className="font-bold text-gray-900">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                      <FiDownload size={18} /> Download
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      <FiMessageSquare size={18} /> Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-600">
              No projects have been assigned to your account yet.
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { label: 'Total Projects', value: projects.length },
            { label: 'Completed', value: projects.filter(p => p.status === 'completed').length },
            { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length }
          ].map((stat, i) => (
            <div key={i} className="card p-6 text-center">
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="card p-6 mt-8 bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">Have questions about your projects? Our team is here to help.</p>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Contact Support
            </button>
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
              View FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
