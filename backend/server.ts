import express, { Request, Response, Express } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sequelize from './database/config.js'
import bcrypt from 'bcryptjs'
import nodemailer, { Transporter } from 'nodemailer'
import replacementSystem from './guard-replacement-system.js'
import guardReplacementRoutes from './routes/guard-replacement.routes.js'
import {
  User, Verification, Attendance, Feedback, Firearm,
  FirearmAllocation, GuardFirearmPermit, FirearmMaintenance,
  AllocationAlert
} from './models/index.js'
import { Op } from 'sequelize'

dotenv.config()

// Type definitions
interface RegisterRequest {
  email: string
  password: string
  username: string
  role: 'user' | 'admin'
  adminCode?: string
  fullName: string
  phoneNumber: string
  licenseNumber?: string
  licenseExpiryDate?: string
}

interface LoginRequest {
  identifier: string
  password: string
}

interface VerifyRequest {
  email: string
  code: string
}

const app: Express = express()
const PORT = process.env.PORT || 5000

// Email configuration
const transporter: Transporter = nodemailer.createTransport({
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
function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send confirmation email
async function sendConfirmationEmail(email: string, confirmationCode: string): Promise<void> {
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
  } catch (error: any) {
    console.error('✗ Failed to send email:', error.message)
    throw new Error('Failed to send confirmation email')
  }
}

// Initialize database
async function initializeDB(): Promise<void> {
  try {
    await sequelize.authenticate()
    console.log('✓ Connected to PostgreSQL')
    
    await sequelize.sync({ alter: true })
    console.log('✓ Database synchronized')
    
    await replacementSystem.initializeReplacementSystem()
    console.log('✓ Guard Replacement System initialized')
  } catch (error: any) {
    console.warn('⚠ Database connection failed:', error.message)
    console.warn('⚠ Please check your PostgreSQL connection')
  }
}

// ============ AUTH ENDPOINTS ============

// Register user
app.post('/api/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, role, adminCode, fullName, phoneNumber, licenseNumber, licenseExpiryDate } = req.body as RegisterRequest

    console.log('Register request received:', { email, username, role, fullName, phoneNumber })

    // For admin accounts, license fields are optional
    if (role === 'admin') {
      if (!email || !password || !username || !role || !fullName || !phoneNumber) {
        res.status(400).json({ error: 'Email, password, username, full name, and phone number are required for admin accounts' })
        return
      }
    } else {
      // For regular users, all fields including license are required
      if (!email || !password || !username || !role || !fullName || !phoneNumber || !licenseNumber || !licenseExpiryDate) {
        res.status(400).json({ error: 'All fields are required for regular user accounts' })
        return
      }
    }

    // Validate Gmail domain
    if (!email.endsWith('@gmail.com')) {
      res.status(400).json({ error: 'You must use a Gmail account (email must end with @gmail.com)' })
      return
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Role must be "user" or "admin"' })
      return
    }

    // Validate admin code if admin role
    if (role === 'admin') {
      if (!adminCode) {
        res.status(400).json({ error: 'Admin code is required' })
        return
      }
      if (adminCode !== '122601') {
        res.status(400).json({ error: 'Invalid admin code' })
        return
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' })
      return
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
    } as any)

    // Store verification code with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await Verification.create({
      userId: user.id,
      code: confirmationCode,
      expiresAt
    } as any)

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, confirmationCode)
    } catch (emailError: any) {
      res.status(500).json({ error: 'Failed to send confirmation email' })
      return
    }

    res.status(201).json({
      message: 'Registration successful! Check your Gmail for confirmation code.',
      userId: user.id,
      email,
      requiresVerification: true
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Verify email confirmation code
app.post('/api/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body as VerifyRequest

    if (!email || !code) {
      res.status(400).json({ error: 'Email and code are required' })
      return
    }

    // Find verification record
    const verification = await Verification.findOne({ where: { code } } as any)
    if (!verification) {
      res.status(400).json({ error: 'Invalid confirmation code' })
      return
    }

    // Check if code expired
    if (new Date() > new Date(verification.expiresAt)) {
      await verification.destroy()
      res.status(400).json({ error: 'Confirmation code expired' })
      return
    }

    // Mark user as verified
    await User.update(
      { verified: true },
      { where: { id: verification.userId } } as any
    )

    // Delete verification record
    await verification.destroy()

    res.json({ message: 'Email verified successfully! You can now login.' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Resend verification code
app.post('/api/resend-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    // Find user
    const user = await User.findOne({ where: { email } })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Generate new code
    const confirmationCode = generateConfirmationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Delete old verification if exists
    await Verification.destroy({ where: { userId: user.id } } as any)

    // Create new verification
    await Verification.create({
      userId: user.id,
      code: confirmationCode,
      expiresAt
    } as any)

    // Send email
    await sendConfirmationEmail(email, confirmationCode)

    res.json({ message: 'Verification code resent to your email' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Login user
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body as LoginRequest

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/phone and password are required' })
      return
    }

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phoneNumber: identifier }
        ]
      }
    } as any)

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Check if user is verified
    if (!user.verified) {
      res.status(403).json({ 
        error: 'Please verify your email first',
        requiresVerification: true,
        email: user.email
      })
      return
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Return user data (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber
    }

    res.json({
      message: 'Login successful',
      user: userResponse
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ============ USER MANAGEMENT ENDPOINTS ============

// Get all users
app.get('/api/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    })

    res.json({
      total: users.length,
      users
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get user by ID
app.get('/api/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id as string, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json(user)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update user profile
app.put('/api/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, phoneNumber, licenseNumber, licenseExpiryDate } = req.body

    const user = await User.findByPk(req.params.id as string)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    if (fullName) user.fullName = fullName
    if (phoneNumber) user.phoneNumber = phoneNumber
    if (licenseNumber) user.licenseNumber = licenseNumber
    if (licenseExpiryDate) user.licenseExpiryDate = licenseExpiryDate

    await user.save()

    res.json({ message: 'User updated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete user
app.delete('/api/user/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id as string)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    await user.destroy()
    res.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ============ FIREARM MANAGEMENT ENDPOINTS ============

// Add firearm
app.post('/api/firearms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { serialNumber, model, caliber, status } = req.body

    if (!serialNumber || !model || !caliber) {
      res.status(400).json({ error: 'Serial number, model, and caliber are required' })
      return
    }

    const firearm = await Firearm.create({
      name: model,
      serialNumber,
      model,
      caliber,
      status: status || 'available'
    } as any)

    res.status(201).json({
      message: 'Firearm added successfully',
      firearmId: firearm.id
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get all firearms
app.get('/api/firearms', async (req: Request, res: Response): Promise<void> => {
  try {
    const firearms = await Firearm.findAll()
    res.json(firearms)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get firearm by ID
app.get('/api/firearms/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firearm = await Firearm.findByPk(req.params.id as string)
    if (!firearm) {
      res.status(404).json({ error: 'Firearm not found' })
      return
    }

    const allocationHistory = await FirearmAllocation.findAll({
      where: { firearmId: req.params.id }
    })

    res.json({
      firearm,
      allocationHistory
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update firearm
app.put('/api/firearms/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, caliber } = req.body

    const firearm = await Firearm.findByPk(req.params.id as string)
    if (!firearm) {
      res.status(404).json({ error: 'Firearm not found' })
      return
    }

    if (status) firearm.status = status
    if (caliber) firearm.caliber = caliber

    await firearm.save()
    res.json({ message: 'Firearm updated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete firearm
app.delete('/api/firearms/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const firearm = await Firearm.findByPk(req.params.id as string)
    if (!firearm) {
      res.status(404).json({ error: 'Firearm not found' })
      return
    }

    await firearm.destroy()
    res.json({ message: 'Firearm deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ============ FIREARM ALLOCATION ENDPOINTS ============

// Issue firearm allocation
app.post('/api/firearm-allocation/issue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firearmId, guardId, notes } = req.body

    if (!firearmId || !guardId) {
      res.status(400).json({ error: 'Firearm ID and Guard ID are required' })
      return
    }

    // Check if firearm exists
    const firearm = await Firearm.findByPk(firearmId)
    if (!firearm) {
      res.status(404).json({ error: 'Firearm not found' })
      return
    }

    // Check if guard exists
    const guard = await User.findByPk(guardId)
    if (!guard) {
      res.status(404).json({ error: 'Guard not found' })
      return
    }

    // Create allocation
    const allocation = await FirearmAllocation.create({
      firearmId,
      guardId,
      allocationDate: new Date(),
      status: 'active'
    } as any)

    // Update firearm status
    await firearm.update({ status: 'allocated' })

    res.status(201).json({
      message: 'Firearm allocated successfully',
      allocationId: allocation.id
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Return firearm allocation
app.post('/api/firearm-allocation/return', async (req: Request, res: Response): Promise<void> => {
  try {
    const { allocationId } = req.body

    if (!allocationId) {
      res.status(400).json({ error: 'Allocation ID is required' })
      return
    }

    const allocation = await FirearmAllocation.findByPk(allocationId)
    if (!allocation) {
      res.status(404).json({ error: 'Allocation not found' })
      return
    }

    // Update allocation
    await allocation.update({
      returnDate: new Date(),
      status: 'returned'
    })

    // Update firearm status
    const firearm = await Firearm.findByPk(allocation.firearmId)
    if (firearm) {
      await firearm.update({ status: 'available' })
    }

    res.json({ message: 'Firearm returned successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get active allocations for guard
app.get('/api/guard-allocations/:guardId', async (req: Request, res: Response): Promise<void> => {
  try {
    const allocations = await FirearmAllocation.findAll({
      where: { guardId: req.params.guardId, status: 'active' }
    })

    res.json({
      total: allocations.length,
      allocations
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get all active allocations
app.get('/api/firearm-allocations/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const allocations = await FirearmAllocation.findAll({
      where: { status: 'active' }
    })

    res.json({
      total: allocations.length,
      allocations
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ============ HEALTH CHECK ============

app.get('/api/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' })
})

// Guard Replacement Routes
app.use('/api/guard-replacement', guardReplacementRoutes)

// Start server
async function startServer(): Promise<void> {
  await initializeDB()
  
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`)
    console.log(`✓ API Documentation available at routes in /api prefix`)
    console.log(`\n--- Guard Firearm Management System Ready ---\n`)
  })
}

startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

export default app
