import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAward, FiCalendar, FiTarget, FiUsers } from 'react-icons/fi'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { resolveAssetUrl, siteDemosAPI } from '../services/api'
import NotFound from './NotFound'

const images = {
  hero: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1800&q=80',
  league: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  social: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80',
  tournament: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80',
  crowd: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80'
}

const cards = [
  ['Weekly Leagues', images.league, 'Show divisions, formats, standings, and easy recurring registration.'],
  ['Social Nights', images.social, 'Promote low-pressure evenings with food, drinks, music, and open play.'],
  ['Big Tournaments', images.tournament, 'Highlight brackets, payouts, sponsors, and event-day schedules.']
]

const features = [
  'League registration and waiver collection',
  'Tournament bracket and sponsor promotion',
  'Team signups for doubles or BYOP formats',
  'Photo-friendly event recaps and standings',
  'Venue rental and private event inquiries',
  'Merch, partner, or sponsor callouts'
]

export default function CornholeSiteDemo() {
  const [demo, setDemo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    siteDemosAPI.getDemo('cornhole')
      .then(setDemo)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><PageSkeleton /></div>
  if (notFound || !demo) return <NotFound />

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Cornhole Website Demo"
        description="Preview a cornhole website demo for leagues, tournaments, registrations, social nights, and sponsors."
        path="/site-demos/cornhole"
      />

      <section className="demo-hero relative min-h-screen overflow-hidden text-white">
        <img src={resolveAssetUrl(images.hero)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative">
          <div className="flex items-center justify-between gap-4 py-6">
            <Link to="/site-demos/cornhole" className="text-2xl font-black uppercase tracking-widest">Bag Night</Link>
            <div className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide lg:flex">
              <a href="#leagues" className="hover:text-amber-300">Leagues</a>
              <a href="#events" className="hover:text-amber-300">Events</a>
              <a href="#community" className="hover:text-amber-300">Community</a>
              <a href="#join" className="hover:text-amber-300">Join</a>
            </div>
            <Link to="/contact" className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-black text-gray-950 hover:bg-amber-200">Join Now</Link>
          </div>

          <div className="flex min-h-[calc(100vh-6rem)] items-center py-20">
            <div className="max-w-4xl">
              <p className="mb-4 inline-flex rounded bg-amber-300 px-3 py-1 text-sm font-black uppercase tracking-widest text-gray-950">Leagues. Social Nights. Tournaments.</p>
              <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">Give Every Throw a Home Base Worth Showing Off</h1>
              <p className="mt-6 max-w-2xl text-xl text-gray-100">
                A cornhole demo built for social leagues, bracket nights, sponsors, private bookings, and easy registration.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/contact" className="rounded-lg bg-amber-300 px-6 py-3 font-black text-gray-950 hover:bg-amber-200">Join a League</Link>
                <a href="#events" className="rounded-lg bg-white px-6 py-3 font-black text-gray-950 hover:bg-gray-100">View Events</a>
                <Link to="/contact" className="rounded-lg border border-white/60 px-6 py-3 font-black text-white hover:bg-white hover:text-gray-950">Use this demo as a starting point</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-5 text-white">
        <div className="container grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            [FiCalendar, 'League Nights', 'Set recurring nights, divisions, and standings in one clear flow.'],
            [FiTarget, 'Tournament Ready', 'Promote brackets, prize pools, and team check-in information.'],
            [FiUsers, 'Community First', 'Show social events, sponsors, and venue partners alongside competition.']
          ].map(([Icon, title, text]: any) => (
            <div key={title} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <Icon className="mt-1 text-amber-300" size={24} />
              <div>
                <h2 className="font-black">{title}</h2>
                <p className="mt-1 text-sm text-gray-300">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="leagues" className="py-16">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-amber-700">League Structure</p>
            <h2 className="text-4xl font-black md:text-5xl">Make Signup, Format, and Weekly Play Feel Obvious</h2>
            <p className="mt-4 text-lg text-gray-600">The best league sites make it easy to see who can join, when games happen, and how the season works.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map(([title, image, text]) => (
              <article key={title} className="group overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="h-72 overflow-hidden">
                  <img src={resolveAssetUrl(image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-gray-600">{text}</p>
                  <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-gray-950 px-5 py-3 font-bold text-white hover:bg-gray-800">Get Details</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="bg-gray-100 py-16">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <img src={resolveAssetUrl(images.crowd)} alt="" className="h-80 w-full rounded-lg object-cover sm:col-span-2" />
            <img src={resolveAssetUrl(images.social)} alt="" className="h-64 w-full rounded-lg object-cover" />
            <img src={resolveAssetUrl(images.tournament)} alt="" className="h-64 w-full rounded-lg object-cover" />
          </div>
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-amber-700">Events & Sponsors</p>
            <h2 className="text-4xl font-black md:text-5xl">From Backyard Socials to Sponsor-Filled Tournaments</h2>
            <p className="mt-5 text-lg text-gray-600">Use this layout for event calendars, venue partnerships, sponsor logos, recaps, and private bookings.</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map(item => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-white p-4 font-bold shadow-sm">
                  <FiAward className="mt-1 shrink-0 text-amber-600" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="relative overflow-hidden py-20 text-white">
        <img src={resolveAssetUrl(images.social)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="container relative max-w-4xl">
          <p className="mb-3 text-sm font-black uppercase tracking-widest text-amber-300">Build the Community</p>
          <h2 className="text-4xl font-black md:text-6xl">Show Why People Keep Coming Back Every Week</h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-100">Feature venue vibes, recurring nights, sponsor appreciation, and the simple fun of people showing up for a good bracket and a better time.</p>
          <Link to="/contact" className="mt-8 inline-flex rounded-lg bg-amber-300 px-6 py-3 font-black text-gray-950 hover:bg-amber-200">Sponsor an Event</Link>
        </div>
      </section>

      <section id="join" className="py-16">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-sm font-black uppercase tracking-widest text-amber-700">Join the Next Throwdown</p>
            <h2 className="text-4xl font-black md:text-5xl">Make It Easy for Players, Teams, and Sponsors to Say Yes</h2>
            <p className="mt-4 text-gray-600">Demo venue: 915 Market Hall. Demo format: weekly doubles, monthly tournaments, private event bookings.</p>
          </div>
          <div className="grid gap-3">
            <Link to="/contact" className="rounded-lg bg-gray-950 px-6 py-4 text-center font-black text-white hover:bg-gray-800">Register a Team</Link>
            <Link to="/contact" className="rounded-lg border border-amber-500 px-6 py-4 text-center font-black text-amber-700 hover:bg-amber-50">Book a Private Night</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
