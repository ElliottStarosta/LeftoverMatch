'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getDb, getAuth } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { signOut } from 'firebase/auth'
import { User } from '@/types'
import { gsap } from 'gsap'
import { 
  StarIcon, 
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'

export default function ProfileContent() {
  const { user: authUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    dietaryRestrictions: [] as string[],
    foodPreferences: [] as string[],
    allergies: [] as string[],
    cookingLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'professional',
    location: '',
    maxDistance: 5,
    notifications: true
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth')
    }
  }, [authUser, authLoading, router])

  useEffect(() => {
    if (!authUser) return

    const loadUserData = async () => {
      try {
        const db = getDb()
        if (!db) return

        const { doc, getDoc } = await import('firebase/firestore')
        const userDoc = await getDoc(doc(db, 'users', authUser.uid))

        if (userDoc.exists()) {
          const data = userDoc.data() as User
          setUserData(data)
          setEditData({
            name: data.name,
            bio: data.bio || '',
            dietaryRestrictions: data.dietaryRestrictions || [],
            foodPreferences: data.foodPreferences || [],
            allergies: data.allergies || [],
            cookingLevel: data.cookingLevel || 'beginner',
            location: data.location || '',
            maxDistance: data.maxDistance || 5,
            notifications: data.notifications ?? true
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [authUser])

  useEffect(() => {
    if (!mounted || !cardRef.current || loading) return

    const tl = gsap.timeline()
    
    tl.fromTo(cardRef.current,
      { scale: 0.9, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
    )

    const sections = cardRef.current.querySelectorAll('.profile-section')
    if (sections.length > 0) {
      tl.fromTo(Array.from(sections),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      )
    }
  }, [mounted, loading])

  const handleSave = async () => {
    if (!authUser) return

    setSaving(true)

    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    }

    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')

      const { doc, updateDoc } = await import('firebase/firestore')

      await updateDoc(doc(db, 'users', authUser.uid), {
        name: editData.name,
        bio: editData.bio,
        dietaryRestrictions: editData.dietaryRestrictions,
        foodPreferences: editData.foodPreferences,
        allergies: editData.allergies,
        cookingLevel: editData.cookingLevel,
        location: editData.location,
        maxDistance: editData.maxDistance,
        notifications: editData.notifications
      })

      setUserData(prev => prev ? { ...prev, ...editData } : null)
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      if (auth) {
        await signOut(auth)
        router.push('/auth')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (!authUser) return
    
    setDeleting(true)
  
    try {
      const db = getDb()
      if (!db) throw new Error('Database not available')
  
      const { doc, deleteDoc, collection, query, where, getDocs } = await import('firebase/firestore')
      const { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } = await import('firebase/auth')
  
      const auth = getAuth()
      if (!auth) throw new Error('Auth not available')
  
      // Check the sign-in method
      const providerData = authUser.providerData[0]
      
      if (providerData?.providerId === 'google.com') {
        // Reauthenticate with Google
        const provider = new GoogleAuthProvider()
        await reauthenticateWithPopup(auth.currentUser!, provider)
      } else if (providerData?.providerId === 'password') {
        // Reauthenticate with email/password
        const password = prompt('Please enter your password to confirm account deletion:')
        if (!password) {
          setDeleting(false)
          setShowDeleteModal(false)
          return
        }
        
        if (authUser.email) {
          const credential = EmailAuthProvider.credential(authUser.email, password)
          await reauthenticateWithCredential(authUser, credential)
        }
      }
  
      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', authUser.uid))
  
      // Delete user's posts
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', authUser.uid))
      const postsSnapshot = await getDocs(postsQuery)
      for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(postDoc.ref)
      }
  
      // Delete user's claims
      const claimsQuery = query(collection(db, 'claims'), where('claimerId', '==', authUser.uid))
      const claimsSnapshot = await getDocs(claimsQuery)
      for (const claimDoc of claimsSnapshot.docs) {
        await deleteDoc(claimDoc.ref)
      }
  
      // Delete auth account
      await authUser.delete()
  
      router.push('/auth')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      if (error.code === 'auth/wrong-password') {
        alert('Incorrect password. Please try again.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        alert('Account deletion cancelled.')
      } else if (error.code === 'auth/requires-recent-login') {
        alert('For security reasons, please sign out and sign in again before deleting your account.')
      } else {
        alert('Failed to delete account. Please try again.')
      }
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const toggleOption = (category: 'dietaryRestrictions' | 'foodPreferences' | 'allergies', value: string) => {
    setEditData(prev => {
      const current = prev[category]
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) }
      } else {
        return { ...prev, [category]: [...current, value] }
      }
    })
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

  if (authLoading || loading) {
    return <LoadingSpinner text="Loading profile..." fullScreen />
  }

  if (!authUser || !userData) return null

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

  const levelBadge = getLevelBadge(userData.level)

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 py-8 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors transform hover:scale-105 active:scale-95"
        >
          <ChevronLeftIcon className="w-6 h-6" />
          <span className="font-semibold">Back to Home</span>
        </button>

        <div ref={cardRef} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 p-8 text-center relative">
            <div className="absolute top-4 right-4">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all transform hover:scale-110 active:scale-95"
                >
                  <PencilIcon className="w-5 h-5 text-white" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 bg-green-500 hover:bg-green-600 rounded-full transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    <CheckIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all transform hover:scale-110 active:scale-95"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>

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

            {editing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="text-3xl font-bold text-gray-900 mb-2 bg-white/90 px-4 py-2 rounded-xl text-center w-full max-w-md mx-auto"
              />
            ) : (
              <h1 className="text-3xl font-bold text-white mb-2">{userData.name}</h1>
            )}
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
              {editing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-gray-900"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-4 rounded-2xl">
                  {userData.bio || 'No bio yet'}
                </p>
              )}
            </div>

            {/* Dietary Restrictions */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Dietary Restrictions 🥗</label>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption('dietaryRestrictions', option.value)}
                      className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        editData.dietaryRestrictions.includes(option.value)
                          ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-orange-500 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-xs font-semibold">{option.value}</div>
                    </button>
                  ))}
                </div>
              ) : (
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
              )}
            </div>

            {/* Food Preferences */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Food Preferences 🍽️</label>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {foodPreferences.map((pref) => (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => toggleOption('foodPreferences', pref.value)}
                      className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        editData.foodPreferences.includes(pref.value)
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-500 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{pref.emoji}</div>
                      <div className="text-xs font-semibold">{pref.value}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userData.foodPreferences?.length ? (
                    userData.foodPreferences.map((pref) => (
                      <span key={pref} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {pref}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">None specified</p>
                  )}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="profile-section">
              <label className="block text-sm font-bold text-gray-700 mb-3">Allergies ⚠️</label>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {allergyOptions.map((allergy) => (
                    <button
                      key={allergy.value}
                      type="button"
                      onClick={() => toggleOption('allergies', allergy.value)}
                      className={`p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                        editData.allergies.includes(allergy.value)
                          ? 'bg-gradient-to-br from-red-500 to-orange-500 border-red-500 text-white shadow-lg'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{allergy.emoji}</div>
                      <div className="text-xs font-semibold">{allergy.value}</div>
                    </button>
                  ))}
                </div>
              ) : (
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
              )}
            </div>

            {/* Location & Settings */}
            {editing && (
              <div className="profile-section space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location 📍</label>
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    placeholder="Your address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Distance: {editData.maxDistance} miles 🚗</label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={editData.maxDistance}
                    onChange={(e) => setEditData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                    className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.notifications}
                    onChange={(e) => setEditData(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="w-5 h-5 rounded text-orange-500"
                  />
                  <span className="font-semibold text-gray-700">🔔 Enable notifications</span>
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-2xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Sign Out
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-2xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <TrashIcon className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Account?</h2>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All your data, posts, and claims will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #fb923c);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
          transition: transform 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #fb923c);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  )
}