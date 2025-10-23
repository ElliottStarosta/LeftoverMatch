'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/lib/useAuth'
import { getPersonalizedFeed, AlgorithmPost } from '@/lib/algorithm'
import { createClaim, isPostAvailable } from '@/lib/claims'
import FoodCard from './FoodCard'
import ClaimModal from './ClaimModal'

// Use AlgorithmPost interface from algorithm.ts

export default function SwipeDeck() {
  const { user, loading } = useAuth()
  const [posts, setPosts] = useState<AlgorithmPost[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedPost, setSelectedPost] = useState<AlgorithmPost | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [currentClaimId, setCurrentClaimId] = useState<string | null>(null)
  const [currentPickupCode, setCurrentPickupCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load personalized feed
  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return
      
      setLoadingPosts(true)
      setError(null)
      try {
        const personalizedPosts = await getPersonalizedFeed(user.uid, 20)
        setPosts(personalizedPosts)
        if (personalizedPosts.length === 0) {
          setError('No food posts available in your area. Try expanding your search radius or check back later!')
        }
      } catch (error) {
        console.error('Error loading posts:', error)
        setError('Failed to load food posts. Please check your connection and try again.')
        setPosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    loadPosts()
  }, [user])

  const currentPost = posts[currentIndex]

  const handleSwipeLeft = () => {
    if (currentPost) {
      setSwipeDirection('left')
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % posts.length)
        setSwipeDirection(null)
      }, 300)
    }
  }

  const handleSwipeRight = async () => {
    if (currentPost && currentPost.status === 'available' && user) {
      setSwipeDirection('right')
      
      try {
        // Check if post is still available
        const isAvailable = await isPostAvailable(currentPost.id)
        if (!isAvailable) {
          throw new Error('This food has already been claimed')
        }
        
        // Create claim
        const claimId = await createClaim(user.uid, currentPost.id, currentPost.userId)
        
        // Generate pickup code (this would normally come from the claim creation)
        const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        
        // On success, show claim modal
        setSelectedPost(currentPost)
        setCurrentClaimId(claimId)
        setCurrentPickupCode(pickupCode)
        setShowClaimModal(true)
        
        // Move to next post
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % posts.length)
          setSwipeDirection(null)
        }, 300)
      } catch (error) {
        // Handle error (already claimed, too many claims, etc.)
        console.error('Claim failed:', error)
        alert(error instanceof Error ? error.message : 'Failed to claim food')
        setSwipeDirection(null)
      }
    }
  }

  const handleInfoClick = () => {
    if (currentPost) {
      setSelectedPost(currentPost)
      // Could open a detail modal here
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          handleSwipeLeft()
          break
        case 'ArrowRight':
          handleSwipeRight()
          break
        case 'i':
          handleInfoClick()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPost])

  if (loadingPosts) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-xl">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Finding food near you...</p>
        </div>
      </div>
    )
  }

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-xl">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {error ? 'Oops!' : 'No more food posts!'}
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            {error || 'Check back later for more delicious leftovers.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition-colors text-sm"
          >
            {error ? 'Try Again' : 'Refresh Feed'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Card Stack */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence>
          <motion.div
            key={currentPost.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0,
              rotate: swipeDirection === 'left' ? -15 : swipeDirection === 'right' ? 15 : 0
            }}
            exit={{ 
              scale: 0.95, 
              opacity: 0,
              x: swipeDirection === 'left' ? -300 : 300,
              rotate: swipeDirection === 'left' ? -15 : 15
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <FoodCard post={currentPost} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-8 mt-4 pb-2">
        <button
          onClick={handleSwipeLeft}
          className="w-12 h-12 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-200 shadow-lg hover:scale-110"
          aria-label="Skip this food"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <button
          onClick={handleInfoClick}
          className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-all duration-200 shadow-lg hover:scale-110"
          aria-label="View details"
        >
          <InformationCircleIcon className="w-6 h-6" />
        </button>

        <button
          onClick={handleSwipeRight}
          className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-all duration-200 shadow-lg hover:scale-110"
          aria-label="Claim this food"
        >
          <HeartSolidIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedPost && (
        <ClaimModal
          post={selectedPost}
          onClose={() => {
            setShowClaimModal(false)
            setCurrentClaimId(null)
            setCurrentPickupCode(null)
          }}
          claimId={currentClaimId || undefined}
          pickupCode={currentPickupCode || undefined}
        />
      )}
    </div>
  )
}
