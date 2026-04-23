import { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI, resolveAssetUrl } from '../services/api'

function formatEventDate(value: string) {
  if (!value) return 'Date to be announced'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function EventsPluginDemo() {
  const [plugin, setPlugin] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await pluginsAPI.getEvents()
        setPlugin(data.plugin)
        setEvents(data.events)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <div className="demo-page bg-white text-gray-950">
      <SEO
        title="Events Plugin Demo"
        description="Preview an editable events plugin with titles, dates, descriptions, images, and action buttons."
        path="/plugins/events"
      />

      <section className="bg-gray-950 text-white py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Plugin Demo</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
          <p className="text-xl text-gray-300 max-w-2xl">Editable events with dates, images, descriptions, and buttons.</p>
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

              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <article key={event.id} className="card overflow-hidden">
                      {event.image ? (
                        <img src={resolveAssetUrl(event.image)} alt={event.title} className="h-60 w-full object-cover" />
                      ) : (
                        <div className="h-60 bg-gray-100 flex items-center justify-center text-gray-500">Event image</div>
                      )}
                      <div className="p-6">
                        <p className="text-sm font-bold uppercase text-blue-600 mb-2">{formatEventDate(event.eventDate)}</p>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h2>
                        {event.description && <p className="text-gray-600 mb-6 whitespace-pre-line">{event.description}</p>}
                        {event.buttonLabel && event.buttonUrl && (
                          <a href={event.buttonUrl} className="btn-primary inline-flex">
                            {event.buttonLabel}
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-600">No events have been added yet.</div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
