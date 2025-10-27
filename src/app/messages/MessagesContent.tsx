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
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/solid'

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
    [userId: string]: boolean
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
  const [showRatingModal, setShowRatingModal] = useState(false)


  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
        if (userData[userId]) continue // Skip if already loaded

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

          // Scroll to bottom
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

  // Local typing state - NO FIREBASE
  const [localTypingStatus, setLocalTypingStatus] = useState<Record<string, number>>({})
  const lastTypingUpdateRef = useRef<number>(0)
  const isCurrentlyTypingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Listen for typing indicators (read-only, efficient)
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
  const handleTyping = () => {
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
    typingTimeoutRef.current = setTimeout(() => {
      const db = getDb()
      if (!db) return

      isCurrentlyTypingRef.current = false

      import('firebase/firestore').then(({ doc, deleteField, updateDoc }) => {
        updateDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: deleteField()
        }).catch(() => { })
      })
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

      import('firebase/firestore').then(({ doc, setDoc }) => {
        setDoc(doc(db, 'typing', selectedConversation.id), {
          [authUser.uid]: now
        }, { merge: true }).catch(() => { })
      })
      return
    }

    lastTypingUpdateRef.current = now
    isCurrentlyTypingRef.current = true

    // Update Firebase (only once every 2 seconds AND only if state changed)
    const db = getDb()
    if (!db) return

    import('firebase/firestore').then(({ doc, setDoc }) => {
      setDoc(doc(db, 'typing', selectedConversation.id), {
        [authUser.uid]: now
      }, { merge: true }).catch(() => {
        // Silently fail - not critical
      })
    })
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
        }).catch(() => { })
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
      updateDoc(doc(db, 'typing', selectedConversation.id), {
        [authUser.uid]: deleteField()
      }).catch(() => { })

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

    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } = await import('firebase/firestore')

      // Get the post to get the address
      const postDoc = await getDoc(doc(db, 'posts', selectedConversation.postId))
      if (!postDoc.exists()) throw new Error('Post not found')

      const postData = postDoc.data()
      const fullAddress = postData.location?.address || 'Address not available'

      // Update conversation
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        status: 'accepted',
        claimAccepted: true,
        addressRevealed: true,
        acceptedAt: serverTimestamp()
      })

      // Send system message with address
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        senderId: 'system',
        text: `📍 Pickup Address: ${fullAddress}`,
        type: 'system',
        createdAt: serverTimestamp(),
        read: false
      })

      // Update claim status
      await updateDoc(doc(db, 'claims', selectedConversation.claimId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      // Send notification to claimer
      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.claimerId,
        type: 'claim_accepted',
        conversationId: selectedConversation.id,
        postTitle: selectedConversation.postTitle,
        message: `Your claim for "${selectedConversation.postTitle}" was accepted!`,
        read: false,
        createdAt: serverTimestamp()
      })

      // Animate success
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
    } finally {
      setAccepting(false)
    }
  }

  const handleCompletePickup = () => {
    setShowRatingModal(true)
  }

  const handleRatingComplete = () => {
    setShowRatingModal(false)
    // Redirect to home
    router.push('/')
  }

  const handleGetDirections = () => {
    if (!selectedConversation?.postLocation) return
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedConversation.postLocation)}`
    window.open(mapsUrl, '_blank')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  const otherUserId = selectedConversation?.participants.find(id => id !== authUser.uid)
  const otherUser = otherUserId ? userData[otherUserId] : null
  const isClaimAccepted = selectedConversation?.claimAccepted
  const isPoster = selectedConversation?.posterId === authUser.uid

  // Check if other user is typing (within last 2 seconds)
  const isOtherUserTyping = selectedConversation && otherUserId &&
    typingStatus[selectedConversation.id]?.[otherUserId] &&
    (Date.now() - typingStatus[selectedConversation.id][otherUserId]) < 2000

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
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {/* Conversations List */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Your Matches</h2>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full max-w-[420px] mx-auto">
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
                      onClick={() => setSelectedConversation(convo)}
                      className={`w-full p-5 rounded-xl transition-all duration-200 mb-2 ${isSelected
                          ? 'bg-gradient-to-r from-orange-100 to-pink-100 shadow-lg scale-105'
                          : 'hover:bg-gray-50 active:scale-95'
                        }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
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
          <div className="md:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden flex flex-col">
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

                  {/* Typing Indicator */}
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

                {/* Accept Claim Button (for poster) */}
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

                {/* Get Directions & Complete Pickup (for claimer after accepted) */}
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
      {/* Rating Modal */}
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