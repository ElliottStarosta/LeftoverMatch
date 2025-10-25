'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useAuth } from '@/lib/useAuth'
import { getPersonalizedFeed, AlgorithmPost } from '@/lib/algorithm'
import { createClaim, isPostAvailable } from '@/lib/claims'
import FoodCard from './FoodCard'
import ClaimModal from './ClaimModal'
import { useRouter } from 'next/navigation'

export default function SwipeDeck() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State
  const [posts, setPosts] = useState<AlgorithmPost[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedPost, setSelectedPost] = useState<AlgorithmPost | null>(null)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentClaimId, setCurrentClaimId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true)
  const [lastTimestamp, setLastTimestamp] = useState<Date | null>(null)
  const [excludedPostIds, setExcludedPostIds] = useState<string[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // ============================================
  // INITIAL LOAD - Get first batch
  // ============================================
  useEffect(() => {
    const loadInitialPosts = async () => {
      if (!user) return
      
      setLoadingPosts(true)
      setError(null)
      
      try {
        console.log('📥 Loading initial batch...')
        const result = await getPersonalizedFeed({
          userId: user.uid,
          batchSize: 10,
          excludedPostIds
        })
        
        console.log('✅ Initial load complete:', result.posts.length, 'posts')
        setPosts(result.posts)
        setHasMore(result.hasMore)
        setLastTimestamp(result.lastTimestamp)
        
        if (result.posts.length === 0) {
          setError('No food posts available in your area. Try expanding your search radius or check back later!')
        }
      } catch (error) {
        console.error('❌ Error loading posts:', error)
        setError('Failed to load food posts. Please check your connection.')
        setPosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    loadInitialPosts()
  }, [user])

  // ============================================
  // INFINITE SCROLL - Load more when near end
  // ============================================
  const loadMorePosts = async () => {
    if (!user || !hasMore || loadingMore || loadingPosts) {
      console.log('⏭️ Skipping load more:', { hasMore, loadingMore, loadingPosts })
      return
    }
    
    console.log('🔄 Loading more posts...')
    setLoadingMore(true)
    
    try {
      const result = await getPersonalizedFeed({
        userId: user.uid,
        batchSize: 10,
        lastPostTimestamp: lastTimestamp || undefined,
        excludedPostIds
      })
      
      console.log('✅ Loaded', result.posts.length, 'more posts')
      
      if (result.posts.length > 0) {
        setPosts(prev => [...prev, ...result.posts])
        setHasMore(result.hasMore)
        setLastTimestamp(result.lastTimestamp)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('❌ Error loading more posts:', error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  // ============================================
  // TRIGGER LOAD MORE - When 2 cards left
  // ============================================
  useEffect(() => {
    // When user is 2 cards away from the end, fetch more
    const remainingCards = posts.length - currentIndex
    
    if (remainingCards <= 2 && hasMore && !loadingMore && !loadingPosts) {
      console.log('⚠️ Near end of deck (', remainingCards, 'cards left), loading more...')
      loadMorePosts()
    }
  }, [currentIndex, posts.length, hasMore, loadingMore, loadingPosts])

  const currentPost = posts[currentIndex]

  // ============================================
  // SWIPE HANDLERS
  // ============================================
  const handleSwipeLeft = () => {
    if (!currentPost) return
    
    console.log('⬅️ Swiping left on:', currentPost.title)
    setSwipeDirection('left')
    
    // Add to excluded posts so it doesn't show up again
    setExcludedPostIds(prev => [...prev, currentPost.id])
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handleSwipeRight = async () => {
    if (!currentPost || !user || claiming) {
      console.log('❌ Cannot swipe right:', { hasPost: !!currentPost, hasUser: !!user, claiming })
      return
    }

    if (currentPost.status !== 'available') {
      console.log('❌ Post not available:', currentPost.status)
      alert('This food is no longer available')
      setCurrentIndex(prev => prev + 1)
      return
    }

    console.log('➡️ Swiping right on:', currentPost.title)
    setClaiming(true)
    setSwipeDirection('right')
    
    try {
      // Check if post is still available
      console.log('🔍 Checking availability...')
      const isAvailable = await isPostAvailable(currentPost.id)
      if (!isAvailable) {
        console.log('❌ Post no longer available')
        setExcludedPostIds(prev => [...prev, currentPost.id])
        setCurrentIndex(prev => prev + 1)
        setSwipeDirection(null)
        setClaiming(false)
        throw new Error('This food has already been claimed')
      }
      
      // Create claim - this locks the post
      console.log('🔒 Creating claim...')
      const claimId = await createClaim(user.uid, currentPost.id, currentPost.userId)
      console.log('✅ Claim created:', claimId)
      
      // Add to excluded posts
      setExcludedPostIds(prev => [...prev, currentPost.id])
      
      // Show modal
      setSelectedPost(currentPost)
      setCurrentClaimId(claimId)
      setShowClaimModal(true)
      setSwipeDirection(null)
      setClaiming(false)
      
      console.log('🎉 Modal opened for claimed post')
    } catch (error) {
      console.error('❌ Claim failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to claim food')
      setSwipeDirection(null)
      setClaiming(false)
    }
  }

  const handleCloseModal = () => {
    console.log('❌ Closing modal')
    setShowClaimModal(false)
    setCurrentClaimId(null)
    setSelectedPost(null)
    
    // Move to next card
    setCurrentIndex(prev => prev + 1)
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showClaimModal) return
      
      switch (event.key) {
        case 'ArrowLeft':
          handleSwipeLeft()
          break
        case 'ArrowRight':
          handleSwipeRight()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPost, showClaimModal, claiming])

  // ============================================
  // LOADING STATE
  // ============================================
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

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!currentPost && !hasMore) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-xl">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {error ? 'Oops!' : 'No more food posts!'}
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            {error || "You've seen all available food. Check back later!"}
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

  // ============================================
  // LOADING MORE INDICATOR
  // ============================================
  if (!currentPost && loadingMore) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-xl">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading more food...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER CARDS
  // ============================================
  return (
    <div className="relative h-full flex flex-col">
      {/* Card Stack */}
      <div className="relative flex-1 min-h-0">
        {currentPost && (
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
        )}
        
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span className="text-sm text-gray-600">Loading more...</span>
            </div>
          </div>
        )}
                
      </div>

      {/* Action Buttons */}
      <div className="flex gap-16 justify-center mt-4">
        {/* Swipe Left (Reject) */}
        <button
          onClick={handleSwipeLeft}
          disabled={claiming || !currentPost}
          className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center
                     hover:bg-red-200 hover:scale-125 active:scale-90 transition-all duration-300
                     shadow-[0_4px_12px_rgba(255,0,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,0,0,0.4)]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Skip this food"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>

        {/* Swipe Right (Like/Claim) */}
        <button
          onClick={handleSwipeRight}
          disabled={claiming || !currentPost}
          className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center
                     hover:bg-green-600 hover:scale-125 active:scale-90 transition-all duration-300
                     shadow-[0_4px_12px_rgba(0,255,100,0.3)] hover:shadow-[0_6px_20px_rgba(0,255,100,0.4)]
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Claim this food"
        >
          {claiming ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <HeartSolidIcon className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedPost && user && currentClaimId && (
        <ClaimModal
          post={{
            id: selectedPost.id,
            title: selectedPost.title,
            description: selectedPost.description,
            photoUrl: selectedPost.photoUrl,
            userId: selectedPost.userId,
            location: selectedPost.location,
            distance: selectedPost.distance,
            compatibilityPercentage: selectedPost.compatibilityPercentage,
            matchReasons: selectedPost.matchReasons
          }}
          onClose={handleCloseModal}
          claimId={currentClaimId}
          currentUserId={user.uid}
        />
      )}
    </div>
  )
}