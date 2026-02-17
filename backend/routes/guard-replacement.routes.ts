/**
 * Guard Replacement System API Routes - TypeScript
 * Endpoints for shift management, attendance tracking, and automatic guard replacement
 */

import { Router, Request, Response } from 'express'
import replacementSystem from '../guard-replacement-system.js'

const router = Router()

interface ShiftRequest {
  guardId: string
  startTime: string
  endTime: string
  clientSite: string
}

interface AttendanceRequest {
  guardId: string
  shiftId: string
}

interface CheckOutRequest {
  attendanceId: string
}

interface ReplacementRequest {
  originalGuardId: string
  replacementGuardId: string
  shiftId: string
}

/**
 * POST /shifts - Create a new shift
 */
router.post('/shifts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardId, startTime, endTime, clientSite } = req.body as ShiftRequest
    
    if (!guardId || !startTime || !endTime || !clientSite) {
      res.status(400).json({ error: 'All fields are required' })
      return
    }
    
    const shiftId = await replacementSystem.createShift(guardId, startTime, endTime, clientSite)
    res.status(201).json({ 
      message: 'Shift created successfully',
      shiftId,
      shift: { guardId, startTime, endTime, clientSite }
    })
  } catch (error: any) {
    console.error('Error creating shift:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /attendance/check-in - Record guard check-in
 */
router.post('/attendance/check-in', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardId, shiftId } = req.body as AttendanceRequest
    
    if (!guardId || !shiftId) {
      res.status(400).json({ error: 'Guard ID and Shift ID are required' })
      return
    }
    
    const attendanceId = await replacementSystem.recordCheckIn(guardId, shiftId)
    res.status(201).json({ 
      message: 'Check-in recorded successfully',
      attendanceId
    })
  } catch (error: any) {
    console.error('Error recording check-in:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /attendance/check-out - Record guard check-out
 */
router.post('/attendance/check-out', async (req: Request, res: Response): Promise<void> => {
  try {
    const { attendanceId } = req.body as CheckOutRequest
    
    if (!attendanceId) {
      res.status(400).json({ error: 'Attendance ID is required' })
      return
    }
    
    await replacementSystem.recordCheckOut(attendanceId)
    res.json({ message: 'Check-out recorded successfully' })
  } catch (error: any) {
    console.error('Error recording check-out:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /detect-no-shows - Detect guards who didn't show up
 */
router.post('/detect-no-shows', async (req: Request, res: Response): Promise<void> => {
  try {
    const noShows = await replacementSystem.detectNoShows()
    res.json({ 
      message: 'No-shows detected',
      noShows
    })
  } catch (error: any) {
    console.error('Error detecting no-shows:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /request-replacement - Request a guard replacement
 */
router.post('/request-replacement', async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalGuardId, replacementGuardId, shiftId } = req.body as ReplacementRequest
    
    if (!originalGuardId || !replacementGuardId || !shiftId) {
      res.status(400).json({ error: 'Original Guard ID, Replacement Guard ID, and Shift ID are required' })
      return
    }
    
    await replacementSystem.acceptReplacement(originalGuardId, replacementGuardId, shiftId)
    res.json({ message: 'Replacement accepted successfully' })
  } catch (error: any) {
    console.error('Error processing replacement:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /set-availability - Set guard availability for shifts
 */
router.post('/set-availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardId, isAvailable, availableFrom, availableUntil } = req.body
    
    if (!guardId || isAvailable === undefined) {
      res.status(400).json({ error: 'Guard ID and availability status are required' })
      return
    }
    
    await replacementSystem.setGuardAvailability(guardId, isAvailable, availableFrom, availableUntil)
    res.json({ message: 'Guard availability updated successfully' })
  } catch (error: any) {
    console.error('Error updating availability:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /shifts/:guardId - Get shifts for a specific guard
 */
router.get('/shifts/:guardId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { guardId } = req.params
    
    if (!guardId) {
      res.status(400).json({ error: 'Guard ID is required' })
      return
    }
    
    // This would need to be implemented in the replacement system
    res.json({ message: 'Guard shifts retrieval not yet implemented' })
  } catch (error: any) {
    console.error('Error retrieving shifts:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
