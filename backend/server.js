import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

let db
let usersCollection
let verificationCollection
let attendanceCollection
let feedbackCollection

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

    if (!email || !password || !username || !role || !fullName || !phoneNumber || !licenseNumber || !licenseExpiryDate) {
      return res.status(400).json({ error: 'All fields are required' })
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

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email, phone number, and password are required' })
    }

    // Find user by email or phone number
    const user = await usersCollection.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(403).json({ error: 'Please verify your email first', requiresVerification: true })
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

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

// Edit user (Superadmin only)
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

// Delete user (Superadmin only)
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

    const meritScores = await Promise.all(guards.map(async (guard) => {
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

      return {
        id: guard._id,
        name: guard.fullName,
        email: guard.email,
        phone: guard.phoneNumber,
        attendanceScore: Math.round(attendanceScore),
        punctualityScore: Math.round(punctualityScore),
        feedbackScore: Math.round(feedbackScore),
        meritScore: Math.round(meritScore * 100) / 100,
        daysPresent,
        feedbackCount: feedbackRecords.length
      }
    }))

    // Sort by merit score descending
    meritScores.sort((a, b) => b.meritScore - a.meritScore)

    res.json({
      total: meritScores.length,
      scores: meritScores
    })
  } catch (error) {
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
