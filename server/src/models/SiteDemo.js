import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const SiteDemo = sequelize.define('SiteDemo', {
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
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Business'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  previewImage: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  demoUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
})

export default SiteDemo
