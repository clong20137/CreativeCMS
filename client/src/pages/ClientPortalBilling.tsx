import { useState, useCallback, useEffect } from 'react'
import { FiDownload, FiCreditCard, FiRefreshCw, FiX } from 'react-icons/fi'
import { invoicesAPI, subscriptionsAPI } from '../services/api'
import { PageSkeleton } from '../components/SkeletonLoaders'

export default function ClientPortalBilling() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const clientId = localStorage.getItem('userId') || ''

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [invoicesData, subData] = await Promise.all([
        invoicesAPI.getClientInvoices(clientId),
        subscriptionsAPI.getClientSubscription(clientId)
      ])
      setInvoices(invoicesData)
      setSubscription(subData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const session = await invoicesAPI.createCheckoutSession(invoiceId)
      if (session.url) {
        window.location.href = session.url
      }
    } catch (error: any) {
      console.error('Error starting payment:', error)
      alert(error.error || 'Payment processing is not configured yet')
    }
  }

  const downloadInvoice = (invoiceId: string) => {
    window.open(invoicesAPI.getDownloadUrl(invoiceId), '_blank')
  }

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await subscriptionsAPI.cancelSubscription(String(subscription.id))
        fetchData()
      } catch (error) {
        console.error('Error canceling subscription:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        {/* Subscription Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Subscription</h2>
          {loading ? (
            <PageSkeleton />
          ) : subscription ? (
            <div className="card p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Plan</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{subscription.tier}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Billing Cycle</p>
                  <p className="text-2xl font-bold text-gray-900">${subscription.price}/{subscription.billingCycle}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
              </div>

              <div className="mt-8 border-t pt-8">
                <h3 className="font-bold text-gray-900 mb-4">Included Features:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subscription.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center gap-2 btn-primary"
                >
                  <FiRefreshCw /> Upgrade Plan
                </button>
                {subscription.status === 'active' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="flex items-center gap-2 btn-secondary"
                  >
                    <FiX /> Cancel Subscription
                  </button>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p>Next renewal date: <strong>{new Date(subscription.renewalDate).toLocaleDateString()}</strong></p>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600 mb-4">You don't have an active subscription</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="btn-primary"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Invoices Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoices & Billing</h2>
          {loading ? (
            <PageSkeleton />
          ) : invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="card p-6 flex items-center justify-between hover:shadow-lg transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Issued: {new Date(invoice.issueDate).toLocaleDateString()} | Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right mr-6">
                    <p className="text-2xl font-bold text-gray-900">${invoice.total.toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadInvoice(String(invoice.id))}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      <FiDownload size={20} />
                    </button>
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => handlePayInvoice(String(invoice.id))}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <FiCreditCard size={16} /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600">No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { name: 'Starter', price: 1500, features: ['5 Projects', 'Basic Support'] },
                { name: 'Professional', price: 3500, features: ['Unlimited Projects', 'Priority Support'] },
                { name: 'Enterprise', price: 7500, features: ['Everything', 'Dedicated Support'] }
              ].map((plan, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">{plan.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-4">${plan.price}</p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f, j) => (
                      <li key={j} className="text-sm text-gray-600">✓ {f}</li>
                    ))}
                  </ul>
                  <button className="w-full btn-primary text-sm">Select</button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
