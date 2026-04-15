import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const RestaurantMenuItem = sequelize.define('RestaurantMenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    defaultValue: 'Entrees'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  image: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  isAvailable: {
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

export default RestaurantMenuItem
