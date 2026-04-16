import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

export default function RestaurantSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchDemo = async () => {
      try {
        setLoading(true)
        const [demoData, menuData] = await Promise.all([
          siteDemosAPI.getDemo('restaurant'),
          pluginsAPI.getRestaurantMenu()
        ])
        setDemo(demoData)
        setMenuItems(menuData.items || [])
      } catch (error) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDemo()
  }, [])

  const categories = useMemo(() => {
    return menuItems.reduce<Record<string, any[]>>((groups, item) => {
      const category = item.category || 'Menu'
      groups[category] = groups[category] || []
      groups[category].push(item)
      return groups
    }, {})
  }, [menuItems])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="bg-white text-gray-950">
      <SEO
        title="Restaurant Website Demo"
        description="Preview a restaurant website demo powered by the editable Menu plugin."
        path="/site-demos/restaurant"
      />

      <section className="relative min-h-[82vh] overflow-hidden text-white">
        <img src={resolveAssetUrl(demo.previewImage)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="container relative flex min-h-[82vh] items-center py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-200">Restaurant Demo</p>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl">A Warm Table For Every Occasion</h1>
            <p className="mt-6 max-w-2xl text-xl text-gray-100">
              Seasonal dishes, private dining, and a menu that stays fresh from brunch rush to dinner service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400">View Menu</a>
              <Link to="/contact" className="rounded-lg bg-white px-6 py-3 font-bold text-gray-950 hover:bg-gray-100">Book a Table</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-3">
          {[
            ['Hours', 'Tue-Sun, 4pm-10pm'],
            ['Location', 'Downtown dining district'],
            ['Private Events', 'Chef-led dinners and group menus']
          ].map(([title, text]) => (
            <div key={title} className="border-l-4 border-emerald-500 bg-gray-50 p-6 shadow">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-2 text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="menu" className="py-16 bg-white">
        <div className="container">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">Featured Plates</p>
            <h2 className="text-4xl font-bold">Featured Menu</h2>
            <p className="mt-4 text-gray-600">Chef picks, seasonal specials, and signature drinks stay ready for guests.</p>
          </div>

          {Object.keys(categories).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-6 text-2xl font-bold">{category}</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map(item => (
                      <article key={item.id} className="overflow-hidden rounded-lg bg-gray-50 shadow">
                        {item.image && <img src={resolveAssetUrl(item.image)} alt={item.name} className="h-56 w-full object-cover" />}
                        <div className="p-6">
                          <div className="mb-3 flex justify-between gap-4">
                            <h4 className="text-xl font-bold">{item.name}</h4>
                            <p className="font-bold text-rose-700">${Number(item.price || 0).toFixed(2)}</p>
                          </div>
                          <p className="text-gray-600">{item.description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border p-8 text-center text-gray-600">No menu items have been added yet.</div>
          )}
        </div>
      </section>

      <section className="bg-gray-950 py-16 text-white">
        <div className="container text-center">
          <h2 className="text-4xl font-bold">A Table Is Waiting</h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-300">Reservations, private parties, and catering requests can start right here.</p>
          <Link to="/contact" className="mt-8 inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400">Reserve a Consultation</Link>
        </div>
      </section>
    </div>
  )
}
