import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface FirearmAllocationAttributes {
  id: string
  guardId: string
  firearmId: string
  allocationDate: Date
  returnDate?: Date | null
  status: 'active' | 'returned'
  createdAt?: Date
  updatedAt?: Date
}

interface FirearmAllocationCreationAttributes extends Optional<FirearmAllocationAttributes, 'id' | 'returnDate' | 'createdAt' | 'updatedAt'> {}

interface FirearmAllocationInstance extends Model<FirearmAllocationAttributes, FirearmAllocationCreationAttributes>, FirearmAllocationAttributes {}

const FirearmAllocation = sequelize.define<FirearmAllocationInstance>('FirearmAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  guardId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  firearmId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  allocationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'returned'),
    defaultValue: 'active',
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
