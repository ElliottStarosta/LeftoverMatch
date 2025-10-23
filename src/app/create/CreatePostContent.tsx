'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase-client'
import { useAuth } from '@/lib/useAuth'
import { Post } from '@/types'

export default function CreatePostPage() {
  const { user, loading } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: 1,
    homemade: false,
    refrigerated: false,
    allergens: [] as string[],
    preparedAt: '',
    pickupWindowStart: '',
    pickupWindowEnd: '',
    location: '',
    lat: 0,
    lng: 0,
    image: null as File | null,
    imagePreview: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const allergenOptions = [
    'Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy', 'Sesame', 'Fish', 'Peanuts'
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

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
          setError('Unable to get your location. Please enter it manually.')
        }
      )
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError('')

    try {
      let imageUrl = ''
      
      if (formData.image && storage) {
        const storageInstance = storage()
        if (!storageInstance) {
          throw new Error('Storage not available')
        }
        const imageRef = ref(storageInstance, `posts/${user.uid}/${Date.now()}_${formData.image.name}`)
        await uploadBytes(imageRef, formData.image)
        imageUrl = await getDownloadURL(imageRef)
      }

      const postData: Omit<Post, 'id'> = {
        userId: user.uid,
        title: formData.title,
        description: formData.description,
        photoUrl: imageUrl,
        location: {
          lat: formData.lat,
          lng: formData.lng,
          address: formData.location
        },
        status: 'available',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        quantity: formData.quantity,
        pickupWindow: {
          start: new Date(formData.pickupWindowStart),
          end: new Date(formData.pickupWindowEnd)
        },
        foodMeta: {
          homemade: formData.homemade,
          refrigerated: formData.refrigerated,
          preparedAt: formData.preparedAt ? new Date(formData.preparedAt) : undefined,
          allergens: formData.allergens
        }
      }

      const dbInstance = db()
      if (!dbInstance) {
        throw new Error('Database not available')
      }
      
      await addDoc(collection(dbInstance, 'posts'), postData)
      router.push('/')
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Failed to create post. Please try again.')
    } finally {
      setSubmitting(false)
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
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🍽️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Share Your Food</h1>
            <p className="text-gray-600 text-sm">Help reduce food waste by sharing your leftovers</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Photo *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {formData.imagePreview ? (
                  <div className="space-y-2">
                    <img 
                      src={formData.imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500 text-sm mb-2">Click to upload a photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      required
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 cursor-pointer"
                    >
                      Choose Photo
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Fresh Pizza Slices"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="Describe your food..."
                rows={3}
                required
              />
            </div>

            {/* Food Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Food Details</h3>
              
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.homemade}
                    onChange={(e) => setFormData(prev => ({ ...prev, homemade: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Homemade</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.refrigerated}
                    onChange={(e) => setFormData(prev => ({ ...prev, refrigerated: e.target.checked }))}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Refrigerated</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prepared At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.preparedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparedAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens (if any)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allergenOptions.map((allergen) => (
                    <label key={allergen} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(allergen)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              allergens: [...prev.allergens, allergen]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              allergens: prev.allergens.filter(item => item !== allergen)
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="ml-1 text-xs text-gray-700">{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Pickup Window */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Pickup Window</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available From *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.pickupWindowStart}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickupWindowStart: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Until *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.pickupWindowEnd}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickupWindowEnd: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Location</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    placeholder="Enter pickup address"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleLocationPermission}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    📍
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'Creating Post...' : 'Share Food'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
