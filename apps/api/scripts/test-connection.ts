/**
 * Test database connection
 * Usage: DATABASE_URL=... npx tsx scripts/test-connection.ts
 */
import postgres from 'postgres'

async function testConnection() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  console.log('Connecting to database...')
  const sql = postgres(connectionString)

  try {
    // List tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `
    console.log('Tables:', tables.map(t => t.table_name))

    // Insert test record
    const testAddress = '0x1234567890123456789012345678901234567890'
    const [inserted] = await sql`
      INSERT INTO profiles (address, nickname, nickname_normalized)
      VALUES (${testAddress}, 'testuser', 'testuser')
      RETURNING id, address, nickname
    `
    console.log('Test insert:', inserted)

    // Clean up
    await sql`DELETE FROM profiles WHERE address = ${testAddress}`
    console.log('Test cleanup: done')

    console.log('\n✅ Database connection successful!')
  } catch (error) {
    console.error('❌ Database error:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

testConnection()
