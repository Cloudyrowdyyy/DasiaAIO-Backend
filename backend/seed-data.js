import { MongoClient } from 'mongodb'

const MONGO_URL = 'mongodb://localhost:27017'
const DB_NAME = 'login_app'

async function seedDatabase() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Clear existing collections (but preserve test login accounts)
    await db.collection('firearms').deleteMany({})
    await db.collection('firearm-allocations').deleteMany({})
    await db.collection('guard-firearm-permits').deleteMany({})
    await db.collection('firearm-maintenance').deleteMany({})
    // Only delete seed-generated users, preserve testuser and testadmin
    await db.collection('users').deleteMany({
      username: { $in: ['guard1', 'guard2', 'admin1'] }
    })

    console.log('Cleared existing data...')

    // Insert test guards
    const guards = await db.collection('users').insertMany([
      {
        username: 'guard1',
        password: 'hashed',
        email: 'guard1@example.com',
        role: 'guard',
        firstName: 'John',
        lastName: 'Smith',
        badge: 'B001',
        status: 'active',
        createdAt: new Date('2024-01-15')
      },
      {
        username: 'guard2',
        password: 'hashed',
        email: 'guard2@example.com',
        role: 'guard',
        firstName: 'Jane',
        lastName: 'Doe',
        badge: 'B002',
        status: 'active',
        createdAt: new Date('2024-02-20')
      },
      {
        username: 'admin1',
        password: 'hashed',
        email: 'admin@example.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        status: 'active',
        createdAt: new Date('2024-01-01')
      }
    ])

    console.log(`✓ Created ${guards.insertedCount} test guards`)

    // Insert test firearms
    const firearms = await db.collection('firearms').insertMany([
      {
        serialNumber: 'SN001',
        type: 'Handgun',
        model: 'Glock 17',
        caliber: '9mm',
        condition: 'excellent',
        status: 'available',
        location: 'Armory Safe A',
        lastMaintenance: new Date('2024-01-10'),
        createdAt: new Date('2023-12-01')
      },
      {
        serialNumber: 'SN002',
        type: 'Rifle',
        model: 'AR-15',
        caliber: '5.56mm',
        condition: 'good',
        status: 'allocated',
        location: 'Armory Safe B',
        lastMaintenance: new Date('2024-01-20'),
        createdAt: new Date('2023-11-15')
      },
      {
        serialNumber: 'SN003',
        type: 'Shotgun',
        model: 'Mossberg 500',
        caliber: '12 gauge',
        condition: 'good',
        status: 'available',
        location: 'Armory Safe C',
        lastMaintenance: new Date('2023-12-05'),
        createdAt: new Date('2023-10-20')
      },
      {
        serialNumber: 'SN004',
        type: 'Handgun',
        model: 'Smith & Wesson M&P',
        caliber: '.40 S&W',
        condition: 'fair',
        status: 'maintenance',
        location: 'Maintenance Area',
        lastMaintenance: new Date('2024-01-05'),
        createdAt: new Date('2023-09-10')
      },
      {
        serialNumber: 'SN005',
        type: 'Pistol',
        model: 'SIG Sauer P226',
        caliber: '9mm',
        condition: 'excellent',
        status: 'allocated',
        location: 'Armory Safe A',
        lastMaintenance: new Date('2024-02-01'),
        createdAt: new Date('2024-01-15')
      }
    ])

    console.log(`✓ Created ${firearms.insertedCount} test firearms`)

    // Insert test allocations
    const allocations = await db.collection('firearm-allocations').insertMany([
      {
        guardId: guards.insertedIds[0].toString(),
        guardName: 'John Smith',
        firearmId: firearms.insertedIds[0].toString(),
        firearmSerialNumber: 'SN001',
        firearmModel: 'Glock 17',
        firearmCaliber: '9mm',
        allocationDate: new Date('2024-02-01'),
        returnDate: null,
        purpose: 'Daily patrol duty',
        status: 'active',
        condition: 'good',
        conditionOnReturn: null,
        notes: 'Allocated for morning shift'
      },
      {
        guardId: guards.insertedIds[1].toString(),
        guardName: 'Jane Doe',
        firearmId: firearms.insertedIds[1].toString(),
        firearmSerialNumber: 'SN002',
        firearmModel: 'AR-15',
        firearmCaliber: '5.56mm',
        allocationDate: new Date('2024-02-05'),
        returnDate: null,
        purpose: 'Security detail',
        status: 'active',
        condition: 'excellent',
        conditionOnReturn: null,
        notes: 'Allocated for special event'
      },
      {
        guardId: guards.insertedIds[0].toString(),
        guardName: 'John Smith',
        firearmId: firearms.insertedIds[4].toString(),
        firearmSerialNumber: 'SN005',
        firearmModel: 'SIG Sauer P226',
        firearmCaliber: '9mm',
        allocationDate: new Date('2024-01-20'),
        returnDate: new Date('2024-02-01'),
        purpose: 'Training exercise',
        status: 'returned',
        condition: 'good',
        conditionOnReturn: 'good',
        notes: 'Returned in good condition'
      }
    ])

    console.log(`✓ Created ${allocations.insertedCount} test allocations`)

    // Insert test permits
    const permits = await db.collection('guard-firearm-permits').insertMany([
      {
        guardId: guards.insertedIds[0].toString(),
        guardName: 'John Smith',
        firearmId: firearms.insertedIds[0].toString(),
        firearmSerialNumber: 'SN001',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        authority: 'Police Department',
        permitNumber: 'PERMIT001',
        status: 'active',
        renewalRequestDate: null
      },
      {
        guardId: guards.insertedIds[1].toString(),
        guardName: 'Jane Doe',
        firearmId: firearms.insertedIds[1].toString(),
        firearmSerialNumber: 'SN002',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2024-11-15'),
        authority: 'Police Department',
        permitNumber: 'PERMIT002',
        status: 'active',
        renewalRequestDate: null
      },
      {
        guardId: guards.insertedIds[0].toString(),
        guardName: 'John Smith',
        firearmId: firearms.insertedIds[4].toString(),
        firearmSerialNumber: 'SN005',
        issueDate: new Date('2023-12-01'),
        expiryDate: new Date('2024-08-01'),
        authority: 'Police Department',
        permitNumber: 'PERMIT003',
        status: 'expired',
        renewalRequestDate: null
      }
    ])

    console.log(`✓ Created ${permits.insertedCount} test permits`)

    // Insert test maintenance records
    const maintenance = await db.collection('firearm-maintenance').insertMany([
      {
        firearmId: firearms.insertedIds[0].toString(),
        firearmSerialNumber: 'SN001',
        maintenanceType: 'Routine Inspection',
        date: new Date('2024-01-10'),
        performedBy: 'John Smith',
        notes: 'Inspected and cleaned',
        nextDueDate: new Date('2024-04-10'),
        cost: 0
      },
      {
        firearmId: firearms.insertedIds[1].toString(),
        firearmSerialNumber: 'SN002',
        maintenanceType: 'Barrel Cleaning',
        date: new Date('2024-01-20'),
        performedBy: 'Admin User',
        notes: 'Deep barrel cleaning performed',
        nextDueDate: new Date('2024-04-20'),
        cost: 50
      },
      {
        firearmId: firearms.insertedIds[3].toString(),
        firearmSerialNumber: 'SN004',
        maintenanceType: 'Repair',
        date: new Date('2024-01-05'),
        performedBy: 'Admin User',
        notes: 'Spring replacement',
        nextDueDate: new Date('2024-12-31'),
        cost: 150
      },
      {
        firearmId: firearms.insertedIds[4].toString(),
        firearmSerialNumber: 'SN005',
        maintenanceType: 'Routine Inspection',
        date: new Date('2024-02-01'),
        performedBy: 'Admin User',
        notes: 'Pre-issue inspection',
        nextDueDate: new Date('2024-05-01'),
        cost: 0
      }
    ])

    console.log(`✓ Created ${maintenance.insertedCount} test maintenance records`)

    console.log('\n✓ Database seeding completed successfully!')
    console.log(`  - ${guards.insertedCount} guards`)
    console.log(`  - ${firearms.insertedCount} firearms`)
    console.log(`  - ${allocations.insertedCount} allocations`)
    console.log(`  - ${permits.insertedCount} permits`)
    console.log(`  - ${maintenance.insertedCount} maintenance records`)

  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await client.close()
  }
}

seedDatabase()
