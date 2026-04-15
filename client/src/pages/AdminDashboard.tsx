import { useState, useCallback, useEffect } from 'react'
import { FiLogOut, FiUsers, FiFileText, FiTrendingUp, FiBarChart } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { DashboardStatsSkeleton } from '../components/SkeletonLoaders'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const checkAdmin = useCallback(() => {
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'admin') {
      navigate('/login')
    }
  }, [navigate])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getStats()
      setStats(data)
    } catch (err: any) {
      setError(err.error || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAdmin()
    fetchStats()
  }, [checkAdmin, fetchStats])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <DashboardStatsSkeleton />
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <StatCard
              icon={FiUsers}
              label="Total Clients"
              value={stats.totalClients}
              color="blue"
            />
            <StatCard
              icon={FiFileText}
              label="Total Projects"
              value={stats.totalProjects}
              color="green"
            />
            <StatCard
              icon={FiTrendingUp}
              label="Active Projects"
              value={stats.activeProjects}
              color="purple"
            />
            <StatCard
              icon={FiBarChart}
              label="Total Revenue"
              value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
              color="orange"
            />
            <StatCard
              icon={FiFileText}
              label="Active Subscriptions"
              value={stats.activeSubscriptions}
              color="pink"
            />
          </div>
        ) : null}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Manage Clients', url: '/admin/clients', icon: FiUsers },
            { label: 'View Projects', url: '/admin/projects', icon: FiFileText },
            { label: 'Invoices', url: '/admin/invoices', icon: FiBarChart },
            { label: 'Subscriptions', url: '/admin/subscriptions', icon: FiTrendingUp }
          ].map((link, i) => {
            const Icon = link.icon
            return (
              <a
                key={i}
                href={link.url}
                className="card p-6 hover:shadow-lg transition text-center"
              >
                <Icon size={32} className="mx-auto mb-3 text-blue-600" />
                <p className="font-semibold text-gray-900">{link.label}</p>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600'
  }

  return (
    <div className="card p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
