'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getDb } from '@/lib/firebase-utils'  // Changed from firebase-client
import { useAuth } from '@/lib/useAuth'
import { User } from '@/types'

export default function ProfileSetupPage() {
  const { user, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    dietaryRestrictions: [] as string[],
    foodPreferences: [] as string[],
    allergies: [] as string[],
    cookingLevel: 'beginner',
    location: '',
    lat: 0,
    lng: 0,
    maxDistance: 5,
    notifications: true,
    profileImage: ''
  })
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user && user.displayName) {
      setFormData(prev => ({ ...prev, name: user.displayName || '' }))
    }
  }, [user])

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Mediterranean'
  ]

  const foodPreferences = [
    'Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'American', 'French', 'Thai', 'Chinese', 'Japanese', 'Korean', 'Middle Eastern'
  ]

  const allergyOptions = [
    'Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Sesame', 'Fish', 'Peanuts'
  ]

  const handleLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
          console.log('Location access denied or failed')
        }
      )
    } else {
      console.log('Geolocation is not supported by this browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const userData: User = {
        uid: user.uid,
        name: formData.name,
        email: user.email || '',
        photoURL: user.photoURL || formData.profileImage,
        joinedAt: new Date(),
        activeClaimsCount: 0,
        totalClaims: 0,
        completedClaims: 0,
        expiredClaims: 0,
        trustScore: 1.0,
        level: 'Rookie Rescuer',
        maxClaimsAllowed: 1,
        banned: false,
        successfulPosts: 0,
        // Profile data
        bio: formData.bio,
        dietaryRestrictions: formData.dietaryRestrictions,
        foodPreferences: formData.foodPreferences,
        allergies: formData.allergies,
        cookingLevel: formData.cookingLevel as 'beginner' | 'intermediate' | 'advanced' | 'professional',
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        maxDistance: formData.maxDistance,
        notifications: formData.notifications
      }

      // Get the Firestore instance correctly
      const dbInstance = getDb()
      if (!dbInstance) {
        throw new Error('Database not available')
      }
      
      // Dynamic import for Firestore functions
      const { doc, setDoc } = await import('firebase/firestore')
      
      // CORRECT: Pass db instance as first argument to doc()
      await setDoc(doc(dbInstance, 'users', user.uid), userData)
      
      console.log('Profile saved successfully!')
      router.push('/')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍽️</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Set Up Your Profile</h1>
            <p className="text-gray-600">Tell us about your food preferences to get better matches</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.profileImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, profileImage: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="https://example.com/your-photo.jpg"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dietary Preferences</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dietary Restrictions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dietaryOptions.map((option) => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.dietaryRestrictions.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions: [...prev.dietaryRestrictions, option]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                dietaryRestrictions: prev.dietaryRestrictions.filter(item => item !== option)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Food Allergies
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allergyOptions.map((allergy) => (
                      <label key={allergy} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allergies.includes(allergy)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                allergies: [...prev.allergies, allergy]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                allergies: prev.allergies.filter(item => item !== allergy)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{allergy}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Food Preferences</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Favorite Cuisines
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {foodPreferences.map((cuisine) => (
                      <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.foodPreferences.includes(cuisine)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                foodPreferences: [...prev.foodPreferences, cuisine]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                foodPreferences: prev.foodPreferences.filter(item => item !== cuisine)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cooking Level
                  </label>
                  <select
                    value={formData.cookingLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, cookingLevel: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Location & Settings</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      placeholder="Enter your city or address"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleLocationPermission}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      📍
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Distance (miles)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {formData.maxDistance} miles
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={formData.notifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-700">
                    Enable notifications for nearby food
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors ml-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 ml-auto"
                >
                  {saving ? 'Creating Profile...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}