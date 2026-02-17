import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface FirearmAttributes {
  id: string
  name: string
  serialNumber: string
  model: string
  caliber: string
  status: 'available' | 'allocated' | 'maintenance'
  createdAt?: Date
  updatedAt?: Date
}

interface FirearmCreationAttributes extends Optional<FirearmAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface FirearmInstance extends Model<FirearmAttributes, FirearmCreationAttributes>, FirearmAttributes {}

const Firearm = sequelize.define<FirearmInstance>('Firearm', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
  caliber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'allocated', 'maintenance'),
    defaultValue: 'available',
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
