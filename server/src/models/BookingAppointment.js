import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const BookingAppointment = sequelize.define('BookingAppointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  availabilitySlotId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  meetingType: {
    type: DataTypes.ENUM('in-person', 'zoom', 'google-meet', 'phone'),
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'cancelled', 'completed'),
    defaultValue: 'scheduled'
  }
}, {
  timestamps: true
})

export default BookingAppointment
