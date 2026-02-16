import User from './User.js'
import Verification from './Verification.js'
import Attendance from './Attendance.js'
import Feedback from './Feedback.js'
import Firearm from './Firearm.js'
import FirearmAllocation from './FirearmAllocation.js'
import GuardFirearmPermit from './GuardFirearmPermit.js'
import FirearmMaintenance from './FirearmMaintenance.js'
import AllocationAlert from './AllocationAlert.js'

// Set up relationships
User.hasMany(Verification, { foreignKey: 'userId', onDelete: 'CASCADE' })
Verification.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Attendance, { foreignKey: 'userId', onDelete: 'CASCADE' })
Attendance.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Feedback, { foreignKey: 'userId', onDelete: 'CASCADE' })
Feedback.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(FirearmAllocation, { foreignKey: 'guardId', onDelete: 'CASCADE' })
FirearmAllocation.belongsTo(User, { foreignKey: 'guardId', as: 'guard' })

Firearm.hasMany(FirearmAllocation, { foreignKey: 'firearmId', onDelete: 'CASCADE' })
FirearmAllocation.belongsTo(Firearm, { foreignKey: 'firearmId' })

User.hasMany(GuardFirearmPermit, { foreignKey: 'guardId', onDelete: 'CASCADE' })
GuardFirearmPermit.belongsTo(User, { foreignKey: 'guardId', as: 'guard' })

Firearm.hasMany(FirearmMaintenance, { foreignKey: 'firearmId', onDelete: 'CASCADE' })
FirearmMaintenance.belongsTo(Firearm, { foreignKey: 'firearmId' })

FirearmAllocation.hasMany(AllocationAlert, { foreignKey: 'allocationId', onDelete: 'CASCADE' })
AllocationAlert.belongsTo(FirearmAllocation, { foreignKey: 'allocationId' })

export {
  User,
  Verification,
  Attendance,
  Feedback,
  Firearm,
  FirearmAllocation,
  GuardFirearmPermit,
  FirearmMaintenance,
  AllocationAlert,
}
