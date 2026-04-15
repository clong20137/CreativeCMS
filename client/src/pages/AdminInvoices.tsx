import { useEffect, useState } from 'react'
import { FiDownload, FiMail, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, invoicesAPI } from '../services/api'

const emptyInvoiceForm = {
  clientId: '',
  description: '',
  quantity: '1',
  rate: '',
  tax: '0',
  dueDate: '',
  notes: '',
  terms: 'Payment due by the listed due date.'
}

export default function AdminInvoices() {
  const [clients, setClients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyInvoiceForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clientsData, invoicesData] = await Promise.all([
        adminAPI.getClients(),
        adminAPI.getInvoices()
      ])
      setClients(clientsData)
      setInvoices(invoicesData)
    } catch (err: any) {
      setError(err.error || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const quantity = Number(formData.quantity || 1)
      const rate = Number(formData.rate || 0)
      const subtotal = quantity * rate
      const tax = Number(formData.tax || 0)
      const total = subtotal + tax

      await invoicesAPI.createInvoice({
        clientId: formData.clientId,
        items: [
          {
            description: formData.description,
            quantity,
            rate,
            amount: subtotal
          }
        ],
        subtotal,
        tax,
        total,
        dueDate: formData.dueDate,
        notes: formData.notes,
        terms: formData.terms,
        status: 'draft'
      })

      setMessage('Invoice created')
      setFormData(emptyInvoiceForm)
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to create invoice')
    }
  }

  const handleSendInvoice = async (id: string) => {
    setError('')
    setMessage('')

    try {
      await invoicesAPI.sendInvoice(id)
      setMessage('Invoice emailed to client')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to send invoice')
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Delete this invoice?')) return

    try {
      await invoicesAPI.deleteInvoice(id)
      setMessage('Invoice deleted')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to delete invoice')
    }
  }

  const downloadInvoice = (id: string) => {
    window.open(invoicesAPI.getDownloadUrl(id), '_blank')
  }

  return (
    <AdminLayout title="Invoices">
      {message && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">{message}</div>}
      {error && <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">{error}</div>}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Invoices</h2>
          <p className="text-gray-600">Create invoices, download a printable copy, or email clients directly.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 btn-primary"
        >
          {showForm ? <FiX /> : <FiPlus />}
          {showForm ? 'Close Form' : 'Create Invoice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateInvoice} className="card p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
              ))}
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <input
            type="text"
            placeholder="Line item description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rate"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Tax"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={2}
          />
          <textarea
            placeholder="Terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={2}
          />

          <button type="submit" className="btn-primary">Save Invoice</button>
        </form>
      )}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Invoice</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{invoice.User?.name || 'Unknown'}</td>
                  <td className="px-6 py-3 text-sm text-gray-700 capitalize">{invoice.status}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">${Number(invoice.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => downloadInvoice(String(invoice.id))} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        <FiDownload /> Download
                      </button>
                      <button onClick={() => handleSendInvoice(String(invoice.id))} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        <FiMail /> Email
                      </button>
                      <button onClick={() => handleDeleteInvoice(String(invoice.id))} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-600">No invoices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
