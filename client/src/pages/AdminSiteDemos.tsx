import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiCopy, FiExternalLink } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'
import { cloneDemoStarterSections } from '../utils/demoStarterTemplates'

export default function AdminSiteDemos() {
  const navigate = useNavigate()
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchDemos = async () => {
    try {
      setLoading(true)
      setDemos(await adminAPI.getSiteDemos())
    } catch (err: any) {
      setError(err.error || 'Failed to load site demos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDemos()
  }, [])

  const updateDemo = async (demo: any, updates: any) => {
    try {
      setError('')
      const updated = await adminAPI.updateSiteDemo(demo.slug, { ...demo, ...updates })
      setDemos(current => current.map(item => item.id === updated.id ? updated : item))
      setMessage(`${updated.name} ${updated.isActive ? 'activated' : 'deactivated'}`)
    } catch (err: any) {
      setError(err.error || 'Failed to update site demo')
    }
  }

  const createStarterPage = async (demo: any) => {
    try {
      setError('')
      setMessage(`Creating ${demo.name} starter page...`)
      const suffix = Date.now().toString().slice(-5)
      const page = await adminAPI.createPage({
        title: `${demo.name} Starter`,
        slug: `${demo.slug}-starter-${suffix}`,
        headerTitle: demo.name,
        headerSubtitle: demo.description || '',
        content: '',
        sections: cloneDemoStarterSections(demo.slug),
        metaTitle: `${demo.name} Starter`,
        metaDescription: demo.description || '',
        isPublished: false,
        sortOrder: 1000 + Number(demo.sortOrder || 0)
      })
      window.dispatchEvent(new Event('admin-pages-refresh'))
      navigate(`/admin/pages?custom=${page.id}`)
    } catch (err: any) {
      setMessage('')
      setError(err.error || 'Failed to create starter page')
    }
  }

  return (
    <AdminLayout title="Site Demos">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pre-Made Demo Sites</h2>
        <p className="text-gray-600">Activate demos clients can preview before choosing a site direction.</p>
      </div>

      {loading ? <PageSkeleton /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {demos.map(demo => (
            <section key={demo.id} className="card overflow-hidden">
              {demo.previewImage ? (
                <img src={resolveAssetUrl(demo.previewImage)} alt={demo.name} className="h-64 w-full object-cover" />
              ) : (
                <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500">Site demo</div>
              )}
              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">{demo.name}</h3>
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{demo.category}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${demo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {demo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mb-5 text-gray-600">{demo.description}</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => updateDemo(demo, { isActive: !demo.isActive })} className="btn-primary">
                    {demo.isActive ? 'Deactivate Demo' : 'Activate Demo'}
                  </button>
                  {demo.isActive && (
                    <Link to={demo.demoUrl} className="inline-flex items-center gap-2 btn-secondary">
                      <FiExternalLink /> View Demo
                    </Link>
                  )}
                  <button onClick={() => createStarterPage(demo)} className="inline-flex items-center gap-2 btn-secondary">
                    <FiCopy /> Use this demo as a starting point
                  </button>
                </div>
              </div>
            </section>
          ))}
          {demos.length === 0 && <div className="card p-8 text-center text-gray-600 xl:col-span-2">No site demos are available yet.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
