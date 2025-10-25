import { getDb } from './firebase-utils'
import { Post, User } from '@/types'

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
  posterLevel?: string  
  posterCookingLevel?: string 
  posterTotalRatings?: number 
  matchReasons: string[]
  compatibilityPercentage: number
}

// ============================================
// DISTANCE CALCULATIONS
// ============================================

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

// Calculate bounding box for geo queries
// This creates a square around the user's location
function calculateBoundingBox(lat: number, lng: number, radiusMiles: number) {
  // 1 degree of latitude = ~69 miles
  // 1 degree of longitude varies by latitude
  const latDelta = radiusMiles / 69.0
  const lngDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180))
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  }
}

// ============================================
// CUISINE & FOOD DETECTION
// ============================================

function detectCuisine(title: string, description: string): string[] {
  const text = (title + ' ' + description).toLowerCase()
  const cuisines: string[] = []
  
  const cuisineKeywords: Record<string, string[]> = {
    'italian': ['pizza', 'pasta', 'lasagna', 'risotto', 'spaghetti', 'carbonara', 'penne', 'ravioli', 'gnocchi', 'italian'],
    'mexican': ['tacos', 'burrito', 'quesadilla', 'enchilada', 'nachos', 'salsa', 'guacamole', 'fajitas', 'mexican', 'tortilla'],
    'chinese': ['fried rice', 'noodles', 'chow mein', 'dumplings', 'spring rolls', 'chinese', 'wonton', 'lo mein', 'kung pao'],
    'indian': ['curry', 'biryani', 'tandoori', 'naan', 'samosa', 'tikka', 'masala', 'indian', 'daal', 'paneer'],
    'japanese': ['sushi', 'ramen', 'udon', 'teriyaki', 'tempura', 'miso', 'japanese', 'bento', 'sashimi'],
    'american': ['burger', 'sandwich', 'bbq', 'ribs', 'steak', 'hot dog', 'american', 'wings', 'fries'],
    'thai': ['pad thai', 'thai', 'curry', 'tom yum', 'basil', 'coconut'],
    'mediterranean': ['hummus', 'falafel', 'kebab', 'shawarma', 'mediterranean', 'gyro', 'tzatziki'],
    'vietnamese': ['pho', 'banh mi', 'vietnamese', 'spring roll'],
    'korean': ['kimchi', 'bibimbap', 'korean', 'bulgogi']
  }
  
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      cuisines.push(cuisine)
    }
  }
  
  return cuisines
}

// ============================================
// DIETARY & ALLERGEN CHECKS
// ============================================

function checkDietaryCompatibility(post: Post, user: User): { compatible: boolean; reasons: string[] } {
  const reasons: string[] = []
  let compatible = true
  
  const title = post.title.toLowerCase()
  const description = post.description.toLowerCase()
  const text = title + ' ' + description
  
  if (!user.dietaryRestrictions || user.dietaryRestrictions.length === 0) {
    return { compatible: true, reasons: [] }
  }
  
  for (const restriction of user.dietaryRestrictions) {
    const restrictionLower = restriction.toLowerCase()
    
    if (restrictionLower === 'vegetarian') {
      const meatKeywords = ['chicken', 'beef', 'pork', 'meat', 'bacon', 'ham', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'seafood']
      if (meatKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('Contains meat (not vegetarian)')
      }
    }
    
    if (restrictionLower === 'vegan') {
      const animalKeywords = ['chicken', 'beef', 'pork', 'meat', 'bacon', 'dairy', 'milk', 'cheese', 'egg', 'butter', 'cream', 'yogurt', 'fish', 'honey']
      if (animalKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('Contains animal products (not vegan)')
      }
    }
    
    if (restrictionLower === 'gluten-free') {
      const glutenKeywords = ['bread', 'pasta', 'wheat', 'flour', 'pizza', 'noodles', 'bagel', 'croissant', 'cake', 'cookie']
      if (glutenKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('May contain gluten')
      }
    }
    
    if (restrictionLower === 'dairy-free' || restrictionLower === 'lactose-free') {
      const dairyKeywords = ['cheese', 'milk', 'cream', 'butter', 'yogurt', 'dairy']
      if (dairyKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('Contains dairy')
      }
    }
    
    if (restrictionLower === 'halal') {
      const nonHalalKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer']
      if (nonHalalKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('Not halal')
      }
    }
    
    if (restrictionLower === 'kosher') {
      const nonKosherKeywords = ['pork', 'bacon', 'ham', 'shellfish', 'shrimp', 'lobster']
      if (nonKosherKeywords.some(keyword => text.includes(keyword))) {
        compatible = false
        reasons.push('Not kosher')
      }
    }
  }
  
  return { compatible, reasons }
}

function checkAllergenSafety(post: Post, user: User): { safe: boolean; warnings: string[] } {
  const warnings: string[] = []
  let safe = true
  
  if (!user.allergies || user.allergies.length === 0) {
    return { safe: true, warnings: [] }
  }
  
  if (post.foodMeta?.allergens) {
    for (const allergen of post.foodMeta.allergens) {
      if (user.allergies.some(userAllergen => 
        userAllergen.toLowerCase() === allergen.toLowerCase()
      )) {
        safe = false
        warnings.push(`Contains ${allergen}`)
      }
    }
  }
  
  const text = (post.title + ' ' + post.description).toLowerCase()
  for (const allergen of user.allergies) {
    const allergenLower = allergen.toLowerCase()
    if (text.includes(allergenLower)) {
      safe = false
      if (!warnings.some(w => w.toLowerCase().includes(allergenLower))) {
        warnings.push(`May contain ${allergen}`)
      }
    }
  }
  
  return { safe, warnings }
}

// ============================================
// SCORING FUNCTIONS
// ============================================

function calculateFreshnessScore(post: Post): number {
  const createdAt = post.createdAt instanceof Date 
    ? post.createdAt 
    : (post.createdAt as any).toDate()
  
  const hoursSincePosted = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  
  if (hoursSincePosted < 0.5) return 100
  if (hoursSincePosted < 1) return 90
  if (hoursSincePosted < 2) return 80
  if (hoursSincePosted < 4) return 70
  if (hoursSincePosted < 8) return 50
  if (hoursSincePosted < 12) return 30
  return 10
}

function calculatePosterScore(posterTrustScore: number, post: Post): number {
  let score = posterTrustScore * 100
  
  if (post.description.length > 50) score += 10
  
  if (post.foodMeta) {
    score += 10
    if (post.foodMeta.homemade) score += 15
    if (post.foodMeta.refrigerated) score += 10
    if (post.foodMeta.preparedAt) score += 5
  }
  
  return Math.min(score, 100)
}

function calculateTimeCompatibility(post: Post): { score: number; reason: string } {
  const now = new Date()
  const pickupStart = post.pickupWindow.start instanceof Date 
    ? post.pickupWindow.start 
    : (post.pickupWindow.start as any).toDate()
  const pickupEnd = post.pickupWindow.end instanceof Date 
    ? post.pickupWindow.end 
    : (post.pickupWindow.end as any).toDate()
  
  if (now >= pickupStart && now <= pickupEnd) {
    return { score: 100, reason: 'Available right now!' }
  }
  
  const hoursUntilStart = (pickupStart.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursUntilStart > 0 && hoursUntilStart < 1) {
    return { score: 90, reason: 'Available in less than an hour' }
  }
  if (hoursUntilStart >= 1 && hoursUntilStart < 2) {
    return { score: 75, reason: 'Available soon' }
  }
  if (hoursUntilStart >= 2 && hoursUntilStart < 4) {
    return { score: 60, reason: 'Available later today' }
  }
  
  if (now > pickupEnd) {
    return { score: 0, reason: 'Pickup window expired' }
  }
  
  return { score: 50, reason: 'Available later' }
}

function calculateScore(
  post: Post,
  user: User,
  distance: number,
  posterTrustScore: number
): { score: number; matchReasons: string[]; compatibilityPercentage: number } {
  const matchReasons: string[] = []
  let totalScore = 0

  // 1. DISTANCE (25 points max)
  const maxDistance = user.maxDistance || 5
  if (distance > maxDistance) {
    return { score: 0, matchReasons: ['📍 Too far away'], compatibilityPercentage: 0 }
  }
  const distanceScore = 25 * Math.max(0, 1 - distance / maxDistance)
  totalScore += distanceScore
  if (distance < 0.5) matchReasons.push(`📍 Super close - only ${distance.toFixed(1)} miles away!`)
  else if (distance < 1) matchReasons.push(`📍 Very close - ${distance.toFixed(1)} miles away`)
  else if (distance < 2) matchReasons.push(`📍 Nearby - ${distance.toFixed(1)} miles away`)

  // 2. DIETARY COMPATIBILITY (20 points max)
  const dietaryCheck = checkDietaryCompatibility(post, user)
  if (!dietaryCheck.compatible) {
    return { score: 0, matchReasons: dietaryCheck.reasons, compatibilityPercentage: 0 }
  }
  totalScore += 20
  if (user.dietaryRestrictions?.length) {
    matchReasons.push(`✅ Matches your ${user.dietaryRestrictions.join(', ')} diet`)
  }

  // 3. ALLERGEN SAFETY (20 points max)
  const allergenCheck = checkAllergenSafety(post, user)
  if (!allergenCheck.safe) {
    return { score: 0, matchReasons: allergenCheck.warnings, compatibilityPercentage: 0 }
  }
  totalScore += 20
  if (user.allergies?.length) {
    matchReasons.push(`✅ Safe from your allergens (${user.allergies.join(', ')})`)
  }

  // 4. CUISINE PREFERENCE (15 points max)
  const postCuisines = detectCuisine(post.title, post.description)
  if (postCuisines.length > 0 && user.foodPreferences?.length) {
    const cuisineMatch = postCuisines.some(c => 
      user.foodPreferences!.some(p => p.toLowerCase() === c)
    )
    if (cuisineMatch) {
      totalScore += 15
      const matchedCuisine = postCuisines.find(c => 
        user.foodPreferences!.some(p => p.toLowerCase() === c)
      )
      matchReasons.push(`🍽️ ${matchedCuisine?.charAt(0).toUpperCase()}${matchedCuisine?.slice(1)} - your favorite!`)
    } else {
      totalScore += 5 // Partial credit
    }
  } else if (postCuisines.length > 0) {
    totalScore += 7.5 // Half credit if no preferences set
  }

  // 5. FRESHNESS (10 points max)
  const createdAt = post.createdAt instanceof Date 
    ? post.createdAt 
    : (post.createdAt as any).toDate()
  const minutesSincePosted = (Date.now() - createdAt.getTime()) / (1000 * 60)
  
  let freshnessScore = 0
  if (minutesSincePosted < 30) {
    freshnessScore = 10
    matchReasons.push('🔥 Just posted!')
  } else if (minutesSincePosted < 120) {
    freshnessScore = 7
    matchReasons.push('⏰ Posted recently')
  } else if (minutesSincePosted < 240) {
    freshnessScore = 5
  } else if (minutesSincePosted < 480) {
    freshnessScore = 3
  } else {
    freshnessScore = 1
  }
  totalScore += freshnessScore

  // 6. POSTER REPUTATION (10 points max)
  const posterScore = posterTrustScore * 10 // Scale 0-1 to 0-10
  totalScore += posterScore
  if (posterTrustScore > 0.8) {
    matchReasons.push('⭐ Highly trusted poster')
  } else if (posterTrustScore > 0.6) {
    matchReasons.push('👍 Trusted poster')
  }

  // 7. TIME AVAILABILITY (5 points max)
  const now = new Date()
  const pickupStart = post.pickupWindow.start instanceof Date 
    ? post.pickupWindow.start 
    : (post.pickupWindow.start as any).toDate()
  const pickupEnd = post.pickupWindow.end instanceof Date 
    ? post.pickupWindow.end 
    : (post.pickupWindow.end as any).toDate()
  
  let timeScore = 0
  if (now >= pickupStart && now <= pickupEnd) {
    timeScore = 5
    matchReasons.push('⏰ Available right now!')
  } else {
    const hoursUntilStart = (pickupStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilStart > 0 && hoursUntilStart < 1) {
      timeScore = 4
      matchReasons.push('⏰ Available in less than an hour')
    } else if (hoursUntilStart >= 1 && hoursUntilStart < 2) {
      timeScore = 3
    } else if (hoursUntilStart >= 2 && hoursUntilStart < 4) {
      timeScore = 2
    } else if (now > pickupEnd) {
      return { score: 0, matchReasons: ['Pickup window expired'], compatibilityPercentage: 0 }
    } else {
      timeScore = 1
    }
  }
  totalScore += timeScore

  // 8. QUALITY INDICATORS (5 points max)
  let qualityScore = 0
  if (post.foodMeta?.homemade) {
    qualityScore += 2
    if (user.cookingLevel === 'advanced' || user.cookingLevel === 'professional') {
      matchReasons.push('🏠 Homemade food')
    }
  }
  if (post.foodMeta?.refrigerated) qualityScore += 1
  if (post.quantity > 1) {
    qualityScore += 1
    if (post.quantity >= 3) {
      matchReasons.push(`🍱 ${post.quantity} portions available`)
    }
  }
  if (post.description.length > 50) qualityScore += 1
  totalScore += qualityScore

  // Total possible: 25+20+20+15+10+10+5+5 = 110 points
  // But we cap at 100 for percentage calculation
  const compatibilityPercentage = Math.min(100, Math.round(totalScore))

  return {
    score: totalScore,
    matchReasons: matchReasons.slice(0, 5),
    compatibilityPercentage
  }
}


// ============================================
// MAIN FEED FUNCTION - OPTIMIZED WITH PAGINATION
// ============================================

interface FeedOptions {
  userId: string
  batchSize?: number
  lastPostTimestamp?: Date
  excludedPostIds?: string[]
}

export async function getPersonalizedFeed({
  userId,
  batchSize = 10,
  lastPostTimestamp,
  excludedPostIds = []
}: FeedOptions): Promise<{
  posts: AlgorithmPost[]
  hasMore: boolean
  lastTimestamp: Date | null
}> {
  try {
    const db = ensureClientSide()
    const { collection, query, where, getDocs, orderBy, limit, doc, getDoc, startAfter } = await import('firebase/firestore')
    
    console.log('🔍 Fetching feed for user:', userId)
    
    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      console.warn('⚠️ User profile not found, redirecting to profile setup')
  return { posts: [], hasMore: false, lastTimestamp: null }
    }
    const user = userDoc.data() as User
    
    if (!user.lat || !user.lng) {
      console.warn('⚠️ User location not set')
      return { posts: [], hasMore: false, lastTimestamp: null }
    }
    
    const maxDistance = user.maxDistance || 5
    console.log(`📍 User location: (${user.lat}, ${user.lng}), Max distance: ${maxDistance} miles`)
    
    // Calculate bounding box for rough geo-filtering
    // This reduces the amount of data we fetch from Firestore
    const bbox = calculateBoundingBox(user.lat, user.lng, maxDistance)
    console.log('📦 Bounding box:', bbox)
    
    // Build query with geo constraints
    // NOTE: Firestore doesn't support true geo queries without a library
    // So we fetch a larger radius and filter in-memory
    let postsQuery = query(
      collection(db, 'posts'),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'),
      limit(batchSize * 5) // Get 5x to account for distance filtering
    )
    
    // Pagination
    if (lastPostTimestamp) {
      postsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'available'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPostTimestamp),
        limit(batchSize * 5)
      )
    }
    
    console.log('🔄 Executing Firestore query...')
    const postsSnapshot = await getDocs(postsQuery)
    console.log(`📦 Fetched ${postsSnapshot.docs.length} posts from database`)
    
    if (postsSnapshot.empty) {
      console.log('❌ No posts found in database')
      return { posts: [], hasMore: false, lastTimestamp: null }
    }
    
    // Process posts with smart filtering
    const scoredPosts: AlgorithmPost[] = []
    const posterCache = new Map<string, User>()
    let processedCount = 0
    let filteredCount = 0
    
    for (const postDoc of postsSnapshot.docs) {
      const post = { id: postDoc.id, ...postDoc.data() } as Post
      processedCount++
      
      // Skip own posts
      if (post.userId === userId) {
        filteredCount++
        continue
      }
      
      // Skip already seen posts
      if (excludedPostIds.includes(post.id)) {
        filteredCount++
        continue
      }
      
      // ============================================
      // CRITICAL: DISTANCE FILTER FIRST
      // This is the most important filter - don't waste time
      // scoring posts that are too far away
      // ============================================
      const distance = calculateDistance(
        user.lat!,
        user.lng!,
        post.location.lat,
        post.location.lng
      )
      
      if (distance > maxDistance) {
        filteredCount++
        continue
      }
      
      // Get or cache poster data
      let posterData: User | null = null
      if (posterCache.has(post.userId)) {
        posterData = posterCache.get(post.userId)!
      } else {
        const posterDoc = await getDoc(doc(db, 'users', post.userId))
        if (posterDoc.exists()) {
          posterData = posterDoc.data() as User
          posterCache.set(post.userId, posterData)
        }
      }
      
      const posterTrustScore = posterData?.trustScore || 0.5
      
      // Calculate score
      const { score, matchReasons, compatibilityPercentage } = calculateScore(
        post, 
        user, 
        distance, 
        posterTrustScore
      )
      
      // Only include if passed all filters (score > 0)
      if (score > 0) {
        scoredPosts.push({
          ...post,
          score,
          distance,
          posterName: posterData?.name || 'Anonymous',
          posterTrustScore,
          posterAvatar: posterData?.photoURL || '',
          posterLevel: posterData?.level || 'Rookie Rescuer', 
          posterCookingLevel: posterData?.cookingLevel, 
          posterTotalRatings: posterData?.totalRatings || 0, 
          matchReasons,
          compatibilityPercentage
        })
      } else {
        filteredCount++
      }
      
      // Stop if we have enough posts
      if (scoredPosts.length >= batchSize) break
    }
    
    console.log(`✅ Processed ${processedCount} posts, filtered out ${filteredCount}, keeping ${scoredPosts.length}`)
    
    // Sort by score with randomness for variety
    const sortedPosts = scoredPosts.sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) < 5) {
        return Math.random() - 0.5
      }
      return scoreDiff
    })
    
    // Take only requested batch size
    const finalPosts = sortedPosts.slice(0, batchSize)
    
    // Determine if there are more posts
    const hasMore = postsSnapshot.docs.length >= batchSize * 5
    
    // Get last timestamp for pagination
    const lastTimestamp = finalPosts.length > 0 
      ? (finalPosts[finalPosts.length - 1].createdAt instanceof Date 
          ? finalPosts[finalPosts.length - 1].createdAt 
          : (finalPosts[finalPosts.length - 1].createdAt as any).toDate())
      : null
    
    console.log(`🎉 Returning ${finalPosts.length} posts, hasMore: ${hasMore}`)
    
    return { 
      posts: finalPosts, 
      hasMore, 
      lastTimestamp 
    }
    
  } catch (error) {
    console.error('❌ Error getting personalized feed:', error)
    return { posts: [], hasMore: false, lastTimestamp: null }
  }
}

// ============================================
// FALLBACK: NEARBY POSTS
// ============================================

export async function getNearbyPosts(
  lat: number,
  lng: number,
  maxDistance: number = 5,
  limitCount: number = 10
): Promise<AlgorithmPost[]> {
  try {
    const db = ensureClientSide()
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
        const posterDoc = await getDoc(doc(db, 'users', post.userId))
        const posterData = posterDoc.exists() ? posterDoc.data() as User : null

        nearbyPosts.push({
          ...post,
          score: 50,
          distance,
          posterName: posterData?.name || 'Anonymous',
          posterTrustScore: posterData?.trustScore || 0.5,
          posterAvatar: posterData?.photoURL || '',
          matchReasons: [`${distance.toFixed(1)} miles away`],
          compatibilityPercentage: 50
        })
      }
    }

    return nearbyPosts
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitCount)

  } catch (error) {
    console.error('Error getting nearby posts:', error)
    return []
  }
}