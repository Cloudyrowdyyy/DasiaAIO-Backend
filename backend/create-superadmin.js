import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

async function createSuperadmin() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('login_app')
    const usersCollection = db.collection('users')
    
    const email = 'dkgagaamain@gmail.com'
    const password = 'december262001'
    const username = 'superadmin'
    
    // Check if superadmin already exists
    const existing = await usersCollection.findOne({ email })
    if (existing) {
      console.log('✗ Superadmin already exists')
      return
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create superadmin
    const result = await usersCollection.insertOne({
      email,
      username,
      password: hashedPassword,
      role: 'superadmin',
      fullName: 'Super Administrator',
      phoneNumber: '000-0000-0000',
      licenseNumber: 'SUPER-ADMIN-001',
      licenseExpiryDate: new Date('2099-12-31'),
      verified: true,
      createdAt: new Date()
    })
    
    console.log('✓ Superadmin created successfully!')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  ID: ${result.insertedId}`)
    
  } catch (error) {
    console.error('✗ Error creating superadmin:', error.message)
  } finally {
    await client.close()
  }
}

createSuperadmin()
