import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    setLoading(true)
    setMessages(await adminAPI.getContactMessages())
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await adminAPI.updateContactMessage(id, { status })
    fetchMessages()
  }

  return (
    <AdminLayout title="Contact Messages">
      {loading ? <PageSkeleton /> : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="card p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{message.name}</h3>
                  <p className="text-sm text-gray-600">{message.email} / {message.phone || 'No phone'}</p>
                  <p className="text-sm text-gray-600">{message.company || 'No company'} / {message.service || 'No service selected'}</p>
                  <p className="mt-4 text-gray-700">{message.message}</p>
                </div>
                <select value={message.status} onChange={(e) => updateStatus(String(message.id), e.target.value)} className="px-3 py-2 border rounded-lg">
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          ))}
          {messages.length === 0 && <div className="card p-8 text-center text-gray-600">No messages yet.</div>}
        </div>
      )}
    </AdminLayout>
  )
}
