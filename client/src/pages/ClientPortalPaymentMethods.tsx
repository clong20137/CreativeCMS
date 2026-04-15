import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiX, FiCheckCircle } from 'react-icons/fi'
import { paymentMethodsAPI } from '../services/api'

export default function ClientPortalPaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const data = await paymentMethodsAPI.getPaymentMethods()
      setPaymentMethods(data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setMessage('Error loading payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      if (!formData.cardNumber || !formData.cardHolder || !formData.expiryMonth || !formData.expiryYear) {
        setMessage('Please fill in all required fields')
        return
      }

      await paymentMethodsAPI.addPaymentMethod(formData)
      setFormData({ cardNumber: '', cardHolder: '', expiryMonth: '', expiryYear: '', cvv: '', isDefault: false })
      setShowAddModal(false)
      setMessage('Payment method added successfully')
      fetchPaymentMethods()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error adding payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await paymentMethodsAPI.setDefaultPaymentMethod(id)
      fetchPaymentMethods()
      setMessage('Default payment method updated')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating default payment method')
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      try {
        await paymentMethodsAPI.deletePaymentMethod(id)
        setMessage('Payment method deleted')
        fetchPaymentMethods()
        setTimeout(() => setMessage(''), 3000)
      } catch (error) {
        setMessage('Error deleting payment method')
      }
    }
  }

  const handleFormChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus /> Add Payment Method
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {paymentMethods.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No payment methods added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Your First Payment Method
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map(method => (
              <div key={method.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{method.cardType}</h3>
                      {method.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          <FiCheckCircle size={14} /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">•••• {method.lastFour}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">{method.cardHolder}</p>
                  <p className="text-sm text-gray-600">Expires {method.expiryMonth}/{method.expiryYear}</p>
                </div>

                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Payment Method</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-600 hover:text-gray-900">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleFormChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                <input
                  type="text"
                  name="cardHolder"
                  value={formData.cardHolder}
                  onChange={handleFormChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select
                    name="expiryMonth"
                    value={formData.expiryMonth}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="">Month</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select
                    name="expiryYear"
                    value={formData.expiryYear}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="">Year</option>
                    {[...Array(10)].map((_, i) => {
                      const year = new Date().getFullYear() + i
                      return (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleFormChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleFormChange}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default payment method
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddPaymentMethod}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Payment Method
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
