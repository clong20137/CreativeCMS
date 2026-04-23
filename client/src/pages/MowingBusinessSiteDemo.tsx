import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiCheck, FiClock, FiMapPin, FiPhone, FiSun } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1800&q=80',
  mower: 'https://images.unsplash.com/photo-1599685315640-cc6f6b19f9d1?auto=format&fit=crop&w=1200&q=80',
  lawn: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
  cleanup: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=1200&q=80',
  home: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'
}

const services = [
  ['Weekly Mowing', images.mower, 'Scheduled mowing, trimming, edging, and blow-off for consistent curb appeal.'],
  ['Seasonal Cleanup', images.cleanup, 'Spring refresh, fall leaves, branches, beds, and property cleanup days.'],
  ['Commercial Grounds', images.lawn, 'Reliable service routes for storefronts, offices, rentals, and HOAs.']
]

const plans = [
  ['Starter', 'Small yards and simple recurring mowing.', ['Mowing', 'Trimming', 'Blow-off cleanup']],
  ['Full Care', 'A stronger plan for homes that need steady attention.', ['Mowing', 'Edging', 'Seasonal visits']],
  ['Commercial', 'Route-based service for visible business properties.', ['Multi-site scheduling', 'Priority routing', 'Monthly billing']]
]

const gallery = [
  ['Fresh Lines', images.mower],
  ['Clean Edges', images.lawn],
  ['Seasonal Cleanup', images.cleanup],
  ['Curb Appeal', images.home]
]

export default function MowingBusinessSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('mowing-business')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Mowing Business Website Demo"
        description="Preview a lawn mowing business website demo for recurring plans, seasonal cleanup, service areas, and quote requests."
        path="/site-demos/mowing-business"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/mowing-business" className="flex items-center gap-2 text-2xl font-black uppercase tracking-widest">
              <FiSun className="text-lime-300" /> Greenline
            </Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#services" className="hover:text-lime-200">Services</a>
              <a href="#plans" className="hover:text-lime-200">Plans</a>
              <a href="#gallery" className="hover:text-lime-200">Work</a>
              <a href="#quote" className="hover:text-lime-200">Quote</a>
            </div>
            <Link to="/contact" className="rounded-lg bg-lime-300 px-4 py-2 text-sm font-black text-gray-950 hover:bg-lime-200">Get Quote</Link>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-lime-300 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Weekly Routes and Seasonal Cleanup</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Reliable Lawn Care That Keeps Properties Looking Ready Every Week</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A demo site for mowing businesses that need recurring plans, quick quote requests, service areas, and strong before-the-call confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-lg bg-lime-300 px-6 py-3 font-black text-gray-950 hover:bg-lime-200">Get a Lawn Quote</Link>
                <a href="#plans" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">View Plans</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiCalendar, 'Recurring Routes', 'Weekly and biweekly service plans.'],
            [FiMapPin, 'Local Service Areas', 'Show neighborhoods, towns, and route zones.'],
            [FiPhone, 'Fast Quotes', 'Capture address, yard size, and service needs.']
          ].map(([Icon, title, text]: any) => (
            <div key={title} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <Icon className="mt-1 text-lime-300" size={24} />
              <div>
                <h2 className="font-black">{title}</h2>
                <p className="mt-1 text-sm text-gray-300">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-green-700">Property Care</p>
            <h2 className="text-4xl font-black md:text-5xl">Weekly Mowing, Cleanup, and Curb Appeal</h2>
            <p className="mt-4 text-lg text-gray-600">Highlight core services, recurring plans, route days, seasonal work, and commercial bids.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {services.map(([title, image, text]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-gray-600">{text}</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Request Service</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="bg-green-950 py-16 text-white">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-lime-300">Service Plans</p>
            <h2 className="text-4xl font-black md:text-5xl">Plans That Make Lawn Care Easy</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map(([title, text, features]: any) => (
              <article key={title} className="rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur">
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-gray-200">{text}</p>
                <div className="mt-6 grid gap-3">
                  {features.map((feature: string) => (
                    <div key={feature} className="flex items-center gap-3 font-bold">
                      <FiCheck className="text-lime-300" /> {feature}
                    </div>
                  ))}
                </div>
                <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-lime-300 px-5 py-3 font-black text-gray-950 hover:bg-lime-200">Choose Plan</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <img src={resolveAssetUrl(images.home)} alt="" className="h-80 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(images.cleanup)} alt="" className="mt-10 h-80 w-full rounded-lg object-cover" />
          </div>
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-green-700">Easy Intake</p>
            <h2 className="text-4xl font-black md:text-5xl">Turn Yard Details Into a Clean Quote Request</h2>
            <p className="mt-5 text-lg text-gray-600">
              Collect address, yard size, frequency, gate access, pet notes, photos, and preferred service days before the first estimate.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Weekly mowing', 'Biweekly service', 'Leaf cleanup', 'Commercial bids'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiCheck className="text-green-700" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-green-700">Work Gallery</p>
            <h2 className="text-4xl font-black md:text-5xl">Show the Lines, Edges, Cleanup, and Finished Properties</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {gallery.map(([title, image]) => (
              <figure key={title} className="group overflow-hidden rounded-lg bg-gray-100">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <figcaption className="p-4 font-black">{title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="bg-gray-950 py-16 text-white">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-lime-300">Ready for the Route?</p>
            <h2 className="text-4xl font-black md:text-5xl">Make It Simple to Request Service and Stay on Schedule</h2>
            <p className="mt-4 text-gray-300">Demo phone: (555) 019-7740. Demo hours: Mon-Sat, 7am-6pm.</p>
          </div>
          <div className="grid gap-3">
            <Link to="/contact" className="rounded-lg bg-lime-300 px-6 py-4 text-center font-black text-gray-950 hover:bg-lime-200">Request a Lawn Quote</Link>
            <Link to="/contact" className="rounded-lg border border-lime-300 px-6 py-4 text-center font-black text-lime-200 hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
          </div>
          <div className="flex gap-3 text-sm text-gray-300 lg:col-span-3">
            <FiClock className="mt-1 text-lime-300" />
            <span>Route scheduling, weather delay notices, and seasonal reminders can be added later with client portal features.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
