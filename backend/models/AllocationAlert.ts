import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface AllocationAlertAttributes {
  id: string
  allocationId: string
  alertType: string
  message: string
  status: 'new' | 'acknowledged' | 'resolved'
  createdAt?: Date
  updatedAt?: Date
}

interface AllocationAlertCreationAttributes extends Optional<AllocationAlertAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface AllocationAlertInstance extends Model<AllocationAlertAttributes, AllocationAlertCreationAttributes>, AllocationAlertAttributes {}

const AllocationAlert = sequelize.define<AllocationAlertInstance>('AllocationAlert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  allocationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  alertType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'acknowledged', 'resolved'),
    defaultValue: 'new',
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
  tableName: 'allocation_alerts',
  timestamps: true,
})

export default AllocationAlert
