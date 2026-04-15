import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { ticketsAPI } from '../services/api'

export default function AdminTickets() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setTickets(await ticketsAPI.getAdminTickets())
    } catch (err: any) {
      setError(err.error || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const updateTicket = async (id: string, data: any) => {
    await ticketsAPI.updateTicket(id, data)
    fetchTickets()
  }

  return (
    <AdminLayout title="Client Tickets">
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}
      {loading ? <PageSkeleton /> : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600">{ticket.User?.name} / {ticket.User?.email}</p>
                  <p className="text-gray-700 mt-4">{ticket.message}</p>
                </div>
                <div className="flex gap-2">
                  <select value={ticket.status} onChange={(e) => updateTicket(String(ticket.id), { status: e.target.value })} className="px-3 py-2 border rounded-lg">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select value={ticket.priority} onChange={(e) => updateTicket(String(ticket.id), { priority: e.target.value })} className="px-3 py-2 border rounded-lg">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <textarea
                defaultValue={ticket.adminResponse || ''}
                onBlur={(e) => updateTicket(String(ticket.id), { adminResponse: e.target.value })}
                placeholder="Admin response"
                className="w-full mt-4 px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          ))}
          {tickets.length === 0 && <div className="card p-8 text-center text-gray-600">No tickets yet.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
