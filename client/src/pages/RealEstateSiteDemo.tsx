import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHome, FiMapPin, FiSearch, FiStar } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80',
  modern: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  kitchen: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
  exterior: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80',
  condo: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80',
  agent: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80',
  neighborhood: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80'
}

const listings = [
  ['Modern Lakeview Residence', '$875,000', '4 Beds', '3.5 Baths', '3,180 Sq Ft', images.modern],
  ['Downtown Penthouse Suite', '$640,000', '2 Beds', '2 Baths', '1,620 Sq Ft', images.condo],
  ['Garden District Classic', '$525,000', '3 Beds', '2.5 Baths', '2,240 Sq Ft', images.exterior]
]

const neighborhoods = [
  ['Lake District', 'Waterfront homes, dining, trails, and evening views.'],
  ['Old Town', 'Historic blocks, walkable shops, and character homes.'],
  ['North Ridge', 'New construction, larger lots, and school access.']
]

export default function RealEstateSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('real-estate')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Real Estate Website Demo"
        description="Preview a real estate website demo for listings, neighborhoods, agents, and lead capture."
        path="/site-demos/real-estate"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/real-estate" className="text-2xl font-black uppercase tracking-widest">Acre & Key</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#listings" className="hover:text-cyan-200">Listings</a>
              <a href="#neighborhoods" className="hover:text-cyan-200">Neighborhoods</a>
              <a href="#agents" className="hover:text-cyan-200">Agents</a>
              <a href="#valuation" className="hover:text-cyan-200">Home Value</a>
            </div>
            <Link to="/contact" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-gray-950 hover:bg-cyan-300">Schedule Tour</Link>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-cyan-400 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Featured Market Demo</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Find the Home That Fits the Next Chapter</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A polished real estate demo for featured listings, search funnels, agent credibility, neighborhood guides, and seller leads.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#listings" className="rounded-lg bg-cyan-400 px-6 py-3 font-black text-gray-950 hover:bg-cyan-300">View Listings</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-20 relative z-10">
        <div className="container">
          <form className="grid grid-cols-1 gap-3 rounded-lg bg-white p-5 shadow-2xl md:grid-cols-5">
            {['City or ZIP', 'Price Range', 'Beds', 'Property Type'].map(label => (
              <input key={label} aria-label={label} placeholder={label} className="rounded-lg border border-gray-300 px-4 py-3" />
            ))}
            <Link to="/plugins/real-estate" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 font-black text-white hover:bg-gray-800">
              <FiSearch /> Search
            </Link>
          </form>
        </div>
      </section>

      <section id="listings" className="py-20">
        <div className="container">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-700">Featured Listings</p>
              <h2 className="text-4xl font-black md:text-5xl">Showcase the Homes Visitors Want to Click</h2>
              <p className="mt-4 text-lg text-gray-600">Listings can pair with the Real Estate plugin for photos, price, beds, baths, square footage, and detail pages.</p>
            </div>
            <Link to="/plugins/real-estate" className="rounded-lg border border-gray-300 px-5 py-3 text-center font-black hover:border-cyan-500 hover:text-cyan-700">View Plugin Demo</Link>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {listings.map(([title, price, beds, baths, sqft, image]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <p className="text-3xl font-black text-cyan-700">{price}</p>
                  <h3 className="mt-2 text-2xl font-black">{title}</h3>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-gray-600">
                    <span>{beds}</span>
                    <span>{baths}</span>
                    <span>{sqft}</span>
                  </div>
                  <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Schedule Tour</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-rose-700">Buyers</p>
            <h2 className="text-4xl font-black md:text-5xl">Guide Visitors From Browsing to Booked Tour</h2>
            <p className="mt-5 text-lg text-gray-600">Use visual sections for saved searches, mortgage prep, relocation guides, buyer checklists, and tour requests.</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Private tours', 'Listing alerts', 'Relocation help', 'Offer strategy'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiStar className="text-rose-600" /> {item}
                </div>
              ))}
            </div>
          </div>
          <img src={resolveAssetUrl(images.kitchen)} alt="" className="h-[34rem] w-full rounded-lg object-cover" />
        </div>
      </section>

      <section id="neighborhoods" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-700">Neighborhood Guides</p>
            <h2 className="text-4xl font-black md:text-5xl">Sell the Area, Not Just the Property</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {neighborhoods.map(([title, text]) => (
              <article key={title} className="rounded-lg border border-gray-200 p-6">
                <FiMapPin className="mb-5 text-cyan-700" size={32} />
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="agents" className="bg-gray-950 py-16 text-white">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <img src={resolveAssetUrl(images.agent)} alt="" className="h-[34rem] w-full rounded-lg object-cover" />
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-300">Agent Profile</p>
            <h2 className="text-4xl font-black md:text-5xl">Build Trust Before the First Showing</h2>
            <p className="mt-5 text-lg text-gray-300">Add agent bios, office info, market stats, testimonials, sold history, and lead capture.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ['18+', 'Years'],
                ['$82M', 'Sold'],
                ['240+', 'Clients']
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 p-4">
                  <p className="text-3xl font-black text-cyan-300">{value}</p>
                  <p className="text-sm text-gray-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="valuation" className="py-16">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-700">Sellers</p>
            <h2 className="text-4xl font-black md:text-5xl">Turn Seller Curiosity Into Valuation Requests</h2>
            <p className="mt-5 text-lg text-gray-600">Use this section for home value forms, listing prep, staging guides, market reports, and consultation booking.</p>
          </div>
          <div className="rounded-lg bg-gray-950 p-8 text-white">
            <FiHome className="mb-5 text-cyan-300" size={36} />
            <h3 className="text-2xl font-black">Get a Home Value</h3>
            <p className="mt-3 text-gray-300">Demo form route: consultation and seller lead capture.</p>
            <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-cyan-400 px-6 py-3 font-black text-gray-950 hover:bg-cyan-300">Start Valuation</Link>
            <Link to="/contact" className="ml-3 mt-6 inline-flex rounded-lg border border-cyan-400 px-6 py-3 font-black text-cyan-200 hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
