import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ticketsAPI } from '../services/api'

export default function ClientTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [formData, setFormData] = useState({ subject: '', message: '', priority: 'normal' })

  const fetchTickets = async () => setTickets(await ticketsAPI.getClientTickets())

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await ticketsAPI.createTicket(formData)
    setFormData({ subject: '', message: '', priority: 'normal' })
    fetchTickets()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <Link to="/client-dashboard" className="text-blue-600 font-semibold">Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-8">Support Tickets</h1>
        <form onSubmit={handleSubmit} className="card p-6 mb-8 space-y-4">
          <input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Subject" className="w-full px-4 py-2 border rounded-lg" required />
          <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="How can we help?" className="w-full px-4 py-2 border rounded-lg" rows={4} required />
          <button type="submit" className="btn-primary">Send Ticket</button>
        </form>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card p-6">
              <div className="flex justify-between gap-4">
                <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                <span className="capitalize text-sm text-blue-600">{ticket.status}</span>
              </div>
              <p className="text-gray-700 mt-3">{ticket.message}</p>
              {ticket.adminResponse && <p className="mt-4 p-4 bg-blue-50 text-blue-900 rounded-lg">{ticket.adminResponse}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
