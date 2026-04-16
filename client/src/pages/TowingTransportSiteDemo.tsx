import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheck, FiClock, FiMapPin, FiPhone } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
  flatbed: 'https://unsplash.com/photos/dF6Sh8krxd4/download?force=true',
  recovery: 'https://unsplash.com/photos/IW9QDmpmZUY/download?force=true',
  loadedFlatbed: 'https://unsplash.com/photos/Q7shv9IN7cc/download?force=true',
  heavyTruck: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
  equipment: 'https://unsplash.com/photos/dF6Sh8krxd4/download?force=true',
  dispatch: 'https://unsplash.com/photos/IW9QDmpmZUY/download?force=true'
}

const services = [
  ['Heavy-Duty Towing', images.heavyTruck, 'Tractors, box trucks, buses, RVs, and commercial fleets.'],
  ['Flatbed Towing', images.flatbed, 'Clean roadside pickup, secure loading, and damage-aware delivery.'],
  ['Recovery Dispatch', images.recovery, 'Winching, disabled vehicles, accident scenes, and urgent calls.'],
  ['Equipment Moves', images.equipment, 'Construction, industrial, farm, and specialty equipment relocation.']
]

const process = [
  ['Pick Your Service', 'Choose towing, transport, recovery, crane support, or equipment relocation.'],
  ['Request Dispatch', 'Call or send the quote form with pickup, dropoff, weight, and timing.'],
  ['We Bring the Gear', 'A trained operator arrives with the right truck, trailer, rigging, and safety plan.'],
  ['Secure Delivery', 'The load is transported, recovered, or placed with clear communication throughout.']
]

const gallery = [
  ['Fleet Ready', images.hero],
  ['Flatbed Truck', images.flatbed],
  ['Emergency Wrecker', images.recovery],
  ['Loaded Flatbed', images.loadedFlatbed],
  ['Roadside Dispatch', images.dispatch],
  ['Heavy Tow Ready', images.heavyTruck]
]

export default function TowingTransportSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('towing-transport')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="bg-white text-gray-950">
      <SEO
        title="Towing & Heavy Transport Demo"
        description="Preview a towing, recovery, crane, and heavy transport website demo."
        path="/site-demos/towing-transport"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/towing-transport" className="text-2xl font-black uppercase tracking-widest">Iron Route</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#services" className="hover:text-yellow-300">Services</a>
              <a href="#quote" className="hover:text-yellow-300">Quote</a>
              <a href="#process" className="hover:text-yellow-300">Process</a>
              <a href="#gallery" className="hover:text-yellow-300">Fleet</a>
            </div>
            <a href="tel:+15550199411" className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-black text-gray-950 hover:bg-yellow-300">24/7 Dispatch</a>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-yellow-400 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Available 24/7/365</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Heavy Recovery, Towing, and Transport Without the Guesswork</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A demo site for operators who move trucks, machines, job-site equipment, and urgent recovery calls with confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#quote" className="rounded-lg bg-yellow-400 px-6 py-3 font-black text-gray-950 hover:bg-yellow-300">Request a Quote</a>
                <a href="tel:+15550199411" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">Call Now</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiClock, '24/7 Emergency Response', 'Rain, snow, overnight, and roadside calls.'],
            [FiMapPin, 'Regional & Long Haul', 'Local recovery and transport across state lines.'],
            [FiPhone, 'Live Dispatch', 'Fast intake for service, quote, and fleet calls.']
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
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-600">Full-Service Transport</p>
            <h2 className="text-4xl font-black md:text-5xl">Built for Heavy Loads and Hard Calls</h2>
            <p className="mt-4 text-lg text-gray-600">Show every service line with bold images, clear descriptions, and quote-ready calls to action.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map(([title, image, text]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-gray-950 text-white shadow">
                <div className="h-64 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm text-gray-300">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="quote" className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Request a Quote</p>
            <h2 className="text-4xl font-black md:text-5xl">Move the Load. Clear the Scene. Get Back on Schedule.</h2>
            <p className="mt-5 text-lg text-gray-600">
              A quote form can collect what is being moved, pickup and dropoff points, urgency, dimensions, photos, and extra dispatch notes.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Heavy tow', 'Flatbed tow', 'Accident recovery', 'Winch-out service', 'Equipment relocation', 'Fleet towing'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiCheck className="text-yellow-600" /> {item}
                </div>
              ))}
            </div>
          </div>
          <form className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-2xl font-black">Transport Details</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {['Name', 'Phone', 'Email', 'What are you moving?', 'Pickup location', 'Dropoff location'].map(label => (
                <input key={label} aria-label={label} placeholder={label} className="rounded-lg border border-gray-300 px-4 py-3" />
              ))}
              <textarea aria-label="Additional information" placeholder="Additional information" rows={5} className="rounded-lg border border-gray-300 px-4 py-3 md:col-span-2"></textarea>
            </div>
            <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-yellow-400 px-6 py-3 font-black text-gray-950 hover:bg-yellow-300">Send Quote Request</Link>
          </form>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 text-white">
        <img src={resolveAssetUrl(images.recovery)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65"></div>
        <div className="container relative max-w-4xl">
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-300">Why Choose Us</p>
          <h2 className="text-4xl font-black md:text-6xl">Professional Operators, Purpose-Built Equipment, Clear Communication</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {['Fast dispatch and secure load handling', 'Transparent estimates and easy scheduling', 'Real-time updates from pickup to dropoff', 'Recovery planning for difficult access sites'].map(item => (
              <div key={item} className="rounded-lg border border-white/20 bg-white/10 p-4 font-bold backdrop-blur">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Our Process</p>
            <h2 className="text-4xl font-black md:text-5xl">Simple Steps for Complicated Moves</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {process.map(([title, text], index) => (
              <article key={title} className="rounded-lg border border-gray-200 p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400 text-xl font-black text-gray-950">{index + 1}</div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm text-gray-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="bg-gray-950 py-16 text-white">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-300">Fleet Gallery</p>
            <h2 className="text-4xl font-black md:text-5xl">Show the Trucks, Trailers, Lifts, and Recovery Work</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gallery.map(([title, image]) => (
              <figure key={title} className="group overflow-hidden rounded-lg bg-white/5">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <figcaption className="p-4 font-black">{title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-700">Service Area</p>
            <h2 className="text-4xl font-black md:text-5xl">Multiple Yards, One Dispatch Number</h2>
            <p className="mt-5 text-lg text-gray-600">Use this section for service areas, yard locations, police rotation notes, employment links, and emergency dispatch copy.</p>
          </div>
          <div className="rounded-lg bg-gray-950 p-8 text-white">
            <h3 className="text-2xl font-black">24/7 Dispatch</h3>
            <p className="mt-3 text-gray-300">Demo phone: (555) 019-9411</p>
            <p className="mt-1 text-gray-300">Demo HQ: Central Midwest</p>
            <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-yellow-400 px-6 py-3 font-black text-gray-950 hover:bg-yellow-300">Contact Dispatch</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
