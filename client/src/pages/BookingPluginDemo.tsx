import { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { pluginsAPI } from '../services/api'

const meetingOptions = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'google-meet', label: 'Google Meet' },
  { value: 'in-person', label: 'In Person' }
]

function formatSlot(slot: any) {
  const date = new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
  return `${date}, ${slot.startTime} - ${slot.endTime}`
}

export default function BookingPluginDemo() {
  const [slots, setSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    meetingType: 'phone',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const data = await pluginsAPI.getBookingSlots()
      setSlots(data.slots)
      if (!selectedSlot && data.slots.length > 0) {
        setSelectedSlot(data.slots[0])
        setFormData(current => ({ ...current, meetingType: data.slots[0].locationTypes?.[0] || 'phone' }))
      }
    } catch (err: any) {
      setError(err.error || 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot)
    setFormData(current => ({ ...current, meetingType: slot.locationTypes?.[0] || 'phone' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    try {
      setError('')
      await pluginsAPI.createBookingAppointment({
        ...formData,
        availabilitySlotId: selectedSlot.id
      })
      setMessage('Your appointment has been booked.')
      setFormData({ name: '', email: '', phone: '', meetingType: 'phone', notes: '' })
      setSelectedSlot(null)
      fetchSlots()
    } catch (err: any) {
      setError(err.error || 'Failed to book appointment')
    }
  }

  const availableMeetingOptions = meetingOptions.filter(option => selectedSlot?.locationTypes?.includes(option.value))

  return (
    <div>
      <SEO
        title="Booking Appointment Plugin Demo"
        description="Preview a booking plugin that lets visitors schedule appointments from available time slots."
        path="/plugins/booking"
      />

      <section className="bg-gray-950 text-white py-20">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-3">Plugin Demo</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book an Appointment</h1>
          <p className="text-xl text-gray-300 max-w-2xl">Choose an available time and meet in person, by Zoom, Google Meet, or phone.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
          {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

          {loading ? <PageSkeleton /> : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Times</h2>
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSelectSlot(slot)}
                      className={`w-full text-left p-4 border rounded-lg transition ${selectedSlot?.id === slot.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      <span className="font-bold text-gray-900">{formatSlot(slot)}</span>
                      <span className="block text-sm text-gray-600 mt-1">
                        {(slot.locationTypes || []).map((type: string) => meetingOptions.find(option => option.value === type)?.label || type).join(', ')}
                      </span>
                    </button>
                  ))}
                  {slots.length === 0 && <div className="card p-8 text-center text-gray-600">No appointment times are currently available.</div>}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                {selectedSlot && <p className="text-blue-700 font-semibold">{formatSlot(selectedSlot)}</p>}
                <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required />
                <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <select value={formData.meetingType} onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" required>
                  {availableMeetingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" rows={4} />
                <button type="submit" disabled={!selectedSlot} className="btn-primary disabled:opacity-50">Book Appointment</button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
