import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../database/config.js'

interface AttendanceAttributes {
  id: string
  userId: string
  date: Date
  status: 'present' | 'absent' | 'late'
  createdAt?: Date
  updatedAt?: Date
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

interface AttendanceInstance extends Model<AttendanceAttributes, AttendanceCreationAttributes>, AttendanceAttributes {}

const Attendance = sequelize.define<AttendanceInstance>('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    defaultValue: 'present',
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
  tableName: 'attendance',
  timestamps: true,
})

export default Attendance
