import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import replacementSystem from './guard-replacement-system.js'
import guardReplacementRoutes from './routes/guard-replacement.routes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

let db
let usersCollection
let verificationCollection
let attendanceCollection
let feedbackCollection
let firearmsCollection
let firearmAllocationsCollection
let guardFirearmPermitsCollection
let firearmMaintenanceCollection
let allocationAlertsCollection

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

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

// Middleware
app.use(express.json())
app.use(cors())

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000 
    })
    await client.connect()
    console.log('✓ Connected to MongoDB')
    db = client.db('login_app')
    usersCollection = db.collection('users')
    verificationCollection = db.collection('verifications')
    attendanceCollection = db.collection('attendance')
    feedbackCollection = db.collection('feedback')
    firearmsCollection = db.collection('firearms')
    firearmAllocationsCollection = db.collection('firearm_allocations')
    guardFirearmPermitsCollection = db.collection('guard_firearm_permits')
    firearmMaintenanceCollection = db.collection('firearm_maintenance')
    allocationAlertsCollection = db.collection('allocation_alerts')
    
    // Initialize Guard Replacement System
    await replacementSystem.initializeReplacementSystem()
    console.log('✓ Guard Replacement System initialized')
  } catch (error) {
    console.warn('⚠ MongoDB connection failed:', error.message)
    console.warn('⚠ Running in offline mode - database features disabled')
    console.warn('⚠ Please check your MongoDB connection string and network access')
  }
}

// Register user
app.post('/api/register', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    
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
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode()
    
    // Create user with verified=false
    const result = await usersCollection.insertOne({
      email,
      username,
      password: hashedPassword,
      role,
      fullName,
      phoneNumber,
      licenseNumber,
      licenseExpiryDate,
      verified: false,
      createdAt: new Date()
    })

    // Store verification code with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await verificationCollection.insertOne({
      userId: result.insertedId,
      email,
      code: confirmationCode,
      expiresAt,
      createdAt: new Date()
    })

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, confirmationCode)
    } catch (emailError) {
      return res.status(500).json({ error: 'Failed to send confirmation email' })
    }

    res.status(201).json({
      message: 'Registration successful! Check your Gmail for confirmation code.',
      userId: result.insertedId,
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
    if (!verificationCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' })
    }

    // Find verification record
    const verification = await verificationCollection.findOne({ email, code })
    if (!verification) {
      return res.status(400).json({ error: 'Invalid confirmation code' })
    }

    // Check if code expired
    if (new Date() > verification.expiresAt) {
      await verificationCollection.deleteOne({ _id: verification._id })
      return res.status(400).json({ error: 'Confirmation code expired' })
    }

    // Mark user as verified
    await usersCollection.updateOne(
      { email },
      { $set: { verified: true } }
    )

    // Delete verification record
    await verificationCollection.deleteOne({ _id: verification._id })

    res.json({ message: 'Email verified successfully! You can now login.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Resend confirmation code
app.post('/api/resend-code', async (req, res) => {
  try {
    if (!verificationCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const user = await usersCollection.findOne({ email })
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
    await verificationCollection.deleteOne({ email })

    // Create new verification record
    await verificationCollection.insertOne({
      userId: user._id,
      email,
      code: newCode,
      expiresAt,
      createdAt: new Date()
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
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }
    
    const { identifier, password } = req.body

    console.log('[LOGIN] Request body:', req.body)
    console.log('[LOGIN] Attempting login with identifier:', identifier)

    if (!identifier || !password) {
      console.log('[LOGIN] Missing identifier or password')
      return res.status(400).json({ error: 'Email, phone number, and password are required' })
    }

    // Find user by email, phone number, or username
    const user = await usersCollection.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier },
        { username: identifier }
      ]
    })
    
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
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get user profile
app.get('/api/user/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb')
    const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
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
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray()

    res.json({
      total: users.length,
      users: users.map(user => ({
        id: user._id,
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
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const { fullName, phoneNumber, licenseNumber, licenseExpiryDate } = req.body

    // Only update provided fields
    const updateFields = {}
    if (fullName !== undefined) updateFields.fullName = fullName
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber
    if (licenseExpiryDate !== undefined) updateFields.licenseExpiryDate = licenseExpiryDate
    updateFields.updatedAt = new Date()

    if (Object.keys(updateFields).length === 1) { // only updatedAt present
      return res.status(400).json({ error: 'No valid fields provided for update' })
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
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
    if (!usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) })

    if (result.deletedCount === 0) {
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
    if (!attendanceCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { guardId } = req.body

    if (!guardId) {
      return res.status(400).json({ error: 'Guard ID is required' })
    }

    // Check if guard exists
    const { ObjectId } = await import('mongodb')
    const guard = await usersCollection.findOne({ _id: new ObjectId(guardId) })
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Check if already checked in today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingCheckin = await attendanceCollection.findOne({
      guardId: new ObjectId(guardId),
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $exists: true }
    })

    if (existingCheckin && !existingCheckin.checkOut) {
      return res.status(400).json({ error: 'Already checked in today. Please check out first.' })
    }

    // Record check-in
    const record = {
      guardId: new ObjectId(guardId),
      date: new Date(),
      checkIn: new Date(),
      checkOut: null,
      createdAt: new Date()
    }

    const result = await attendanceCollection.insertOne(record)

    res.json({ 
      message: 'Check-in successful',
      attendanceId: result.insertedId,
      checkInTime: record.checkIn
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Guard check-out
app.post('/api/attendance/checkout', async (req, res) => {
  try {
    if (!attendanceCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { attendanceId } = req.body

    if (!attendanceId) {
      return res.status(400).json({ error: 'Attendance ID is required' })
    }

    const { ObjectId } = await import('mongodb')
    const result = await attendanceCollection.updateOne(
      { _id: new ObjectId(attendanceId) },
      { $set: { checkOut: new Date() } }
    )

    if (result.matchedCount === 0) {
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
    if (!feedbackCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { guardId, rating, comment, submittedBy } = req.body

    if (!guardId || !rating || !submittedBy) {
      return res.status(400).json({ error: 'Guard ID, rating, and submitted by are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const { ObjectId } = await import('mongodb')
    
    // Verify guard exists
    const guard = await usersCollection.findOne({ _id: new ObjectId(guardId) })
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    const feedback = {
      guardId: new ObjectId(guardId),
      rating,
      comment: comment || '',
      submittedBy,
      submittedAt: new Date(),
      createdAt: new Date()
    }

    const result = await feedbackCollection.insertOne(feedback)

    res.json({ 
      message: 'Feedback submitted successfully',
      feedbackId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get merit scores (all guards ranked)
app.get('/api/performance/merit-scores', async (req, res) => {
  try {
    if (!usersCollection || !attendanceCollection || !feedbackCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    
    // Get all security guards (role: 'user')
    const guards = await usersCollection.find({ role: 'user' }).toArray()

    const meritScores = []
    
    for (const guard of guards) {
      try {
        // Attendance score (40%)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const attendanceRecords = await attendanceCollection.find({
          guardId: guard._id,
          date: { $gte: thirtyDaysAgo }
        }).toArray()

        const daysPresent = attendanceRecords.filter(r => r.checkIn && r.checkOut).length
        const totalWorkingDays = 30
        const attendanceScore = (daysPresent / totalWorkingDays) * 100

        // Punctuality score (30%) - on time if checked in before 9 AM
        const onTimeCount = attendanceRecords.filter(r => {
          const checkInHour = new Date(r.checkIn).getHours()
          return checkInHour <= 9
        }).length
        const punctualityScore = (onTimeCount / Math.max(daysPresent, 1)) * 100

        // Feedback score (30%) - average rating
        const feedbackRecords = await feedbackCollection.find({
          guardId: guard._id
        }).toArray()

        const feedbackScore = feedbackRecords.length > 0
          ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length) * 20
          : 0

        // Merit score calculation
        const meritScore = (attendanceScore * 0.4) + (punctualityScore * 0.3) + (feedbackScore * 0.3)

        meritScores.push({
          id: guard._id,
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
        console.error(`Error calculating merit for guard ${guard._id}:`, guardError.message)
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
    if (!usersCollection || !attendanceCollection || !feedbackCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const guardId = new ObjectId(req.params.id)

    // Get guard
    const guard = await usersCollection.findOne({ _id: guardId })
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Get attendance records (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const attendanceRecords = await attendanceCollection.find({
      guardId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 }).toArray()

    // Get feedback records
    const feedbackRecords = await feedbackCollection.find({
      guardId
    }).sort({ submittedAt: -1 }).toArray()

    // Calculate metrics
    const daysPresent = attendanceRecords.filter(r => r.checkIn && r.checkOut).length
    const onTimeCount = attendanceRecords.filter(r => {
      const checkInHour = new Date(r.checkIn).getHours()
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
        id: guard._id,
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
          checkIn: r.checkIn,
          checkOut: r.checkOut
        }))
      },
      feedback: {
        total: feedbackRecords.length,
        averageRating: feedbackRecords.length > 0
          ? (feedbackRecords.reduce((sum, f) => sum + f.rating, 0) / feedbackRecords.length).toFixed(2)
          : 0,
        records: feedbackRecords.map(f => ({
          rating: f.rating,
          comment: f.comment,
          submittedBy: f.submittedBy,
          submittedAt: f.submittedAt
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
    if (!firearmsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { serialNumber, model, condition, status } = req.body

    if (!serialNumber || !model || !condition || !status) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Check if serial number already exists
    const existing = await firearmsCollection.findOne({ serialNumber })
    if (existing) {
      return res.status(400).json({ error: 'Firearm with this serial number already exists' })
    }

    const result = await firearmsCollection.insertOne({
      serialNumber,
      model,
      condition,
      status,
      createdAt: new Date(),
      lastMaintenanceDate: null,
      currentAllocationId: null
    })

    res.status(201).json({
      message: 'Firearm added successfully',
      firearmId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all firearms
app.get('/api/firearms', async (req, res) => {
  try {
    if (!firearmsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const firearms = await firearmsCollection.find({}).toArray()

    res.json(firearms.map(f => ({
      _id: f._id,
      serialNumber: f.serialNumber,
      type: f.type,
      model: f.model,
      caliber: f.caliber,
      condition: f.condition,
      status: f.status,
      location: f.location,
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
    if (!firearmsCollection || !firearmAllocationsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const firearm = await firearmsCollection.findOne({ _id: new ObjectId(req.params.id) })

    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    // Get allocation history
    const allocationHistory = await firearmAllocationsCollection
      .find({ firearmId: firearm._id })
      .sort({ issuedAt: -1 })
      .limit(20)
      .toArray()

    res.json({
      firearm: {
        id: firearm._id,
        serialNumber: firearm.serialNumber,
        model: firearm.model,
        condition: firearm.condition,
        status: firearm.status,
        currentAllocationId: firearm.currentAllocationId,
        lastMaintenanceDate: firearm.lastMaintenanceDate,
        createdAt: firearm.createdAt
      },
      allocationHistory: allocationHistory.map(a => ({
        id: a._id,
        guardId: a.guardId,
        issuedAt: a.issuedAt,
        returnedAt: a.returnedAt,
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
    if (!firearmsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const { condition, status } = req.body

    const updateData = {}
    if (condition) updateData.condition = condition
    if (status) updateData.status = status

    const result = await firearmsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
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
    if (!firearmsCollection || !firearmAllocationsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const firearmId = new ObjectId(req.params.id)

    // Check if firearm is currently allocated
    const allocation = await firearmAllocationsCollection.findOne({
      firearmId,
      returnedAt: null
    })

    if (allocation) {
      return res.status(400).json({ error: 'Cannot delete firearm that is currently allocated' })
    }

    const result = await firearmsCollection.deleteOne({ _id: firearmId })

    if (result.deletedCount === 0) {
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
    if (!guardFirearmPermitsCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { guardId, permitNumber, trainingDate, expiryDate } = req.body

    if (!guardId || !permitNumber || !trainingDate || !expiryDate) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const { ObjectId } = await import('mongodb')

    // Check if guard exists
    const guard = await usersCollection.findOne({ _id: new ObjectId(guardId) })
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Check if permit already exists
    const existing = await guardFirearmPermitsCollection.findOne({ guardId: new ObjectId(guardId) })

    if (existing) {
      // Update existing permit
      const result = await guardFirearmPermitsCollection.updateOne(
        { guardId: new ObjectId(guardId) },
        { $set: { permitNumber, trainingDate: new Date(trainingDate), expiryDate: new Date(expiryDate), updatedAt: new Date() } }
      )
      return res.json({ message: 'Permit updated successfully' })
    }

    // Create new permit
    const result = await guardFirearmPermitsCollection.insertOne({
      guardId: new ObjectId(guardId),
      permitNumber,
      trainingDate: new Date(trainingDate),
      expiryDate: new Date(expiryDate),
      status: 'active',
      createdAt: new Date()
    })

    res.status(201).json({
      message: 'Permit added successfully',
      permitId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get guard firearm permit
app.get('/api/guard-firearm-permits/:guardId', async (req, res) => {
  try {
    if (!guardFirearmPermitsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const permit = await guardFirearmPermitsCollection.findOne({ guardId: new ObjectId(req.params.guardId) })

    if (!permit) {
      return res.status(404).json({ error: 'No permit found for this guard' })
    }

    const isExpired = new Date() > new Date(permit.expiryDate)

    res.json({
      id: permit._id,
      guardId: permit.guardId,
      permitNumber: permit.permitNumber,
      trainingDate: permit.trainingDate,
      expiryDate: permit.expiryDate,
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
    if (!firearmAllocationsCollection || !firearmsCollection || !guardFirearmPermitsCollection || !usersCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { firearmId, guardId, notes } = req.body

    if (!firearmId || !guardId) {
      return res.status(400).json({ error: 'Firearm ID and Guard ID are required' })
    }

    const { ObjectId } = await import('mongodb')

    // Verify guard exists
    const guard = await usersCollection.findOne({ _id: new ObjectId(guardId) })
    if (!guard) {
      return res.status(404).json({ error: 'Guard not found' })
    }

    // Verify guard has valid permit
    const permit = await guardFirearmPermitsCollection.findOne({ guardId: new ObjectId(guardId) })
    if (!permit) {
      return res.status(400).json({ error: 'Guard does not have a firearm permit' })
    }

    const isPermitExpired = new Date() > new Date(permit.expiryDate)
    if (isPermitExpired) {
      return res.status(400).json({ error: 'Guard\'s firearm permit has expired' })
    }

    // Verify firearm exists and is available
    const firearm = await firearmsCollection.findOne({ _id: new ObjectId(firearmId) })
    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    if (firearm.status !== 'available') {
      return res.status(400).json({ error: 'Firearm is not available for allocation' })
    }

    // Check if firearm is already allocated
    if (firearm.currentAllocationId) {
      return res.status(400).json({ error: 'Firearm is already allocated' })
    }

    // Create allocation record
    const allocation = {
      firearmId: new ObjectId(firearmId),
      guardId: new ObjectId(guardId),
      issuedAt: new Date(),
      returnedAt: null,
      status: 'allocated',
      notes: notes || '',
      createdAt: new Date()
    }

    const result = await firearmAllocationsCollection.insertOne(allocation)

    // Update firearm status
    await firearmsCollection.updateOne(
      { _id: new ObjectId(firearmId) },
      { $set: { status: 'allocated', currentAllocationId: result.insertedId } }
    )

    res.status(201).json({
      message: 'Firearm issued successfully',
      allocationId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Return firearm from guard
app.post('/api/firearm-allocation/return', async (req, res) => {
  try {
    if (!firearmAllocationsCollection || !firearmsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { allocationId, condition, notes } = req.body

    if (!allocationId) {
      return res.status(400).json({ error: 'Allocation ID is required' })
    }

    const { ObjectId } = await import('mongodb')

    // Find allocation
    const allocation = await firearmAllocationsCollection.findOne({ _id: new ObjectId(allocationId) })
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' })
    }

    if (allocation.returnedAt) {
      return res.status(400).json({ error: 'Firearm has already been returned' })
    }

    // Update allocation
    const returnData = {
      returnedAt: new Date(),
      status: 'returned',
      returnCondition: condition || 'good',
      returnNotes: notes || ''
    }

    await firearmAllocationsCollection.updateOne(
      { _id: new ObjectId(allocationId) },
      { $set: returnData }
    )

    // Update firearm status
    await firearmsCollection.updateOne(
      { _id: allocation.firearmId },
      { $set: { status: 'available', currentAllocationId: null, condition: condition || 'good' } }
    )

    res.json({ message: 'Firearm returned successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get allocation history for a guard
app.get('/api/guard-allocations/:guardId', async (req, res) => {
  try {
    if (!firearmAllocationsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')

    const allocations = await firearmAllocationsCollection
      .find({ guardId: new ObjectId(req.params.guardId) })
      .sort({ issuedAt: -1 })
      .toArray()

    res.json({
      total: allocations.length,
      allocations: allocations.map(a => ({
        id: a._id,
        firearmId: a.firearmId,
        issuedAt: a.issuedAt,
        returnedAt: a.returnedAt,
        status: a.status,
        notes: a.notes,
        returnCondition: a.returnCondition
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current active allocations
app.get('/api/firearm-allocations/active', async (req, res) => {
  try {
    if (!firearmAllocationsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const activeAllocations = await firearmAllocationsCollection
      .find({ returnedAt: null, status: 'allocated' })
      .toArray()

    res.json({
      total: activeAllocations.length,
      allocations: activeAllocations.map(a => ({
        id: a._id,
        firearmId: a.firearmId,
        guardId: a.guardId,
        issuedAt: a.issuedAt,
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
    if (!firearmMaintenanceCollection || !firearmsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { firearmId, maintenanceType, notes } = req.body

    if (!firearmId || !maintenanceType) {
      return res.status(400).json({ error: 'Firearm ID and maintenance type are required' })
    }

    const { ObjectId } = await import('mongodb')

    // Verify firearm exists
    const firearm = await firearmsCollection.findOne({ _id: new ObjectId(firearmId) })
    if (!firearm) {
      return res.status(404).json({ error: 'Firearm not found' })
    }

    // Record maintenance
    const result = await firearmMaintenanceCollection.insertOne({
      firearmId: new ObjectId(firearmId),
      maintenanceType,
      notes: notes || '',
      maintenanceDate: new Date(),
      createdAt: new Date()
    })

    // Update firearm's last maintenance date
    if (maintenanceType === 'service' || maintenanceType === 'inspection') {
      await firearmsCollection.updateOne(
        { _id: new ObjectId(firearmId) },
        { $set: { lastMaintenanceDate: new Date() } }
      )
    }

    res.status(201).json({
      message: 'Maintenance recorded successfully',
      maintenanceId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get maintenance history for firearm
app.get('/api/firearm-maintenance/:firearmId', async (req, res) => {
  try {
    if (!firearmMaintenanceCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')

    const maintenance = await firearmMaintenanceCollection
      .find({ firearmId: new ObjectId(req.params.firearmId) })
      .sort({ maintenanceDate: -1 })
      .toArray()

    res.json({
      total: maintenance.length,
      records: maintenance.map(m => ({
        id: m._id,
        maintenanceType: m.maintenanceType,
        notes: m.notes,
        maintenanceDate: m.maintenanceDate
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== REPORTS API ====================

// Get all firearm allocations (for reports)
app.get('/api/firearm-allocations', async (req, res) => {
  try {
    if (!firearmAllocationsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const allocations = await firearmAllocationsCollection
      .find({})
      .sort({ allocationDate: -1 })
      .toArray()

    res.json(allocations.map(a => ({
      _id: a._id,
      guardId: a.guardId,
      guardName: a.guardName,
      firearmId: a.firearmId,
      firearmSerialNumber: a.firearmSerialNumber,
      firearmModel: a.firearmModel,
      firearmCaliber: a.firearmCaliber,
      allocationDate: a.allocationDate,
      returnDate: a.returnDate,
      purpose: a.purpose,
      status: a.status,
      condition: a.condition,
      conditionOnReturn: a.conditionOnReturn,
      notes: a.notes
    })))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all guard firearm permits (for reports)
app.get('/api/guard-firearm-permits', async (req, res) => {
  try {
    if (!guardFirearmPermitsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const permits = await guardFirearmPermitsCollection
      .find({})
      .sort({ issueDate: -1 })
      .toArray()

    res.json(permits.map(p => ({
      _id: p._id,
      guardId: p.guardId,
      guardName: p.guardName,
      firearmId: p.firearmId,
      firearmSerialNumber: p.firearmSerialNumber,
      issueDate: p.issueDate,
      expiryDate: p.expiryDate,
      authority: p.authority,
      permitNumber: p.permitNumber,
      status: p.status,
      renewalRequestDate: p.renewalRequestDate
    })))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all firearm maintenance records (for reports)
app.get('/api/firearm-maintenance', async (req, res) => {
  try {
    if (!firearmMaintenanceCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const maintenance = await firearmMaintenanceCollection
      .find({})
      .sort({ date: -1 })
      .toArray()

    res.json(maintenance.map(m => ({
      _id: m._id,
      firearmId: m.firearmId,
      firearmSerialNumber: m.firearmSerialNumber,
      maintenanceType: m.maintenanceType,
      date: m.date,
      performedBy: m.performedBy,
      notes: m.notes,
      nextDueDate: m.nextDueDate,
      cost: m.cost
    })))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== ALERTS API ====================

// Create alert
app.post('/api/alerts', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { type, title, message, guardId, firearmId, priority, relatedId } = req.body

    if (!type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const alert = {
      type, // 'permit_expiry', 'maintenance_due', 'low_stock', 'allocation', 'general'
      title,
      message,
      guardId: guardId || null,
      firearmId: firearmId || null,
      priority: priority || 'medium', // 'low', 'medium', 'high', 'critical'
      relatedId: relatedId || null,
      isRead: false,
      createdAt: new Date(),
      createdBy: req.body.createdBy || 'system'
    }

    const result = await allocationAlertsCollection.insertOne(alert)

    res.status(201).json({
      message: 'Alert created successfully',
      alertId: result.insertedId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all alerts (with filtering)
app.get('/api/alerts', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { type, priority, isRead, guardId, limit = 50, skip = 0 } = req.query
    const filter = {}

    if (type) filter.type = type
    if (priority) filter.priority = priority
    if (isRead !== undefined) filter.isRead = isRead === 'true'
    if (guardId) {
      const { ObjectId } = await import('mongodb')
      filter.guardId = new ObjectId(guardId)
    }

    const alerts = await allocationAlertsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray()

    const total = await allocationAlertsCollection.countDocuments(filter)
    const unreadCount = await allocationAlertsCollection.countDocuments({ ...filter, isRead: false })

    res.json({
      total,
      unreadCount,
      alerts: alerts.map(a => ({
        id: a._id,
        type: a.type,
        title: a.title,
        message: a.message,
        guardId: a.guardId,
        firearmId: a.firearmId,
        priority: a.priority,
        isRead: a.isRead,
        createdAt: a.createdAt,
        createdBy: a.createdBy
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get alerts for specific user/guard
app.get('/api/alerts/user/:userId', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const { limit = 20, skip = 0 } = req.query

    const alerts = await allocationAlertsCollection
      .find({ guardId: new ObjectId(req.params.userId) })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray()

    const unreadCount = await allocationAlertsCollection.countDocuments({
      guardId: new ObjectId(req.params.userId),
      isRead: false
    })

    res.json({
      total: alerts.length,
      unreadCount,
      alerts: alerts.map(a => ({
        id: a._id,
        type: a.type,
        title: a.title,
        message: a.message,
        priority: a.priority,
        isRead: a.isRead,
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
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')

    const result = await allocationAlertsCollection.updateOne(
      { _id: new ObjectId(req.params.alertId) },
      { $set: { isRead: true, readAt: new Date() } }
    )

    res.json({
      message: 'Alert marked as read',
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark multiple alerts as read
app.patch('/api/alerts/read-multiple', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')
    const { alertIds } = req.body

    if (!Array.isArray(alertIds)) {
      return res.status(400).json({ error: 'alertIds must be an array' })
    }

    const result = await allocationAlertsCollection.updateMany(
      { _id: { $in: alertIds.map(id => new ObjectId(id)) } },
      { $set: { isRead: true, readAt: new Date() } }
    )

    res.json({
      message: 'Alerts marked as read',
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete alert
app.delete('/api/alerts/:alertId', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const { ObjectId } = await import('mongodb')

    const result = await allocationAlertsCollection.deleteOne(
      { _id: new ObjectId(req.params.alertId) }
    )

    res.json({
      message: 'Alert deleted successfully',
      deletedCount: result.deletedCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Clear old alerts (older than 30 days)
app.delete('/api/alerts/clear-old', async (req, res) => {
  try {
    if (!allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await allocationAlertsCollection.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    })

    res.json({
      message: 'Old alerts cleared',
      deletedCount: result.deletedCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate expiring permit alerts
app.post('/api/alerts/generate/permits-expiring', async (req, res) => {
  try {
    if (!guardFirearmPermitsCollection || !allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const today = new Date()

    const expiringPermits = await guardFirearmPermitsCollection
      .find({
        expiryDate: { $gte: today, $lte: thirtyDaysFromNow },
        alertSent: false
      })
      .toArray()

    let alertsCreated = 0

    for (const permit of expiringPermits) {
      const daysUntilExpiry = Math.ceil(
        (permit.expiryDate - today) / (1000 * 60 * 60 * 24)
      )

      await allocationAlertsCollection.insertOne({
        type: 'permit_expiry',
        title: `Permit Expiring Soon`,
        message: `Firearm permit for guard expires in ${daysUntilExpiry} days`,
        guardId: permit.guardId,
        firearmId: permit.firearmId,
        priority: daysUntilExpiry <= 7 ? 'critical' : 'high',
        relatedId: permit._id,
        isRead: false,
        createdAt: new Date(),
        createdBy: 'system'
      })

      // Mark permit as alerted
      await guardFirearmPermitsCollection.updateOne(
        { _id: permit._id },
        { $set: { alertSent: true } }
      )

      alertsCreated++
    }

    res.json({
      message: 'Permit expiry alerts generated',
      alertsCreated,
      expiringPermitCount: expiringPermits.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate maintenance due alerts
app.post('/api/alerts/generate/maintenance-due', async (req, res) => {
  try {
    if (!firearmsCollection || !firearmMaintenanceCollection || !allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const firearmsNeedingMaintenance = await firearmsCollection
      .find({
        $or: [
          { lastMaintenanceDate: { $lt: sixtyDaysAgo } },
          { lastMaintenanceDate: { $exists: false } }
        ]
      })
      .toArray()

    let alertsCreated = 0

    for (const firearm of firearmsNeedingMaintenance) {
      // Check if alert already exists for this firearm
      const existingAlert = await allocationAlertsCollection.findOne({
        type: 'maintenance_due',
        firearmId: firearm._id,
        isRead: false
      })

      if (!existingAlert) {
        await allocationAlertsCollection.insertOne({
          type: 'maintenance_due',
          title: `Firearm Maintenance Due`,
          message: `Firearm ${firearm.serialNumber} is due for maintenance`,
          firearmId: firearm._id,
          priority: 'high',
          isRead: false,
          createdAt: new Date(),
          createdBy: 'system'
        })
        alertsCreated++
      }
    }

    res.json({
      message: 'Maintenance due alerts generated',
      alertsCreated,
      firearmsNeedingMaintenance: firearmsNeedingMaintenance.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Generate low stock alerts
app.post('/api/alerts/generate/low-stock', async (req, res) => {
  try {
    if (!firearmsCollection || !allocationAlertsCollection) {
      return res.status(503).json({ error: 'Database not connected' })
    }

    const lowStockFirearms = await firearmsCollection
      .find({ quantity: { $lte: 3 } })
      .toArray()

    let alertsCreated = 0

    for (const firearm of lowStockFirearms) {
      const existingAlert = await allocationAlertsCollection.findOne({
        type: 'low_stock',
        firearmId: firearm._id,
        isRead: false
      })

      if (!existingAlert) {
        await allocationAlertsCollection.insertOne({
          type: 'low_stock',
          title: `Low Firearm Stock`,
          message: `Only ${firearm.quantity} units of ${firearm.model} remaining`,
          firearmId: firearm._id,
          priority: firearm.quantity <= 1 ? 'critical' : 'medium',
          isRead: false,
          createdAt: new Date(),
          createdBy: 'system'
        })
        alertsCreated++
      }
    }

    res.json({
      message: 'Low stock alerts generated',
      alertsCreated,
      lowStockCount: lowStockFirearms.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mount Guard Replacement System Routes
app.use('/api', guardReplacementRoutes)

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    if (db) {
      console.log(`✓ Server running on http://localhost:${PORT} (Database connected)`)
    } else {
      console.log(`✓ Server running on http://localhost:${PORT} (Offline mode)`)
    }
  })
})
