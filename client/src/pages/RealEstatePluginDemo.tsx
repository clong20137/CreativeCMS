import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, resolveAssetUrl } from '../services/api'

function formatPrice(price: number | string) {
  return Number(price || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

export default function RealEstatePluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await pluginsAPI.getRealEstateListings()
        setPlugin(data.plugin)
        setListings(data.listings)
      } catch (error) {
        console.error('Error loading real estate listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Real Estate Listings Plugin Demo"
        description="Preview an editable real estate plugin with property photos, prices, descriptions, and more information buttons."
        path="/plugins/real-estate"
      />

      <section className="bg-gray-950 text-white py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Plugin Demo</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Real Estate Listings</h1>
          <p className="text-xl text-gray-300 max-w-2xl">Editable property listings with photos, prices, descriptions, and more information buttons.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {loading ? <PageSkeleton /> : (
            <>
              {!plugin?.isEnabled && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900">
                  This plugin demo is currently inactive. Activate it from Admin Panel, Plugins.
                </div>
              )}

              {listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <article key={listing.id} className="card overflow-hidden">
                      {listing.image ? (
                        <img src={resolveAssetUrl(listing.image)} alt={listing.title} className="h-60 w-full object-cover" />
                      ) : (
                        <div className="h-60 bg-gray-100 flex items-center justify-center text-gray-500">Property listing</div>
                      )}
                      <div className="p-6">
                        <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(listing.price)}</p>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{listing.title}</h2>
                        {listing.address && <p className="text-sm font-semibold text-gray-500 mb-3">{listing.address}</p>}
                        <p className="text-gray-600 mb-6">{listing.description}</p>
                        <Link to={`/plugins/real-estate/${listing.id}`} className="btn-primary inline-flex">
                          More Information
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-600">No real estate listings have been added yet.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
