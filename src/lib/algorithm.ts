import { getDb } from './firebase-utils'
import { Post, User } from '@/types'

// Helper function to ensure we're on client side
function ensureClientSide() {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side')
  }
  
  try {
    const db = getDb()
    if (!db) {
      throw new Error('Firestore database is not available')
    }
    return db
  } catch (error) {
    console.error('Firestore database error:', error)
    throw new Error('Firestore database is not available. Please check your Firebase configuration.')
  }
}

export interface AlgorithmPost extends Post {
  score: number
  distance: number
  posterName: string
  posterTrustScore: number
  posterAvatar: string
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate algorithm score based on user preferences and post characteristics
function calculateScore(
  post: Post, 
  user: User, 
  distance: number
): number {
  let score = 0

  // Base score
  score += 50

  // Distance factor (closer = higher score)
  const maxDistance = user.maxDistance || 5
  if (distance <= maxDistance) {
    score += (maxDistance - distance) * 10
  } else {
    return 0 // Don't show posts outside user's max distance
  }

  // Trust score factor
  score += post.foodMeta ? 20 : 0

  // Freshness factor (newer posts get higher scores)
  const hoursSincePosted = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)
  if (hoursSincePosted < 1) {
    score += 30
  } else if (hoursSincePosted < 6) {
    score += 20
  } else if (hoursSincePosted < 12) {
    score += 10
  }

  // User preference matching
  if (user.foodPreferences && user.foodPreferences.length > 0) {
    // This would need to be enhanced with actual cuisine detection
    // For now, we'll give a small bonus for any food preferences
    score += 15
  }

  // Dietary restrictions matching
  if (user.dietaryRestrictions && user.dietaryRestrictions.length > 0) {
    // Check if post matches user's dietary restrictions
    // This would need to be enhanced with actual dietary restriction detection
    score += 10
  }

  // Allergies avoidance
  if (user.allergies && user.allergies.length > 0) {
    // Check if post contains user's allergens
    // This would need to be enhanced with actual allergen detection
    score += 5
  }

  // Homemade preference
  if (user.cookingLevel === 'advanced' || user.cookingLevel === 'professional') {
    if (post.foodMeta?.homemade) {
      score += 15
    }
  }

  // Quantity factor (more items = higher score for some users)
  if (post.quantity > 1) {
    score += 5
  }

  return Math.min(score, 100) // Cap at 100
}

// Get personalized food suggestions for a user
export async function getPersonalizedFeed(
  userId: string, 
  limitCount: number = 10
): Promise<AlgorithmPost[]> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, query, where, getDocs, orderBy, limit, doc, getDoc } = await import('firebase/firestore')
    
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      throw new Error('User not found')
    }
    
    const user = userDoc.data() as User

    // Get available posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(50) // Get more posts to filter from
    )

    const postsSnapshot = await getDocs(postsQuery)
    const posts: Post[] = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post))

    // Calculate scores and distances for each post
    const scoredPosts: AlgorithmPost[] = []

    for (const post of posts) {
      // Skip posts from the same user
      if (post.userId === userId) {
        continue
      }

      // Calculate distance
      const distance = calculateDistance(
        user.lat || 0,
        user.lng || 0,
        post.location.lat,
        post.location.lng
      )

      // Calculate algorithm score
      const score = calculateScore(post, user, distance)

      // Only include posts with positive scores
      if (score > 0) {
        // Get poster information
        const posterDoc = await getDoc(doc(db, 'users', post.userId))
        const posterData = posterDoc.exists() ? posterDoc.data() as User : null

        scoredPosts.push({
          ...post,
          score,
          distance,
          posterName: posterData?.name || 'Anonymous',
          posterTrustScore: posterData?.trustScore || 0.5,
          posterAvatar: posterData?.photoURL || ''
        })
      }
    }

    // Sort by score (highest first) and return limited results
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount)

  } catch (error) {
    console.error('Error getting personalized feed:', error)
    return []
  }
}

// Get nearby food posts (fallback when algorithm fails)
export async function getNearbyPosts(
  lat: number,
  lng: number,
  maxDistance: number = 5,
  limitCount: number = 10
): Promise<AlgorithmPost[]> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, query, where, getDocs, orderBy, limit, doc, getDoc } = await import('firebase/firestore')
    
    const postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const postsSnapshot = await getDocs(postsQuery)
    const posts: Post[] = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post))

    const nearbyPosts: AlgorithmPost[] = []

    for (const post of posts) {
      const distance = calculateDistance(lat, lng, post.location.lat, post.location.lng)
      
      if (distance <= maxDistance) {
        // Get poster information
        const posterDoc = await getDoc(doc(db, 'users', post.userId))
        const posterData = posterDoc.exists() ? posterDoc.data() as User : null

        nearbyPosts.push({
          ...post,
          score: 50, // Base score for nearby posts
          distance,
          posterName: posterData?.name || 'Anonymous',
          posterTrustScore: posterData?.trustScore || 0.5,
          posterAvatar: posterData?.photoURL || ''
        })
      }
    }

    return nearbyPosts
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, limitCount)

  } catch (error) {
    console.error('Error getting nearby posts:', error)
    return []
  }
}
