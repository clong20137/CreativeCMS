import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
  getPortfolio: () => unwrap(api.get('/portfolio')),
  getPortfolioByCategory: (category: string) => unwrap(api.get(`/portfolio/category/${category}`)),
  getPortfolioItem: (id: string) => unwrap(api.get(`/portfolio/${id}`))
}

// Admin API
export const adminAPI = {
  getStats: () => unwrap(api.get('/admin/stats')),
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
  assignSubscription: (data: any) => unwrap(api.post('/admin/subscriptions/assign', data))
}

// Users API - Profile Management
export const usersAPI = {
  getProfile: () => unwrap(api.get('/users/profile')),
  updateProfile: (data: any) => unwrap(api.put('/users/profile', data)),
  updateEmail: (data: any) => unwrap(api.put('/users/email', data)),
  changePassword: (data: any) => unwrap(api.put('/users/password', data)),
  getPreferences: () => unwrap(api.get('/users/preferences')),
  updatePreferences: (data: any) => unwrap(api.put('/users/preferences', data))
}

// Payment Methods API
export const paymentMethodsAPI = {
  getPaymentMethods: () => unwrap<any[]>(api.get('/payment-methods')),
  addPaymentMethod: (data: any) => unwrap(api.post('/payment-methods', data)),
  updatePaymentMethod: (id: string, data: any) => unwrap(api.put(`/payment-methods/${id}`, data)),
  deletePaymentMethod: (id: string) => unwrap(api.delete(`/payment-methods/${id}`)),
  setDefaultPaymentMethod: (id: string) => unwrap(api.put(`/payment-methods/${id}/default`))
}

export default api
