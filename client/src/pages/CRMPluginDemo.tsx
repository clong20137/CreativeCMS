import { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import PageSections from '../components/PageSections'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI } from '../services/api'

export default function CRMPluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pluginsAPI.getCrmPlugin()
      .then(data => setPlugin(data.plugin))
      .catch(() => setPlugin(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><PageSkeleton /></div>

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="CRM Quote System Plugin Demo"
        description="Preview a CRM quote request and lead capture plugin for service businesses."
        path="/plugins/crm"
      />
      <section className="bg-gray-950 py-20 text-white">
        <div className="container">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-300">Plugin Demo</p>
          <h1 className="max-w-4xl text-4xl font-bold md:text-6xl">CRM Quote System</h1>
          <p className="mt-5 max-w-3xl text-xl text-gray-200">
            Capture quote requests, service details, and customer contact information, then manage every lead in the admin portal.
          </p>
          {!plugin && (
            <div className="mt-8 rounded-lg border border-yellow-300/40 bg-yellow-300/10 p-4 text-yellow-100">
              This plugin demo is currently inactive. Activate it from Admin Panel, Plugins.
            </div>
          )}
        </div>
      </section>
      {plugin && (
        <PageSections
          sections={[
            {
              id: 'crm-demo',
              type: 'plugin',
              pluginSlug: 'crm',
              title: 'Request a Service Quote',
              body: 'This section can be dropped into any page and styled with its own background image, overlay, spacing, and typography.',
              imageUrl: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
              overlayColor: '#111827',
              overlayOpacity: 72,
              crmEyebrow: 'Built for Service Businesses',
              crmPanelTitle: 'Turn every quote request into a trackable CRM lead.',
              crmPanelText: 'Use it for towing dispatch, electrician calls, lawn care estimates, consultations, or custom service requests.',
              crmFormTitle: 'Request a Quote',
              crmServices: 'Heavy-duty towing\nFlatbed towing\nEquipment transport\nEmergency recovery\nScheduled service',
              buttonLabel: 'Send Quote Request'
            }
          ]}
        />
      )}
    </div>
  )
}
