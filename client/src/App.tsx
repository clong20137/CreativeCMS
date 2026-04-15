import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import PortfolioDetail from './pages/PortfolioDetail'
import Services from './pages/Services'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import Login from './pages/Login'
import ClientDashboard from './pages/ClientDashboard'
import ClientPortalBilling from './pages/ClientPortalBilling'
import ClientPortalSettings from './pages/ClientPortalSettings'
import AdminDashboard from './pages/AdminDashboard'
import AdminClients from './pages/AdminClients'
import AdminProjects from './pages/AdminProjects'
import AdminInvoices from './pages/AdminInvoices'
import AdminSubscriptions from './pages/AdminSubscriptions'
import AdminServices from './pages/AdminServices'
import AdminPortfolio from './pages/AdminPortfolio'
import AdminSettings from './pages/AdminSettings'
import AdminTickets from './pages/AdminTickets'
import AdminMessages from './pages/AdminMessages'
import ClientTickets from './pages/ClientTickets'
import NotFound from './pages/NotFound'
import { siteSettingsAPI } from './services/api'

function App() {
  useEffect(() => {
    const applySettings = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        if (settings.faviconUrl) {
          let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
          if (!favicon) {
            favicon = document.createElement('link')
            favicon.rel = 'icon'
            document.head.appendChild(favicon)
          }
          favicon.href = settings.faviconUrl
        }
      } catch (error) {
        console.error('Error loading site settings:', error)
      }
    }

    applySettings()
  }, [])

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-dashboard/billing" element={<ClientPortalBilling />} />
            <Route path="/client-dashboard/settings" element={<ClientPortalSettings />} />
            <Route path="/client-dashboard/tickets" element={<ClientTickets />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/portfolio" element={<AdminPortfolio />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
