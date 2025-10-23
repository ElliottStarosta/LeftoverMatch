// Simple Firebase connection test
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...')
    
    // Test if we can get the database
    const { getDb } = await import('./firebase-utils')
    const db = getDb()
    
    if (!db) {
      throw new Error('Database is null')
    }
    
    console.log('✅ Firebase connection successful')
    console.log('Database instance:', db)
    
    return true
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    return false
  }
}
