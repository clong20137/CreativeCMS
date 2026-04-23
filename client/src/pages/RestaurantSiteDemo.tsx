import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const demoImages = {
  hero: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80',
  steak: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  sushi: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80',
  cocktails: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=1200&q=80',
  dining: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
  privateDining: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  patio: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80'
}

const demoMenuItems = [
  {
    id: 'demo-steak',
    name: 'Charred Ribeye',
    category: 'Dinner',
    description: 'Prime cut, herb butter, blistered greens, and roasted garlic jus.',
    price: 38,
    image: demoImages.steak
  },
  {
    id: 'demo-sushi',
    name: 'Crisp Rice Tuna',
    category: 'Sushi',
    description: 'Spicy tuna, avocado, sesame, scallion, and citrus soy.',
    price: 18,
    image: demoImages.sushi
  },
  {
    id: 'demo-cocktail',
    name: 'Garden Highball',
    category: 'Drinks',
    description: 'Cucumber, mint, lime, botanical spirit, and sparkling soda.',
    price: 13,
    image: demoImages.cocktails
  },
  {
    id: 'demo-dessert',
    name: 'Cocoa Cloud',
    category: 'Dessert',
    description: 'Chocolate mousse, espresso cream, shaved chocolate, and berries.',
    price: 11,
    image: demoImages.dessert
  }
]

const gallery = [
  ['Chef Counter', demoImages.dining],
  ['Signature Sushi', demoImages.sushi],
  ['Craft Cocktails', demoImages.cocktails],
  ['Private Dining', demoImages.privateDining],
  ['Catering Platters', demoImages.catering],
  ['Evening Patio', demoImages.patio]
]

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

  const displayMenuItems = menuItems.length > 0 ? menuItems : demoMenuItems
  const categories = useMemo(() => {
    return displayMenuItems.reduce<Record<string, any[]>>((groups, item) => {
      const category = item.category || 'Menu'
      groups[category] = groups[category] || []
      groups[category].push(item)
      return groups
    }, {})
  }, [displayMenuItems])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Restaurant Website Demo"
        description="Preview a restaurant website demo powered by the editable Menu plugin."
        path="/site-demos/restaurant"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(demoImages.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/restaurant" className="text-2xl font-black uppercase tracking-widest">Ember & Vine</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#menu" className="hover:text-emerald-200">Menus</a>
              <a href="#happenings" className="hover:text-emerald-200">Happenings</a>
              <a href="#events" className="hover:text-emerald-200">Private Events</a>
              <a href="#gallery" className="hover:text-emerald-200">Gallery</a>
            </div>
            <div className="flex gap-2">
              <Link to="/contact" className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-950 hover:bg-gray-100">Reserve</Link>
              <a href="#menu" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400">Order</a>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-emerald-200">Restaurant Demo</p>
              <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">Modern Grill Energy, Neighborhood Table Soul</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A polished restaurant template with bold food photography, fast reservations, menu highlights, private dining, and catering.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#menu" className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400">View Menu</a>
                <Link to="/contact" className="rounded-lg bg-white px-6 py-3 font-bold text-gray-950 hover:bg-gray-100">Book a Table</Link>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-bold text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white py-5">
        <div className="container grid grid-cols-1 gap-4 text-sm font-bold uppercase tracking-wide text-gray-700 md:grid-cols-4">
          <a href="#menu" className="rounded-lg border border-gray-200 px-4 py-3 text-center hover:border-emerald-500 hover:text-emerald-700">All Day Menu</a>
          <a href="#happenings" className="rounded-lg border border-gray-200 px-4 py-3 text-center hover:border-emerald-500 hover:text-emerald-700">Happy Hour</a>
          <a href="#events" className="rounded-lg border border-gray-200 px-4 py-3 text-center hover:border-emerald-500 hover:text-emerald-700">Private Events</a>
          <Link to="/contact" className="rounded-lg border border-gray-200 px-4 py-3 text-center hover:border-emerald-500 hover:text-emerald-700">Catering</Link>
        </div>
      </section>

      <section className="py-16">
        <div className="container grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[
            ['Steakhouse Favorites', demoImages.steak, 'Seared cuts, bright sides, and polished dinner service.'],
            ['Sushi & Seafood', demoImages.sushi, 'Fresh rolls, crisp starters, and shareable plates.'],
            ['Bar-Forward Evenings', demoImages.cocktails, 'Cocktails, zero-proof drinks, and late-night bites.']
          ].map(([title, image, text]) => (
            <article key={title} className="group overflow-hidden rounded-lg bg-gray-950 text-white shadow">
              <div className="h-80 overflow-hidden">
                <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="mt-3 text-gray-300">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="happenings" className="bg-gray-50 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-rose-700">Happenings</p>
            <h2 className="text-4xl font-black md:text-5xl">Seasonal Features That Feel Worth Leaving Home For</h2>
            <p className="mt-5 text-lg text-gray-600">
              Spotlight limited menus, chef features, brunch, happy hour, holiday dinners, and local events with image-led blocks.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">See Features</a>
              <Link to="/contact" className="rounded-lg border border-gray-300 px-5 py-3 font-bold hover:border-rose-500 hover:text-rose-700">Plan a Visit</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={resolveAssetUrl(demoImages.cocktails)} alt="" className="h-72 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(demoImages.dessert)} alt="" className="mt-10 h-72 w-full rounded-lg object-cover" />
          </div>
        </div>
      </section>

      <section id="menu" className="py-16">
        <div className="container">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">Menu Plugin</p>
              <h2 className="text-4xl font-black md:text-5xl">Featured Menu</h2>
              <p className="mt-4 text-gray-600">
                Menu items, categories, descriptions, prices, availability, and item photos can come from the restaurant Menu plugin.
              </p>
            </div>
            <Link to="/plugins/restaurant" className="rounded-lg border border-gray-300 px-5 py-3 text-center font-bold hover:border-emerald-500 hover:text-emerald-700">Open Menu Plugin Demo</Link>
          </div>

          <div className="space-y-12">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-6 text-2xl font-black">{category}</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {items.map(item => (
                    <article key={item.id} className="overflow-hidden rounded-lg bg-gray-50 shadow">
                      {(item.image || item.imageUrl) && <img src={resolveAssetUrl(item.image || item.imageUrl)} alt={item.name} className="h-56 w-full object-cover" />}
                      <div className="p-5">
                        <div className="mb-3 flex justify-between gap-4">
                          <h4 className="text-xl font-bold">{item.name}</h4>
                          <p className="font-bold text-rose-700">${Number(item.price || 0).toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="bg-gray-950 py-16 text-white">
        <div className="container grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[
            ['Private Events', demoImages.privateDining, 'Chef-led dinners, company celebrations, rehearsal dinners, and intimate gatherings.'],
            ['Catering', demoImages.catering, 'Platters, party trays, boxed lunches, and event-ready service options.']
          ].map(([title, image, text]) => (
            <article key={title} className="group relative min-h-[30rem] overflow-hidden rounded-lg">
              <img src={resolveAssetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/45"></div>
              <div className="absolute inset-x-0 bottom-0 p-8">
                <h2 className="text-4xl font-black">{title}</h2>
                <p className="mt-3 max-w-xl text-gray-100">{text}</p>
                <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 font-bold text-gray-950 hover:bg-gray-100">Find Out More</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="gallery" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">Gallery</p>
            <h2 className="text-4xl font-black md:text-5xl">Atmosphere Sells the Reservation</h2>
            <p className="mt-4 text-gray-600">Use a gallery section for food, drinks, dining rooms, patio shots, catering spreads, and event setups.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gallery.map(([title, image]) => (
              <figure key={title} className="group overflow-hidden rounded-lg bg-gray-50">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <figcaption className="p-4 font-bold">{title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-rose-700">Reserve Now</p>
            <h2 className="text-4xl font-black">Book Your Table Today</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {['Restaurant Selection', 'Party Size', 'Date', 'Time'].map(label => (
                <div key={label} className="rounded-lg border border-gray-200 px-4 py-3 text-gray-600">{label}</div>
              ))}
            </div>
            <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400">Reserve Now</Link>
            <Link to="/contact" className="ml-3 mt-6 inline-flex rounded-lg border border-emerald-500 px-6 py-3 font-bold text-emerald-700 hover:bg-emerald-50">Use this demo as a starting point</Link>
          </div>
          <div className="overflow-hidden rounded-lg">
            <img src={resolveAssetUrl(demoImages.patio)} alt="" className="h-full min-h-[28rem] w-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  )
}
