import { DataTypes } from 'sequelize'
import sequelize from '../database/config.js'
import FirearmAllocation from './FirearmAllocation.js'

const AllocationAlert = sequelize.define('AllocationAlert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  allocationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: FirearmAllocation, key: 'id' },
  },
  alertType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'allocation_alerts',
  timestamps: false,
})

export default AllocationAlert
