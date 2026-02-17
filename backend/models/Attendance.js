import { DataTypes } from 'sequelize'
import sequelize from '../database/config.js'
import User from './User.js'

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    defaultValue: 'absent',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'attendance',
  timestamps: false,
})

export default Attendance
