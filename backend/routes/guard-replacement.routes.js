/**
 * Guard Replacement System API Routes
 * Endpoints for shift management, attendance tracking, and automatic guard replacement
 */

import express from 'express'
import replacementSystem from '../guard-replacement-system.js'

const router = express.Router()

/**
 * POST /api/shifts - Create a new shift
 */
router.post('/shifts', async (req, res) => {
  try {
    const { guardId, startTime, endTime, clientSite } = req.body
    
    if (!guardId || !startTime || !endTime || !clientSite) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    
    const shiftId = await replacementSystem.createShift(guardId, startTime, endTime, clientSite)
    res.status(201).json({ 
      message: 'Shift created successfully',
      shiftId,
      shift: { guardId, startTime, endTime, clientSite }
    })
  } catch (error) {
    console.error('Error creating shift:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/attendance/check-in - Record guard check-in
 */
router.post('/attendance/check-in', async (req, res) => {
  try {
    const { guardId, shiftId } = req.body
    
    if (!guardId || !shiftId) {
      return res.status(400).json({ error: 'Guard ID and Shift ID are required' })
    }
    
    const attendanceId = await replacementSystem.recordCheckIn(guardId, shiftId)
    res.status(201).json({ 
      message: 'Check-in recorded successfully',
      attendanceId
    })
  } catch (error) {
    console.error('Error recording check-in:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/attendance/check-out - Record guard check-out
 */
router.post('/attendance/check-out', async (req, res) => {
  try {
    const { guardId, shiftId } = req.body
    
    if (!guardId || !shiftId) {
      return res.status(400).json({ error: 'Guard ID and Shift ID are required' })
    }
    
    await replacementSystem.recordCheckOut(guardId, shiftId)
    res.status(200).json({ 
      message: 'Check-out recorded successfully'
    })
  } catch (error) {
    console.error('Error recording check-out:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/guard-availability - Set guard availability
 */
router.post('/guard-availability', async (req, res) => {
  try {
    const { guardId, date, available } = req.body
    
    if (!guardId || !date || available === undefined) {
      return res.status(400).json({ error: 'Guard ID, date, and availability status are required' })
    }
    
    await replacementSystem.setGuardAvailability(guardId, date, available)
    res.status(200).json({ 
      message: 'Availability updated successfully',
      guardId,
      date,
      available
    })
  } catch (error) {
    console.error('Error setting availability:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/no-shows - Detect and retrieve no-shows
 * This can be called manually or by a cron job
 */
router.get('/no-shows', async (req, res) => {
  try {
    const noShows = await replacementSystem.detectNoShows()
    
    if (noShows.length === 0) {
      return res.status(200).json({ 
        message: 'No no-shows detected',
        noShows: []
      })
    }
    
    // Process each no-show: find replacements and send notifications
    const replacementRequests = []
    
    for (const noShow of noShows) {
      const replacementGuards = await replacementSystem.findReplacementGuards(noShow)
      
      if (replacementGuards.length > 0) {
        const replacementId = await replacementSystem.sendReplacementRequest(noShow, replacementGuards)
        replacementRequests.push({
          noShowShift: noShow,
          replacementId,
          candidateGuards: replacementGuards
        })
      } else {
        console.log(`⚠ No available guards found for replacement at ${noShow.clientSite}`)
      }
    }
    
    res.status(200).json({ 
      message: `Processed ${noShows.length} no-shows`,
      noShowsDetected: noShows.length,
      replacementRequestsCreated: replacementRequests.length,
      replacementRequests
    })
  } catch (error) {
    console.error('Error detecting no-shows:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/replacements/:replacementId/accept - Guard accepts replacement assignment
 */
router.post('/replacements/:replacementId/accept', async (req, res) => {
  try {
    const { replacementId } = req.params
    const { guardId } = req.body
    
    if (!guardId) {
      return res.status(400).json({ error: 'Guard ID is required' })
    }
    
    await replacementSystem.acceptReplacement(replacementId, guardId)
    res.status(200).json({ 
      message: 'Replacement assignment accepted successfully',
      replacementId,
      guardId
    })
  } catch (error) {
    console.error('Error accepting replacement:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/replacements/:replacementId/decline - Guard declines replacement assignment
 */
router.post('/replacements/:replacementId/decline', async (req, res) => {
  try {
    const { replacementId } = req.params
    // TODO: Implement decline logic - mark guard as declined, try next candidate
    
    res.status(200).json({ 
      message: 'Replacement assignment declined',
      replacementId
    })
  } catch (error) {
    console.error('Error declining replacement:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
