import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const ClientPluginPurchase = sequelize.define('ClientPluginPurchase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pluginId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pluginSlug: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pluginName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'cancelled'),
    defaultValue: 'pending'
  },
  stripeCheckoutSessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  purchasedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
})

export default ClientPluginPurchase
