'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { getDb } from '@/lib/firebase-utils'
import Image from 'next/image'
import { calculateLevel } from '@/lib/levels'
import LoadingSpinner from './LoadingSpinner'


interface RatingModalProps {
  conversationId: string
  postId: string
  postTitle: string
  posterId: string
  posterName: string
  posterAvatar?: string
  claimId: string
  onClose: () => void
  currentUserId: string
}


async function deleteConversationMessages(conversationId: string) {
  try {
    const db = getDb()
    if (!db) throw new Error('Database not available')

    const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore')

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    )

    const messagesSnapshot = await getDocs(messagesQuery)

    const deletePromises = messagesSnapshot.docs.map(messageDoc =>
      deleteDoc(doc(db, 'messages', messageDoc.id))
    )

    await Promise.all(deletePromises)
    console.log(`✓ Deleted ${messagesSnapshot.size} messages`)

    // Also delete the typing document
    try {
      await deleteDoc(doc(db, 'typing', conversationId))
      console.log('✓ Deleted typing document')
    } catch (error) {
      console.log('No typing document to delete (this is fine)')
    }
  } catch (error) {
    console.error('Error deleting messages:', error)
    throw error
  }
}


export default function RatingModal({
  conversationId,
  postId,
  postTitle,
  posterId,
  posterName,
  posterAvatar,
  claimId,
  onClose,
  currentUserId
}: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline()

    if (modalRef.current) {
      tl.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
    }

    if (cardRef.current) {
      tl.fromTo(cardRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' },
        '-=0.2'
      )
    }
  }, [])

  const handleClose = () => {
    const tl = gsap.timeline()

    if (cardRef.current) {
      tl.to(cardRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: 'power2.in'
      })
    }

    if (modalRef.current) {
      tl.to(modalRef.current, {
        opacity: 0,
        duration: 0.2,
        onComplete: onClose
      }, '-=0.1')
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    setSubmitting(true)

    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, increment } = await import('firebase/firestore')

      console.log('Step 1: Creating rating...')
      console.log('Data:', { postId, posterId, claimerId: currentUserId, claimId, stars: rating })

      // Create rating
      await addDoc(collection(db, 'ratings'), {
        postId,
        posterId,
        claimerId: currentUserId,
        claimId,
        stars: rating,
        comment: comment.trim() || null,
        createdAt: serverTimestamp()
      })
      console.log('✓ Rating created')

      console.log('Step 2: Fetching poster doc...')
      // Update poster's trust score
      const posterDoc = await getDoc(doc(db, 'users', posterId))
      console.log('✓ Poster doc fetched')

      if (posterDoc.exists()) {
        console.log('Step 3: Updating poster...')
        const posterData = posterDoc.data()
        const currentTrustScore = posterData.trustScore || 0.5
        const totalRatings = posterData.totalRatings || 0
        const successfulPosts = posterData.successfulPosts || 0

        const newTrustScore = ((currentTrustScore * totalRatings) + (rating / 5)) / (totalRatings + 1)
        const newLevel = calculateLevel(totalRatings + 1, newTrustScore, successfulPosts + 1)

        await updateDoc(doc(db, 'users', posterId), {
          trustScore: newTrustScore,
          totalRatings: increment(1),
          successfulPosts: increment(1),
          level: newLevel
        })
        console.log('✓ Poster updated')

        if (newLevel !== posterData.level) {
          console.log('Step 4: Creating level up notification...')
          await addDoc(collection(db, 'notifications'), {
            userId: posterId,
            type: 'level_up',
            message: `🎉 Congratulations! You've reached ${newLevel}!`,
            read: false,
            createdAt: serverTimestamp()
          })
          console.log('✓ Level up notification created')
        }
      }

      console.log('Step 5: Updating claimer...')
      // Update claimer's completed claims
      await updateDoc(doc(db, 'users', currentUserId), {
        completedClaims: increment(1),
        totalClaims: increment(1)
      })
      console.log('✓ Claimer updated')

      console.log('Step 6: Creating rating notification...')
      // Send notification to poster
      await addDoc(collection(db, 'notifications'), {
        userId: posterId,
        type: 'rating_received',
        postTitle,
        rating,
        message: `You received a ${rating}-star rating for "${postTitle}"!`,
        read: false,
        createdAt: serverTimestamp()
      })
      console.log('✓ Rating notification created')

      console.log('Step 7: Deleting claim...')
      // Delete the claim
      await deleteDoc(doc(db, 'claims', claimId))
      console.log('✓ Claim deleted')

      console.log('Step 8: Deleting post...')
      // Delete the post
      await deleteDoc(doc(db, 'posts', postId))
      console.log('✓ Post deleted')

      console.log('Step 9: Deleting conversation...')
      // Delete the conversation
      await deleteDoc(doc(db, 'conversations', conversationId))
      console.log('✓ Conversation deleted')

      console.log('Step 10: Deleting all messages...')
      await deleteConversationMessages(conversationId);
      console.log('✓ All messages deleted');


      console.log('SUCCESS!')

      // Success animation
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          onComplete: handleClose
        })
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative rounded-full overflow-hidden">
            {posterAvatar ? (
              <Image src={posterAvatar} alt={posterName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                {posterName.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate the Food</h2>
          <p className="text-gray-600">How was "{postTitle}" from {posterName}?</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transform hover:scale-125 transition-transform duration-200"
            >
              {star <= (hoverRating || rating) ? (
                <StarSolidIcon className="w-12 h-12 text-yellow-400" />
              ) : (
                <StarIcon className="w-12 h-12 text-gray-300" />
              )}
            </button>
          ))}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Add a comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 resize-none"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/200</p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner text="Submitting..." fullScreen={false} size="sm" />
            </span>
          ) : (
            'Submit Rating'
          )}
        </button>
      </div>
    </div>
  )
}