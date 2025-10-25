  'use client'

  import { useState, useEffect, useRef } from 'react'
  import Link from 'next/link'
  import { useRouter, usePathname } from 'next/navigation'
  import { signOut } from 'firebase/auth'
  import { getAuth, getDb } from '@/lib/firebase-utils'
  import { useAuth } from '@/lib/useAuth'
  import { gsap } from 'gsap'
  import { 
    PlusIcon, 
    ChatBubbleLeftRightIcon,
    BellIcon,
    UserCircleIcon,
    HomeIcon
  } from '@heroicons/react/24/outline'

  interface Notification {
    id: string
    type: string
    message: string
    conversationId?: string
    read: boolean
    createdAt: any
  }

  export default function Navbar() {
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const notifRef = useRef<HTMLDivElement>(null)
    const navRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    useEffect(() => {
      if (!mounted || !navRef.current) return
    
      const navEl = navRef.current
      const navItems = navEl.querySelectorAll('.nav-item')
    
      // Prevent double animations
      if (navEl.dataset.animated) return
    
      // GSAP context to clean up on unmount
      const ctx = gsap.context(() => {
        // Set initial states (prevents flicker)
        gsap.set(navEl, { y: -60, opacity: 0 })
        gsap.set(navItems, { y: -10, opacity: 0, scale: 0.9 })
    
        // Create animation timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.to(navEl, { y: 0, opacity: 1, duration: 0.4 })
        tl.to(
          navItems,
          { y: 0, opacity: 1, scale: 1, duration: 0.3, stagger: 0.07 },
          '-=0.2'
        )
      }, navEl)
    
      // Mark as animated
      navEl.dataset.animated = 'true'
    
      // Cleanup GSAP context
      return () => ctx.revert()
    }, [mounted])
    

    // Load notifications
    useEffect(() => {
      if (!user) return

      const loadNotifications = async () => {
        try {
          const db = getDb()
          if (!db) return

          const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore')

          const notifQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false),
            orderBy('createdAt', 'desc'),
            limit(10)
          )

          const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Notification))

            setNotifications(notifs)
          })

          return () => unsubscribe()
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }

      loadNotifications()
    }, [user])

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
          setShowNotifications(false)
        }
      }

      if (showNotifications) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showNotifications])

    const handleNotificationClick = async (notif: Notification) => {
      try {
        const db = getDb()
        if (!db) return

        const { doc, deleteDoc } = await import('firebase/firestore')

        // Delete the notification
        await deleteDoc(doc(db, 'notifications', notif.id))

        // Navigate if has conversation
        if (notif.conversationId) {
          router.push(`/messages?conversation=${notif.conversationId}`)
        }

        setShowNotifications(false)
      } catch (error) {
        console.error('Error handling notification:', error)
      }
    }

    const handleMarkAllRead = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { doc, deleteDoc } = await import('firebase/firestore')

        for (const notif of notifications) {
          await deleteDoc(doc(db, 'notifications', notif.id))
        }
      } catch (error) {
        console.error('Error clearing notifications:', error)
      }
    }

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'new_claim':
          return '🍽️'
        case 'claim_accepted':
          return '✅'
        case 'rating_received':
          return '⭐'
        case 'level_up':
          return '🎉'
        default:
          return '📬'
      }
    }

    const isActive = (path: string) => pathname === path

    if (!mounted) return null

    return (
      <nav ref={navRef} className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-orange-100 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">🍽️</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
                LeftoverMatch
              </span>
            </Link>
    
            {/* Navigation Items */}
            {user && (
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Home */}
                <Link
                  href="/"
                  className={`nav-item p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative group ${
                    isActive('/') 
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg' 
                      : 'hover:bg-orange-50'
                  }`}
                >
                  <HomeIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive('/') ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}`} />
                </Link>
    
                {/* Create Post */}
                <Link
                  href="/create"
                  className={`nav-item p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative group ${
                    isActive('/create') 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg' 
                      : 'hover:bg-green-50'
                  }`}
                >
                  <PlusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive('/create') ? 'text-white' : 'text-gray-600 group-hover:text-green-600'}`} />
                </Link>
    
                {/* Messages */}
                <Link
                  href="/messages"
                  className={`nav-item p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative group ${
                    isActive('/messages') 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive('/messages') ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
                </Link>
    
                {/* Notifications */}
                <div className="relative nav-item" ref={notifRef}>
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications)
                      if (!showNotifications) {
                        const dropdown = notifRef.current?.querySelector('.notification-dropdown')
                        if (dropdown) {
                          gsap.fromTo(
                            dropdown,
                            { scale: 0.9, opacity: 0, y: -10 },
                            { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)' }
                          )
                        }
                      }
                    }}
                    className="p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 hover:bg-purple-50 group relative"
                  >
                    <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-purple-600" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>
    
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 z-50">
                      <div 
                        className="overflow-hidden rounded-2xl shadow-2xl border-2 border-orange-100"
                        style={{ transformOrigin: 'top right' }}
                      >
                        <div className="notification-dropdown bg-white">
                          {/* Header */}
                          <div className="p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                              <BellIcon className="w-5 h-5" />
                              Notifications
                            </h3>
                            {notifications.length > 0 && (
                              <button 
                                onClick={handleMarkAllRead}
                                className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                          {/* Scrollable notifications */}
                          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">
                                <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No new notifications</p>
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <button
                                  key={notif.id}
                                  onClick={() => handleNotificationClick(notif)}
                                  className="w-full p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all border-b border-gray-100 text-left active:scale-95"
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {notif.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
    
                {/* Profile */}
                <Link
                  href="/profile"
                  className={`nav-item p-2.5 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 relative group ${
                    isActive('/profile') 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg' 
                      : 'hover:bg-purple-50'
                  }`}
                >
                  <UserCircleIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive('/profile') ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'}`} />
                </Link>
              </div>
            )}
    
            {/* Sign In Button (if not logged in) */}
            {!loading && !user && (
              <Link 
                href="/auth" 
                className="nav-item bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    )
  }