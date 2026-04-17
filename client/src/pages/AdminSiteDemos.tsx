import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiCopy, FiExternalLink } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, resolveAssetUrl } from '../services/api'

const demoStarterSections: Record<string, any[]> = {
  restaurant: [
    {
      id: 'restaurant-hero',
      type: 'hero',
      title: 'Modern Grill Energy, Neighborhood Table Soul',
      body: 'A polished restaurant homepage with strong food photography, reservations, menu highlights, private dining, and catering.',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80',
      buttonLabel: 'View Menu',
      buttonUrl: '#menu',
      secondaryButtonLabel: 'Book a Table',
      secondaryButtonUrl: '/contact'
    },
    {
      id: 'restaurant-cards',
      type: 'imageCards',
      title: 'Featured Experiences',
      columns: 3,
      items: [
        { id: 'card-1', title: 'Steakhouse Favorites', description: 'Seared cuts, bright sides, and polished dinner service.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Reserve', buttonUrl: '/contact' },
        { id: 'card-2', title: 'Sushi & Seafood', description: 'Fresh rolls, crisp starters, and shareable plates.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'View Menu', buttonUrl: '#menu' },
        { id: 'card-3', title: 'Private Events', description: 'Chef-led dinners, celebrations, and intimate gatherings.', image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Plan Event', buttonUrl: '/contact' }
      ]
    },
    { id: 'restaurant-menu-plugin', type: 'plugin', pluginSlug: 'restaurant', title: 'Featured Menu' },
    { id: 'restaurant-cta', type: 'cta', title: 'Ready to Fill More Tables?', body: 'Turn this demo into a restaurant site your client can edit and launch.', buttonLabel: 'Start a Project', buttonUrl: '/contact' }
  ],
  'towing-transport': [
    {
      id: 'towing-hero',
      type: 'hero',
      title: 'Heavy Recovery, Towing, and Transport Without the Guesswork',
      body: 'A demo site for operators who move trucks, machines, job-site equipment, and urgent recovery calls.',
      imageUrl: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
      buttonLabel: 'Request a Quote',
      buttonUrl: '/contact',
      secondaryButtonLabel: 'Call Dispatch',
      secondaryButtonUrl: 'tel:+15550199411'
    },
    {
      id: 'towing-services',
      type: 'imageCards',
      title: 'Built for Heavy Loads and Hard Calls',
      columns: 4,
      items: [
        { id: 'tow-1', title: 'Heavy-Duty Towing', description: 'Tractors, buses, RVs, and commercial fleets.', image: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true', buttonLabel: 'Get Help', buttonUrl: '/contact' },
        { id: 'tow-2', title: 'Flatbed Towing', description: 'Secure roadside pickup and damage-aware delivery.', image: 'https://unsplash.com/photos/dF6Sh8krxd4/download?force=true', buttonLabel: 'Schedule', buttonUrl: '/contact' },
        { id: 'tow-3', title: 'Recovery Dispatch', description: 'Winching, disabled vehicles, and accident scenes.', image: 'https://unsplash.com/photos/IW9QDmpmZUY/download?force=true', buttonLabel: 'Dispatch', buttonUrl: '/contact' },
        { id: 'tow-4', title: 'Equipment Moves', description: 'Construction, industrial, farm, and specialty relocation.', image: 'https://unsplash.com/photos/Q7shv9IN7cc/download?force=true', buttonLabel: 'Quote', buttonUrl: '/contact' }
      ]
    },
    { id: 'towing-process', type: 'columns', title: 'Simple Steps for Complicated Moves', columns: 3, items: [{ id: 'col-1', sections: [{ id: 'h1', type: 'header', title: 'Request Dispatch' }, { id: 'p1', type: 'paragraph', body: 'Send pickup, dropoff, weight, and urgency.' }] }, { id: 'col-2', sections: [{ id: 'h2', type: 'header', title: 'We Bring the Gear' }, { id: 'p2', type: 'paragraph', body: 'Operators arrive with the right truck, trailer, and plan.' }] }, { id: 'col-3', sections: [{ id: 'h3', type: 'header', title: 'Secure Delivery' }, { id: 'p3', type: 'paragraph', body: 'Clear communication from pickup to dropoff.' }] }] },
    { id: 'towing-contact', type: 'contactForm', title: 'Request a Quote' }
  ],
  barbershop: [
    { id: 'barber-hero', type: 'hero', title: 'Let Clients Choose Their Chair', body: 'A sharp barbershop starter page for services, memberships, booking, and team highlights.', imageUrl: 'https://unsplash.com/photos/k6RsU8om2UE/download?force=true', buttonLabel: 'Book a Cut', buttonUrl: '/contact' },
    { id: 'barber-services', type: 'imageCards', title: 'Cuts, Trims, and Memberships', columns: 3, items: [{ id: 'b1', title: 'Signature Cuts', description: 'Clean fades, scissor cuts, and style refreshes.', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book', buttonUrl: '/contact' }, { id: 'b2', title: 'Beard Work', description: 'Lineups, trims, hot towel finishes, and detail work.', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book', buttonUrl: '/contact' }, { id: 'b3', title: 'Monthly Plans', description: 'Recurring grooming plans for clients who stay sharp.', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Join', buttonUrl: '/contact' }] },
    { id: 'barber-cta', type: 'cta', title: 'Keep the Chairs Full', body: 'Use this demo starter for a local grooming brand.', buttonLabel: 'Start Project', buttonUrl: '/contact' }
  ],
  'real-estate': [
    { id: 'real-estate-hero', type: 'hero', title: 'Homes, Neighborhoods, and Leads in One Place', body: 'A polished real estate starter for featured listings, neighborhoods, agents, and lead capture.', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'View Listings', buttonUrl: '/plugins/real-estate' },
    { id: 'real-estate-plugin', type: 'plugin', pluginSlug: 'real-estate', title: 'Featured Listings' },
    { id: 'real-estate-cards', type: 'imageCards', title: 'Neighborhood Focus', columns: 3, items: [{ id: 'r1', title: 'Downtown Living', description: 'Condos, walkability, and city amenities.', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Explore', buttonUrl: '/contact' }, { id: 'r2', title: 'Suburban Homes', description: 'Space, schools, and quiet streets.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Explore', buttonUrl: '/contact' }, { id: 'r3', title: 'Investment Properties', description: 'Income-ready options and market guidance.', image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Invest', buttonUrl: '/contact' }] },
    { id: 'real-estate-contact', type: 'contactForm', title: 'Start Your Search' }
  ]
}

function cloneSections(sections: any[]) {
  return JSON.parse(JSON.stringify(sections)).map((section: any) => ({ ...section, id: crypto.randomUUID() }))
}

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
        sections: cloneSections(demoStarterSections[demo.slug] || []),
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
                    <FiCopy /> Use as Starter
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
