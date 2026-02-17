/**
 * Guard Replacement System - TypeScript
 * Handles automated detection of no-shows and deployment of replacement guards
 */

import sequelize from './database/config.js'
import { DataTypes, Model } from 'sequelize'

const NO_SHOW_THRESHOLD_MINUTES = 15 // Grace period before marking no-show

interface ShiftAttributes {
  id: string
  guardId: string
  startTime: Date
  endTime: Date
  clientSite?: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'replacement_assigned'
  replacementRequired: boolean
  replacementGuardId?: string | null
  createdAt: Date
}

interface ShiftCreationAttributes extends Omit<ShiftAttributes, 'id' | 'createdAt'> {
  id?: string
  createdAt?: Date
}

interface ReplacementAttributes {
  id: string
  originalGuardId: string
  replacementGuardId?: string | null
  originalShiftId: string
  clientSite?: string | null
  shiftTime?: Date | null
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  acceptedGuardId?: string | null
  acceptedAt?: Date | null
  expiresAt?: Date | null
  createdAt: Date
}

interface ReplacementCreationAttributes extends Omit<ReplacementAttributes, 'id' | 'createdAt'> {
  id?: string
  createdAt?: Date
}

interface GuardAvailabilityAttributes {
  id: string
  guardId: string
  date: Date
  available: boolean
  updatedAt: Date
}

interface GuardAvailabilityCreationAttributes extends Omit<GuardAvailabilityAttributes, 'id' | 'updatedAt'> {
  id?: string
  updatedAt?: Date
}

interface AttendanceAttributes {
  id: string
  guardId: string
  shiftId: string
  checkInTime: Date
  checkOutTime?: Date | null
  createdAt: Date
}

interface AttendanceCreationAttributes extends Omit<AttendanceAttributes, 'id' | 'createdAt'> {
  id?: string
  createdAt?: Date
}

class ShiftModel extends Model<ShiftAttributes, ShiftCreationAttributes> {}
class ReplacementModel extends Model<ReplacementAttributes, ReplacementCreationAttributes> {}
class GuardAvailabilityModel extends Model<GuardAvailabilityAttributes, GuardAvailabilityCreationAttributes> {}
class AttendanceModel extends Model<AttendanceAttributes, AttendanceCreationAttributes> {}

let Shift: typeof ShiftModel
let Replacement: typeof ReplacementModel
let GuardAvailability: typeof GuardAvailabilityModel
let Attendance: typeof AttendanceModel

/**
 * Initialize Guard Replacement System models
 */
export async function initializeReplacementSystem(): Promise<void> {
  try {
    // Define Shift model
    Shift = sequelize.define<ShiftModel, ShiftCreationAttributes>('Shift', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      guardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      clientSite: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'no_show', 'replacement_assigned'),
        defaultValue: 'scheduled',
      },
      replacementRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      replacementGuardId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'shifts',
      timestamps: false,
    })
  
    // Define Replacement model
    Replacement = sequelize.define<ReplacementModel, ReplacementCreationAttributes>('Replacement', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      originalGuardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      replacementGuardId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      originalShiftId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      clientSite: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shiftTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
        defaultValue: 'pending',
      },
      acceptedGuardId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'replacements',
      timestamps: false,
    })

    // Define GuardAvailability model
    GuardAvailability = sequelize.define<GuardAvailabilityModel, GuardAvailabilityCreationAttributes>('GuardAvailability', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      guardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      available: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'guard_availability',
      timestamps: false,
    })

    // Define Attendance model
    Attendance = sequelize.define<AttendanceModel, AttendanceCreationAttributes>('Attendance', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      guardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      shiftId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      checkOutTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'attendance',
      timestamps: false,
    })

    // Sync models
    await Shift.sync({ alter: true })
    await Replacement.sync({ alter: true })
    await GuardAvailability.sync({ alter: true })
    await Attendance.sync({ alter: true })

    console.log('✓ Guard Replacement System initialized')
  } catch (error: any) {
    console.warn('⚠ Guard Replacement System initialization failed:', error.message)
  }
}

/**
 * Create a shift for a guard
 */
export async function createShift(
  guardId: string,
  startTime: string | Date,
  endTime: string | Date,
  clientSite: string
): Promise<string> {
  try {
    const shift = await (Shift as any).create({
      guardId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      clientSite,
      status: 'scheduled',
      replacementRequired: false,
    })
    console.log(`✓ Shift created: ${shift.id}`)
    return shift.id as string
  } catch (error: any) {
    console.error('Error creating shift:', error.message)
    throw error
  }
}

/**
 * Record guard check-in
 */
export async function recordCheckIn(guardId: string, shiftId: string): Promise<string> {
  try {
    const shift = await (Shift as any).findByPk(shiftId)
    if (!shift) throw new Error('Shift not found')

    const attendance = await (Attendance as any).create({
      guardId,
      shiftId,
      checkInTime: new Date(),
    })

    // Update shift status
    await shift.update({ status: 'in_progress' })
    
    console.log(`✓ Check-in recorded for guard ${guardId}`)
    return attendance.id as string
  } catch (error: any) {
    console.error('Error recording check-in:', error.message)
    throw error
  }
}

/**
 * Record guard check-out
 */
export async function recordCheckOut(attendanceId: string): Promise<void> {
  try {
    const attendance = await (Attendance as any).findByPk(attendanceId)
    if (!attendance) throw new Error('Attendance record not found')

    await attendance.update({ checkOutTime: new Date() })

    // Update shift status to completed
    const shift = await (Shift as any).findByPk(attendance.shiftId)
    if (shift) {
      await shift.update({ status: 'completed' })
    }

    console.log(`✓ Check-out recorded for attendance ${attendanceId}`)
  } catch (error: any) {
    console.error('Error recording check-out:', error.message)
    throw error
  }
}

/**
 * Detect no-shows
 */
export async function detectNoShows(): Promise<any[]> {
  try {
    const now = new Date()
    const thresholdTime = new Date(now.getTime() - NO_SHOW_THRESHOLD_MINUTES * 60000)
    
    const noShowShifts = await (Shift as any).findAll({
      where: {
        status: 'scheduled',
        startTime: { [(sequelize as any).Op.lt]: thresholdTime },
        replacementRequired: false,
      },
    })
    
    console.log(`Found ${noShowShifts.length} potential no-show shifts`)
    return noShowShifts
  } catch (error: any) {
    console.error('Error detecting no-shows:', error.message)
    throw error
  }
}

/**
 * Send replacement request
 */
export async function sendReplacementRequest(
  noShowShift: any,
  replacementGuards?: any[]
): Promise<string> {
  try {
    const replacement = await (Replacement as any).create({
      originalShiftId: noShowShift.id,
      originalGuardId: noShowShift.guardId,
      clientSite: noShowShift.clientSite,
      shiftTime: noShowShift.startTime,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60000),
    })
    console.log(`✓ Replacement request created: ${replacement.id}`)
    return replacement.id as string
  } catch (error: any) {
    console.error('Error sending replacement request:', error.message)
    throw error
  }
}

/**
 * Accept replacement
 */
export async function acceptReplacement(
  originalGuardId: string,
  replacementGuardId: string,
  shiftId: string
): Promise<boolean> {
  try {
    const replacement = await (Replacement as any).findOne({
      where: {
        originalGuardId,
        originalShiftId: shiftId,
      },
    })

    if (!replacement) throw new Error('Replacement not found')
    
    await replacement.update({
      status: 'accepted',
      replacementGuardId,
      acceptedAt: new Date(),
    })
    
    const shift = await (Shift as any).findByPk(shiftId)
    if (shift) {
      await shift.update({
        replacementGuardId,
        status: 'replacement_assigned',
        replacementRequired: true,
      })
    }
    
    console.log(`✓ Replacement accepted by guard ${replacementGuardId}`)
    return true
  } catch (error: any) {
    console.error('Error accepting replacement:', error.message)
    throw error
  }
}

/**
 * Set guard availability
 */
export async function setGuardAvailability(
  guardId: string,
  isAvailable: boolean,
  availableFrom?: string | Date,
  availableUntil?: string | Date
): Promise<boolean> {
  try {
    const dateObj = new Date()
    dateObj.setHours(0, 0, 0, 0)
    
    const [availability, created] = await (GuardAvailability as any).findOrCreate({
      where: { guardId, date: dateObj },
      defaults: { guardId, date: dateObj, available: isAvailable },
    })
    
    if (!created) {
      await availability.update({ available: isAvailable, updatedAt: new Date() })
    }
    
    console.log(`✓ Updated availability for guard ${guardId}: ${isAvailable}`)
    return true
  } catch (error: any) {
    console.error('Error setting availability:', error.message)
    throw error
  }
}

export default {
  initializeReplacementSystem,
  createShift,
  recordCheckIn,
  recordCheckOut,
  detectNoShows,
  sendReplacementRequest,
  acceptReplacement,
  setGuardAvailability,
}
