import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const ASSET_BASE_URL = API_URL.replace(/\/api\/?$/, '')

export function resolveAssetUrl(url?: string | null) {
  if (!url) return ''
  const value = String(url)
  if (value.startsWith('data:') || value.startsWith('blob:')) return value

  if (value.startsWith('/api/uploads/')) {
    return `${ASSET_BASE_URL}${value}`
  }

  if (value.startsWith('api/uploads/')) {
    return `${ASSET_BASE_URL}/${value}`
  }

  if (value.startsWith('/uploads/')) {
    return `${API_URL}${value}`
  }

  if (value.startsWith('uploads/')) {
    return `${API_URL}/${value}`
  }

  try {
    const parsed = new URL(value)
    const isLocalUpload = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname) && parsed.pathname.startsWith('/uploads/')
    if (isLocalUpload) {
      return `${API_URL}${parsed.pathname}`
    }
  } catch (error) {
    return value
  }

  return value
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 413) {
      return Promise.reject({
        error: 'This save is too large. Use smaller images or hosted image URLs, then try again.'
      })
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userEmail')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

const unwrap = async <T = any>(request: Promise<{ data: T }>) => {
  const response = await request
  return response.data
}

// Auth API
export const authAPI = {
  register: (data: any) => unwrap(api.post('/auth/register', data)),
  login: (data: any) => unwrap(api.post('/auth/login', data)),
  verifyTwoFactor: (data: any) => unwrap(api.post('/auth/verify-2fa', data)),
  forgotPassword: (data: any) => unwrap(api.post('/auth/forgot-password', data)),
  resetPassword: (data: any) => unwrap(api.post('/auth/reset-password', data)),
  getMe: () => unwrap(api.get('/auth/me'))
}

// Projects API
export const projectsAPI = {
  getClientProjects: (clientId: string) => unwrap<any[]>(api.get(`/projects/client/${clientId}`)),
  getProject: (id: string) => unwrap(api.get(`/projects/${id}`)),
  createProject: (data: any) => unwrap(api.post('/projects', data)),
  updateProject: (id: string, data: any) => unwrap(api.put(`/projects/${id}`, data)),
  deleteProject: (id: string) => unwrap(api.delete(`/projects/${id}`))
}

// Invoices API
export const invoicesAPI = {
  getClientInvoices: (clientId: string) => unwrap<any[]>(api.get(`/invoices/client/${clientId}`)),
  getInvoice: (id: string) => unwrap(api.get(`/invoices/${id}`)),
  createInvoice: (data: any) => unwrap(api.post('/invoices', data)),
  updateInvoice: (id: string, data: any) => unwrap(api.put(`/invoices/${id}`, data)),
  payInvoice: (id: string) => unwrap(api.put(`/invoices/${id}/pay`)),
  deleteInvoice: (id: string) => unwrap(api.delete(`/invoices/${id}`)),
  sendInvoice: (id: string) => unwrap(api.post(`/invoices/${id}/send`)),
  createCheckoutSession: (id: string) => unwrap(api.post(`/invoices/${id}/checkout-session`)),
  getDownloadUrl: (id: string) => `${API_URL}/invoices/${id}/download`
}

// Subscriptions API
export const subscriptionsAPI = {
  getClientSubscription: (clientId: string) => unwrap(api.get(`/subscriptions/client/${clientId}`)),
  getSubscription: (id: string) => unwrap(api.get(`/subscriptions/${id}`)),
  createSubscription: (data: any) => unwrap(api.post('/subscriptions', data)),
  updateSubscription: (id: string, data: any) => unwrap(api.put(`/subscriptions/${id}`, data)),
  cancelSubscription: (id: string) => unwrap(api.put(`/subscriptions/${id}/cancel`)),
  deleteSubscription: (id: string) => unwrap(api.delete(`/subscriptions/${id}`))
}

// Portfolio API
export const portfolioAPI = {
  getPortfolio: () => unwrap<any[]>(api.get('/portfolio')),
  getPortfolioByCategory: (category: string) => unwrap(api.get(`/portfolio/category/${category}`)),
  getPortfolioItem: (id: string) => unwrap(api.get(`/portfolio/${id}`))
}

export const servicePackagesAPI = {
  getServices: () => unwrap<any[]>(api.get('/service-packages'))
}

export const siteSettingsAPI = {
  getSettings: () => unwrap(api.get('/site-settings'))
}

export const customPagesAPI = {
  getPage: (slug: string) => unwrap(api.get(`/pages/${slug}`))
}

export const contactMessagesAPI = {
  createMessage: (data: any) => unwrap(api.post('/contact-messages', data))
}

export const pluginsAPI = {
  getPlugins: () => unwrap<any[]>(api.get('/plugins')),
  getClientPlugins: () => unwrap<any[]>(api.get('/plugins/client')),
  createPluginCheckoutSession: (slug: string) => unwrap<{ url: string }>(api.post(`/plugins/${slug}/checkout-session`)),
  getRestaurantMenu: () => unwrap<{ plugin: any; items: any[] }>(api.get('/plugins/restaurant/menu')),
  getRealEstateListings: () => unwrap<{ plugin: any; listings: any[] }>(api.get('/plugins/real-estate/listings')),
  getRealEstateListing: (id: string) => unwrap<{ plugin: any; listing: any }>(api.get(`/plugins/real-estate/listings/${id}`)),
  getBookingSlots: () => unwrap<{ plugin: any; slots: any[] }>(api.get('/plugins/booking/slots')),
  createBookingAppointment: (data: any) => unwrap(api.post('/plugins/booking/appointments', data)),
  getEvents: () => unwrap<{ plugin: any; events: any[] }>(api.get('/plugins/events')),
  getProtectedContentItems: () => unwrap<{ plugin: any; items: any[] }>(api.get('/plugins/protected-content/items')),
  getProtectedContentItem: (id: string) => unwrap(api.get(`/plugins/protected-content/items/${id}`)),
  createProtectedContentCheckoutSession: (id: string) => unwrap<{ url: string }>(api.post(`/plugins/protected-content/items/${id}/checkout-session`))
}

export const siteDemosAPI = {
  getDemos: () => unwrap<any[]>(api.get('/site-demos')),
  getDemo: (slug: string) => unwrap(api.get(`/site-demos/${slug}`))
}

// Admin API
export const adminAPI = {
  getStats: () => unwrap(api.get('/admin/stats')),
  getNotifications: () => unwrap<{ newMessages: number; newTickets: number; total: number }>(api.get('/admin/notifications')),
  getClients: () => unwrap<any[]>(api.get('/admin/clients')),
  getProjects: () => unwrap<any[]>(api.get('/admin/projects')),
  getInvoices: () => unwrap<any[]>(api.get('/admin/invoices')),
  getSubscriptions: () => unwrap<any[]>(api.get('/admin/subscriptions')),
  getSubscriptionPlans: () => unwrap<any[]>(api.get('/admin/subscription-plans')),
  getMonthlyRevenue: () => unwrap(api.get('/admin/revenue/monthly')),
  createUser: (data: any) => unwrap(api.post('/admin/users', data)),
  updateUser: (id: string, data: any) => unwrap(api.put(`/admin/users/${id}`, data)),
  deleteUser: (id: string) => unwrap(api.delete(`/admin/users/${id}`)),
  createSubscriptionPlan: (data: any) => unwrap(api.post('/admin/subscription-plans', data)),
  updateSubscriptionPlan: (id: string, data: any) => unwrap(api.put(`/admin/subscription-plans/${id}`, data)),
  deleteSubscriptionPlan: (id: string) => unwrap(api.delete(`/admin/subscription-plans/${id}`)),
  assignSubscription: (data: any) => unwrap(api.post('/admin/subscriptions/assign', data)),
  getServicePackages: () => unwrap<any[]>(api.get('/admin/service-packages')),
  createServicePackage: (data: any) => unwrap(api.post('/admin/service-packages', data)),
  updateServicePackage: (id: string, data: any) => unwrap(api.put(`/admin/service-packages/${id}`, data)),
  deleteServicePackage: (id: string) => unwrap(api.delete(`/admin/service-packages/${id}`)),
  getPortfolioItems: () => unwrap<any[]>(api.get('/admin/portfolio-items')),
  createPortfolioItem: (data: any) => unwrap(api.post('/admin/portfolio-items', data)),
  updatePortfolioItem: (id: string, data: any) => unwrap(api.put(`/admin/portfolio-items/${id}`, data)),
  deletePortfolioItem: (id: string) => unwrap(api.delete(`/admin/portfolio-items/${id}`)),
  getPlugins: () => unwrap<any[]>(api.get('/admin/plugins')),
  updatePlugin: (slug: string, data: any) => unwrap(api.put(`/admin/plugins/${slug}`, data)),
  getSiteDemos: () => unwrap<any[]>(api.get('/admin/site-demos')),
  updateSiteDemo: (slug: string, data: any) => unwrap(api.put(`/admin/site-demos/${slug}`, data)),
  getRestaurantMenuItems: () => unwrap<any[]>(api.get('/admin/plugins/restaurant/menu')),
  createRestaurantMenuItem: (data: any) => unwrap(api.post('/admin/plugins/restaurant/menu', data)),
  updateRestaurantMenuItem: (id: string, data: any) => unwrap(api.put(`/admin/plugins/restaurant/menu/${id}`, data)),
  deleteRestaurantMenuItem: (id: string) => unwrap(api.delete(`/admin/plugins/restaurant/menu/${id}`)),
  getRealEstateListings: () => unwrap<any[]>(api.get('/admin/plugins/real-estate/listings')),
  createRealEstateListing: (data: any) => unwrap(api.post('/admin/plugins/real-estate/listings', data)),
  updateRealEstateListing: (id: string, data: any) => unwrap(api.put(`/admin/plugins/real-estate/listings/${id}`, data)),
  deleteRealEstateListing: (id: string) => unwrap(api.delete(`/admin/plugins/real-estate/listings/${id}`)),
  getBookingSlots: () => unwrap<any[]>(api.get('/admin/plugins/booking/slots')),
  createBookingSlot: (data: any) => unwrap(api.post('/admin/plugins/booking/slots', data)),
  updateBookingSlot: (id: string, data: any) => unwrap(api.put(`/admin/plugins/booking/slots/${id}`, data)),
  deleteBookingSlot: (id: string) => unwrap(api.delete(`/admin/plugins/booking/slots/${id}`)),
  getBookingAppointments: () => unwrap<any[]>(api.get('/admin/plugins/booking/appointments')),
  updateBookingAppointment: (id: string, data: any) => unwrap(api.put(`/admin/plugins/booking/appointments/${id}`, data)),
  getEventItems: () => unwrap<any[]>(api.get('/admin/plugins/events/items')),
  createEventItem: (data: any) => unwrap(api.post('/admin/plugins/events/items', data)),
  updateEventItem: (id: string, data: any) => unwrap(api.put(`/admin/plugins/events/items/${id}`, data)),
  deleteEventItem: (id: string) => unwrap(api.delete(`/admin/plugins/events/items/${id}`)),
  getProtectedContentAdminItems: () => unwrap<any[]>(api.get('/admin/plugins/protected-content/items')),
  createProtectedContentAdminItem: (data: any) => unwrap(api.post('/admin/plugins/protected-content/items', data)),
  updateProtectedContentAdminItem: (id: string, data: any) => unwrap(api.put(`/admin/plugins/protected-content/items/${id}`, data)),
  deleteProtectedContentAdminItem: (id: string) => unwrap(api.delete(`/admin/plugins/protected-content/items/${id}`)),
  getPages: () => unwrap<any[]>(api.get('/admin/pages')),
  createPage: (data: any) => unwrap(api.post('/admin/pages', data)),
  updatePage: (id: string, data: any) => unwrap(api.put(`/admin/pages/${id}`, data)),
  deletePage: (id: string) => unwrap(api.delete(`/admin/pages/${id}`)),
  getSiteSettings: () => unwrap(api.get('/admin/site-settings')),
  updateSiteSettings: (data: any) => unwrap(api.put('/admin/site-settings', data)),
  uploadImage: (dataUrl: string) => unwrap<{ url: string }>(api.post('/admin/uploads', { dataUrl })),
  getContactMessages: () => unwrap<any[]>(api.get('/admin/contact-messages')),
  updateContactMessage: (id: string, data: any) => unwrap(api.put(`/admin/contact-messages/${id}`, data)),
  updateTwoFactor: (id: string, enabled: boolean) => unwrap(api.put(`/admin/users/${id}/two-factor`, { enabled })),
  startTwoFactorSetup: (id: string) => unwrap(api.post(`/admin/users/${id}/two-factor/setup`)),
  confirmTwoFactorSetup: (id: string, code: string) => unwrap(api.post(`/admin/users/${id}/two-factor/confirm`, { code }))
}

export const ticketsAPI = {
  getClientTickets: () => unwrap<any[]>(api.get('/tickets/client')),
  createTicket: (data: any) => unwrap(api.post('/tickets', data)),
  getAdminTickets: () => unwrap<any[]>(api.get('/tickets/admin')),
  updateTicket: (id: string, data: any) => unwrap(api.put(`/tickets/${id}`, data))
}

// Users API - Profile Management
export const usersAPI = {
  getProfile: () => unwrap(api.get('/users/profile')),
  updateProfile: (data: any) => unwrap(api.put('/users/profile', data)),
  updateEmail: (data: any) => unwrap(api.put('/users/email', data)),
  changePassword: (data: any) => unwrap(api.put('/users/password', data)),
  updateTwoFactor: (enabled: boolean) => unwrap(api.put('/users/two-factor', { enabled })),
  startTwoFactorSetup: () => unwrap(api.post('/users/two-factor/setup')),
  confirmTwoFactorSetup: (code: string) => unwrap(api.post('/users/two-factor/confirm', { code })),
  getPreferences: () => unwrap(api.get('/users/preferences')),
  updatePreferences: (data: any) => unwrap(api.put('/users/preferences', data))
}

export default api
