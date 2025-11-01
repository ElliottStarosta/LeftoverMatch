'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDb } from '@/lib/firebase-utils'
import { gsap } from 'gsap'
import Image from 'next/image'
import RatingModal from '@/components/RatingModal'
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  MapPinIcon,
  UserIcon,
  CheckIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'
import { DirectionsMap } from '@/components/DirectionsMap'

interface Conversation {
  id: string
  claimId: string
  postId: string
  postTitle: string
  postPhoto: string
  postLocation?: string
  postDistance?: number
  participants: string[]
  claimerId: string
  posterId: string
  status: 'pending' | 'accepted' | 'completed'
  claimAccepted: boolean
  addressRevealed: boolean
  lastMessage?: string
  lastMessageAt?: any
  createdAt: any
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  type: 'user' | 'system'
  createdAt: any
  read: boolean
}

interface UserData {
  name: string
  photoURL?: string
  trustScore?: number
}

interface TypingStatus {
  [conversationId: string]: {
    [userId: string]: number
  }
}

export default function MessagesContent() {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversation')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<Record<string, UserData>>({})
  const [accepting, setAccepting] = useState(false)
  const [typingStatus, setTypingStatus] = useState<TypingStatus>({})
  const [localTypingStatus, setLocalTypingStatus] = useState<Record<string, number>>({})
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showChatView, setShowChatView] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [showDirectionsModal, setShowDirectionsModal] = useState(false)


  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Animate header
    gsap.fromTo('.conversations-header',
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
    )

    // Animate conversation cards
    gsap.fromTo('.conversation-card',
      { opacity: 0, x: -30, scale: 0.9 },
      { opacity: 1, x: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.7)' }
    )
  }, [conversations.length])

  useEffect(() => {
    if (!selectedConversation) return

    const db = getDb()
    if (!db) return

    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const conversationRef = doc(db, 'conversations', selectedConversation.id)

      const unsubscribe = onSnapshot(conversationRef, (snapshot) => {
        if (!snapshot.exists()) {
          // Conversation was deleted, redirect to home
          console.log('Conversation deleted, redirecting to home')
          router.push('/')
        }
      })

      return () => unsubscribe()
    })
  }, [selectedConversation, router])


  useEffect(() => {
    if (!isMobile) return;
    if (showChatView && selectedConversation) {
      // Animate chat header
      gsap.fromTo('.chat-header',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      )

      // Animate messages
      gsap.fromTo('.message-bubble',
        { opacity: 0, x: (i) => i % 2 === 0 ? -30 : 30, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }
      )

      // Animate input
      gsap.fromTo('.message-input-container',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'back.out(1.7)' }
      )
    } else if (isMobile && !showChatView) {
      // Animate header
      gsap.fromTo('.conversations-header',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      )

      // Animate conversation cards
      gsap.fromTo('.conversation-card',
        { opacity: 0, x: -30, scale: 0.9 },
        { opacity: 1, x: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(1.7)' }
      )
    }
  }, [showChatView, selectedConversation, isMobile])

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()
    tl.fromTo(containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )

    if (listRef.current) {
      const items = listRef.current.children
      tl.fromTo(Array.from(items),
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(1.7)' },
        '-=0.4'
      )
    }
  }, [conversations.length])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth')
    }
  }, [authUser, authLoading, router])

  // Load conversations
  useEffect(() => {
    if (!authUser) return

    const loadConversations = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore')

        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', authUser.uid),
          orderBy('lastMessageAt', 'desc')
        )

        const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
          const convos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Conversation))

          setConversations(convos)

          // Load user data for all participants
          const userIds = [...new Set(convos.flatMap(c => c.participants))]
          loadUserData(userIds)

          // Auto-select conversation from URL
          if (conversationId && !selectedConversation) {
            const convo = convos.find(c => c.id === conversationId)
            if (convo) {
              setSelectedConversation(convo)
              if (window.innerWidth < 768) {
                setShowChatView(true)
              }
            }
          }

          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading conversations:', error)
        setLoading(false)
      }
    }

    loadConversations()
  }, [authUser, conversationId, selectedConversation])

  // Load user data
  const loadUserData = async (userIds: string[]) => {
    try {
      const db = getDb()
      if (!db) return

      const { doc, getDoc } = await import('firebase/firestore')

      const usersData: Record<string, UserData> = {}

      for (const userId of userIds) {
        if (userData[userId]) continue

        const userDoc = await getDoc(doc(db, 'users', userId))
        if (userDoc.exists()) {
          usersData[userId] = userDoc.data() as UserData
        }
      }

      setUserData(prev => ({ ...prev, ...usersData }))
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const loadMessages = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore')

        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', selectedConversation.id),
          orderBy('createdAt', 'asc')
        )

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message))

          setMessages(msgs)

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()
  }, [selectedConversation])

  // Local typing state
  const lastTypingUpdateRef = useRef<number>(0)
  const isCurrentlyTypingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Listen for typing indicators
  useEffect(() => {
    if (!selectedConversation || !authUser) return

    const db = getDb()
    if (!db) return

    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const typingRef = doc(db, 'typing', selectedConversation.id)

      const unsubscribe = onSnapshot(typingRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, number>
          setTypingStatus(prev => ({
            ...prev,
            [selectedConversation.id]: data
          }))
        }
      })

      return () => unsubscribe()
    })
  }, [selectedConversation, authUser])

  // Handle typing indicator - DEBOUNCED with local state
  const handleTyping = async () => {
    if (!selectedConversation || !authUser) return

    const now = Date.now()
    setLocalTypingStatus(prev => ({
      ...prev,
      [authUser.uid]: now
    }))

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      const db = getDb()
      if (!db) return

      isCurrentlyTypingRef.current = false

      try {
        const { doc, deleteField, updateDoc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: deleteField()
        })
      } catch (error) {
        // Silently fail - typing indicators are not critical
        console.log('Clear typing error (non-critical):', error)
      }
    }, 2000)

    // Only update Firebase every 2 seconds MAX
    if (now - lastTypingUpdateRef.current < 2000) {
      return
    }

    // Check if state actually changed (are we already marked as typing?)
    if (isCurrentlyTypingRef.current) {
      // We're already typing in Firebase, just refresh the timestamp
      lastTypingUpdateRef.current = now

      const db = getDb()
      if (!db) return

      try {
        const { doc, setDoc } = await import('firebase/firestore')
        await setDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: now
        }, { merge: true })
      } catch (error) {
        console.log('Update typing error (non-critical):', error)
      }
      return
    }

    lastTypingUpdateRef.current = now
    isCurrentlyTypingRef.current = true

    // Update Firebase (only once every 2 seconds AND only if state changed)
    const db = getDb()
    if (!db) return

    try {
      const { doc, setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'typing', selectedConversation.id), {
        [authUser.uid]: now
      }, { merge: true })
    } catch (error) {
      // Silently fail - not critical
      console.log('Set typing error (non-critical):', error)
    }
  }

  // Cleanup typing status when unmounting or switching conversations
  useEffect(() => {
    return () => {
      if (!selectedConversation || !authUser) return

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      const db = getDb()
      if (!db) return

      // Mark as not typing when unmounting
      isCurrentlyTypingRef.current = false

      import('firebase/firestore').then(({ doc, deleteField, updateDoc }) => {
        updateDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: deleteField()
        }).catch(() => {
          // Silently fail
        })
      })
    }
  }, [selectedConversation, authUser])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !authUser) return

    setSending(true)

    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { collection, addDoc, doc, updateDoc, deleteField, serverTimestamp } = await import('firebase/firestore')

      // Clear typing status when sending message
      isCurrentlyTypingRef.current = false
      try {
        await updateDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: deleteField()
        })
      } catch (error) {
        // Ignore typing clear errors
      }

      // Add message
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        senderId: authUser.uid,
        text: newMessage.trim(),
        type: 'user',
        createdAt: serverTimestamp(),
        read: false
      })

      // Update conversation
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage.substring(0, 100),
        lastMessageAt: serverTimestamp()
      })

      setNewMessage('')

      // Animate send
      const input = document.querySelector('.message-input')
      if (input) {
        gsap.fromTo(input,
          { scale: 0.95 },
          { scale: 1, duration: 0.2, ease: 'back.out(2)' }
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleAcceptClaim = async () => {
    if (!selectedConversation || !authUser) return

    setAccepting(true)

    setSelectedConversation(prev =>
      prev ? { ...prev, claimAccepted: true } : null
    )

    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } = await import('firebase/firestore')

      const postDoc = await getDoc(doc(db, 'posts', selectedConversation.postId))
      if (!postDoc.exists()) throw new Error('Post not found')

      const postData = postDoc.data()
      const fullAddress = postData.location?.address || 'Address not available'

      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        status: 'accepted',
        claimAccepted: true,
        addressRevealed: true,
        acceptedAt: serverTimestamp()
      })

      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        senderId: 'system',
        text: `📍 Pickup Address: ${fullAddress}`,
        type: 'system',
        createdAt: serverTimestamp(),
        read: false
      })

      await updateDoc(doc(db, 'claims', selectedConversation.claimId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.claimerId,
        type: 'claim_accepted',
        conversationId: selectedConversation.id,
        postTitle: selectedConversation.postTitle,
        message: `Your claim for "${selectedConversation.postTitle}" was accepted!`,
        read: false,
        createdAt: serverTimestamp()
      })

      const button = document.querySelector('.accept-button')
      if (button) {
        gsap.to(button, {
          scale: 1.1,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        })
      }
    } catch (error) {
      console.error('Error accepting claim:', error)
      alert('Failed to accept claim')
      setSelectedConversation(prev =>
        prev ? { ...prev, claimAccepted: false } : null
      )
    } finally {
      setAccepting(false)
    }
  }

  const handleCompletePickup = () => {
    setShowRatingModal(true)
  }

  const handleRatingComplete = () => {
    setShowRatingModal(false)
    router.push('/')
  }

  const handleGetDirections = () => {
    if (!selectedConversation?.postLocation) return
    const address = selectedConversation.postLocation

    // Detect if iOS or Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    if (isIOS) {
      // Apple Maps - use maps:// scheme
      window.location.href = `maps://?address=${encodeURIComponent(address)}`
    } else if (isAndroid) {
      // Google Maps - use geo: scheme
      window.location.href = `geo:0,0?q=${encodeURIComponent(address)}`
    } else {
      // Fallback to Google Maps web for desktop
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank')
    }
  }

  const handleSelectConversation = (convo: Conversation) => {
    setSelectedConversation(convo)
    if (isMobile) {
      setShowChatView(true)
    }
  }

  const handleBackToList = () => {
    setShowChatView(false)
    setSelectedConversation(null)
    setMessages([])

    // Check if we came from a URL parameter
    const conversationId = searchParams.get('conversation')
    if (conversationId) {
      // We have a conversation ID, so navigate to plain /messages
      router.push('/messages')
    }
  }



  if (authLoading || loading) {
    return <LoadingSpinner text="Loading messages..." />
  }

  if (!authUser) {
    return null
  }

  const otherUserId = selectedConversation?.participants.find(id => id !== authUser.uid)
  const otherUser = otherUserId ? userData[otherUserId] : null
  const isClaimAccepted = selectedConversation?.claimAccepted
  const isPoster = selectedConversation?.posterId === authUser.uid

  const isOtherUserTyping = selectedConversation && otherUserId &&
    typingStatus[selectedConversation.id]?.[otherUserId] &&
    typeof typingStatus[selectedConversation.id][otherUserId] === 'number' &&
    (Date.now() - typingStatus[selectedConversation.id][otherUserId]) < 2000

  // MOBILE LAYOUT
  const DirectionsModal = () => {
    if (!selectedConversation?.postLocation) return null

    const address = selectedConversation.postLocation
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="w-full bg-white rounded-t-3xl p-4 space-y-4 animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900">Get Directions</h3>
            <button
              onClick={() => setShowDirectionsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>

          {/* Map Preview */}
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl overflow-hidden border-2 border-orange-200 h-48 w-full">
            <DirectionsMap destinationAddress={selectedConversation.postLocation!} />
          </div>

          {/* Navigation Options */}
          <div className="space-y-2">
            {isIOS ? (
              <>
                <button
                  onClick={() => {
                    window.location.href = `maps://?address=${encodeURIComponent(address)}`
                    setShowDirectionsModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg"
                >
                  🗺️ Open in Apple Maps
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank')
                    setShowDirectionsModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg"
                >
                  🔴 Open in Google Maps
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    window.location.href = `geo:0,0?q=${encodeURIComponent(address)}`
                    setShowDirectionsModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg"
                >
                  🗺️ Open in Google Maps
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank')
                    setShowDirectionsModal(false)
                  }}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg"
                >
                  🌐 Open in Browser
                </button>
              </>
            )}
          </div>

          {/* Copy Address Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(address)
              alert('Address copied!')
            }}
            className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-3 px-4 rounded-2xl font-semibold active:scale-95 transition-transform"
          >
            📋 Copy Address
          </button>

          <button
            onClick={() => setShowDirectionsModal(false)}
            className="w-full bg-gray-200 text-gray-900 py-3 px-4 rounded-2xl font-semibold active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }
  if (isMobile) {
    // Show chat view
    if (showChatView && selectedConversation) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-pink-50 flex flex-col">
          {/* Chat Header */}
          <div className="chat-header bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
            <button
              onClick={handleBackToList}
              className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors transform hover:scale-110 active:scale-95"
              type="button"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-lg transform hover:scale-110 transition-transform">
              {otherUser?.photoURL ? (
                <Image
                  src={otherUser.photoURL}
                  alt={otherUser.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-orange-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{otherUser?.name || 'Anonymous'}</h3>
              <p className="text-xs text-white/80 truncate">{selectedConversation.postTitle}</p>
            </div>
            {isClaimAccepted && (
              <div className="bg-green-400/90 rounded-full p-2 animate-pulse">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
  
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-br from-orange-50/50 to-pink-50/50">
            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === authUser.uid
              const isSystem = msg.type === 'system'
  
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center py-2">
                    <div className="message-bubble bg-blue-100 px-4 py-2 rounded-full text-xs text-blue-700 font-semibold max-w-[85%] text-center shadow-sm">
                      {msg.text}
                    </div>
                  </div>
                )
              }
  
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`message-bubble max-w-[80%] px-4 py-3 rounded-2xl shadow-md transition-all transform hover:scale-105 ${isOwn
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none border border-orange-100'
                      }`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                    </p>
                  </div>
                </div>
              )
            })}
  
            {isOtherUserTyping && (
              <div className="flex justify-start">
                <div className="message-bubble bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-md border border-orange-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
  
            <div ref={messagesEndRef} />
          </div>
  
          {/* Accept Claim Button */}
          {isPoster && !isClaimAccepted && selectedConversation && !selectedConversation.claimAccepted && (
            <div className="action-button px-4 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-green-300">
              <button
                onClick={handleAcceptClaim}
                disabled={accepting}
                className="accept-button w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-2xl font-bold active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl transform hover:scale-105"
                type="button"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Accept & Share Address
                  </>
                )}
              </button>
            </div>
          )}
  
          {/* Get Directions & Complete */}
          {!isPoster && isClaimAccepted && selectedConversation.postLocation && (
            <div className="action-button px-4 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 border-t-2 border-blue-300 space-y-2">
              <button
                onClick={() => setShowDirectionsModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl transform hover:scale-105"
                type="button"
              >
                <MapPinIcon className="w-5 h-5" />
                Get Directions
              </button>
              <button
                onClick={handleCompletePickup}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl transform hover:scale-105"
                type="button"
              >
                <CheckIcon className="w-5 h-5" />
                Complete Pickup
              </button>
            </div>
          )}
  
          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="message-input-container px-4 py-3 bg-white border-t-2 border-orange-200 shadow-lg">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                placeholder="Message..."
                className="message-input flex-1 px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full focus:outline-none text-base text-gray-900 placeholder-gray-500 border border-orange-200 focus:border-orange-500 transition-all"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full disabled:opacity-50 active:scale-90 transition-all flex-shrink-0 shadow-lg hover:shadow-xl transform hover:scale-110"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
  
          {/* Directions Modal */}
          {showDirectionsModal && selectedConversation?.postLocation && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="w-full bg-white rounded-t-3xl p-4 space-y-4 animate-in slide-in-from-bottom">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-900">Get Directions</h3>
                  <button
                    onClick={() => setShowDirectionsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
  
                {/* Map Preview */}
                <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl overflow-hidden border-2 border-orange-200 h-48 w-full">
                  <DirectionsMap destinationAddress={selectedConversation.postLocation} />
                </div>
  
                {/* Navigation Options */}
                <div className="space-y-2">
                  {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = `maps://?address=${encodeURIComponent(selectedConversation.postLocation!)}`
                          setShowDirectionsModal(false)
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl"
                        type="button"
                      >
                        🗺️ Open in Apple Maps
                      </button>
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedConversation.postLocation!)}`, '_blank')
                          setShowDirectionsModal(false)
                        }}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl"
                        type="button"
                      >
                        🔴 Open in Google Maps
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = `geo:0,0?q=${encodeURIComponent(selectedConversation.postLocation!)}`
                          setShowDirectionsModal(false)
                        }}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl"
                        type="button"
                      >
                        🗺️ Open in Google Maps
                      </button>
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedConversation.postLocation!)}`, '_blank')
                          setShowDirectionsModal(false)
                        }}
                        className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-4 rounded-2xl font-bold active:scale-95 flex items-center justify-center gap-2 transition-transform shadow-lg hover:shadow-xl"
                        type="button"
                      >
                        🌐 Open in Browser
                      </button>
                    </>
                  )}
                </div>
  
                {/* Copy Address Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedConversation.postLocation!)
                    alert('Address copied!')
                  }}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-3 px-4 rounded-2xl font-semibold active:scale-95 transition-transform"
                  type="button"
                >
                  📋 Copy Address
                </button>
  
                <button
                  onClick={() => setShowDirectionsModal(false)}
                  className="w-full bg-gray-200 text-gray-900 py-3 px-4 rounded-2xl font-semibold active:scale-95 transition-transform"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
  
          {showRatingModal && otherUser && (
            <RatingModal
              conversationId={selectedConversation.id}
              postId={selectedConversation.postId}
              postTitle={selectedConversation.postTitle}
              posterId={selectedConversation.posterId}
              posterName={otherUser.name}
              posterAvatar={otherUser.photoURL}
              claimId={selectedConversation.claimId}
              onClose={handleRatingComplete}
              currentUserId={authUser.uid}
            />
          )}
        </div>
      )
    }
  
    // Show conversations list
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-pink-50 flex flex-col">
        {/* Header */}
        <div className="conversations-header bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 px-4 py-4 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors transform hover:scale-110 active:scale-95"
              type="button"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <div className="w-10"></div>
          </div>
        </div>
  
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-6xl mb-4 opacity-50 animate-bounce">💬</div>
              <p className="text-gray-700 text-center font-semibold mb-1">No messages yet</p>
              <p className="text-sm text-gray-500 text-center">Start swiping to connect!</p>
            </div>
          ) : (
            <div ref={listRef} className="space-y-2">
              {conversations.map((convo) => {
                const other = convo.participants.find(id => id !== authUser.uid)
                const otherData = other ? userData[other] : null
  
                return (
                  <button
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo)}
                    className="conversation-card w-full p-4 rounded-2xl bg-white border-2 border-orange-100 hover:border-orange-300 active:bg-orange-50 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95"
                    type="button"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-orange-200 shadow-md transform hover:scale-110 transition-transform">
                        <Image
                          src={convo.postPhoto}
                          alt={convo.postTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 truncate text-sm">
                            {convo.postTitle}
                          </h3>
                          {convo.claimAccepted && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 ml-2 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1 font-medium">
                          {otherData?.name || 'Anonymous'}
                        </p>
                        {convo.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {convo.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // DESKTOP LAYOUT
  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-all hover:scale-110 active:scale-95"
              >
                <ArrowLeftIcon className="w-5 h-5 text-orange-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-sm text-gray-600">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
          {/* Conversations List */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Your Matches</h2>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-500">Start swiping to find food!</p>
                </div>
              ) : (
                conversations.map((convo) => {
                  const other = convo.participants.find(id => id !== authUser.uid)
                  const otherData = other ? userData[other] : null
                  const isSelected = selectedConversation?.id === convo.id

                  return (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConversation(convo)}
                      className={`w-full p-4 rounded-xl transition-all duration-200 mb-2 ${isSelected
                        ? 'bg-gradient-to-r from-orange-100 to-pink-100 shadow-lg'
                        : 'hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <Image
                            src={convo.postPhoto}
                            alt={convo.postTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-sm">
                            {convo.postTitle}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {otherData?.name || 'Anonymous'}
                          </p>
                          {convo.lastMessage && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {convo.lastMessage}
                            </p>
                          )}
                        </div>
                        {convo.claimAccepted && (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        {otherUser?.photoURL ? (
                          <Image
                            src={otherUser.photoURL}
                            alt={otherUser.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{otherUser?.name || 'Anonymous'}</h3>
                        <p className="text-xs text-gray-600">{selectedConversation.postTitle}</p>
                      </div>
                    </div>

                    {isClaimAccepted && (
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">Accepted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-orange-50/30 to-pink-50/30">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === authUser.uid
                    const isSystem = msg.type === 'system'

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="bg-blue-100 px-4 py-2 rounded-full text-xs text-blue-800 max-w-md text-center">
                            {msg.text}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                            : 'bg-white text-gray-800 shadow-sm'
                            }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                            {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Accept Claim Button */}
                {isPoster && !isClaimAccepted && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
                    <button
                      onClick={handleAcceptClaim}
                      disabled={accepting}
                      className="accept-button w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {accepting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          Accept Claim & Share Address
                        </>
                      )}
                    </button>
                    <p className="text-xs text-center text-gray-600 mt-2">
                      This will share your pickup address with {otherUser?.name}
                    </p>
                  </div>
                )}

                {/* Get Directions & Complete Pickup */}
                {!isPoster && isClaimAccepted && selectedConversation.postLocation && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-blue-200 space-y-3">
                    <button
                      onClick={handleGetDirections}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MapPinIcon className="w-5 h-5" />
                      Get Directions
                    </button>
                    <button
                      onClick={handleCompletePickup}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckIcon className="w-5 h-5" />
                      Complete Pickup & Rate
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      placeholder={`Message ${otherUser?.name || 'them'}...`}
                      className="message-input flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <HeartIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a match to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRatingModal && selectedConversation && otherUser && (
        <RatingModal
          conversationId={selectedConversation.id}
          postId={selectedConversation.postId}
          postTitle={selectedConversation.postTitle}
          posterId={selectedConversation.posterId}
          posterName={otherUser.name}
          posterAvatar={otherUser.photoURL}
          claimId={selectedConversation.claimId}
          onClose={handleRatingComplete}
          currentUserId={authUser.uid}
        />
      )}
    </div>
  )
}