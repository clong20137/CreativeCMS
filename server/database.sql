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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE SET NULL
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS Subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
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
  FOREIGN KEY (clientId) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create Indexes for Better Performance
CREATE INDEX idx_projects_clientId ON Projects(clientId);
CREATE INDEX idx_invoices_clientId ON Invoices(clientId);
CREATE INDEX idx_invoices_projectId ON Invoices(projectId);
CREATE INDEX idx_invoices_status ON Invoices(status);
CREATE INDEX idx_subscriptions_clientId ON Subscriptions(clientId);
CREATE INDEX idx_subscriptions_status ON Subscriptions(status);

-- Sample Admin User (Password: admin123 - hashed with bcryptjs)
INSERT INTO Users (name, email, password, role, company, isActive)
VALUES ('Admin', 'admin@creative.com', '$2a$10$YourHashedPasswordHere', 'admin', 'Creative Studio', true)
ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id);
