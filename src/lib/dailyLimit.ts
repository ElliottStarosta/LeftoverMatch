import { getDb } from './firebase-utils'

export async function checkDailyClaimLimit(userId: string): Promise<{
  canClaim: boolean
  claimsToday: number
  maxClaims: number
  resetTime: Date
}> {
  try {
    const db = getDb()
    if (!db) throw new Error('Database not available')

    const { doc, getDoc, updateDoc } = await import('firebase/firestore')

    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const userData = userDoc.data()
    const maxClaims = 10 // Daily limit per user

    // Get or initialize daily claim tracking
    const dailyClaimsData = userData.dailyClaims || {}
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Check if we need to reset (new day)
    if (dailyClaimsData.date !== today) {
      // Reset for new day
      await updateDoc(userRef, {
        dailyClaims: {
          date: today,
          count: 0,
          resetTime: new Date()
        }
      })

      return {
        canClaim: true,
        claimsToday: 0,
        maxClaims,
        resetTime: getTomorrowMidnight()
      }
    }

    const claimsToday = dailyClaimsData.count || 0
    const canClaim = claimsToday < maxClaims

    return {
      canClaim,
      claimsToday,
      maxClaims,
      resetTime: getTomorrowMidnight()
    }
  } catch (error) {
    console.error('Error checking daily claim limit:', error)
    throw error
  }
}

// Increment the daily claim count
export async function incrementDailyClaimCount(userId: string): Promise<void> {
  try {
    const db = getDb()
    if (!db) throw new Error('Database not available')

    const { doc, getDoc, updateDoc, increment } = await import('firebase/firestore')

    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error('User not found')
    }

    const userData = userDoc.data()
    const dailyClaimsData = userData.dailyClaims || {}
    const today = new Date().toISOString().split('T')[0]

    // Check if it's still the same day
    if (dailyClaimsData.date === today) {
      await updateDoc(userRef, {
        'dailyClaims.count': increment(1)
      })
    } else {
      // New day, reset counter
      await updateDoc(userRef, {
        dailyClaims: {
          date: today,
          count: 1,
          resetTime: new Date()
        }
      })
    }
  } catch (error) {
    console.error('Error incrementing daily claim count:', error)
    throw error
  }
}

// Helper function to get tomorrow at midnight
function getTomorrowMidnight(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}