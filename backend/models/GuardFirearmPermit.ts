import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface GuardFirearmPermitAttributes {
  id: string
  guardId: string
  firearmId: string
  permitDate: Date
  expiryDate: Date
  status: 'active' | 'expired' | 'revoked'
  createdAt?: Date
  updatedAt?: Date
}

interface GuardFirearmPermitCreationAttributes extends Optional<GuardFirearmPermitAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface GuardFirearmPermitInstance extends Model<GuardFirearmPermitAttributes, GuardFirearmPermitCreationAttributes>, GuardFirearmPermitAttributes {}

const GuardFirearmPermit = sequelize.define<GuardFirearmPermitInstance>('GuardFirearmPermit', {
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
  permitDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked'),
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
  tableName: 'guard_firearm_permits',
  timestamps: true,
})

export default GuardFirearmPermit
