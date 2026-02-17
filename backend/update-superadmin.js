import { MongoClient } from 'mongodb'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function updateUserRole() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Update user role to superadmin
    const result = await db.collection('users').updateOne(
      { email: 'dkgagaamain@gmail.com' },
      { $set: { role: 'superadmin' } }
    )

    if (result.modifiedCount > 0) {
      console.log('✓ User role updated to superadmin!')
      console.log('  Email: dkgagaamain@gmail.com')
      console.log('  New Role: superadmin')
      
      // Verify the update
      const updated = await db.collection('users').findOne({
        email: 'dkgagaamain@gmail.com'
      })
      console.log('  Verified Role:', updated.role)
    } else {
      console.log('User not found')
    }

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.close()
  }
}

updateUserRole()
