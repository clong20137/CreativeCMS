import { useEffect, useMemo, useState } from 'react'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI } from '../services/api'

export default function RestaurantPluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await pluginsAPI.getRestaurantMenu()
        setPlugin(data.plugin)
        setItems(data.items)
      } catch (error) {
        console.error('Error loading restaurant menu:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const categories = useMemo(() => {
    return items.reduce<Record<string, any[]>>((groups, item) => {
      const category = item.category || 'Menu'
      groups[category] = groups[category] || []
      groups[category].push(item)
      return groups
    }, {})
  }, [items])

  return (
    <div>
      <SEO
        title="Restaurant Menu Plugin Demo"
        description="Preview an editable restaurant menu plugin with item photos, descriptions, categories, and prices."
        path="/plugins/restaurant"
      />

      <section className="bg-gray-950 text-white py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Plugin Demo</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Restaurant Menu</h1>
          <p className="text-xl text-gray-300 max-w-2xl">Editable menu items, categories, photos, prices, and availability for restaurant websites.</p>
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

              {Object.keys(categories).length > 0 ? (
                <div className="space-y-12">
                  {Object.entries(categories).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h2 className="text-3xl font-bold text-gray-900 mb-6">{category}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categoryItems.map((item) => (
                          <article key={item.id} className="card overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />
                            ) : (
                              <div className="h-56 bg-gray-100 flex items-center justify-center text-gray-500">Menu item</div>
                            )}
                            <div className="p-6">
                              <div className="flex justify-between gap-4 mb-3">
                                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                                <p className="text-xl font-bold text-blue-600">${Number(item.price || 0).toFixed(2)}</p>
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
                <div className="card p-8 text-center text-gray-600">No restaurant menu items have been added yet.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
