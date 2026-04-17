import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const MediaAsset = sequelize.define('MediaAsset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaType: {
    type: DataTypes.ENUM('image', 'video', 'document', 'other'),
    defaultValue: 'other'
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  altText: {
    type: DataTypes.STRING,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  folder: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Uncategorized'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'public'
  }
}, {
  timestamps: true
})

export default MediaAsset
