import { useState, useEffect } from 'react'
import { FiTrash2, FiEdit, FiPlus } from 'react-icons/fi'
import { adminAPI } from '../services/api'
import { PageSkeleton } from '../components/SkeletonLoaders'

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getClients()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await adminAPI.updateUser(editingId, formData)
      } else {
        await adminAPI.createUser({ ...formData, password: 'TempPassword123!' })
      }
      setFormData({ name: '', email: '', company: '', phone: '' })
      setEditingId(null)
      setShowForm(false)
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await adminAPI.deleteUser(id)
        fetchClients()
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null) }}
            className="flex items-center gap-2 btn-primary"
          >
            <FiPlus /> Add Client
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Save Client</button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients Table */}
        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{client.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{client.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{client.company}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{client.phone}</td>
                    <td className="px-6 py-3 text-sm space-x-2">
                      <button
                        onClick={() => {
                          setFormData({
                            name: client.name,
                            email: client.email,
                            company: client.company || '',
                            phone: client.phone || ''
                          })
                          setEditingId(String(client.id))
                          setShowForm(true)
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        <FiEdit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(String(client.id))}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <FiTrash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
