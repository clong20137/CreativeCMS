import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Services from './pages/Services'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import Login from './pages/Login'
import ClientDashboard from './pages/ClientDashboard'
import ClientPortalBilling from './pages/ClientPortalBilling'
import ClientPortalPaymentMethods from './pages/ClientPortalPaymentMethods'
import ClientPortalSettings from './pages/ClientPortalSettings'
import AdminDashboard from './pages/AdminDashboard'
import AdminClients from './pages/AdminClients'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-dashboard/billing" element={<ClientPortalBilling />} />
            <Route path="/client-dashboard/payment-methods" element={<ClientPortalPaymentMethods />} />
            <Route path="/client-dashboard/settings" element={<ClientPortalSettings />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
