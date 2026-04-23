import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAward, FiCalendar, FiFlag, FiMapPin } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=80',
  tee: 'https://images.unsplash.com/photo-1510160498866-5dae45000ebc?auto=format&fit=crop&w=1200&q=80',
  lesson: 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80',
  outing: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80',
  course: 'https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?auto=format&fit=crop&w=1400&q=80'
}

const highlights = [
  ['Daily Tee Times', images.tee, 'Keep public play moving with featured tee windows, weekday specials, and twilight rates.'],
  ['Instruction', images.lesson, 'Promote private lessons, clinics, junior programs, and coach availability.'],
  ['Outings & Events', images.outing, 'Sell tournament packages, sponsor options, and clubhouse experiences.']
]

const memberships = [
  ['Weekday Member', 'Flexible daytime access with range use and member-only pricing.'],
  ['Full Club', 'Anytime play, guest privileges, and clubhouse event access.'],
  ['Family & Junior', 'Family rounds, youth coaching, and seasonal leagues.']
]

export default function GolfSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('golf')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Golf Website Demo"
        description="Preview a golf website demo for tee times, memberships, lessons, tournaments, and clubhouse events."
        path="/site-demos/golf"
      />

      <section className="demo-hero relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/golf" className="text-2xl font-black uppercase tracking-widest">Fairway Reserve</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#highlights" className="hover:text-emerald-300">Tee Times</a>
              <a href="#memberships" className="hover:text-emerald-300">Memberships</a>
              <a href="#events" className="hover:text-emerald-300">Events</a>
              <a href="#visit" className="hover:text-emerald-300">Visit</a>
            </div>
            <Link to="/contact" className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-gray-950 hover:bg-emerald-300">Book Now</Link>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-emerald-400 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Tee Times. Instruction. Events.</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">A Golf Demo That Feels Premium Before the First Swing</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A polished golf site starter for memberships, lessons, tee times, tournaments, and clubhouse dining.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-lg bg-emerald-400 px-6 py-3 font-black text-gray-950 hover:bg-emerald-300">Book a Tee Time</Link>
                <a href="#memberships" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">Explore Memberships</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiCalendar, 'Online Tee Sheets', 'Make availability and booking frictionless.'],
            [FiAward, 'Instruction Packages', 'Feature coaches, clinics, and player development.'],
            [FiFlag, 'Tournament Ready', 'Promote outings, sponsor decks, and scoring formats.']
          ].map(([Icon, title, text]: any) => (
            <div key={title} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <Icon className="mt-1 text-emerald-300" size={24} />
              <div>
                <h2 className="font-black">{title}</h2>
                <p className="mt-1 text-sm text-gray-300">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="highlights" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-emerald-700">Club Highlights</p>
            <h2 className="text-4xl font-black md:text-5xl">Sell the Full Club Experience, Not Just the Scorecard</h2>
            <p className="mt-4 text-lg text-gray-600">Build interest around daily play, instruction, events, and a clubhouse experience people actually want to revisit.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {highlights.map(([title, image, text]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-gray-600">{text}</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Learn More</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="memberships" className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-emerald-700">Memberships</p>
            <h2 className="text-4xl font-black md:text-5xl">Make Membership Choices Feel Clear and Valuable</h2>
            <p className="mt-5 text-lg text-gray-600">This section gives you room for perks, guest access, practice facilities, and clubhouse benefits without burying the decision.</p>
            <div className="mt-8 grid grid-cols-1 gap-4">
              {memberships.map(([title, text]) => (
                <div key={title} className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-200">
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-2 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <img src={resolveAssetUrl(images.course)} alt="" className="h-80 w-full rounded-lg object-cover sm:col-span-2" />
            <img src={resolveAssetUrl(images.tee)} alt="" className="h-64 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(images.outing)} alt="" className="h-64 w-full rounded-lg object-cover" />
          </div>
        </div>
      </section>

      <section id="events" className="relative overflow-hidden py-20 text-white">
        <img src={resolveAssetUrl(images.outing)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="container relative grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-emerald-300">Events & Outings</p>
            <h2 className="text-4xl font-black md:text-6xl">Corporate Events, Charity Days, and Member Tournaments All Need a Clean Home Base</h2>
            <p className="mt-5 max-w-2xl text-lg text-gray-100">Use this space for sponsor packages, registration links, clubhouse rentals, and photo-forward event promotion.</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur">
            <h3 className="text-2xl font-black">Tournament Season</h3>
            <p className="mt-3 text-gray-200">Weekly member events, charity scramble weekends, and sponsor-ready outing packages.</p>
            <Link to="/contact" className="mt-6 inline-flex rounded-lg bg-emerald-400 px-6 py-3 font-black text-gray-950 hover:bg-emerald-300">Plan an Event</Link>
          </div>
        </div>
      </section>

      <section id="visit" className="py-16">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-emerald-700">Visit the Club</p>
            <h2 className="text-4xl font-black md:text-5xl">Give Guests a Clear Next Step Whether They Want to Play, Learn, or Join</h2>
            <p className="mt-4 text-gray-600">Demo location: 2400 Fairway Ridge. Demo amenities: driving range, clubhouse dining, lesson bay, and private event hosting.</p>
          </div>
          <div className="grid gap-3">
            <Link to="/contact" className="rounded-lg bg-gray-950 px-6 py-4 text-center font-black text-white hover:bg-gray-800">Request Tee Time Info</Link>
            <div className="rounded-lg border border-gray-200 px-6 py-4 text-center font-bold text-gray-700">
              <FiMapPin className="mx-auto mb-2 text-emerald-700" />
              View Membership Tours
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
