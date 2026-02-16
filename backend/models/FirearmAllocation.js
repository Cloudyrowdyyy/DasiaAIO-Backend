import { DataTypes } from 'sequelize'
import sequelize from '../database/config.js'
import User from './User.js'
import Firearm from './Firearm.js'

const FirearmAllocation = sequelize.define('FirearmAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  guardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  firearmId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Firearm, key: 'id' },
  },
  allocationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('allocated', 'returned', 'lost'),
    defaultValue: 'allocated',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'firearm_allocations',
  timestamps: true,
})

export default FirearmAllocation
