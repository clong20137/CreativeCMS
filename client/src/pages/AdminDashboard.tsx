import { useState, useCallback, useEffect } from 'react'
import { FiUsers, FiFileText, FiTrendingUp, FiBarChart } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { DashboardStatsSkeleton } from '../components/SkeletonLoaders'
import AdminLayout from '../components/AdminLayout'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
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
      const [data, clientsData, subscriptionsData, invoicesData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getClients(),
        adminAPI.getSubscriptions(),
        adminAPI.getInvoices()
      ])
      setStats(data)
      setClients(clientsData)
      setSubscriptions(subscriptionsData)
      setInvoices(invoicesData)
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

  return (
    <AdminLayout title="Admin Dashboard">
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
              <button
                key={i}
                onClick={() => navigate(link.url)}
                className="card p-6 hover:shadow-lg transition text-center"
              >
                <Icon size={32} className="mx-auto mb-3 text-blue-600" />
                <p className="font-semibold text-gray-900">{link.label}</p>
              </button>
            )
          })}
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
            <MiniBarChart
              title="Business Snapshot"
              data={[
                { label: 'Clients', value: stats.totalClients || clients.length },
                { label: 'Projects', value: stats.totalProjects || 0 },
                { label: 'Subscriptions', value: stats.activeSubscriptions || 0 }
              ]}
            />
            <MiniBarChart
              title="Invoice Revenue"
              data={[
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total || 0), 0) },
                { label: 'Open', value: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + Number(i.total || 0), 0) }
              ]}
              currency
            />
            <MiniBarChart
              title="Subscription Status"
              data={[
                { label: 'Active', value: subscriptions.filter(s => s.status === 'active').length },
                { label: 'Cancelled', value: subscriptions.filter(s => s.status === 'cancelled').length },
                { label: 'Other', value: subscriptions.filter(s => !['active', 'cancelled'].includes(s.status)).length }
              ]}
            />
          </div>
        )}
    </AdminLayout>
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

function MiniBarChart({ title, data, currency = false }: any) {
  const max = Math.max(...data.map((item: any) => Number(item.value || 0)), 1)

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item: any) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-gray-700">{item.label}</span>
              <span className="text-gray-600">{currency ? `$${Number(item.value || 0).toLocaleString()}` : item.value}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded">
              <div className="h-3 bg-blue-600 rounded" style={{ width: `${(Number(item.value || 0) / max) * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
