import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sequelize from './database/config.js'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import replacementSystem from './guard-replacement-system.js'
import guardReplacementRoutes from './routes/guard-replacement.routes.js'
import {
  User, Verification, Attendance, Feedback, Firearm,
  FirearmAllocation, GuardFirearmPermit, FirearmMaintenance,
  AllocationAlert
} from './models/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

// Middleware
app.use(express.json())
app.use(cors())

// Generate random confirmation code
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send confirmation email
async function sendConfirmationEmail(email, confirmationCode) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Email Confirmation Code',
      html: `
        <h2>Welcome to Our Application</h2>
        <p>Your confirmation code is:</p>
        <h1 style="color: #667eea; font-size: 32px; letter-spacing: 5px;">${confirmationCode}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    })
    console.log(`✓ Confirmation email sent to ${email}`)
  } catch (error) {
    console.error('✗ Failed to send email:', error.message)
    throw new Error('Failed to send confirmation email')
  }
}

// Initialize database
async function initializeDB() {
  try {
    await sequelize.authenticate()
    console.log('✓ Connected to PostgreSQL')
    
    await sequelize.sync({ alter: true })
    console.log('✓ Database synchronized')
    
    await replacementSystem.initializeReplacementSystem()
    console.log('✓ Guard Replacement System initialized')
  } catch (error) {
    console.warn('⚠ Database connection failed:', error.message)
    console.warn('⚠ Please check your PostgreSQL connection')
  }
}

// ============ AUTH ENDPOINTS ============

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, username, role, adminCode, fullName, phoneNumber, licenseNumber, licenseExpiryDate } = req.body

    console.log('Register request received:', { email, username, role, fullName, phoneNumber, hasLicense: !!licenseNumber })

    // For admin accounts, license fields are optional
    if (role === 'admin') {
      if (!email || !password || !username || !role || !fullName || !phoneNumber) {
        return res.status(400).json({ error: 'Email, password, username, full name, and phone number are required for admin accounts' })
      }
    } else {
      // For regular users, all fields including license are required
      if (!email || !password || !username || !role || !fullName || !phoneNumber || !licenseNumber || !licenseExpiryDate) {
        return res.status(400).json({ error: 'All fields are required for regular user accounts' })
      }
    }

    // Validate Gmail domain
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'You must use a Gmail account (email must end with @gmail.com)' })
    }

    // Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' })
    }

    // Validate admin code if admin role
    if (role === 'admin') {
      if (!adminCode) {
        return res.status(400).json({ error: 'Admin code is required' })
      }
      if (adminCode !== '122601') {
        return res.status(400).json({ error: 'Invalid admin code' })
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode()
    
    // Create user with verified=false
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      role,
      fullName,
      phoneNumber,
      licenseNumber,
      licenseExpiryDate,
      verified: false
    })

    // Store verification code with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await Verification.create({
      userId: user.id,
      email,
      code: confirmationCode,
      expiresAt
    })

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, confirmationCode)
    } catch (emailError) {
      return res.status(500).json({ error: 'Failed to send confirmation email' })
    }

    res.status(201).json({
      message: 'Registration successful! Check your Gmail for confirmation code.',
      userId: user.id,
      email,
      requiresVerification: true
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Verify email confirmation code
app.post('/api/verify', async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' })
    }

    // Find verification record
    const verification = await Verification.findOne({ where: { email, code } })
    if (!verification) {
      return res.status(400).json({ error: 'Invalid confirmation code' })
    }

    // Check if code expired
    if (new Date() > verification.expiresAt) {
      await verification.destroy()
      return res.status(400).json({ error: 'Confirmation code expired' })
    }

    // Mark user as verified
    await User.update(
      { verified: true },
      { where: { email } }
    )

    // Delete verification record
    await verification.destroy()

    res.json({ message: 'Email verified successfully! You can now login.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Resend confirmation code
app.post('/api/resend-code', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.verified) {
      return res.status(400).json({ error: 'User already verified' })
    }

    // Generate new code
    const newCode = generateConfirmationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Delete old verification record
    await Verification.destroy({ where: { email } })

    // Create new verification record
    await Verification.create({
      userId: user.id,
      email,
      code: newCode,
      expiresAt
    })

    // Send new confirmation email
    await sendConfirmationEmail(email, newCode)

    res.json({ message: 'New confirmation code sent to your email' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body

    console.log('[LOGIN] Attempting login with identifier:', identifier)

    if (!identifier || !password) {
      console.log('[LOGIN] Missing identifier or password')
      return res.status(400).json({ error: 'Email, phone number, and password are required' })
    }

    // Find user by email, phone number, or username
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        'LIKE',
        `%${identifier.toLowerCase()}%`
      )
    }) || await User.findOne({ where: { phoneNumber: identifier } })
      || await User.findOne({ where: { username: identifier } })
    
    console.log('[LOGIN] User query result:', user ? `Found: ${user.username}` : 'NOT FOUND')
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if user is verified
    if (!user.verified) {
      console.log('[LOGIN] User not verified')
      return res.status(403).json({ error: 'Please verify your email first', requiresVerification: true })
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('[LOGIN] Password match result:', isPasswordValid)
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('[LOGIN] SUCCESS for user:', identifier)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============ USER MANAGEMENT ENDPOINTS ============

// Get user profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    })

    res.json({
      total: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        licenseNumber: user.licenseNumber,
        licenseExpiryDate: user.licenseExpiryDate,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Edit user (Admin only)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, phoneNumber, licenseNumber, licenseExpiryDate } = req.body

    // Only update provided fields
    const updateFields = {}
    if (fullName !== undefined) updateFields.fullName = fullName
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber
    if (licenseExpiryDate !== undefined) updateFields.licenseExpiryDate = licenseExpiryDate

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' })
    }

    const [updated] = await User.update(
      updateFields,
      { where: { id: req.params.id } }
    )

    if (updated === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user (Admin only)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } })

    if (deleted === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============ PERFORMANCE MANAGEMENT ENDPOINTS ============

// Guard check-in
app.post('/api/attendance/checkin', async (req, res) => {
  try {
    const { guardId } = req.body

    if (!guardId) {
      return res.status(400).json({ error: 'Guard ID is required' })
    }

    // Check if guard exists
    const guard = await User.findByPk(guardId)
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingCheckin = await Attendance.findOne({
      where: {
        userId: guardId,
        date: today,
        checkInTime: { [sequelize.Op.not]: null }
      }
    })

    if (existingCheckin && !existingCheckin.checkOutTime) {
      return res.status(400).json({ error: 'Already checked in today. Please check out first.' })
    }

    // Record check-in
    const attendance = await Attendance.create({
      userId: guardId,
      date: today,
      checkInTime: new Date(),
      status: 'present'
    })

    res.json({ 
      message: 'Check-in successful',
      attendanceId: attendance.id,
      checkInTime: attendance.checkInTime
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Guard check-out
app.post('/api/attendance/checkout', async (req, res) => {
  try {
    const { attendanceId } = req.body

    if (!attendanceId) {
      return res.status(400).json({ error: 'Attendance ID is required' })
    }

    const [updated] = await Attendance.update(
      { checkOutTime: new Date() },
      { where: { id: attendanceId } }
    )

    if (updated === 0) {
      return res.status(404).json({ error: 'Attendance record not found' })
    }

    res.json({ 
      message: 'Check-out successful',
      checkOutTime: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Submit guard feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, title, message, rating } = req.body

    if (!userId || !title || !message || !rating) {
      return res.status(400).json({ error: 'userId, title, message, and rating are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    // Verify user exists
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const feedback = await Feedback.create({
      userId,
      title,
      message,
      rating,
      category: 'general',
      status: 'open'
    })

    res.json({ 
      message: 'Feedback submitted successfully',
      feedbackId: feedback.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get merit scores (all guards ranked)
app.get('/api/performance/merit-scores', async (req, res) => {
  try {
    const guards = await User.findAll({ where: { role: 'user' } })
    const meritScores = []
    
    for (const guard of guards) {
      try {
        // Attendance score (40%)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const attendanceRecords = await Attendance.findAll({
          where: {
            userId: guard.id,
            date: { [sequelize.Op.gte]: thirtyDaysAgo }
          }
        })

        const daysPresent = attendanceRecords.filter(r => r.checkInTime && r.checkOutTime).length
        const totalWorkingDays = 30
        const attendanceScore = (daysPresent / totalWorkingDays) * 100

        // Punctuality score (30%) - on time if checked in before 9 AM
        const onTimeCount = attendanceRecords.filter(r => {
          if (!r.checkInTime) return false
          const checkInHour = new Date(r.checkInTime).getHours()
          return checkInHour <= 9
        }).length
        const punctualityScore = (onTimeCount / Math.max(daysPresent, 1)) * 100

        // Feedback score (30%) - average rating
        const feedbackRecords = await Feedback.findAll({
          where: { userId: guard.id }
        })

        const feedbackScore = feedbackRecords.length > 0
          ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length) * 20
          : 0

        // Merit score calculation
        const meritScore = (attendanceScore * 0.4) + (punctualityScore * 0.3) + (feedbackScore * 0.3)

        meritScores.push({
          id: guard.id,
          name: guard.fullName || 'Unknown',
          email: guard.email || '',
          phone: guard.phoneNumber || '',
          attendanceScore: Math.round(attendanceScore),
          punctualityScore: Math.round(punctualityScore),
          feedbackScore: Math.round(feedbackScore),
          meritScore: Math.round(meritScore * 100) / 100,
          daysPresent,
          feedbackCount: feedbackRecords.length
        })
      } catch (guardError) {
        console.error(`Error calculating merit for guard ${guard.id}:`, guardError.message)
      }
    }

    // Sort by merit score descending
    meritScores.sort((a, b) => b.meritScore - a.meritScore)

    res.json({
      total: meritScores.length,
      scores: meritScores
    })
  } catch (error) {
    console.error('Error fetching merit scores:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Get individual guard performance details
app.get('/api/performance/guards/:id', async (req, res) => {
  try {
    const guard = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    })
    
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Get attendance records (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const attendanceRecords = await Attendance.findAll({
      where: {
        userId: req.params.id,
        date: { [sequelize.Op.gte]: thirtyDaysAgo }
      },
      order: [['date', 'DESC']]
    })

    // Get feedback records
    const feedbackRecords = await Feedback.findAll({
      where: { userId: req.params.id },
      order: [['createdAt', 'DESC']]
    })

    // Calculate metrics
    const daysPresent = attendanceRecords.filter(r => r.checkInTime && r.checkOutTime).length
    const onTimeCount = attendanceRecords.filter(r => {
      if (!r.checkInTime) return false
      const checkInHour = new Date(r.checkInTime).getHours()
      return checkInHour <= 9
    }).length

    const attendanceScore = (daysPresent / 30) * 100
    const punctualityScore = (onTimeCount / Math.max(daysPresent, 1)) * 100
    const feedbackScore = feedbackRecords.length > 0
      ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length) * 20
      : 0

    const meritScore = (attendanceScore * 0.4) + (punctualityScore * 0.3) + (feedbackScore * 0.3)

    res.json({
      guard: {
        id: guard.id,
        name: guard.fullName,
        email: guard.email,
        phone: guard.phoneNumber,
        verified: guard.verified
      },
      metrics: {
        attendanceScore: Math.round(attendanceScore),
        punctualityScore: Math.round(punctualityScore),
        feedbackScore: Math.round(feedbackScore),
        meritScore: Math.round(meritScore * 100) / 100
      },
      attendance: {
        daysPresent,
        daysAbsent: 30 - daysPresent,
        onTimeCount,
        lateCount: daysPresent - onTimeCount,
        records: attendanceRecords.map(r => ({
          date: r.date,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime
        }))
      },
      feedback: {
        total: feedbackRecords.length,
        averageRating: feedbackRecords.length > 0
          ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length).toFixed(2)
          : 0,
        records: feedbackRecords.map(f => ({
          title: f.title,
          message: f.message,
          rating: f.rating,
          createdAt: f.createdAt
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============ FIREARM MANAGEMENT ENDPOINTS ============

// Add new firearm to inventory
app.post('/api/firearms', async (req, res) => {
  try {
    const { serialNumber, model, caliber, type, manufacturer, condition, status } = req.body

    if (!serialNumber || !model || !condition || !status) {
      return res.status(400).json({ error: 'All required fields must be provided' })
    }

    // Check if serial number already exists
    const existing = await Firearm.findOne({ where: { serialNumber } })
    if (existing) {
      return res.status(400).json({ error: 'Firearm with this serial number already exists' })
    }

    const firearm = await Firearm.create({
      serialNumber,
      model,
      caliber,
      type,
      manufacturer,
      condition,
      status
    })

    res.status(201).json({
      message: 'Firearm added successfully',
      firearmId: firearm.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all firearms
app.get('/api/firearms', async (req, res) => {
  try {
    const firearms = await Firearm.findAll()

    res.json(firearms.map(f => ({
      id: f.id,
      serialNumber: f.serialNumber,
      type: f.type,
      model: f.model,
      caliber: f.caliber,
      manufacturer: f.manufacturer,
      condition: f.condition,
      status: f.status,
      lastMaintenance: f.lastMaintenance,
      lastMaintenanceDate: f.lastMaintenanceDate,
      createdAt: f.createdAt
    })))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single firearm details
app.get('/api/firearms/:id', async (req, res) => {
  try {
    const firearm = await Firearm.findByPk(req.params.id)

    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    // Get allocation history
    const allocationHistory = await FirearmAllocation.findAll({
      where: { firearmId: firearm.id },
      order: [['allocationDate', 'DESC']],
      limit: 20
    })

    res.json({
      firearm: {
        id: firearm.id,
        serialNumber: firearm.serialNumber,
        model: firearm.model,
        condition: firearm.condition,
        status: firearm.status,
        lastMaintenanceDate: firearm.lastMaintenanceDate,
        createdAt: firearm.createdAt
      },
      allocationHistory: allocationHistory.map(a => ({
        id: a.id,
        guardId: a.guardId,
        allocationDate: a.allocationDate,
        returnDate: a.returnDate,
        status: a.status
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update firearm condition/status
app.put('/api/firearms/:id', async (req, res) => {
  try {
    const { condition, status } = req.body

    const updateData = {}
    if (condition) updateData.condition = condition
    if (status) updateData.status = status

    const [updated] = await Firearm.update(
      updateData,
      { where: { id: req.params.id } }
    )

    if (updated === 0) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    res.json({ message: 'Firearm updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete firearm (only if not allocated)
app.delete('/api/firearms/:id', async (req, res) => {
  try {
    // Check if firearm is currently allocated
    const allocation = await FirearmAllocation.findOne({
      where: {
        firearmId: req.params.id,
        returnDate: null
      }
    })

    if (allocation) {
      return res.status(400).json({ error: 'Cannot delete firearm that is currently allocated' })
    }

    const deleted = await Firearm.destroy({ where: { id: req.params.id } })

    if (deleted === 0) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    res.json({ message: 'Firearm deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== Guard Firearm Permits =====

// Add/update guard firearm permit
app.post('/api/guard-firearm-permits', async (req, res) => {
  try {
    const { guardId, permitNumber, issueDate, expiryDate, permitType, authorizedWeapons } = req.body

    if (!guardId || !permitNumber || !issueDate || !expiryDate) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Check if guard exists
    const guard = await User.findByPk(guardId)
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Check if permit already exists for this guard
    const existingPermit = await GuardFirearmPermit.findOne({ where: { guardId } })

    if (existingPermit) {
      // Update existing permit
      await existingPermit.update({
        permitNumber,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        permitType,
        authorizedWeapons
      })
      return res.json({ message: 'Permit updated successfully' })
    }

    // Create new permit
    const permit = await GuardFirearmPermit.create({
      guardId,
      permitNumber,
      issueDate: new Date(issueDate),
      expiryDate: new Date(expiryDate),
      permitType,
      authorizedWeapons,
      status: 'active'
    })

    res.status(201).json({
      message: 'Permit added successfully',
      permitId: permit.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get guard firearm permit
app.get('/api/guard-firearm-permits/:guardId', async (req, res) => {
  try {
    const permit = await GuardFirearmPermit.findOne({
      where: { guardId: req.params.guardId }
    })

    if (!permit) {
      return res.status(404).json({ error: 'No permit found for this guard' })
    }

    const isExpired = new Date() > new Date(permit.expiryDate)

    res.json({
      id: permit.id,
      guardId: permit.guardId,
      permitNumber: permit.permitNumber,
      issueDate: permit.issueDate,
      expiryDate: permit.expiryDate,
      permitType: permit.permitType,
      authorizedWeapons: permit.authorizedWeapons,
      status: isExpired ? 'expired' : 'active',
      isExpired
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== Firearm Allocation =====

// Issue firearm to guard
app.post('/api/firearm-allocation/issue', async (req, res) => {
  try {
    const { firearmId, guardId, notes } = req.body

    if (!firearmId || !guardId) {
      return res.status(400).json({ error: 'Firearm ID and Guard ID are required' })
    }

    // Verify guard exists
    const guard = await User.findByPk(guardId)
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Verify guard has valid permit
    const permit = await GuardFirearmPermit.findOne({ where: { guardId } })
    if (!permit) {
      return res.status(400).json({ error: 'Guard does not have a firearm permit' })
    }

    const isPermitExpired = new Date() > new Date(permit.expiryDate)
    if (isPermitExpired) {
      return res.status(400).json({ error: 'Guard\'s firearm permit has expired' })
    }

    // Verify firearm exists and is available
    const firearm = await Firearm.findByPk(firearmId)
    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    if (firearm.status !== 'available') {
      return res.status(400).json({ error: 'Firearm is not available for allocation' })
    }

    // Create allocation record
    const allocation = await FirearmAllocation.create({
      firearmId,
      guardId,
      allocationDate: new Date(),
      status: 'allocated',
      notes: notes || ''
    })

    // Update firearm status
    await firearm.update({ status: 'allocated' })

    res.status(201).json({
      message: 'Firearm issued successfully',
      allocationId: allocation.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Return firearm from guard
app.post('/api/firearm-allocation/return', async (req, res) => {
  try {
    const { allocationId, condition, notes } = req.body

    if (!allocationId) {
      return res.status(400).json({ error: 'Allocation ID is required' })
    }

    // Find allocation
    const allocation = await FirearmAllocation.findByPk(allocationId)
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' })
    }

    if (allocation.returnDate) {
      return res.status(400).json({ error: 'Firearm has already been returned' })
    }

    // Update allocation
    await allocation.update({
      returnDate: new Date(),
      status: 'returned',
      notes: notes || ''
    })

    // Update firearm status
    const firearm = await Firearm.findByPk(allocation.firearmId)
    await firearm.update({
      status: 'available',
      condition: condition || firearm.condition
    })

    res.json({ message: 'Firearm returned successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get allocation history for a guard
app.get('/api/guard-allocations/:guardId', async (req, res) => {
  try {
    const allocations = await FirearmAllocation.findAll({
      where: { guardId: req.params.guardId },
      order: [['allocationDate', 'DESC']]
    })

    res.json({
      total: allocations.length,
      allocations: allocations.map(a => ({
        id: a.id,
        firearmId: a.firearmId,
        allocationDate: a.allocationDate,
        returnDate: a.returnDate,
        status: a.status,
        notes: a.notes
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current active allocations
app.get('/api/firearm-allocations/active', async (req, res) => {
  try {
    const activeAllocations = await FirearmAllocation.findAll({
      where: {
        returnDate: null,
        status: 'allocated'
      }
    })

    res.json({
      total: activeAllocations.length,
      allocations: activeAllocations.map(a => ({
        id: a.id,
        firearmId: a.firearmId,
        guardId: a.guardId,
        allocationDate: a.allocationDate,
        status: a.status
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ===== Firearm Maintenance =====

// Record maintenance
app.post('/api/firearm-maintenance', async (req, res) => {
  try {
    const { firearmId, maintenanceType, description, technician, cost, nextMaintenanceDate } = req.body

    if (!firearmId || !maintenanceType) {
      return res.status(400).json({ error: 'Firearm ID and maintenance type are required' })
    }

    // Verify firearm exists
    const firearm = await Firearm.findByPk(firearmId)
    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    // Record maintenance
    const maintenance = await FirearmMaintenance.create({
      firearmId,
      maintenanceType,
      description,
      technician,
      cost,
      nextMaintenanceDate,
      status: 'completed',
      maintenanceDate: new Date()
    })

    // Update firearm's last maintenance date
    if (maintenanceType === 'service' || maintenanceType === 'inspection') {
      await firearm.update({ lastMaintenanceDate: new Date() })
    }

    res.status(201).json({
      message: 'Maintenance recorded successfully',
      maintenanceId: maintenance.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get maintenance history for firearm
app.get('/api/firearm-maintenance/:firearmId', async (req, res) => {
  try {
    const maintenance = await FirearmMaintenance.findAll({
      where: { firearmId: req.params.firearmId },
      order: [['maintenanceDate', 'DESC']]
    })

    res.json({
      total: maintenance.length,
      records: maintenance.map(m => ({
        id: m.id,
        maintenanceType: m.maintenanceType,
        description: m.description,
        technician: m.technician,
        cost: m.cost,
        maintenanceDate: m.maintenanceDate,
        nextMaintenanceDate: m.nextMaintenanceDate,
        status: m.status
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== ALERTS API ====================

// Create alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { alertType, message, severity, allocationId } = req.body

    if (!alertType || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const alert = await AllocationAlert.create({
      allocationId,
      alertType,
      message,
      severity: severity || 'medium',
      isResolved: false
    })

    res.status(201).json({
      message: 'Alert created successfully',
      alertId: alert.id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all alerts (with filtering)
app.get('/api/alerts', async (req, res) => {
  try {
    const { alertType, severity, isResolved, limit = 50, skip = 0 } = req.query
    const where = {}

    if (alertType) where.alertType = alertType
    if (severity) where.severity = severity
    if (isResolved !== undefined) where.isResolved = isResolved === 'true'

    const alerts = await AllocationAlert.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(skip)
    })

    const total = await AllocationAlert.count({ where })
    const unreadCount = await AllocationAlert.count({ ...where, isResolved: false })

    res.json({
      total,
      unreadCount,
      alerts: alerts.map(a => ({
        id: a.id,
        alertType: a.alertType,
        message: a.message,
        severity: a.severity,
        isResolved: a.isResolved,
        allocationId: a.allocationId,
        createdAt: a.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark alert as read
app.patch('/api/alerts/:alertId/read', async (req, res) => {
  try {
    const [updated] = await AllocationAlert.update(
      { isResolved: true, resolvedAt: new Date() },
      { where: { id: req.params.alertId } }
    )

    res.json({
      message: 'Alert marked as resolved',
      modifiedCount: updated
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete alert
app.delete('/api/alerts/:alertId', async (req, res) => {
  try {
    const deleted = await AllocationAlert.destroy({
      where: { id: req.params.alertId }
    })

    res.json({
      message: 'Alert deleted successfully',
      deletedCount: deleted
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mount Guard Replacement System Routes
app.use('/api', guardReplacementRoutes)

// Initialize and start server
initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err.message)
  process.exit(1)
})
