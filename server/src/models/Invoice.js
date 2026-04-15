import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Projects',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'draft'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  paidDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  terms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stripeCheckoutSessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
})

export default Invoice
