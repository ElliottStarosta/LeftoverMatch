'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { getDb } from '@/lib/firebase-utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from './LoadingSpinner'

interface ClaimModalProps {
  post: {
    id: string
    title: string
    description: string
    photoUrl: string
    userId: string
    location: {
      address: string
      lat: number
      lng: number
    }
    distance: number
    compatibilityPercentage: number
    matchReasons: string[]
  }
  onClose: () => void
  claimId: string
  currentUserId: string
}

export default function ClaimModal({ post, onClose, claimId, currentUserId }: ClaimModalProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [posterData, setPosterData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const heartRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch poster data
  useEffect(() => {
    const fetchPosterData = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { doc, getDoc } = await import('firebase/firestore')
        const posterDoc = await getDoc(doc(db, 'users', post.userId))
        
        if (posterDoc.exists()) {
          const data = posterDoc.data()
          setPosterData(data)
        }
      } catch (error) {
        console.error('Error fetching poster data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosterData()
  }, [post.userId])

  // Entrance animation
  useEffect(() => {
    if (loading) return
    
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

    if (heartRef.current) {
      tl.fromTo(heartRef.current,
        { scale: 0, rotation: -180 },
        { 
          scale: 1, 
          rotation: 0, 
          duration: 0.8, 
          ease: 'elastic.out(1, 0.6)',
          onComplete: () => {
            if (heartRef.current) {
              gsap.to(heartRef.current, {
                y: -10,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
              })
            }
          }
        },
        '-=0.5'
      )
    }

    if (contentRef.current) {
      const children = contentRef.current.children
      tl.fromTo(Array.from(children),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
        '-=0.5'
      )
    }
  }, [loading])

  const handleSendMessage = async () => {
    if (!message.trim() || !claimId) {
      return
    }
    
    setSending(true)
    
    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

      const conversationRef = await addDoc(collection(db, 'conversations'), {
        claimId,
        postId: post.id,
        postTitle: post.title,
        postPhoto: post.photoUrl,
        postLocation: post.location.address,
        postDistance: post.distance,
        participants: [currentUserId, post.userId],
        claimerId: currentUserId,
        posterId: post.userId,
        status: 'pending',
        claimAccepted: false,
        addressRevealed: false,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: message.substring(0, 100)
      })

      await addDoc(collection(db, 'messages'), {
        conversationId: conversationRef.id,
        senderId: currentUserId,
        text: message,
        type: 'user',
        createdAt: serverTimestamp(),
        read: false
      })

      await addDoc(collection(db, 'notifications'), {
        userId: post.userId,
        type: 'new_claim',
        claimId,
        postId: post.id,
        postTitle: post.title,
        claimerName: posterData?.name || 'Someone',
        conversationId: conversationRef.id,
        message: `Someone wants your ${post.title}!`,
        read: false,
        createdAt: serverTimestamp()
      })

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
          onComplete: () => {
            onClose()
          }
        }, '-=0.1')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
      setSending(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

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
        onComplete: () => {
          onClose()
        }
      }, '-=0.1')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <LoadingSpinner text="Loading..." fullScreen={false} />
        </div>
      </div>
    )
  }

  const posterName = posterData?.name || 'Anonymous'
  const posterAvatar = posterData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(posterName)}&background=f97316&color=fff&size=128`

  const quickMessages = [
    "Hey! Your food looks amazing. When can I grab it?",
    "Hi! I'm interested. What time works for you?",
    "Yo! This looks fire 🔥 Can I pick it up today?"
  ]

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="sticky top-4 left-[calc(100%-3.5rem)] z-10 w-10 h-10 bg-white/90 backdrop-blur hover:bg-gray-100 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>

        <div ref={contentRef} className="p-8 pt-2">
          {/* Heart Icon */}
          <div ref={heartRef} className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <HeartSolidIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3">
            It's a Match!
          </h2>
          
          <p className="text-center text-gray-700 mb-6">
            Slide into <span className="font-bold text-orange-600">{posterName}'s</span> DMs to claim this food
          </p>

          {/* Food Preview */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex gap-4 items-center">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                <Image
                  src={post.photoUrl}
                  alt={post.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{post.title}</h3>
                <p className="text-sm text-gray-600">{post.distance.toFixed(1)} miles away</p>
              </div>
            </div>
          </div>

          {/* Poster Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-2xl">
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-md">
              <Image
                src={posterAvatar}
                alt={posterName}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{posterName}</h4>
              <p className="text-xs text-gray-600">Will share address after accepting</p>
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Send a message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hey ${posterName}! When can I pick this up?`}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 resize-none"
            />
          </div>

          {/* Quick Messages */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-600 mb-2">Quick messages:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickMessages.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="text-left bg-white border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 active:scale-[0.98]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="w-full bg-gradient-to-r from-rose-500 via-orange-500 to-pink-500 text-white py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Message 🚀'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}