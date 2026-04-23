import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiClock, FiMapPin, FiScissors, FiStar } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://unsplash.com/photos/5h8EmdrFGjY/download?force=true',
  chair: 'https://unsplash.com/photos/k6RsU8om2UE/download?force=true',
  haircut: 'https://unsplash.com/photos/Sh3n9QGKzbg/download?force=true',
  interior: 'https://unsplash.com/photos/XG5OAQYxi4g/download?force=true',
  station: 'https://unsplash.com/photos/k6RsU8om2UE/download?force=true',
  detail: 'https://unsplash.com/photos/5h8EmdrFGjY/download?force=true'
}

const services = [
  ['Signature Cut', '$38', 'Consultation, clipper work, scissor finish, rinse, and style.'],
  ['Skin Fade', '$45', 'Tight blend, razor line-up, hot towel, and finished styling.'],
  ['Beard Trim', '$24', 'Shape, detail, neckline clean-up, oil, and warm towel.'],
  ['Cut + Beard', '$58', 'Full grooming appointment for hair, beard, and sharp details.']
]

const barbers = [
  ['Marcus', 'Fades, texture, beard shaping'],
  ['Andre', 'Classic cuts and razor details'],
  ['Theo', 'Modern styles and long-hair cleanup']
]

const gallery = [
  ['Chair Ready', images.chair],
  ['Fresh Cut', images.haircut],
  ['Shop Interior', images.interior],
  ['Mirror Detail', images.station]
]

export default function BarbershopSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('barbershop')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Barbershop Website Demo"
        description="Preview a modern barbershop website demo for cuts, beard trims, memberships, and booking."
        path="/site-demos/barbershop"
      />

      <section className="relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/barbershop" className="text-2xl font-black uppercase tracking-widest">Crownline</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#services" className="hover:text-teal-200">Services</a>
              <a href="#barbers" className="hover:text-teal-200">Barbers</a>
              <a href="#membership" className="hover:text-teal-200">Memberships</a>
              <a href="#gallery" className="hover:text-teal-200">Gallery</a>
            </div>
            <Link to="/contact" className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-black text-gray-950 hover:bg-teal-300">Book Now</Link>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-teal-400 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Cuts. Fades. Beard Work.</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Sharp Grooming for Walk-Ins, Regulars, and Weekend Plans</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A barbershop demo built for online booking, service menus, barber profiles, memberships, and strong shop photography.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-lg bg-teal-400 px-6 py-3 font-black text-gray-950 hover:bg-teal-300">Book an Appointment</Link>
                <a href="#services" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">View Services</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiClock, 'Open Late', 'Flexible hours for workdays and weekends.'],
            [FiScissors, 'Detailed Cuts', 'Fades, tapers, scissor work, and beard care.'],
            [FiMapPin, 'Easy Booking', 'Let clients book, reschedule, and find the shop fast.']
          ].map(([Icon, title, text]: any) => (
            <div key={title} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <Icon className="mt-1 text-teal-300" size={24} />
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
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-teal-700">Service Menu</p>
            <h2 className="text-4xl font-black md:text-5xl">Simple Pricing, Premium Details</h2>
            <p className="mt-4 text-lg text-gray-600">Use this section for core services, add-ons, product upsells, and direct booking buttons.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {services.map(([title, price, text]) => (
              <article key={title} className="rounded-lg border border-gray-200 p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <h3 className="text-2xl font-black">{title}</h3>
                <p className="mt-3 text-4xl font-black text-teal-700">{price}</p>
                <p className="mt-4 text-gray-600">{text}</p>
                <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Book This</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <img src={resolveAssetUrl(images.chair)} alt="" className="h-80 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(images.haircut)} alt="" className="mt-10 h-80 w-full rounded-lg object-cover" />
          </div>
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-rose-700">The Chair Experience</p>
            <h2 className="text-4xl font-black md:text-5xl">A Shop Site Should Make the Appointment Feel Easy Before They Arrive</h2>
            <p className="mt-5 text-lg text-gray-600">
              Add visual proof, explain the service, show what is included, and keep booking one click away.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Hot towel finish', 'Razor line-up', 'Beard care', 'Style consultation'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiStar className="text-rose-600" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="barbers" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-teal-700">Meet the Barbers</p>
            <h2 className="text-4xl font-black md:text-5xl">Let Clients Choose Their Chair</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {barbers.map(([name, specialty], index) => (
              <article key={name} className="overflow-hidden rounded-lg bg-gray-950 text-white shadow">
                <img src={resolveAssetUrl(index === 0 ? images.haircut : index === 1 ? images.station : images.detail)} alt="" className="h-80 w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl font-black">{name}</h3>
                  <p className="mt-2 text-gray-300">{specialty}</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-teal-400 px-5 py-3 font-bold text-gray-950 hover:bg-teal-300">Book with {name}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="membership" className="relative overflow-hidden py-20 text-white">
        <img src={resolveAssetUrl(images.interior)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65"></div>
        <div className="container relative max-w-4xl">
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-teal-300">Memberships</p>
          <h2 className="text-4xl font-black md:text-6xl">Monthly Grooming Plans for Clients Who Stay Sharp</h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-100">
            Feature recurring cut plans, beard maintenance, priority booking, retail discounts, and loyalty rewards.
          </p>
          <Link to="/contact" className="mt-8 inline-flex rounded-lg bg-teal-400 px-6 py-3 font-black text-gray-950 hover:bg-teal-300">Join the List</Link>
        </div>
      </section>

      <section id="gallery" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-teal-700">Gallery</p>
            <h2 className="text-4xl font-black md:text-5xl">Show the Shop, the Work, and the Vibe</h2>
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

      <section className="bg-gray-950 py-16 text-white">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-teal-300">Ready for the Chair?</p>
            <h2 className="text-4xl font-black md:text-5xl">Book Online, Walk In, or Save a Favorite Barber</h2>
            <p className="mt-4 text-gray-300">Demo address: 1100 Market Row. Demo hours: Tue-Sat, 10am-8pm.</p>
          </div>
          <div className="grid gap-3">
            <Link to="/contact" className="rounded-lg bg-teal-400 px-6 py-4 text-center font-black text-gray-950 hover:bg-teal-300">Book Appointment</Link>
            <Link to="/contact" className="rounded-lg border border-teal-400 px-6 py-4 text-center font-black text-teal-200 hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
