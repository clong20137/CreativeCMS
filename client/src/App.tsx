import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import { resolveAssetUrl, siteSettingsAPI } from './services/api'
import { applyThemeSettings } from './utils/theme'

const Home = lazy(() => import('./pages/Home'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const PortfolioDetail = lazy(() => import('./pages/PortfolioDetail'))
const Services = lazy(() => import('./pages/Services'))
const Pricing = lazy(() => import('./pages/Pricing'))
const Contact = lazy(() => import('./pages/Contact'))
const Plugins = lazy(() => import('./pages/Plugins'))
const RestaurantPluginDemo = lazy(() => import('./pages/RestaurantPluginDemo'))
const RealEstatePluginDemo = lazy(() => import('./pages/RealEstatePluginDemo'))
const RealEstateListingDetail = lazy(() => import('./pages/RealEstateListingDetail'))
const BookingPluginDemo = lazy(() => import('./pages/BookingPluginDemo'))
const EventsPluginDemo = lazy(() => import('./pages/EventsPluginDemo'))
const ProtectedContentPluginDemo = lazy(() => import('./pages/ProtectedContentPluginDemo'))
const CRMPluginDemo = lazy(() => import('./pages/CRMPluginDemo'))
const RestaurantSiteDemo = lazy(() => import('./pages/RestaurantSiteDemo'))
const TowingTransportSiteDemo = lazy(() => import('./pages/TowingTransportSiteDemo'))
const BarbershopSiteDemo = lazy(() => import('./pages/BarbershopSiteDemo'))
const RealEstateSiteDemo = lazy(() => import('./pages/RealEstateSiteDemo'))
const ElectricianSiteDemo = lazy(() => import('./pages/ElectricianSiteDemo'))
const MowingBusinessSiteDemo = lazy(() => import('./pages/MowingBusinessSiteDemo'))
const Login = lazy(() => import('./pages/Login'))
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))
const ClientPortalBilling = lazy(() => import('./pages/ClientPortalBilling'))
const ClientPortalLicense = lazy(() => import('./pages/ClientPortalLicense'))
const ClientPortalPlugins = lazy(() => import('./pages/ClientPortalPlugins'))
const ClientPortalSettings = lazy(() => import('./pages/ClientPortalSettings'))
const ClientTickets = lazy(() => import('./pages/ClientTickets'))
const ClientPortalUpdates = lazy(() => import('./pages/ClientPortalUpdates'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminClients = lazy(() => import('./pages/AdminClients'))
const AdminProjects = lazy(() => import('./pages/AdminProjects'))
const AdminInvoices = lazy(() => import('./pages/AdminInvoices'))
const AdminSubscriptions = lazy(() => import('./pages/AdminSubscriptions'))
const AdminServices = lazy(() => import('./pages/AdminServices'))
const AdminPortfolio = lazy(() => import('./pages/AdminPortfolio'))
const AdminPages = lazy(() => import('./pages/AdminPages'))
const AdminNavigation = lazy(() => import('./pages/AdminNavigation'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminTickets = lazy(() => import('./pages/AdminTickets'))
const AdminMessages = lazy(() => import('./pages/AdminMessages'))
const AdminPlugins = lazy(() => import('./pages/AdminPlugins'))
const AdminPluginDetail = lazy(() => import('./pages/AdminPluginDetail'))
const AdminSiteDemos = lazy(() => import('./pages/AdminSiteDemos'))
const AdminMediaLibrary = lazy(() => import('./pages/AdminMediaLibrary'))
const CustomPage = lazy(() => import('./pages/CustomPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Loading...
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={`flex min-h-screen flex-col ${isAdminRoute ? '' : 'site-theme'}`}>
      {!isAdminRoute && <Navigation />}
      <main className="flex-grow">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/plugins/restaurant" element={<RestaurantPluginDemo />} />
            <Route path="/plugins/real-estate" element={<RealEstatePluginDemo />} />
            <Route path="/plugins/real-estate/:id" element={<RealEstateListingDetail />} />
            <Route path="/plugins/booking" element={<BookingPluginDemo />} />
            <Route path="/plugins/events" element={<EventsPluginDemo />} />
            <Route path="/plugins/protected-content" element={<ProtectedContentPluginDemo />} />
            <Route path="/plugins/crm" element={<CRMPluginDemo />} />
            <Route path="/site-demos/restaurant" element={<RestaurantSiteDemo />} />
            <Route path="/site-demos/towing-transport" element={<TowingTransportSiteDemo />} />
            <Route path="/site-demos/barbershop" element={<BarbershopSiteDemo />} />
            <Route path="/site-demos/real-estate" element={<RealEstateSiteDemo />} />
            <Route path="/site-demos/electrician" element={<ElectricianSiteDemo />} />
            <Route path="/site-demos/mowing-business" element={<MowingBusinessSiteDemo />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/client-dashboard/license" element={<ClientPortalLicense />} />
            <Route path="/client-dashboard/billing" element={<ClientPortalBilling />} />
            <Route path="/client-dashboard/plugins" element={<ClientPortalPlugins />} />
            <Route path="/client-dashboard/updates" element={<ClientPortalUpdates />} />
            <Route path="/client-dashboard/settings" element={<ClientPortalSettings />} />
            <Route path="/client-dashboard/tickets" element={<ClientTickets />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/portfolio" element={<AdminPortfolio />} />
            <Route path="/admin/pages" element={<AdminPages />} />
            <Route path="/admin/navigation" element={<AdminNavigation />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/plugins" element={<AdminPlugins />} />
            <Route path="/admin/plugins/:slug" element={<AdminPluginDetail />} />
            <Route path="/admin/site-demos" element={<AdminSiteDemos />} />
            <Route path="/admin/media" element={<AdminMediaLibrary />} />
            <Route path="/:slug" element={<CustomPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  )
}

function App() {
  useEffect(() => {
    const applySettings = async () => {
      try {
        const settings = await siteSettingsAPI.getSettings()
        applyThemeSettings(settings)
        if (settings.faviconUrl) {
          let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
          if (!favicon) {
            favicon = document.createElement('link')
            favicon.rel = 'icon'
            document.head.appendChild(favicon)
          }
          favicon.href = resolveAssetUrl(settings.faviconUrl)
        }
      } catch (error) {
        console.error('Error loading site settings:', error)
      }
    }

    applySettings()
  }, [])

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
