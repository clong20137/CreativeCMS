import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI } from '../services/api'

const messageGroups = [
  { status: 'new', label: 'New', empty: 'No new messages.' },
  { status: 'read', label: 'Read', empty: 'No read messages.' },
  { status: 'archived', label: 'Archived', empty: 'No archived messages.' }
]

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
    window.dispatchEvent(new Event('admin-notifications-refresh'))
  }

  return (
    <AdminLayout title="Contact Messages">
      {loading ? <PageSkeleton /> : (
        <div className="space-y-8">
          {messages.length === 0 ? (
            <div className="card p-8 text-center text-gray-600">No messages yet.</div>
          ) : messageGroups.map((group) => {
            const groupMessages = messages.filter(message => message.status === group.status)

            return (
              <section key={group.status}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{group.label}</h2>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    group.status === 'new'
                      ? 'bg-red-100 text-red-700'
                      : group.status === 'read'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}>
                    {groupMessages.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {groupMessages.map((message) => (
                    <div key={message.id} className="card p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{message.name}</h3>
                          <p className="text-sm text-gray-600">{message.email} / {message.phone || 'No phone'}</p>
                          <p className="text-sm text-gray-600">{message.company || 'No company'} / {message.service || 'No service selected'}</p>
                          <p className="mt-4 text-gray-700">{message.message}</p>
                        </div>
                        <select value={message.status} onChange={(e) => updateStatus(String(message.id), e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {groupMessages.length === 0 && <div className="card p-6 text-center text-gray-600">{group.empty}</div>}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
