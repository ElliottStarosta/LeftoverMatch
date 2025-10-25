import { getDb } from './firebase-utils'
import { Claim, Post } from '@/types'

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

// Create a new claim
// Create a new claim
export async function createClaim(
  claimerId: string,
  postId: string,
  posterId: string
): Promise<string> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, addDoc, updateDoc, doc, getDoc } = await import('firebase/firestore')
    
    // First, check if post is still available
    const postRef = doc(db, 'posts', postId)
    const postSnap = await getDoc(postRef)
    
    if (!postSnap.exists()) {
      throw new Error('Post not found')
    }
    
    const postData = postSnap.data()
    if (postData.status !== 'available') {
      throw new Error('This food has already been claimed')
    }
    
    // Generate a random pickup code
    const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // FIRST: Update post status to locked (this removes it from everyone's feed immediately)
    await updateDoc(postRef, {
      status: 'locked',
      lockInfo: {
        claimedBy: claimerId,
        claimId: 'pending', // Temporary until claim is created
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
    })
    
    // THEN: Create claim document
    const claimData: any = {
      claimerId,
      posterId,
      postId,
      status: 'pending',
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to complete claim
      pickupCode
    }

    const claimRef = await addDoc(collection(db, 'claims'), claimData)
    
    // Update the post with the actual claim ID
    await updateDoc(postRef, {
      'lockInfo.claimId': claimRef.id
    })

    return claimRef.id
  } catch (error) {
    console.error('Error creating claim:', error)
    throw error
  }
}

// Complete a claim
export async function completeClaim(claimId: string): Promise<void> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, addDoc, updateDoc, doc, query, where, getDocs } = await import('firebase/firestore')
    
    const claimRef = doc(db, 'claims', claimId)
    await updateDoc(claimRef, {
      status: 'completed',
      completedAt: new Date()
    })

    // Get claim data to update post
    const claimDoc = await getDocs(query(collection(db, 'claims'), where('id', '==', claimId)))
    if (!claimDoc.empty) {
      const claimData = claimDoc.docs[0].data() as Claim
      
      // Update post status to claimed
      await updateDoc(doc(db, 'posts', claimData.postId), {
        status: 'claimed'
      })
    }
  } catch (error) {
    console.error('Error completing claim:', error)
    throw error
  }
}

// Cancel a claim
export async function cancelClaim(claimId: string): Promise<void> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, addDoc, updateDoc, doc, query, where, getDocs } = await import('firebase/firestore')
    
    const claimRef = doc(db, 'claims', claimId)
    await updateDoc(claimRef, {
      status: 'cancelled',
      cancelledAt: new Date()
    })

    // Get claim data to update post
    const claimDoc = await getDocs(query(collection(db, 'claims'), where('id', '==', claimId)))
    if (!claimDoc.empty) {
      const claimData = claimDoc.docs[0].data() as Claim
      
      // Update post status back to available
      await updateDoc(doc(db, 'posts', claimData.postId), {
        status: 'available',
        lockInfo: null
      })
    }
  } catch (error) {
    console.error('Error cancelling claim:', error)
    throw error
  }
}

// Get user's active claims
export async function getUserActiveClaims(userId: string): Promise<Claim[]> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { collection, addDoc, updateDoc, doc, query, where, getDocs } = await import('firebase/firestore')
    
    const claimsQuery = query(
      collection(db, 'claims'),
      where('claimerId', '==', userId),
      where('status', 'in', ['pending', 'completed'])
    )
    
    const claimsSnapshot = await getDocs(claimsQuery)
    return claimsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Claim))
  } catch (error) {
    console.error('Error getting user claims:', error)
    return []
  }
}

// Listen to real-time updates for a user's claims
export function listenToUserClaims(
  userId: string, 
  callback: (claims: Claim[]) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  const db = getDb()
  if (!db) {
    return () => {}
  }
  
  // Import Firebase functions dynamically
  import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
    const claimsQuery = query(
      collection(db, 'claims'),
      where('claimerId', '==', userId),
      where('status', 'in', ['pending', 'completed'])
    )

    return onSnapshot(claimsQuery, (snapshot) => {
      const claims = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Claim))
      callback(claims)
    })
  }).catch(console.error)
  
  return () => {}
}

// Check if a post is available for claiming
export async function isPostAvailable(postId: string): Promise<boolean> {
  try {
    const db = ensureClientSide()
    
    // Dynamic import for Firebase Firestore functions
    const { doc, getDoc } = await import('firebase/firestore')
    
    const postDoc = await getDoc(doc(db, 'posts', postId))
    if (!postDoc.exists()) return false
    
    const post = postDoc.data() as Post
    return post.status === 'available'
  } catch (error) {
    console.error('Error checking post availability:', error)
    return false
  }
}
