import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface FirearmMaintenanceAttributes {
  id: string
  firearmId: string
  maintenanceDate: Date
  maintenanceType: string
  notes: string
  nextMaintenanceDate?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

interface FirearmMaintenanceCreationAttributes extends Optional<FirearmMaintenanceAttributes, 'id' | 'nextMaintenanceDate' | 'createdAt' | 'updatedAt'> {}

interface FirearmMaintenanceInstance extends Model<FirearmMaintenanceAttributes, FirearmMaintenanceCreationAttributes>, FirearmMaintenanceAttributes {}

const FirearmMaintenance = sequelize.define<FirearmMaintenanceInstance>('FirearmMaintenance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  firearmId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  maintenanceDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  maintenanceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
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
  tableName: 'firearm_maintenance',
  timestamps: true,
})

export default FirearmMaintenance
