import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, siteSettingsAPI } from '../services/api'

const fallbackHeader = {
  title: 'Website Plugins',
  subtitle: 'Add the features your business needs when you need them.'
}

export default function Plugins() {
  const [plugins, setPlugins] = useState<any[]>([])
  const [pageHeader, setPageHeader] = useState(fallbackHeader)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const [pluginData, settings] = await Promise.all([
          pluginsAPI.getPlugins(),
          siteSettingsAPI.getSettings()
        ])
        setPlugins(pluginData)
        setPageHeader({ ...fallbackHeader, ...(settings.pageHeaders?.plugins || {}) })
      } catch (error) {
        console.error('Error loading plugins:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlugins()
  }, [])

  return (
    <div>
      <SEO
        title="Website Plugins and Add Ons"
        description="Explore optional website plugins from Creative by Caleb, including restaurant menus and real estate listing tools."
        path="/plugins"
      />

      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageHeader.title}</h1>
          <p className="text-xl text-blue-100">{pageHeader.subtitle}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {loading ? <PageSkeleton /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plugins.map((plugin) => (
                <div key={plugin.id} className="card p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{plugin.name}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plugin.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {plugin.isEnabled ? 'Demo active' : 'Demo inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">{plugin.description}</p>
                  {plugin.demoUrl && (
                    <Link to={plugin.demoUrl} className="btn-primary inline-flex">
                      View Demo
                    </Link>
                  )}
                </div>
              ))}
              {plugins.length === 0 && <div className="card p-8 text-center text-gray-600 md:col-span-2">No active plugin demos are available yet.</div>}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
