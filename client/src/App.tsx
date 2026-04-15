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
import AdminDashboard from './pages/AdminDashboard'
import AdminClients from './pages/AdminClients'
import ClientPortalSettings from './pages/ClientPortalSettings'
import ClientPortalPaymentMethods from './pages/ClientPortalPaymentMethods'
import ClientPortalBilling from './pages/ClientPortalBilling'

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
            
            {/* Client Portal Routes */}
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-portal/settings" element={<ClientPortalSettings />} />
            <Route path="/client-portal/payment-methods" element={<ClientPortalPaymentMethods />} />
            <Route path="/client-portal/billing" element={<ClientPortalBilling />} />
            
            {/* Admin Portal Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
