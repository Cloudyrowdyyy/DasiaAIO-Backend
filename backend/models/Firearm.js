import { DataTypes } from 'sequelize'
import sequelize from '../database/config.js'

const Firearm = sequelize.define('Firearm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  caliber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastMaintenance: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  maintenanceInterval: {
    type: DataTypes.INTEGER,
    defaultValue: 90,
  },
  status: {
    type: DataTypes.ENUM('available', 'allocated', 'maintenance', 'retired'),
    defaultValue: 'available',
  },
  condition: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
    defaultValue: 'good',
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
  tableName: 'firearms',
  timestamps: true,
})

export default Firearm
