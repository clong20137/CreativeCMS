import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const BookingAvailabilitySlot = sequelize.define('BookingAvailabilitySlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  locationTypes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['phone', 'zoom', 'google-meet', 'in-person']
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
})

export default BookingAvailabilitySlot
