-- Create Database
CREATE DATABASE IF NOT EXISTS creative_portfolio;
USE creative_portfolio;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zipCode VARCHAR(20),
  country VARCHAR(100),
  role ENUM('admin', 'client') DEFAULT 'client',
  avatar VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  emailNotifications BOOLEAN DEFAULT true,
  invoiceReminders BOOLEAN DEFAULT true,
  marketingEmails BOOLEAN DEFAULT false,
  privacyLevel VARCHAR(50) DEFAULT 'public',
  twoFactorEnabled BOOLEAN DEFAULT false,
  twoFactorCode VARCHAR(20),
  twoFactorExpires DATETIME,
  twoFactorMethod ENUM('email', 'app') DEFAULT 'email',
  twoFactorSecret VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS Projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  category ENUM('web-design', 'photography', 'videography', 'branding') NOT NULL,
  status ENUM('pending', 'in-progress', 'completed', 'on-hold') DEFAULT 'pending',
  progress INT DEFAULT 0,
  startDate DATE,
  dueDate DATE,
  budget DECIMAL(10, 2),
  spent DECIMAL(10, 2) DEFAULT 0,
  attachments JSON,
  notes LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS Invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceNumber VARCHAR(255) UNIQUE NOT NULL,
  clientId INT NOT NULL,
  projectId INT,
  items JSON NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  dueDate DATE,
  issueDate DATE NOT NULL,
  paidDate DATE,
  notes LONGTEXT,
  terms LONGTEXT,
  stripeCheckoutSessionId VARCHAR(255),
  stripePaymentIntentId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE SET NULL
);

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS SubscriptionPlans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  tier ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter',
  price DECIMAL(10, 2) NOT NULL,
  billingCycle ENUM('monthly', 'quarterly', 'annually') DEFAULT 'monthly',
  features JSON,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- A La Carte Service Packages Table
CREATE TABLE IF NOT EXISTS ServicePackages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service VARCHAR(255) NOT NULL,
  description LONGTEXT,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(255) DEFAULT 'project',
  isActive BOOLEAN DEFAULT true,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Public Portfolio Items Table
CREATE TABLE IF NOT EXISTS PortfolioItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category ENUM('web-design', 'photography', 'videography', 'branding') NOT NULL,
  image LONGTEXT,
  description LONGTEXT,
  projectUrl VARCHAR(500),
  isPublished BOOLEAN DEFAULT true,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional Website Plugins Table
CREATE TABLE IF NOT EXISTS Plugins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  category VARCHAR(255) DEFAULT 'Business',
  price DECIMAL(10, 2) DEFAULT 0,
  isEnabled BOOLEAN DEFAULT false,
  isPurchased BOOLEAN DEFAULT false,
  demoUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Restaurant Menu Plugin Items Table
CREATE TABLE IF NOT EXISTS RestaurantMenuItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  category VARCHAR(255) DEFAULT 'Entrees',
  price DECIMAL(10, 2) NOT NULL,
  image LONGTEXT,
  isAvailable BOOLEAN DEFAULT true,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Real Estate Plugin Listings Table
CREATE TABLE IF NOT EXISTS RealEstateListings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  description LONGTEXT,
  price DECIMAL(12, 2) NOT NULL,
  image LONGTEXT,
  moreInfoUrl VARCHAR(500),
  isActive BOOLEAN DEFAULT true,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Client Plugin Purchases Table
CREATE TABLE IF NOT EXISTS ClientPluginPurchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  pluginId INT NOT NULL,
  pluginSlug VARCHAR(255) NOT NULL,
  pluginName VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  status ENUM('pending', 'active', 'cancelled') DEFAULT 'pending',
  stripeCheckoutSessionId VARCHAR(255),
  stripePaymentIntentId VARCHAR(255),
  purchasedAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (pluginId) REFERENCES Plugins(id) ON DELETE CASCADE
);

-- Booking Plugin Availability Slots Table
CREATE TABLE IF NOT EXISTS BookingAvailabilitySlots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  startTime VARCHAR(20) NOT NULL,
  endTime VARCHAR(20) NOT NULL,
  locationTypes JSON,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Booking Plugin Appointments Table
CREATE TABLE IF NOT EXISTS BookingAppointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  availabilitySlotId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  meetingType ENUM('in-person', 'zoom', 'google-meet', 'phone') NOT NULL,
  notes LONGTEXT,
  status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (availabilitySlotId) REFERENCES BookingAvailabilitySlots(id) ON DELETE CASCADE
);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS SiteSettings (
  id INT PRIMARY KEY DEFAULT 1,
  siteName VARCHAR(255) DEFAULT 'Creative by Caleb',
  faviconUrl LONGTEXT,
  logoUrl LONGTEXT,
  logoSize INT DEFAULT 40,
  contactEmail VARCHAR(255) DEFAULT 'hello@creativestudio.com',
  phone VARCHAR(255) DEFAULT '+1 (555) 123-4567',
  hours VARCHAR(255) DEFAULT 'Mon-Fri, 9am-6pm EST',
  locationLine1 VARCHAR(255) DEFAULT '123 Creative Street',
  locationLine2 VARCHAR(255) DEFAULT 'New York, NY 10001',
  footerDescription LONGTEXT,
  heroTitle VARCHAR(255) DEFAULT 'Transform Your Vision Into Reality',
  heroSubtitle LONGTEXT,
  heroPrimaryLabel VARCHAR(255) DEFAULT 'Start a Project',
  heroPrimaryUrl VARCHAR(500) DEFAULT '/contact',
  heroSecondaryLabel VARCHAR(255) DEFAULT 'View Our Work',
  heroSecondaryUrl VARCHAR(500) DEFAULT '/portfolio',
  heroMediaType ENUM('none', 'image', 'video') DEFAULT 'none',
  heroMediaUrl LONGTEXT,
  facebookUrl VARCHAR(500),
  instagramUrl VARCHAR(500),
  twitterUrl VARCHAR(500),
  linkedinUrl VARCHAR(500),
  whatWeDo JSON,
  webDesignPackages JSON,
  services JSON,
  featuredWork JSON,
  faqs JSON,
  testimonials JSON,
  googleReviewsEnabled BOOLEAN DEFAULT false,
  googlePlaceId VARCHAR(255),
  googleApiKey VARCHAR(255),
  stripePublishableKey VARCHAR(500),
  stripeSecretKey VARCHAR(500),
  stripeWebhookSecret VARCHAR(500),
  bankName VARCHAR(255),
  bankAccountLast4 VARCHAR(20),
  payoutInstructions LONGTEXT,
  turnstileSiteKey VARCHAR(500),
  turnstileSecretKey VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS ContactMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  company VARCHAR(255),
  service VARCHAR(255),
  message LONGTEXT NOT NULL,
  status ENUM('new', 'read', 'archived') DEFAULT 'new',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS Subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  planId INT,
  planName VARCHAR(255),
  tier ENUM('starter', 'professional', 'enterprise') NOT NULL,
  status ENUM('active', 'cancelled', 'suspended', 'expired') DEFAULT 'active',
  price DECIMAL(10, 2) NOT NULL,
  billingCycle ENUM('monthly', 'quarterly', 'annually') DEFAULT 'monthly',
  startDate DATE NOT NULL,
  renewalDate DATE NOT NULL,
  endDate DATE,
  autoRenew BOOLEAN DEFAULT true,
  features JSON,
  paymentMethod VARCHAR(255),
  stripeSubscriptionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (planId) REFERENCES SubscriptionPlans(id) ON DELETE SET NULL
);

-- Create Indexes for Better Performance
CREATE INDEX idx_projects_clientId ON Projects(clientId);
CREATE INDEX idx_invoices_clientId ON Invoices(clientId);
CREATE INDEX idx_invoices_projectId ON Invoices(projectId);
CREATE INDEX idx_invoices_status ON Invoices(status);
CREATE INDEX idx_subscriptions_clientId ON Subscriptions(clientId);
CREATE INDEX idx_subscriptions_planId ON Subscriptions(planId);
CREATE INDEX idx_subscriptions_status ON Subscriptions(status);
CREATE INDEX idx_subscription_plans_active ON SubscriptionPlans(isActive);
CREATE INDEX idx_service_packages_active ON ServicePackages(isActive);
CREATE INDEX idx_portfolio_items_published ON PortfolioItems(isPublished);
CREATE INDEX idx_portfolio_items_category ON PortfolioItems(category);
CREATE INDEX idx_plugins_slug ON Plugins(slug);
CREATE INDEX idx_plugins_enabled ON Plugins(isEnabled);
CREATE INDEX idx_restaurant_menu_category ON RestaurantMenuItems(category);
CREATE INDEX idx_restaurant_menu_available ON RestaurantMenuItems(isAvailable);
CREATE INDEX idx_real_estate_active ON RealEstateListings(isActive);
CREATE INDEX idx_real_estate_sort ON RealEstateListings(sortOrder);
CREATE INDEX idx_client_plugin_client ON ClientPluginPurchases(clientId);
CREATE INDEX idx_client_plugin_slug ON ClientPluginPurchases(pluginSlug);
CREATE INDEX idx_booking_slots_date ON BookingAvailabilitySlots(date);
CREATE INDEX idx_booking_appointments_slot ON BookingAppointments(availabilitySlotId);

-- Sample Admin User (Password: admin123 - hashed with bcryptjs)
INSERT INTO Users (name, email, password, role, company, isActive)
VALUES ('Admin', 'admin@creative.com', '$2a$10$YourHashedPasswordHere', 'admin', 'Creative by Caleb', true)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

INSERT INTO Plugins (slug, name, description, category, price, isEnabled, isPurchased, demoUrl)
VALUES (
  'restaurant-menu',
  'Restaurant Menu',
  'Create menu categories, item photos, descriptions, and prices for a restaurant website.',
  'Restaurant',
  299.00,
  true,
  true,
  '/plugins/restaurant'
)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

INSERT INTO Plugins (slug, name, description, category, price, isEnabled, isPurchased, demoUrl)
VALUES (
  'booking-appointments',
  'Booking Appointments',
  'Let visitors book appointments from available time slots for in-person, Zoom, Google Meet, or phone calls.',
  'Scheduling',
  349.00,
  true,
  true,
  '/plugins/booking'
)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);

INSERT INTO Plugins (slug, name, description, category, price, isEnabled, isPurchased, demoUrl)
VALUES (
  'real-estate-listings',
  'Real Estate Listings',
  'Add property listings with photos, prices, descriptions, and more information buttons.',
  'Real Estate',
  399.00,
  true,
  true,
  '/plugins/real-estate'
)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
