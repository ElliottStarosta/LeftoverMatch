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
  HomeIcon,
  XMarkIcon,
  Bars3Icon
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
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [mounted, setMounted] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hamburger menu animation
  useEffect(() => {
    if (!menuRef.current) return

    if (showMenu) {
      // Menu opening animation
      gsap.to(menuRef.current, {
        duration: 0.3,
        opacity: 1,
        pointerEvents: 'auto',
        ease: 'power2.out'
      })

      const menuItems = menuRef.current.querySelectorAll('.menu-item')
      gsap.fromTo(
        menuItems,
        { y: 20, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.5)',
          delay: 0.1
        }
      )
    } else {
      // Menu closing animation
      const menuItems = menuRef.current?.querySelectorAll('.menu-item') || []
      gsap.to(menuItems, {
        duration: 0.2,
        y: 20,
        opacity: 0,
        scale: 0.9,
        stagger: 0.04,
        ease: 'power2.in'
      })

      gsap.to(menuRef.current, {
        duration: 0.2,
        opacity: 0,
        pointerEvents: 'none',
        ease: 'power2.in',
        delay: 0.15
      })
    }
  }, [showMenu])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const button = document.querySelector('[data-menu-toggle]')
        if (button && !button.contains(event.target as Node)) {
          setShowMenu(false)
        }
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

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

  const handleNotificationClick = async (notif: Notification) => {
    try {
      const db = getDb()
      if (!db) return

      const { doc, deleteDoc } = await import('firebase/firestore')

      await deleteDoc(doc(db, 'notifications', notif.id))

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

      await Promise.all(
        notifications.map(notif =>
          deleteDoc(doc(db, 'notifications', notif.id))
        )
      )

      setNotifications([])
      setShowNotifications(false)
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

  const menuItems = [
    { icon: HomeIcon, label: 'Home', href: '/', color: 'from-orange-500 to-pink-500' },
    { icon: PlusIcon, label: 'Create', href: '/create', color: 'from-green-500 to-emerald-500' },
    { icon: ChatBubbleLeftRightIcon, label: 'Messages', href: '/messages', color: 'from-blue-500 to-cyan-500' },
    { icon: UserCircleIcon, label: 'Profile', href: '/profile', color: 'from-purple-500 to-indigo-500' },
  ]

  if (!mounted) {
    return (
      <nav className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="hidden sm:flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">🍽️</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                ReSwipe
              </span>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav ref={navRef} className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Desktop Logo */}
            <Link href="/" className="hidden sm:flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <span className="text-white font-bold text-xl">🍽️</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              ReSwipe
              </span>
            </Link>

            {/* Mobile: Hamburger Menu */}
            {user && (
              <div className="sm:hidden flex items-center justify-between w-full">
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center transform group-active:scale-95 transition-all duration-200 shadow-lg">
                    <span className="text-white font-bold text-lg">🍽️</span>
                  </div>
                </Link>

                <button
                  data-menu-toggle
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2.5 rounded-xl transition-all transform active:scale-95 ${
                    showMenu
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg'
                      : 'hover:bg-orange-50'
                  }`}
                >
                  {showMenu ? (
                    <XMarkIcon className="w-6 h-6 text-white" />
                  ) : (
                    <Bars3Icon className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </div>
            )}

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden sm:flex items-center gap-4">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                        isActive(item.href)
                          ? `bg-gradient-to-br ${item.color} shadow-lg`
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isActive(item.href) ? 'text-white' : 'text-gray-600'}`} />
                    </Link>
                  )
                })}

                {/* Desktop Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-3 rounded-xl transition-all hover:bg-purple-50 relative"
                  >
                    <BellIcon className={`w-6 h-6 ${showNotifications ? 'text-purple-600' : 'text-gray-600'}`} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 z-50">
                      <div className="overflow-hidden rounded-2xl shadow-2xl border-2 border-orange-100 bg-white">
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
                  )}
                </div>
              </div>
            )}

            {/* Sign In Button */}
            {!loading && !user && (
              <Link
                href="/auth"
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-full hover:from-orange-600 hover:to-pink-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMenu && user && (
        <div
          ref={menuRef}
          className="fixed inset-0 top-16 bg-white z-30 overflow-y-auto opacity-0 pointer-events-none"
        >
          <div className="p-4 space-y-3">
            {/* Menu Items */}
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMenu(false)}
                  className="menu-item p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-orange-50 hover:to-orange-100 active:scale-95 flex items-center gap-4 transition-all block"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 text-lg">{item.label}</span>
                </Link>
              )
            })}

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="menu-item p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-purple-100 active:scale-95 flex items-center gap-4 transition-all w-full text-left"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg flex-shrink-0">
                <BellIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-gray-900 text-lg">Notifications</span>
              </div>
              {notifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold flex-shrink-0">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Inline Sheet */}
            {showNotifications && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs bg-orange-200 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-300 transition-colors font-semibold"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No new notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="w-full p-3 hover:bg-white/60 bg-white/40 rounded-lg transition-all text-left active:scale-95"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium">{notif.message}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notif.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                try {
                  const auth = getAuth()
                  await signOut(auth)
                  setShowMenu(false)
                  router.push('/auth')
                } catch (error) {
                  console.error('Error signing out:', error)
                }
              }}
              className="menu-item mt-6 p-4 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 active:scale-95 flex items-center gap-4 transition-all text-red-600 font-semibold w-full"
            >
              <span className="text-2xl">👋</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}