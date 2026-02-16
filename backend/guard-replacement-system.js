/**
 * Guard Replacement System
 * Handles automated detection of no-shows and deployment of replacement guards
 */

import sequelize from './database/config.js'
import { DataTypes } from 'sequelize'

const NO_SHOW_THRESHOLD_MINUTES = 15 // Grace period before marking no-show

let Shift, Replacement, GuardAvailability

export async function initializeReplacementSystem() {
  try {
    // Define Shift model
    Shift = sequelize.define('Shift', {
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
    Replacement = sequelize.define('Replacement', {
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
    GuardAvailability = sequelize.define('GuardAvailability', {
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

    // Sync models
    await Shift.sync({ alter: true })
    await Replacement.sync({ alter: true })
    await GuardAvailability.sync({ alter: true })

    console.log('✓ Guard Replacement System initialized')
  } catch (error) {
    console.warn('⚠ Guard Replacement System initialization failed:', error.message)
  }
}

/**
 * Create a shift for a guard
 */
export async function createShift(guardId, startTime, endTime, clientSite) {
  try {
    const shift = await Shift.create({
      guardId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      clientSite,
      status: 'scheduled',
      replacementRequired: false,
    })
    console.log(`✓ Shift created: ${shift.id}`)
    return shift.id
  } catch (error) {
    console.error('Error creating shift:', error.message)
    throw error
  }
}

/**
 * Detect no-shows
 */
export async function detectNoShows() {
  try {
    const now = new Date()
    const thresholdTime = new Date(now.getTime() - NO_SHOW_THRESHOLD_MINUTES * 60000)
    
    const noShowShifts = await Shift.findAll({
      where: {
        status: 'scheduled',
        startTime: { [sequelize.Op.lt]: thresholdTime },
        replacementRequired: false,
      },
    })
    
    console.log(`Found ${noShowShifts.length} potential no-show shifts`)
    return noShowShifts
  } catch (error) {
    console.error('Error detecting no-shows:', error.message)
    throw error
  }
}

/**
 * Send replacement request
 */
export async function sendReplacementRequest(noShowShift, replacementGuards) {
  try {
    const replacement = await Replacement.create({
      originalShiftId: noShowShift.id,
      originalGuardId: noShowShift.guardId,
      clientSite: noShowShift.clientSite,
      shiftTime: noShowShift.startTime,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60000),
    })
    console.log(`✓ Replacement request created: ${replacement.id}`)
    return replacement.id
  } catch (error) {
    console.error('Error sending replacement request:', error.message)
    throw error
  }
}

/**
 * Accept replacement
 */
export async function acceptReplacement(replacementId, guardId) {
  try {
    const replacement = await Replacement.findByPk(replacementId)
    if (!replacement) throw new Error('Replacement not found')
    
    await replacement.update({
      status: 'accepted',
      replacementGuardId: guardId,
      acceptedAt: new Date(),
    })
    
    await Shift.update(
      { replacementGuardId: guardId, status: 'replacement_assigned' },
      { where: { id: replacement.originalShiftId } }
    )
    
    console.log(`✓ Replacement accepted by guard ${guardId}`)
    return true
  } catch (error) {
    console.error('Error accepting replacement:', error.message)
    throw error
  }
}

/**
 * Set guard availability
 */
export async function setGuardAvailability(guardId, date, available) {
  try {
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    const [availability, created] = await GuardAvailability.findOrCreate({
      where: { guardId, date: dateObj },
      defaults: { guardId, date: dateObj, available },
    })
    
    if (!created) {
      await availability.update({ available, updatedAt: new Date() })
    }
    
    console.log(`✓ Updated availability for guard ${guardId}: ${available}`)
    return true
  } catch (error) {
    console.error('Error setting availability:', error.message)
    throw error
  }
}

export default {
  initializeReplacementSystem,
  createShift,
  detectNoShows,
  sendReplacementRequest,
  acceptReplacement,
  setGuardAvailability
}
