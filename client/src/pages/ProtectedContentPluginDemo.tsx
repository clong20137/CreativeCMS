import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { API_URL, pluginsAPI, resolveAssetUrl } from '../services/api'

function formatPrice(value: number | string) {
  return Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

function renderUnlockedContent(item: any) {
  if (!item?.contentUrl) return null
  const token = localStorage.getItem('authToken') || ''
  const protectedMediaUrl = item.mediaAssetId ? `${API_URL}/protected-media/${item.mediaAssetId}?token=${encodeURIComponent(token)}` : ''
  const contentUrl = protectedMediaUrl || resolveAssetUrl(item.contentUrl)

  if (item.contentType === 'video') {
    return (
      <video src={contentUrl} controls className="mt-4 w-full rounded-lg bg-black" />
    )
  }

  if (item.contentType === 'image') {
    return (
      <img src={contentUrl} alt={item.title} className="mt-4 w-full rounded-lg object-cover" />
    )
  }

  return (
    <a href={contentUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-flex">
      Open Document
    </a>
  )
}

export default function ProtectedContentPluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [unlockedItems, setUnlockedItems] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const isLoggedIn = Boolean(localStorage.getItem('authToken')) && localStorage.getItem('userRole') === 'client'

  const fetchItems = async () => {
    try {
      setLoading(true)
      const data = await pluginsAPI.getProtectedContentItems()
      setPlugin(data.plugin)
      setItems(data.items)
    } catch (err: any) {
      setError(err.error || 'Failed to load protected content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    const payment = searchParams.get('content_payment')
    if (payment === 'success') setMessage('Payment received. Your content will unlock after Stripe confirms the payment.')
    if (payment === 'cancelled') setError('Payment was cancelled. No charge was made.')
  }, [searchParams])

  const purchaseItem = async (item: any) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      setError('')
      const session = await pluginsAPI.createProtectedContentCheckoutSession(String(item.id))
      window.location.href = session.url
    } catch (err: any) {
      setError(err.error || 'Protected content checkout is not configured yet')
    }
  }

  const unlockItem = async (item: any) => {
    if (!isLoggedIn) {
      window.location.href = '/login'
      return
    }

    try {
      setError('')
      const unlocked = await pluginsAPI.getProtectedContentItem(String(item.id))
      setUnlockedItems(current => ({ ...current, [item.id]: unlocked }))
    } catch (err: any) {
      setError(err.error || 'Purchase required to view this content')
    }
  }

  return (
    <div>
      <SEO
        title="Protected Content Library Plugin Demo"
        description="Preview a protected content plugin that sells private videos, images, and documents to logged-in clients."
        path="/plugins/protected-content"
      />

      <section className="bg-gray-950 text-white py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Plugin Demo</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Protected Content Library</h1>
          <p className="text-xl text-gray-300 max-w-2xl">Sell private training videos, images, and documents that unlock only after purchase.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
          {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

          {loading ? <PageSkeleton /> : (
            <>
              {!plugin?.isEnabled && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900">
                  This plugin demo is currently inactive. Activate it from Admin Panel, Plugins.
                </div>
              )}

              {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((item) => {
                    const unlocked = unlockedItems[item.id]
                    return (
                      <article key={item.id} className="card overflow-hidden">
                        {item.previewImage ? (
                          <img src={resolveAssetUrl(item.previewImage)} alt={item.title} className="h-60 w-full object-cover" />
                        ) : (
                          <div className="h-60 bg-gray-100 flex items-center justify-center text-gray-500">{item.contentType}</div>
                        )}
                        <div className="p-6">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">{item.contentType}</span>
                            {item.isUnlocked && <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Purchased</span>}
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h2>
                          {item.description && <p className="text-gray-600 mb-6 whitespace-pre-line">{item.description}</p>}
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(item.price)}</p>
                            {item.isUnlocked ? (
                              <button onClick={() => unlockItem(item)} className="btn-primary">View Content</button>
                            ) : isLoggedIn ? (
                              <button onClick={() => purchaseItem(item)} className="btn-primary">{item.buttonLabel || 'Unlock Access'}</button>
                            ) : (
                              <Link to="/login" className="btn-primary">Log In to Buy</Link>
                            )}
                          </div>
                          {unlocked && renderUnlockedContent(unlocked)}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-600">No protected content has been added yet.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
