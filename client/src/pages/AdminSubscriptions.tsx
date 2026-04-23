import { useEffect, useState } from 'react'
import { FiEdit, FiPlus, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi'
import AdminLayout from '../components/AdminLayout'
import { PageSkeleton } from '../components/SkeletonLoaders'
import { adminAPI, subscriptionsAPI } from '../services/api'

const emptyPlanForm = {
  name: '',
  description: '',
  tier: 'starter',
  price: '',
  billingCycle: 'monthly',
  productType: 'service',
  updateChannel: 'stable',
  includedUpdates: true,
  features: '',
  isActive: true
}

export default function AdminSubscriptions() {
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState(emptyPlanForm)
  const [assignment, setAssignment] = useState({ clientId: '', planId: '', renewalDate: '', licensedDomain: '' })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [clientsData, plansData, subscriptionsData, licensesData] = await Promise.all([
        adminAPI.getClients(),
        adminAPI.getSubscriptionPlans(),
        adminAPI.getSubscriptions(),
        adminAPI.getLicenses()
      ])
      setClients(clientsData)
      setPlans(plansData)
      setSubscriptions(subscriptionsData)
      setLicenses(licensesData)
    } catch (err: any) {
      setError(err.error || 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetPlanForm = () => {
    setPlanForm(emptyPlanForm)
    setEditingPlanId(null)
    setShowPlanForm(false)
  }

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...planForm,
        price: Number(planForm.price),
        features: planForm.features
      }

      if (editingPlanId) {
        await adminAPI.updateSubscriptionPlan(editingPlanId, payload)
        setMessage('Subscription plan updated')
      } else {
        await adminAPI.createSubscriptionPlan(payload)
        setMessage('Subscription plan created')
      }

      resetPlanForm()
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to save subscription plan')
    }
  }

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(String(plan.id))
    setPlanForm({
      name: plan.name || '',
      description: plan.description || '',
      tier: plan.tier || 'starter',
      price: String(plan.price || ''),
      billingCycle: plan.billingCycle || 'monthly',
      productType: plan.productType || 'service',
      updateChannel: plan.updateChannel || 'stable',
      includedUpdates: plan.includedUpdates !== false,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      isActive: plan.isActive !== false
    })
    setShowPlanForm(true)
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Delete this subscription plan? Existing client subscriptions will keep their saved plan details.')) return

    try {
      await adminAPI.deleteSubscriptionPlan(id)
      setMessage('Subscription plan deleted')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to delete subscription plan')
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await adminAPI.assignSubscription(assignment)
      setMessage(result?.type === 'license' ? 'CMS license assigned to client' : 'Subscription assigned to client')
      setAssignment({ clientId: '', planId: '', renewalDate: '', licensedDomain: '' })
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to assign subscription')
    }
  }

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('Cancel this client subscription?')) return

    try {
      await subscriptionsAPI.cancelSubscription(id)
      setMessage('Subscription cancelled')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to cancel subscription')
    }
  }

  const handleCancelLicense = async (id: string) => {
    if (!confirm('Cancel this CMS license?')) return

    try {
      await adminAPI.cancelLicense(id)
      setMessage('CMS license cancelled')
      fetchData()
    } catch (err: any) {
      setError(err.error || 'Failed to cancel license')
    }
  }

  const servicePlans = plans.filter((plan) => plan.productType !== 'cms-license')
  const licensePlans = plans.filter((plan) => plan.productType === 'cms-license')
  const selectedPlan = plans.find((plan) => String(plan.id) === assignment.planId)

  return (
    <AdminLayout title="Subscriptions">
      {message && <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 md:mb-6">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-400 bg-red-100 p-4 text-sm text-red-700 md:mb-6">{error}</div>}

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-6 pb-28 md:space-y-10">
          <section>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Subscription Plans</h2>
                <p className="text-sm text-gray-600 md:text-base">Manage the plans clients can be assigned to.</p>
              </div>
              <button
                onClick={() => {
                  setShowPlanForm(true)
                  setEditingPlanId(null)
                  setPlanForm(emptyPlanForm)
                }}
                className="inline-flex items-center gap-2 btn-primary"
              >
                <FiPlus /> Add Plan
              </button>
            </div>

            {showPlanForm && (
              <form onSubmit={handlePlanSubmit} className="card mb-6 space-y-4 p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Plan name"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={planForm.tier}
                    onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={planForm.productType}
                    onChange={(e) => setPlanForm({ ...planForm, productType: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="service">Service Plan</option>
                    <option value="cms-license">CMS License</option>
                  </select>
                  <select
                    value={planForm.updateChannel}
                    onChange={(e) => setPlanForm({ ...planForm, updateChannel: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="stable">Stable Updates</option>
                    <option value="early-access">Early Access</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={planForm.includedUpdates}
                      onChange={(e) => setPlanForm({ ...planForm, includedUpdates: e.target.checked })}
                    />
                    Includes updates
                  </label>
                </div>
                <textarea
                  placeholder="Description"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={2}
                />
                <textarea
                  placeholder="Features, one per line"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows={4}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  />
                  Active plan
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    {editingPlanId ? 'Save Plan' : 'Create Plan'}
                  </button>
                  <button type="button" onClick={resetPlanForm} className="btn-secondary w-full sm:w-auto">
                    <FiX className="inline mr-1" /> Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="card p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{plan.tier} / {plan.billingCycle}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {plan.productType === 'cms-license' ? 'CMS License' : 'Service Plan'} / {plan.updateChannel === 'early-access' ? 'Early Access' : 'Stable'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-3">${Number(plan.price || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mb-4">{plan.description || 'No description'}</p>
                  <ul className="space-y-2 mb-6">
                    {(plan.features || []).map((feature: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">- {feature}</li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => handleEditPlan(plan)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200">
                      <FiEdit /> Edit
                    </button>
                    <button onClick={() => handleDeletePlan(String(plan.id))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200">
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {plans.length === 0 && <div className="card p-8 text-center text-gray-600 lg:col-span-3">No subscription plans yet.</div>}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <form onSubmit={handleAssign} className="card space-y-4 p-4 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Assign to Client</h2>
              <select
                value={assignment.clientId}
                onChange={(e) => setAssignment({ ...assignment, clientId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                ))}
              </select>
              <select
                value={assignment.planId}
                onChange={(e) => setAssignment({ ...assignment, planId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select plan</option>
                {plans.filter(plan => plan.isActive !== false).map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} - ${Number(plan.price || 0).toLocaleString()} ({plan.productType === 'cms-license' ? 'CMS License' : 'Service'})</option>
                ))}
              </select>
              {selectedPlan?.productType === 'cms-license' && (
                <input
                  type="text"
                  value={assignment.licensedDomain}
                  onChange={(e) => setAssignment({ ...assignment, licensedDomain: e.target.value })}
                  placeholder="Licensed domain, for example clientsite.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}
              <input
                type="date"
                value={assignment.renewalDate}
                onChange={(e) => setAssignment({ ...assignment, renewalDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button type="submit" className="inline-flex items-center justify-center gap-2 w-full btn-primary">
                <FiUserPlus /> {selectedPlan?.productType === 'cms-license' ? 'Assign CMS License' : 'Assign Subscription'}
              </button>
            </form>

            <div className="lg:col-span-2">
              <div className="space-y-3 md:hidden">
                {subscriptions.map((subscription) => (
                  <article key={subscription.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{subscription.User?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{subscription.planName}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">{subscription.status}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-semibold text-gray-900">{subscription.productType === 'cms-license' ? 'CMS License' : 'Service'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Renewal</p>
                        <p className="font-semibold text-gray-900">{subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Billing</p>
                        <p className="font-semibold text-gray-900">${Number(subscription.price || 0).toLocaleString()} / {subscription.billingCycle}</p>
                      </div>
                    </div>
                    {subscription.status === 'active' && (
                      <button onClick={() => handleCancelSubscription(String(subscription.id))} className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-700 hover:bg-red-200">
                        Cancel
                      </button>
                    )}
                  </article>
                ))}
                {subscriptions.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-gray-600 shadow-sm">No client subscriptions yet.</div>}
              </div>

              <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
              <table className="w-full">
                <thead>
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plan</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Renewal</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700">{subscription.User?.name || 'Unknown'}</td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-gray-900">{subscription.planName}</p>
                        <p className="text-sm text-gray-600">${Number(subscription.price || 0).toLocaleString()} / {subscription.billingCycle}</p>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{subscription.productType === 'cms-license' ? 'CMS License' : 'Service'}</p>
                          {subscription.productType === 'cms-license' && subscription.licenseKey && (
                            <p className="font-mono text-xs text-gray-500">{subscription.licenseKey}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 capitalize">{subscription.status}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {subscription.status === 'active' && (
                          <button onClick={() => handleCancelSubscription(String(subscription.id))} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-600">No client subscriptions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="card p-4 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Service Plans</h2>
              <p className="mt-2 text-sm text-gray-600">These plans power normal recurring services and do not control CMS access.</p>
              <div className="mt-4 space-y-3">
                {servicePlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-600">{plan.billingCycle} / ${Number(plan.price || 0).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Service</span>
                    </div>
                  </div>
                ))}
                {servicePlans.length === 0 && (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No service plans yet.</p>
                )}
              </div>
            </div>

            <div className="card p-4 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">CMS License Plans</h2>
              <p className="mt-2 text-sm text-gray-600">These unlock the CMS itself and are tracked separately from service subscriptions.</p>
              <div className="mt-4 space-y-3">
                {licensePlans.map((plan) => (
                  <div key={plan.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-600">{plan.billingCycle} / ${Number(plan.price || 0).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">CMS License</span>
                    </div>
                  </div>
                ))}
                {licensePlans.length === 0 && (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No CMS license plans yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr,1.6fr] xl:gap-6">
            <div className="card space-y-4 p-4 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">CMS Licenses</h2>
              <p className="text-sm text-gray-600">
                Active CMS licenses unlock the full client-side CMS experience, separately from service subscriptions.
              </p>
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
                Assigning a CMS license now creates a dedicated license record for the account. Service subscriptions stay separate.
              </div>
            </div>

            <div>
              <div className="space-y-3 md:hidden">
                {licenses.map((license) => (
                  <article key={license.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{license.User?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{license.planName}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-700">{license.status}</span>
                    </div>
                    <p className="mt-3 break-all font-mono text-xs text-gray-500">{license.licenseKey}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Domain</p>
                        <p className="font-semibold text-gray-900">{license.licensedDomain || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Renewal</p>
                        <p className="font-semibold text-gray-900">{license.renewalDate ? new Date(license.renewalDate).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                    {license.status === 'active' && (
                      <button onClick={() => handleCancelLicense(String(license.id))} className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-700 hover:bg-red-200">
                        Cancel
                      </button>
                    )}
                  </article>
                ))}
                {licenses.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-gray-600 shadow-sm">No CMS licenses assigned yet.</div>}
              </div>

              <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">License</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Domain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Renewal</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => (
                    <tr key={license.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700">{license.User?.name || 'Unknown'}</td>
                      <td className="px-6 py-3">
                        <p className="font-semibold text-gray-900">{license.planName}</p>
                        <p className="font-mono text-xs text-gray-500">{license.licenseKey}</p>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{license.licensedDomain || '-'}</td>
                      <td className="px-6 py-3 text-sm capitalize text-gray-700">{license.status}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {license.renewalDate ? new Date(license.renewalDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {license.status === 'active' && (
                          <button onClick={() => handleCancelLicense(String(license.id))} className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {licenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-600">No CMS licenses assigned yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}
