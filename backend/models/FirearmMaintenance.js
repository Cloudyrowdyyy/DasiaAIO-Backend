import { DataTypes } from 'sequelize'
import sequelize from '../database/config.js'
import Firearm from './Firearm.js'

const FirearmMaintenance = sequelize.define('FirearmMaintenance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firearmId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Firearm, key: 'id' },
  },
  maintenanceDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  maintenanceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  technician: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'in_progress'),
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'firearm_maintenance',
  timestamps: false,
})

export default FirearmMaintenance
