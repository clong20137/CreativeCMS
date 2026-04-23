import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

export default function RealEstateListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return
      try {
        const data = await pluginsAPI.getRealEstateListing(id)
        setListing(data.listing)
      } catch (err: any) {
        setError(err.error || 'Listing not found')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  if (loading) {
    return (
      <section className="py-16">
        <div className="container"><PageSkeleton /></div>
      </section>
    )
  }

  if (error || !listing) {
    return (
      <section className="py-16">
        <div className="container">
          <div className="card p-8 text-center text-gray-600">{error || 'Listing not found'}</div>
        </div>
      </section>
    )
  }

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title={`${listing.title} Real Estate Listing`}
        description={listing.description || `View details for ${listing.title}.`}
        path={`/plugins/real-estate/${listing.id}`}
        image={resolveAssetUrl(listing.image) || undefined}
      />

      {listing.image ? (
        <section className="h-[45vh] min-h-[340px] bg-gray-900">
          <img src={resolveAssetUrl(listing.image)} alt={listing.title} className="h-full w-full object-cover" />
        </section>
      ) : (
        <section className="h-[35vh] min-h-[280px] bg-gray-950" />
      )}

      <section className="py-12">
        <div className="container max-w-4xl">
          <Link to="/plugins/real-estate" className="text-blue-600 font-semibold hover:text-blue-800">Back to Listings</Link>
          <p className="text-3xl font-bold text-blue-600 mt-6 mb-3">{formatPrice(listing.price)}</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{listing.title}</h1>
          {listing.address && <p className="text-lg font-semibold text-gray-500 mb-8">{listing.address}</p>}
          <p className="text-lg text-gray-700 leading-relaxed mb-8">{listing.description}</p>
          {listing.moreInfoUrl ? (
            <a href={listing.moreInfoUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex">
              Request More Information
            </a>
          ) : (
            <Link to="/contact" className="btn-primary inline-flex">
              Request More Information
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
