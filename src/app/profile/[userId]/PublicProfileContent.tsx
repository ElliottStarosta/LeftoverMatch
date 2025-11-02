'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { gsap } from 'gsap'
import { StarIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

interface PublicProfileContentProps {
  userId: string
}

export default function PublicProfileContent({ userId }: PublicProfileContentProps) {
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError('No user ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Import Firebase functions dynamically
        const { getFirestore, doc, getDoc } = await import('firebase/firestore')
        const { getApp } = await import('@/lib/firebase-utils')

        // Get Firebase app and Firestore instance
        const app = getApp()
        const db = getFirestore(app)

        if (!db) {
          throw new Error('Firestore not initialized')
        }

        // Fetch user document
        const userDocRef = doc(db, 'users', userId)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const data = userDocSnap.data()
          console.log('Full user data loaded:', data)
          console.log('Bio:', data.bio)
          console.log('Dietary Restrictions:', data.dietaryRestrictions)
          console.log('Food Preferences:', data.foodPreferences)
          console.log('Allergies:', data.allergies)
          console.log('Cooking Level:', data.cookingLevel)
          setUserData(data as User)
        } else {
          setError('User profile not found')
        }
      } catch (err) {
        console.error('Error loading user data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [userId])

  useEffect(() => {
    if (!loading && cardRef.current && userData) {
      const tl = gsap.timeline()
      tl.fromTo(
        cardRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
      )
    }
  }, [loading, userData])

  const getTrustStars = (score: number) => {
    const stars = []
    const fullStars = Math.floor(score * 5)
    for (let i = 0; i < 5; i++) {
      stars.push(
        i < fullStars ? (
          <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="w-5 h-5 text-gray-300" />
        )
      )
    }
    return stars
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Rookie Rescuer':
        return { emoji: '🌱', color: 'from-gray-400 to-gray-500' }
      case 'Food Hero':
        return { emoji: '⭐', color: 'from-blue-500 to-purple-500' }
      case 'Food Legend':
        return { emoji: '👑', color: 'from-yellow-400 to-orange-500' }
      default:
        return { emoji: '🌱', color: 'from-gray-400 to-gray-500' }
    }
  }

  const dietaryOptions = [
    { value: 'Vegetarian', emoji: '🥗' },
    { value: 'Vegan', emoji: '🌱' },
    { value: 'Pescatarian', emoji: '🐟' },
    { value: 'Keto', emoji: '🥑' },
    { value: 'Paleo', emoji: '🍖' },
    { value: 'Gluten-Free', emoji: '🌾' },
    { value: 'Dairy-Free', emoji: '🥛' },
    { value: 'Halal', emoji: '☪️' }
  ]

  const foodPreferences = [
    { value: 'Italian', emoji: '🍝' },
    { value: 'Asian', emoji: '🍜' },
    { value: 'Mexican', emoji: '🌮' },
    { value: 'Indian', emoji: '🍛' },
    { value: 'Mediterranean', emoji: '🫒' },
    { value: 'American', emoji: '🍔' },
    { value: 'French', emoji: '🥐' },
    { value: 'Thai', emoji: '🍲' },
    { value: 'Chinese', emoji: '🥟' },
    { value: 'Japanese', emoji: '🍱' },
    { value: 'Korean', emoji: '🍲' },
    { value: 'Middle Eastern', emoji: '🧆' }
  ]

  const allergyOptions = [
    { value: 'Nuts', emoji: '🥜' },
    { value: 'Dairy', emoji: '🧀' },
    { value: 'Gluten', emoji: '🍞' },
    { value: 'Shellfish', emoji: '🦐' },
    { value: 'Eggs', emoji: '🥚' },
    { value: 'Soy', emoji: '🫘' },
    { value: 'Sesame', emoji: '🫘' },
    { value: 'Fish', emoji: '🐠' }
  ]

  if (loading) {
    return <LoadingSpinner text="Loading profile..." fullScreen />
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Profile Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">User ID: {userId}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const levelBadge = getLevelBadge(userData.level)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 py-8 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors transform hover:scale-105 active:scale-95"
          type="button"
        >
          <ChevronLeftIcon className="w-6 h-6" />
          <span className="font-semibold">Back</span>
        </button>

        <div ref={cardRef} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 p-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {userData.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt={userData.name}
                  fill
                  className="rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl font-bold text-orange-500 border-4 border-white shadow-xl">
                  {userData.name.charAt(0)}
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">{userData.name}</h1>
            <p className="text-white/90">{userData.email}</p>
          </div>

          {/* Stats Section */}
          <div className="profile-section grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-orange-50 to-pink-50">
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
              <div className={`text-4xl mb-2 bg-gradient-to-r ${levelBadge.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto`}>
                <span>{levelBadge.emoji}</span>
              </div>
              <p className="text-xs text-gray-600 mb-1">Level</p>
              <p className="text-sm font-bold text-gray-900">{userData.level}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
              <div className="flex justify-center gap-0.5 mb-2">
                {getTrustStars(userData.trustScore)}
              </div>
              <p className="text-xs text-gray-600 mb-1">Trust Score</p>
              <p className="text-sm font-bold text-gray-900">
                {userData.totalRatings && userData.totalRatings > 0
                  ? `${(userData.trustScore * 5).toFixed(1)} (${userData.totalRatings})`
                  : 'No ratings'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
              <div className="text-3xl mb-2">🍱</div>
              <p className="text-xs text-gray-600 mb-1">Completed</p>
              <p className="text-sm font-bold text-gray-900">{userData.completedClaims}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg transform hover:scale-105 transition-all">
              <div className="text-3xl mb-2">📤</div>
              <p className="text-xs text-gray-600 mb-1">Shared</p>
              <p className="text-sm font-bold text-gray-900">{userData.successfulPosts || 0}</p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Bio */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio 💬</label>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-2xl">
                {userData.bio || 'No bio yet'}
              </p>
            </div>

            {/* Dietary Restrictions */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Dietary Restrictions 🥗</label>
              <div className="flex flex-wrap gap-2">
                {userData.dietaryRestrictions?.length ? (
                  userData.dietaryRestrictions.map((restriction) => (
                    <span key={restriction} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {restriction}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>

            {/* Food Preferences */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Food Preferences 🍽️</label>
              <div className="flex flex-wrap gap-2">
                {userData.foodPreferences?.length ? (
                  userData.foodPreferences.map((pref) => (
                    <span key={pref} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {pref}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Allergies ⚠️</label>
              <div className="flex flex-wrap gap-2">
                {userData.allergies?.length ? (
                  userData.allergies.map((allergy) => (
                    <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">None specified</p>
                )}
              </div>
            </div>

            {/* Cooking Level */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-2">Cooking Level 👨‍🍳</label>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-2xl capitalize font-semibold">
                {userData.cookingLevel || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #f97316, #fbbf24);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ea580c, #f59e0b);
        }
      `}</style>
    </div>
  )
}