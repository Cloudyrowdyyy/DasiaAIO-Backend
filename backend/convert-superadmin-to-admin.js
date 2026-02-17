import { MongoClient } from 'mongodb'

const MONGODB_URI = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function convertSuperadminToAdmin() {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✓ MongoDB connection successful')
    
    const db = client.db(DB_NAME)
    const usersCollection = db.collection('users')
    
    // Find superadmin users
    const result = await usersCollection.updateMany(
      { role: 'superadmin' },
      { $set: { role: 'admin' } }
    )
    
    console.log(`✓ Updated ${result.modifiedCount} users from superadmin to admin`)
    
    // Show all admin users now
    const adminUsers = await usersCollection.find({ role: 'admin' }).toArray()
    console.log('\n✓ Current admin users:')
    adminUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.username})`)
    })
    
    await client.close()
    console.log('\n✓ Database conversion complete!')
    
  } catch (error) {
    console.error('✗ Error converting superadmin to admin:', error.message)
    process.exit(1)
  }
}

convertSuperadminToAdmin()
