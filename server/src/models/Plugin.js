import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Plugin = sequelize.define('Plugin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Business'
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPurchased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  demoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
})

export default Plugin
