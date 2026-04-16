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
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
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
      const [data, clientsData, subscriptionsData, invoicesData, revenueData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getClients(),
        adminAPI.getSubscriptions(),
        adminAPI.getInvoices(),
        adminAPI.getMonthlyRevenue()
      ])
      setStats(data)
      setClients(clientsData)
      setSubscriptions(subscriptionsData)
      setInvoices(invoicesData)
      setMonthlyRevenue(revenueData)
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-12">
            <LineGraph
              title="Monthly Revenue"
              subtitle="Paid invoice revenue by month"
              data={monthlyRevenue.map(item => ({
                label: item.month,
                value: Number(item.revenue || 0)
              }))}
              currency
            />
            <DonutGraph
              title="Invoice Status"
              data={[
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#16A34A' },
                { label: 'Open', value: invoices.filter(i => ['sent', 'viewed', 'draft'].includes(i.status)).length, color: '#2563EB' },
                { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#DC2626' }
              ]}
            />
            <ColumnGraph
              title="Business Snapshot"
              data={[
                { label: 'Clients', value: stats.totalClients || clients.length },
                { label: 'Projects', value: stats.totalProjects || 0 },
                { label: 'Active', value: stats.activeProjects || 0 },
                { label: 'Plans', value: stats.activeSubscriptions || 0 }
              ]}
            />
            <DonutGraph
              title="Subscription Status"
              data={[
                { label: 'Active', value: subscriptions.filter(s => s.status === 'active').length, color: '#2563EB' },
                { label: 'Cancelled', value: subscriptions.filter(s => s.status === 'cancelled').length, color: '#6B7280' },
                { label: 'Other', value: subscriptions.filter(s => !['active', 'cancelled'].includes(s.status)).length, color: '#F59E0B' }
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

function formatChartValue(value: number, currency = false) {
  if (currency) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  }
  return value.toLocaleString()
}

function LineGraph({ title, subtitle, data, currency = false }: any) {
  const chartData = data.length > 0 ? data : [{ label: 'No data', value: 0 }]
  const max = Math.max(...chartData.map((item: any) => Number(item.value || 0)), 1)
  const points = chartData.map((item: any, index: number) => {
    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100
    const y = 86 - (Number(item.value || 0) / max) * 64
    return { ...item, x, y }
  })
  const path = points.map((point: any, index: number) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible" role="img" aria-label={title}>
        {[22, 38, 54, 70, 86].map(line => (
          <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="#E5E7EB" strokeWidth="0.5" />
        ))}
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point: any) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="2.8" fill="#2563EB" />
        ))}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        {chartData.slice(-6).map((item: any) => (
          <div key={item.label} className="rounded-lg bg-gray-100 p-3">
            <p className="font-semibold text-gray-700">{item.label}</p>
            <p className="text-gray-900">{formatChartValue(Number(item.value || 0), currency)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColumnGraph({ title, data }: any) {
  const max = Math.max(...data.map((item: any) => Number(item.value || 0)), 1)

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      <div className="flex h-64 items-end gap-4 border-b border-gray-200 pb-4">
        {data.map((item: any) => {
          const height = Math.max(8, (Number(item.value || 0) / max) * 100)
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-blue-600"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{Number(item.value || 0).toLocaleString()}</p>
                <p className="text-xs font-semibold text-gray-600">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DonutGraph({ title, data }: any) {
  const total = data.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  let offset = 25
  const circumference = 100

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 42 42" className="h-44 w-44 -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#E5E7EB" strokeWidth="5" />
            {total > 0 && data.map((item: any) => {
              const value = Number(item.value || 0)
              const dash = (value / total) * circumference
              const segment = (
                <circle
                  key={item.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="5"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              )
              offset -= dash
              return segment
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-gray-900">{total}</p>
            <p className="text-xs font-semibold text-gray-600">Total</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.map((item: any) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg bg-gray-100 p-3">
              <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="text-lg font-bold text-gray-900">{Number(item.value || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
