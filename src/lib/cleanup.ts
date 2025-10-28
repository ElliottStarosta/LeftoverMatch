import { getDb } from './firebase-utils'

export async function checkAndDeleteExpiredPosts() {
  try {
    const db = getDb()
    if (!db) return
    
    const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore')
    
    const now = new Date()
    
    const expiredQuery = query(
      collection(db, 'posts'),
      where('pickupWindow.end', '<', now),
      where('status', '==', 'available')
    )
    
    const snapshot = await getDocs(expiredQuery)
    
    console.log(`🗑️ Found ${snapshot.docs.length} expired posts`)
    
    for (const postDoc of snapshot.docs) {
      await deleteDoc(doc(db, 'posts', postDoc.id))
      console.log(`✅ Deleted expired post: ${postDoc.id}`)
    }
    
    return snapshot.docs.length
  } catch (error) {
    console.error('Error deleting expired posts:', error)
    return 0
  }
}