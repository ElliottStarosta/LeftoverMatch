'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getAuth, getDb } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user, loading } = useAuth()
  const router = useRouter()
  const notifRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      if (auth) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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

      const { doc, updateDoc } = await import('firebase/firestore')

      // Mark as read
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true
      })

      // Navigate if has conversation
      if (notif.conversationId) {
        router.push(`/messages?conversation=${notif.conversationId}`)
      }

      setShowNotifications(false)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const db = getDb()
      if (!db) return

      const { doc, updateDoc } = await import('firebase/firestore')

      for (const notif of notifications) {
        await updateDoc(doc(db, 'notifications', notif.id), {
          read: true
        })
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
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
      default:
        return '📬'
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍽️</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              LeftoverMatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/create" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium">
                  Post Food
                </Link>
                
                <Link href="/messages" className="text-gray-600 hover:text-orange-500 transition-colors font-medium relative">
                  Messages
                </Link>
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative"
                  >
                    <BellIcon className="w-6 h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white flex items-center justify-between">
                        <h3 className="font-bold">Notifications</h3>
                        {notifications.length > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
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
                              className="w-full p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800 font-medium">{notif.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notif.createdAt?.toDate?.()?.toRelativeTime?.() || 'Just now'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-700" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link href="/create" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>Post Food</span>
                  </Link>
                  
                  <Link href="/messages" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>Messages</span>
                  </Link>
                  
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    <BellIcon className="w-5 h-5" />
                    <span>Notifications {notifications.length > 0 && `(${notifications.length})`}</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link href="/auth" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}