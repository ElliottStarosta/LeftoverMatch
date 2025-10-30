'use client'


import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/useAuth'
import { getPersonalizedFeed, AlgorithmPost } from '@/lib/algorithm'
import { createClaim, isPostAvailable } from '@/lib/claims'
import FoodCard from './FoodCard'
import ClaimModal from './ClaimModal'
import { useRouter } from 'next/navigation'
import { useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { gsap } from 'gsap'
import { checkDailyClaimLimit, incrementDailyClaimCount } from '@/lib/dailyLimit'

// Swipe Deck Class
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
  const [showDetailsModal, setShowDetailsModal] = useState(false)


  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])


  // Pagination state
  const [hasMore, setHasMore] = useState(true)
  const [lastTimestamp, setLastTimestamp] = useState<Date | null>(null)
  const [excludedPostIds, setExcludedPostIds] = useState<string[]>(() => {
    // Load excluded posts from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('excludedPostIds')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  useEffect(() => {
    // Clean up expired posts when component mounts
    const cleanup = async () => {
      const { checkAndDeleteExpiredPosts } = await import('@/lib/cleanup')
      const deleted = await checkAndDeleteExpiredPosts();

      if (deleted !== undefined && deleted > 0) {
        console.log(`🗑️ Cleaned up ${deleted} expired posts`)
      }
    }

    cleanup()

    // Run cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])





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

  useEffect(() => {
    if (typeof window !== 'undefined' && excludedPostIds.length > 0) {
      localStorage.setItem('excludedPostIds', JSON.stringify(excludedPostIds))
    }
  }, [excludedPostIds])



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
    const remainingCards = posts.length - currentIndex

    if (remainingCards <= 2 && hasMore && !loadingMore && !loadingPosts) {
      console.log('⚠️ Near end of deck (', remainingCards, 'cards left), loading more...')
      loadMorePosts()
    }

    // NEW: If we have NO cards left and there might be more, try loading
    if (remainingCards === 0 && hasMore && !loadingMore && !loadingPosts) {
      console.log('⚠️ Ran out of cards, loading more...')
      loadMorePosts()
    }
  }, [currentIndex, posts.length, hasMore, loadingMore, loadingPosts])

  const currentPost = posts[currentIndex]

  useEffect(() => {
    const container = document.querySelector('.card-drag-container');
    if (!container || !currentPost) return;

    if (showClaimModal || showDetailsModal) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let dragTimeline: gsap.core.Timeline | null = null;

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      isDragging = true;
      startX = clientX;
      startY = clientY;

      // Kill any existing animation
      if (dragTimeline) dragTimeline.kill();
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - startX;

      x.set(deltaX);
      y.set(0);
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const deltaX = clientX - startX;

      isDragging = false;

      const threshold = 100;
      if (Math.abs(deltaX) > threshold) {
        // Smooth GSAP animation for swipe exit
        dragTimeline = gsap.timeline();
        dragTimeline.to([x, y], {
          x: deltaX > 0 ? 500 : -500,
          duration: 0.4,
          ease: 'power2.inOut'
        }, 0);
        dragTimeline.to(x, {
          duration: 0.3,
          ease: 'power2.in'
        }, 0);

        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      } else {
        // Snap back animation
        dragTimeline = gsap.timeline();
        dragTimeline.to([x, y], {
          x: 0,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)'
        }, 0);
      }
    };

    container.addEventListener('mousedown', handlePointerDown as any);
    container.addEventListener('mousemove', handlePointerMove as any);
    container.addEventListener('mouseup', handlePointerUp as any);
    container.addEventListener('touchstart', handlePointerDown as any);
    container.addEventListener('touchmove', handlePointerMove as any);
    container.addEventListener('touchend', handlePointerUp as any);

    return () => {
      if (dragTimeline) dragTimeline.kill();
      container.removeEventListener('mousedown', handlePointerDown as any);
      container.removeEventListener('mousemove', handlePointerMove as any);
      container.removeEventListener('mouseup', handlePointerUp as any);
      container.removeEventListener('touchstart', handlePointerDown as any);
      container.removeEventListener('touchmove', handlePointerMove as any);
      container.removeEventListener('touchend', handlePointerUp as any);
    };
  }, [currentPost, claiming, showClaimModal, showDetailsModal]);
  // ============================================
  // SWIPE HANDLERS
  // ============================================
  const handleSwipeLeft = () => {
    if (!currentPost) return

    console.log('⬅️ Swiping left on:', currentPost.title)
    setSwipeDirection('left')

    setExcludedPostIds(prev => {
      const updated = [...prev, currentPost.id]
      // Keep only last 100 to prevent localStorage bloat
      return updated.slice(-100)
    })

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
      x.set(0)
      y.set(0)
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
    setCurrentIndex(prev => prev + 1)


    // ✅ CHECK DAILY CLAIM LIMIT FIRST
    try {
      const { canClaim, claimsToday, maxClaims, resetTime } = await checkDailyClaimLimit(user.uid)

      if (!canClaim) {
        const resetTimeStr = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        alert(`🚫 You've reached your daily limit of ${maxClaims} claims!\n\nCome back tomorrow at ${resetTimeStr}.`)
        setClaiming(false)
        setSwipeDirection(null)
        x.set(0)
        y.set(0)
        return
      }

      console.log(`✅ Daily limit check passed: ${claimsToday}/${maxClaims} claims today`)
    } catch (error) {
      console.error('Error checking claim limit:', error)
      alert('Error checking claim limit. Please try again.')
      setClaiming(false)
      setSwipeDirection(null)
      return
    }

    // Create floating hearts animation
    const createFloatingHeart = () => {
      const heart = document.createElement('div')
      heart.innerHTML = '❤️'
      heart.style.cssText = `
      position: fixed;
      font-size: ${Math.random() * 40 + 30}px;
      z-index: 9999;
      pointer-events: none;
      left: ${Math.random() * window.innerWidth}px;
      top: ${window.innerHeight + 50}px;
    `
      document.body.appendChild(heart)

      gsap.to(heart, {
        y: -window.innerHeight - 100,
        opacity: 0,
        rotation: Math.random() * 360,
        duration: Math.random() * 1 + 2,
        ease: 'power1.inOut',
        onComplete: () => heart.remove()
      })
    }

    // Burst of hearts
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createFloatingHeart(), i * 100)
    }

    try {
      console.log('🔍 Checking availability...')
      const isAvailable = await isPostAvailable(currentPost.id)
      if (!isAvailable) {
        console.log('❌ Post no longer available')
        setExcludedPostIds(prev => {
          const updated = [...prev, currentPost.id]
          return updated.slice(-100)
        })
        
        setSwipeDirection(null)
        setClaiming(false)

        throw new Error('This food has already been claimed')
      }

      console.log('🔒 Creating claim...')
      const claimId = await createClaim(user.uid, currentPost.id, currentPost.userId)
      console.log('✅ Claim created:', claimId)

      // ✅ INCREMENT DAILY CLAIM COUNT
      try {
        await incrementDailyClaimCount(user.uid)
        console.log('✅ Daily claim count incremented')
      } catch (error) {
        console.error('Error updating daily claim count:', error)
      }

      setExcludedPostIds(prev => {
        const updated = [...prev, currentPost.id]
        return updated.slice(-100)
      })

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
    } finally {
      setSwipeDirection(null)
      setClaiming(false)
      x.set(0)
      y.set(0)
    }
  }



  const handleCloseModal = () => {
    console.log('❌ Closing modal')
    setShowClaimModal(false)
    setCurrentClaimId(null)
    setSelectedPost(null)

    // Move to next card
    x.set(0)
    y.set(0)
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const container = document.querySelector('.card-drag-container');
    if (!container || !currentPost) return;

    if (showClaimModal || showDetailsModal) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      console.log('👇 POINTER DOWN - Starting drag');
      isDragging = true;
      startX = clientX;
      startY = clientY;
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      // Only allow horizontal movement - constrain to X axis only
      console.log('👆 DRAGGING - deltaX:', deltaX);

      x.set(deltaX);
      y.set(0); // Keep Y at 0 - no vertical movement
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const deltaX = clientX - startX;

      console.log('🎯 DRAG END - deltaX:', deltaX);
      isDragging = false;

      const threshold = 100;
      if (Math.abs(deltaX) > threshold) {
        console.log('✅ SWIPE DETECTED! Direction:', deltaX > 0 ? 'RIGHT' : 'LEFT');
        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      } else {
        console.log('❌ NOT ENOUGH DISTANCE - Resetting');
        x.set(0);
        y.set(0);
      }
    };

    container.addEventListener('mousedown', handlePointerDown as any);
    container.addEventListener('mousemove', handlePointerMove as any);
    container.addEventListener('mouseup', handlePointerUp as any);
    container.addEventListener('touchstart', handlePointerDown as any);
    container.addEventListener('touchmove', handlePointerMove as any);
    container.addEventListener('touchend', handlePointerUp as any);

    return () => {
      container.removeEventListener('mousedown', handlePointerDown as any);
      container.removeEventListener('mousemove', handlePointerMove as any);
      container.removeEventListener('mouseup', handlePointerUp as any);
      container.removeEventListener('touchstart', handlePointerDown as any);
      container.removeEventListener('touchmove', handlePointerMove as any);
      container.removeEventListener('touchend', handlePointerUp as any);
    };
  }, [currentPost, claiming, showClaimModal, showDetailsModal]);

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
    <div className="relative h-full flex flex-col swipe-deck">
      {/* Card Stack */}
      <div className="relative flex-1 min-h-0 card-drag-container" style={{ touchAction: 'none' }}>
        {currentPost && (
          <motion.div
            key={currentPost.id}
            style={{
              x,
              y,
              rotate,
              opacity
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: swipeDirection ? 0 : 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="pointer-events-auto h-full w-full">
              <FoodCard post={currentPost}
                onDetailsModalChange={setShowDetailsModal} />
            </div>
          </motion.div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span className="text-sm text-gray-600">Loading more...</span>
            </div>
          </div>
        )}
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