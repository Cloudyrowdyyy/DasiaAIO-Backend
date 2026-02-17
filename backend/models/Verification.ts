import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface VerificationAttributes {
  id: string
  userId: string
  code: string
  expiresAt: Date
  createdAt?: Date
}

interface VerificationCreationAttributes extends Optional<VerificationAttributes, 'id' | 'createdAt'> {}

interface VerificationInstance extends Model<VerificationAttributes, VerificationCreationAttributes>, VerificationAttributes {}

const Verification = sequelize.define<VerificationInstance>('Verification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'verifications',
  timestamps: false,
})

export default Verification
