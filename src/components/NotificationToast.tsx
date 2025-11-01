'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDb } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Toast {
  id: string
  type: string
  message: string
  conversationId?: string
  createdAt: Date
}

export default function NotificationToast() {
  const { user } = useAuth()
  const router = useRouter()
  const [toast, setToast] = useState<Toast | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!user) return

    const subscribeToNotifications = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { collection, query, where, orderBy, onSnapshot, limit } = await import('firebase/firestore')

        const notifQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(1)
        )

        const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0]
            const notification: Toast = {
              id: doc.id,
              type: doc.data().type,
              message: doc.data().message,
              conversationId: doc.data().conversationId,
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }

            // Only show if different from current toast
            if (!toast || toast.id !== notification.id) {
              setToast(notification)
              setIsVisible(true)

              // Auto-hide after 4 seconds
              const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(() => setToast(null), 300)
              }, 4000)

              return () => clearTimeout(timer)
            }
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error subscribing to notifications:', error)
      }
    }

    subscribeToNotifications()
  }, [user])

  const dismissNotification = async () => {
    if (!toast) return

    setIsVisible(false)
    setTimeout(() => setToast(null), 300)

    // Delete notification from Firebase
    try {
      const db = getDb()
      if (!db) return

      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(db, 'notifications', toast.id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Handle notification click - navigate to conversation
  const handleNotificationClick = async () => {
    if (!toast?.conversationId) {
      console.log('No conversation ID:', toast)
      return
    }

    console.log('Navigating to conversation:', toast.conversationId)

    // Delete notification immediately
    try {
      const db = getDb()
      if (!db) return

      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(db, 'notifications', toast.id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }

    // Dismiss the toast
    setIsVisible(false)
    setToast(null)
    
    // Navigate to messages with conversation param
    setTimeout(() => {
      router.push(`/messages?conversation=${toast.conversationId}`)
      setTimeout(() => {
        router.push('/messages')
      }, 1000) // wait 1000 ms before going to /messages
    }, 100)
    
    
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

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'new_claim':
        return 'border-l-orange-500'
      case 'claim_accepted':
        return 'border-l-green-500'
      case 'rating_received':
        return 'border-l-yellow-500'
      case 'level_up':
        return 'border-l-purple-500'
      default:
        return 'border-l-blue-500'
    }
  }

  if (!toast) return null

  return (
    <div className="fixed bottom-6 right-4 z-50 sm:bottom-8 sm:right-6 pointer-events-none">
      <button
        onClick={handleNotificationClick}
        className={`pointer-events-auto bg-white rounded-xl shadow-lg border-l-4 ${getBorderColor(toast.type)} p-4 max-w-xs transition-all duration-300 transform hover:shadow-xl active:scale-95 w-full text-left ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{getNotificationIcon(toast.type)}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{toast.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {toast.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              dismissNotification()
            }}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </button>
    </div>
  )
}