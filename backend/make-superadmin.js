import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

async function makeSuperadmin() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db('login_app')
    const usersCollection = db.collection('users')
    
    const email = 'dkgagaamain@gmail.com'
    
    const result = await usersCollection.updateOne(
      { email },
      { $set: { role: 'superadmin' } }
    )
    
    if (result.matchedCount === 0) {
      console.log('✗ User not found')
    } else if (result.modifiedCount === 0) {
      console.log('✓ User already is superadmin')
    } else {
      console.log('✓ User updated to superadmin!')
      console.log(`  Email: ${email}`)
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message)
  } finally {
    await client.close()
  }
}

makeSuperadmin()
