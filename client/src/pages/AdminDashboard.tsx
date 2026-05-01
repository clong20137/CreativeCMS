import { useState, useCallback, useEffect } from 'react'
import { FiUsers, FiFileText, FiTrendingUp, FiBarChart, FiSearch, FiZap, FiAlertCircle, FiTarget } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { DashboardStatsSkeleton } from '../components/SkeletonLoaders'
import AdminLayout from '../components/AdminLayout'
import { buildSiteHealthDashboard } from '../utils/siteHealth'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [seoDashboard, setSeoDashboard] = useState<any>(null)
  const [siteHealth, setSiteHealth] = useState<any>(null)
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
      const [data, clientsData, subscriptionsData, invoicesData, revenueData, seoData, settingsData, pagesData, mediaData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getClients(),
        adminAPI.getSubscriptions(),
        adminAPI.getInvoices(),
        adminAPI.getMonthlyRevenue(),
        adminAPI.getSeoDashboard().catch((seoError: any) => ({ errors: [seoError.error || 'Failed to load SEO dashboard'] })),
        adminAPI.getSiteSettings(),
        adminAPI.getPages(),
        adminAPI.getMedia('all', 'all')
      ])
      setStats(data)
      setClients(clientsData)
      setSubscriptions(subscriptionsData)
      setInvoices(invoicesData)
      setMonthlyRevenue(revenueData)
      setSeoDashboard(seoData)
      setSiteHealth(buildSiteHealthDashboard({ settings: settingsData, pages: pagesData, media: mediaData }))
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
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mb-10 lg:grid-cols-5 lg:gap-6">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
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
                className="card p-4 text-center transition hover:shadow-lg sm:p-5 lg:p-6"
              >
                <Icon size={28} className="mx-auto mb-2 text-blue-600 sm:mb-3 sm:text-[32px]" />
                <p className="text-sm font-semibold text-gray-900 sm:text-base">{link.label}</p>
              </button>
            )
          })}
        </div>

        <SeoDashboardPanel data={seoDashboard} />
        <SiteHealthPanel data={siteHealth} navigate={navigate} />

        {stats && (
          <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
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
    <div className="card p-4 sm:p-5 lg:p-6">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg sm:mb-4 sm:h-12 sm:w-12 ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{value}</p>
    </div>
  )
}

function SeoDashboardPanel({ data }: any) {
  const search = data?.searchConsole
  const pageSpeed = data?.pageSpeed
  const mobile = pageSpeed?.mobile
  const desktop = pageSpeed?.desktop
  const insights = data?.insights || {}
  const recommendations = insights.recommendations || []
  const opportunityQueries = insights.opportunityQueries || []
  const lowCtrPages = insights.lowCtrPages || []

  return (
    <section className="mt-8 space-y-4 sm:space-y-5 lg:mt-10 lg:space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Google Search and Site Health</h2>
          <p className="text-sm text-gray-600 sm:text-base">Search Console rankings and PageSpeed Insights for your configured site.</p>
        </div>
        {data?.dateRange && (
          <p className="text-sm font-semibold text-gray-600">
            {data.dateRange.startDate} to {data.dateRange.endDate}
          </p>
        )}
      </div>

      {data?.errors?.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
          {data.errors.map((message: string) => <p key={message}>{message}</p>)}
        </div>
      )}

      {!data?.configured && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          Connect Google Search Console in Admin Settings, SEO to show ranking data here.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <MiniMetric icon={FiSearch} label="Google Clicks" value={search ? Number(search.clicks || 0).toLocaleString() : 'Not connected'} />
        <MiniMetric icon={FiBarChart} label="Impressions" value={search ? Number(search.impressions || 0).toLocaleString() : 'Not connected'} />
        <MiniMetric icon={FiTrendingUp} label="Avg Position" value={search?.averagePosition ? search.averagePosition.toFixed(1) : 'Not connected'} />
        <MiniMetric icon={FiTarget} label="CTR" value={search ? `${(Number(search.ctr || 0) * 100).toFixed(1)}%` : 'Not connected'} />
        <MiniMetric icon={FiZap} label="Mobile Speed" value={mobile ? `${mobile.performance}/100` : 'No URL'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="card p-4 sm:p-5 lg:p-6 xl:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-amber-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">SEO Priorities</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((item: any) => (
              <div key={item.title} className="rounded-lg bg-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </div>
            ))}
            {recommendations.length === 0 && <p className="text-gray-600">No major SEO warnings from the current Search Console and PageSpeed data.</p>}
          </div>
        </div>

        <RankingTable title="Queries To Improve" rows={opportunityQueries} labelKey="query" />
        <RankingTable title="Pages With Low CTR" rows={lowCtrPages} labelKey="page" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
        <RankingTable title="Top Search Queries" rows={search?.topQueries || []} labelKey="query" />
        <RankingTable title="Top Ranking Pages" rows={search?.topPages || []} labelKey="page" />
        <div className="card p-4 sm:p-5 lg:p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">PageSpeed Insights</h3>
          {pageSpeed?.disabledReason ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
              {pageSpeed.disabledReason}
            </div>
          ) : pageSpeed ? (
            <div className="space-y-4">
              {[mobile, desktop].filter(Boolean).map((item: any) => (
                <div key={item.strategy} className="rounded-lg bg-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold capitalize text-gray-900">{item.strategy}</p>
                    <p className="text-xs font-semibold text-gray-600 sm:text-sm">{new Date(item.checkedAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-3">
                    <Score label="Performance" value={item.performance} />
                    <Score label="SEO" value={item.seo} />
                    <p className="text-gray-600">FCP: <strong>{item.firstContentfulPaint || 'n/a'}</strong></p>
                    <p className="text-gray-600">LCP: <strong>{item.largestContentfulPaint || 'n/a'}</strong></p>
                    <p className="text-gray-600">CLS: <strong>{item.cumulativeLayoutShift || 'n/a'}</strong></p>
                    <p className="text-gray-600">Speed: <strong>{item.speedIndex || 'n/a'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Add a PageSpeed URL in Admin Settings, SEO.</p>
          )}
        </div>
      </div>
    </section>
  )
}

function SiteHealthPanel({ data, navigate }: any) {
  if (!data) return null

  const summary = data.summary || {}
  const topIssues = data.topIssues || []
  const orphanPages = data.orphanPages || []
  const mediaAssetsMissingAlt = data.mediaAssetsMissingAlt || []

  return (
    <section className="mt-8 space-y-4 sm:space-y-5 lg:mt-10 lg:space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Site Health Dashboard</h2>
          <p className="text-sm text-gray-600 sm:text-base">Page quality, navigation coverage, link health, and media accessibility across the CMS.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/admin/pages')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Open Pages</button>
          <button onClick={() => navigate('/admin/navigation')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Open Navigation</button>
          <button onClick={() => navigate('/admin/media')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Open Media</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthMetricCard label="Avg Page Score" value={`${summary.averageScore || 0}/100`} tone={Number(summary.averageScore || 0) >= 85 ? 'good' : Number(summary.averageScore || 0) >= 65 ? 'warn' : 'bad'} hint={`${summary.totalPages || 0} pages audited`} />
        <HealthMetricCard label="Pages With Issues" value={summary.pagesWithIssues || 0} tone={(summary.pagesWithIssues || 0) === 0 ? 'good' : 'warn'} hint="Pages with one or more audit flags" />
        <HealthMetricCard label="Broken Internal Links" value={summary.brokenLinks || 0} tone={(summary.brokenLinks || 0) === 0 ? 'good' : 'bad'} hint="Relative links that do not start with /" />
        <HealthMetricCard label="Missing Alt" value={`${summary.missingAltImages || 0} / ${summary.missingAltAssets || 0}`} tone={(summary.missingAltImages || 0) + (summary.missingAltAssets || 0) === 0 ? 'good' : 'warn'} hint="Page images / media assets" />
        <HealthMetricCard label="Orphan Pages" value={summary.orphanPages || 0} tone={(summary.orphanPages || 0) === 0 ? 'good' : 'warn'} hint="Pages not linked in primary nav" />
        <HealthMetricCard label="Unpublished Custom Pages" value={summary.unpublishedPages || 0} tone={(summary.unpublishedPages || 0) === 0 ? 'neutral' : 'warn'} hint="Draft-only custom pages" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
        <div className="card p-4 sm:p-5 lg:p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Pages Needing Attention</h3>
              <p className="text-sm text-gray-600">Sorted by issue count, then lowest score.</p>
            </div>
            <button onClick={() => navigate('/admin/pages')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Review Pages</button>
          </div>
          <div className="space-y-3">
            {topIssues.map((page: any) => (
              <div key={page.id} className="rounded-lg bg-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{page.label}</p>
                    <p className="text-sm text-gray-600">{page.path} • {page.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreChip value={page.overall} />
                    <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${page.issuesCount >= 4 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{page.issuesCount} issue{page.issuesCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {page.isOrphan && <span className="rounded-full bg-yellow-100 px-2 py-1 font-semibold text-yellow-800">Orphan</span>}
                  {page.isUnpublished && <span className="rounded-full bg-gray-200 px-2 py-1 font-semibold text-gray-700">Unpublished</span>}
                  {page.diagnostics.seo.slice(0, 2).map((issue: string) => <span key={issue} className="rounded-full bg-red-50 px-2 py-1 font-medium text-red-700">{issue}</span>)}
                  {page.diagnostics.mobile.slice(0, 1).map((issue: string) => <span key={issue} className="rounded-full bg-yellow-50 px-2 py-1 font-medium text-yellow-700">{issue}</span>)}
                  {page.diagnostics.speed.slice(0, 1).map((issue: string) => <span key={issue} className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">{issue}</span>)}
                </div>
              </div>
            ))}
            {topIssues.length === 0 && <p className="text-gray-600">No page-level health warnings right now.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Orphan Pages</h3>
              <button onClick={() => navigate('/admin/navigation')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Fix Nav</button>
            </div>
            <div className="space-y-3">
              {orphanPages.map((page: any) => (
                <div key={page.id} className="rounded-lg bg-gray-100 p-3">
                  <p className="font-semibold text-gray-900">{page.label}</p>
                  <p className="text-sm text-gray-600">{page.path}</p>
                </div>
              ))}
              {orphanPages.length === 0 && <p className="text-gray-600">Every audited page is linked from the main navigation.</p>}
            </div>
          </div>

          <div className="card p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Media Missing Alt</h3>
              <button onClick={() => navigate('/admin/media')} className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Open Media</button>
            </div>
            <div className="space-y-3">
              {mediaAssetsMissingAlt.map((asset: any) => (
                <div key={asset.id} className="rounded-lg bg-gray-100 p-3">
                  <p className="font-semibold text-gray-900">{asset.title || asset.filename || `Asset #${asset.id}`}</p>
                  <p className="text-sm text-gray-600">{asset.mediaType || 'asset'}{asset.usageCount ? ` • used ${asset.usageCount} time${asset.usageCount === 1 ? '' : 's'}` : ''}</p>
                </div>
              ))}
              {mediaAssetsMissingAlt.length === 0 && <p className="text-gray-600">No media assets are missing alt text.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HealthMetricCard({ label, value, hint, tone = 'neutral' }: any) {
  const toneClasses: Record<string, string> = {
    neutral: 'bg-gray-100 text-gray-700',
    good: 'bg-green-100 text-green-700',
    warn: 'bg-yellow-100 text-yellow-700',
    bad: 'bg-red-100 text-red-700'
  }
  return (
    <div className="card p-4 sm:p-5">
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${toneClasses[tone] || toneClasses.neutral}`}>{label}</span>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{hint}</p>
    </div>
  )
}

function ScoreChip({ value }: { value: number }) {
  const tone = value >= 85 ? 'bg-green-100 text-green-700' : value >= 65 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone}`}>{value}/100</span>
}

function MiniMetric({ icon: Icon, label, value }: any) {
  return (
    <div className="card p-4 sm:p-5">
      <Icon className="mb-3 text-blue-600" size={24} />
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
    </div>
  )
}

function RankingTable({ title, rows, labelKey }: any) {
  return (
    <div className="card p-4 sm:p-5 lg:p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
      <div className="space-y-3">
        {rows.slice(0, 8).map((row: any) => (
          <div key={row[labelKey]} className="rounded-lg bg-gray-100 p-3">
            <p className="truncate font-semibold text-gray-900" title={row[labelKey]}>{row[labelKey]}</p>
            <p className="mt-1 text-sm text-gray-600">
              {Number(row.clicks || 0).toLocaleString()} clicks | {Number(row.impressions || 0).toLocaleString()} impressions | Pos {Number(row.position || 0).toFixed(1)}
            </p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-gray-600">No Search Console rows available yet.</p>}
      </div>
    </div>
  )
}

function Score({ label, value }: any) {
  const color = Number(value) >= 90 ? 'text-green-700' : Number(value) >= 50 ? 'text-yellow-700' : 'text-red-700'
  return <p className="text-gray-600">{label}: <strong className={color}>{value}/100</strong></p>
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
    <div className="card p-4 sm:p-5 lg:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <svg viewBox="0 0 100 100" className="h-44 w-full overflow-visible sm:h-52 lg:h-56" role="img" aria-label={title}>
        {[22, 38, 54, 70, 86].map(line => (
          <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="#E5E7EB" strokeWidth="0.5" />
        ))}
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point: any) => (
          <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="2.8" fill="#2563EB" />
        ))}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-3 md:gap-3">
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
    <div className="card p-4 sm:p-5 lg:p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 sm:mb-6 sm:text-xl">{title}</h3>
      <div className="flex h-52 items-end gap-3 border-b border-gray-200 pb-4 sm:h-64 sm:gap-4">
        {data.map((item: any) => {
          const height = Math.max(8, (Number(item.value || 0) / max) * 100)
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-32 w-full items-end sm:h-44">
                <div
                  className="w-full rounded-t-lg bg-blue-600"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900 sm:text-lg">{Number(item.value || 0).toLocaleString()}</p>
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
    <div className="card p-4 sm:p-5 lg:p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 sm:mb-6 sm:text-xl">{title}</h3>
      <div className="grid grid-cols-1 items-center gap-4 sm:gap-6 md:grid-cols-[180px_1fr]">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44 md:mx-0">
          <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90 sm:h-44 sm:w-44">
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
            <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{total}</p>
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
