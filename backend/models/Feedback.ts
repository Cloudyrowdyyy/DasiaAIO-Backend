import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface FeedbackAttributes {
  id: string
  userId: string
  message: string
  rating: number
  createdAt?: Date
  updatedAt?: Date
}

interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface FeedbackInstance extends Model<FeedbackAttributes, FeedbackCreationAttributes>, FeedbackAttributes {}

const Feedback = sequelize.define<FeedbackInstance>('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  tableName: 'feedback',
  timestamps: true,
})

export default Feedback
