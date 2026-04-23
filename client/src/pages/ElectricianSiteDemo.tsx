import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiMapPin, FiPhone, FiShield, FiZap } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1800&q=80',
  panel: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
  tools: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  lighting: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
  exterior: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
}

const services = [
  ['Emergency Repairs', images.panel, 'Breaker trips, outages, unsafe wiring, smoke detectors, and urgent troubleshooting.'],
  ['Panel Upgrades', images.tools, 'Modern service panels, added capacity, surge protection, and code-ready installs.'],
  ['Lighting & Fixtures', images.lighting, 'Interior lighting, exterior security, recessed fixtures, and commercial updates.'],
  ['Inspections', images.exterior, 'Property sale inspections, safety checks, and repair recommendations.']
]

const checklist = [
  'Licensed residential and commercial technicians',
  'Emergency intake and same-day scheduling options',
  'Clear estimates before work begins',
  'Photo-friendly service requests and job notes',
  'Follow-up recommendations for future upgrades',
  'Service area and dispatch routing built into the page'
]

export default function ElectricianSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('electrician')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Electrician Website Demo"
        description="Preview an electrician website demo for service calls, panel upgrades, lighting, inspections, and emergency requests."
        path="/site-demos/electrician"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/electrician" className="flex items-center gap-2 text-2xl font-black uppercase tracking-widest">
              <FiZap className="text-yellow-300" /> Brightwire
            </Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#services" className="hover:text-yellow-300">Services</a>
              <a href="#why" className="hover:text-yellow-300">Why Us</a>
              <a href="#service-area" className="hover:text-yellow-300">Service Area</a>
              <a href="#quote" className="hover:text-yellow-300">Quote</a>
            </div>
            <a href="tel:+15550190210" className="rounded-lg bg-yellow-300 px-4 py-2 text-sm font-black text-gray-950 hover:bg-yellow-200">Call Now</a>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-yellow-300 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Emergency and Scheduled Service</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Fast, Licensed Electrical Help When the Lights Cannot Wait</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A demo site for electricians who need service calls, panel upgrades, inspections, lighting projects, and quote requests in one clean flow.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-lg bg-yellow-300 px-6 py-3 font-black text-gray-950 hover:bg-yellow-200">Request Service</Link>
                <a href="tel:+15550190210" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">Call Dispatch</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiClock, 'Same-Day Options', 'Route urgent requests and scheduled work fast.'],
            [FiShield, 'Licensed and Insured', 'Build trust before someone calls.'],
            [FiPhone, 'Quote-Ready Forms', 'Collect photos, issue details, and service notes.']
          ].map(([Icon, title, text]: any) => (
            <div key={title} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <Icon className="mt-1 text-yellow-300" size={24} />
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
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Electrical Services</p>
            <h2 className="text-4xl font-black md:text-5xl">Make Every Service Easy to Request</h2>
            <p className="mt-4 text-lg text-gray-600">Use strong service cards for emergency work, upgrades, lighting, inspections, and commercial projects.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map(([title, image, text]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-64 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm text-gray-600">{text}</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Request Help</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Trust Signals</p>
            <h2 className="text-4xl font-black md:text-5xl">Homeowners Need Confidence Before They Let Someone Near the Panel</h2>
            <p className="mt-5 text-lg text-gray-600">
              This demo gives service businesses room for credentials, response times, safety copy, photo proof, and a direct path to contact.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {checklist.map(item => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiCheckCircle className="mt-1 shrink-0 text-yellow-600" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={resolveAssetUrl(images.panel)} alt="" className="h-80 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(images.lighting)} alt="" className="mt-10 h-80 w-full rounded-lg object-cover" />
          </div>
        </div>
      </section>

      <section id="service-area" className="relative overflow-hidden py-20 text-white">
        <img src={resolveAssetUrl(images.exterior)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="container relative grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-300">Service Area</p>
            <h2 className="text-4xl font-black md:text-6xl">Local Crews, Clear Dispatch, and Work That Feels Accountable</h2>
            <p className="mt-5 max-w-2xl text-lg text-gray-100">Use this section for towns served, emergency hours, memberships, financing, and commercial maintenance plans.</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur">
            <FiMapPin className="text-yellow-300" size={30} />
            <h3 className="mt-4 text-2xl font-black">Demo Dispatch Area</h3>
            <p className="mt-3 text-gray-200">Northside, downtown, suburbs, and nearby commercial corridors.</p>
            <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-yellow-300 px-6 py-3 font-black text-gray-950 hover:bg-yellow-200">Check Availability</Link>
          </div>
        </div>
      </section>

      <section id="quote" className="py-16">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Start the Job</p>
            <h2 className="text-4xl font-black md:text-5xl">Collect the Details Before the First Phone Call</h2>
            <p className="mt-4 text-gray-600">Demo phone: (555) 019-0210. Demo hours: 24/7 emergency line, weekday appointments.</p>
          </div>
          <div className="grid gap-3">
            <Link to="/contact" className="rounded-lg bg-gray-950 px-6 py-4 text-center font-black text-white hover:bg-gray-800">Request Electrical Service</Link>
            <Link to="/contact" className="rounded-lg border border-yellow-500 px-6 py-4 text-center font-black text-yellow-700 hover:bg-yellow-50">Use this demo as a starting point</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
