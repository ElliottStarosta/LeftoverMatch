'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getDb } from '@/lib/firebase-utils'
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
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { doc, getDoc } = await import('firebase/firestore')
        const userDoc = await getDoc(doc(db, 'users', userId))

        if (userDoc.exists()) {
          setUserData(userDoc.data() as User)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [userId])

  useEffect(() => {
    if (!loading && cardRef.current) {
      const tl = gsap.timeline()
      tl.fromTo(cardRef.current,
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
      )
    }
  }, [loading])

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

  if (loading) {
    return <LoadingSpinner text="Loading profile..." fullScreen />
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-orange-50 to-pink-50">
            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className={`text-4xl mb-2 bg-gradient-to-r ${levelBadge.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto`}>
                {levelBadge.emoji}
              </div>
              <p className="text-xs text-gray-600 mb-1">Level</p>
              <p className="text-sm font-bold text-gray-900">{userData.level}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className="flex justify-center gap-0.5 mb-2">
                {getTrustStars(userData.trustScore)}
              </div>
              <p className="text-xs text-gray-600 mb-1">Trust</p>
              <p className="text-sm font-bold text-gray-900">
                {userData.totalRatings && userData.totalRatings > 0
                  ? `${(userData.trustScore * 5).toFixed(1)}`
                  : 'New'
                }
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className="text-3xl mb-2">🍱</div>
              <p className="text-xs text-gray-600 mb-1">Completed</p>
              <p className="text-sm font-bold text-gray-900">{userData.completedClaims}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 text-center shadow-lg">
              <div className="text-3xl mb-2">📤</div>
              <p className="text-xs text-gray-600 mb-1">Shared</p>
              <p className="text-sm font-bold text-gray-900">{userData.successfulPosts || 0}</p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Bio */}
            {userData.bio && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bio 💬</label>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-2xl">
                  {userData.bio}
                </p>
              </div>
            )}

            {/* Dietary Restrictions */}
            {userData.dietaryRestrictions && userData.dietaryRestrictions.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Dietary Restrictions 🥗</label>
                <div className="flex flex-wrap gap-2">
                  {userData.dietaryRestrictions.map((restriction) => (
                    <span key={restriction} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Food Preferences */}
            {userData.foodPreferences && userData.foodPreferences.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Food Preferences 🍽️</label>
                <div className="flex flex-wrap gap-2">
                  {userData.foodPreferences.map((pref) => (
                    <span key={pref} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {userData.allergies && userData.allergies.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Allergies ⚠️</label>
                <div className="flex flex-wrap gap-2">
                  {userData.allergies.map((allergy) => (
                    <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cooking Level */}
            {userData.cookingLevel && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cooking Level 👨‍🍳</label>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-2xl capitalize font-semibold">
                  {userData.cookingLevel}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}