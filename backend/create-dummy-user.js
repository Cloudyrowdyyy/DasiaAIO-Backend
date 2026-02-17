import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGODB_URI = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function createDummyUser() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✓ MongoDB connection successful')
    
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')
    
    // Check if dummy user already exists
    const existingUser = await usersCollection.findOne({
      email: 'dummy@gmail.com'
    })
    
    if (existingUser) {
      console.log('✗ Dummy user already exists')
      console.log(`  Email: dummy@gmail.com`)
      console.log(`  Username: dummyuser`)
      console.log(`  Password: dummypass123`)
      await client.close()
      return
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('dummypass123', 10)
    
    // Create dummy user
    const result = await usersCollection.insertOne({
      email: 'dummy@gmail.com',
      username: 'dummyuser',
      password: hashedPassword,
      fullName: 'Dummy User',
      phoneNumber: '+63-905-123-4567',
      licenseNumber: 'DL12345678',
      licenseExpiryDate: new Date('2027-12-31'),
      role: 'user',
      verified: true,
      createdAt: new Date()
    })
    
    console.log('✓ Dummy user created successfully!')
    console.log(`\n📋 Credentials:`)
    console.log(`  Email: dummy@gmail.com`)
    console.log(`  Username: dummyuser`)
    console.log(`  Password: dummypass123`)
    console.log(`  Role: user`)
    console.log(`  Phone: +63-905-123-4567`)
    console.log(`\n🔑 User ID: ${result.insertedId}`)
    
    await client.close()
    console.log('\n✓ Done!')
    
  } catch (error) {
    console.error('✗ Error creating dummy user:', error.message)
    process.exit(1)
  }
}

createDummyUser()
