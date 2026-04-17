import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const ProtectedContentItem = sequelize.define('ProtectedContentItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contentType: {
    type: DataTypes.ENUM('image', 'video', 'document'),
    defaultValue: 'video'
  },
  previewImage: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  contentUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  mediaAssetId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  buttonLabel: {
    type: DataTypes.STRING,
    defaultValue: 'Unlock Access'
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

export default ProtectedContentItem
