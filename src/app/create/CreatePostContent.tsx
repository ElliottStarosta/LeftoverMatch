'use client'

import { useState, useEffect, useRef } from 'react'
import CustomDateTimePicker from './CustomDateTimePicker'
import { useRouter } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { useAuth } from '@/lib/useAuth'
import { Post } from '@/types'
import { gsap } from 'gsap'

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
  const [mounted, setMounted] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [isPickupStartOpen, setIsPickupStartOpen] = useState(false)
  const [isPickupEndOpen, setIsPickupEndOpen] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const allergenOptions = [
    { value: 'Nuts', emoji: '🥜' },
    { value: 'Dairy', emoji: '🧀' },
    { value: 'Gluten', emoji: '🍞' },
    { value: 'Shellfish', emoji: '🦐' },
    { value: 'Eggs', emoji: '🥚' },
    { value: 'Soy', emoji: '🫘' },
    { value: 'Sesame', emoji: '🫘' },
    { value: 'Fish', emoji: '🐠' },
    { value: 'Peanuts', emoji: '🥜' }
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user) {
      console.log('🚀 Auto-fetching location on mount...')
      handleLocationPermission()
    }
  }, [mounted, user])

  // Auto-fill pickup window with today's date
  useEffect(() => {
    if (mounted) {
      const now = new Date()
      console.log('Current time:', now.toString())
      console.log('Current time ISO:', now.toISOString())
      console.log('Timezone offset:', now.getTimezoneOffset())

      // Format for datetime-local input (local time, not UTC)
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      const startTime = `${year}-${month}-${day}T${hours}:${minutes}`

      // Set end time to 2 hours from now
      const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const endHours = String(endDate.getHours()).padStart(2, '0')
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
      const endDay = String(endDate.getDate()).padStart(2, '0')
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')

      const endTime = `${endDate.getFullYear()}-${endMonth}-${endDay}T${endHours}:${endMinutes}`

      console.log('Setting start time to:', startTime)
      console.log('Setting end time to:', endTime)

      setFormData(prev => ({
        ...prev,
        pickupWindowStart: startTime,
        pickupWindowEnd: endTime
      }))
    }
  }, [mounted])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Initial entrance animation
  useEffect(() => {
    if (!mounted || !cardRef.current) return

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.fromTo(cardRef.current,
      { scale: 0.8, opacity: 0, y: 50 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
    )

    if (contentRef.current) {
      const children = contentRef.current.children
      tl.fromTo(Array.from(children),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
        '-=0.4'
      )
    }
  }, [mounted])

  const handleLocationPermission = () => {
    setLocationStatus('loading')
    const button = document.querySelector('.location-btn')

    if (button) {
      gsap.to(button, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      })
    }

    let attempt = 0
    const maxAttempts = 5
    let currentDelay = 2000
    let isComplete = false

    const attemptGeolocation = () => {
      if (isComplete) return

      attempt++
      console.log(`🔄 Attempt ${attempt} of ${maxAttempts} (delay: ${currentDelay}ms)`)

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isComplete) return
            isComplete = true

            console.log('✅ Location obtained successfully')

            setFormData(prev => ({
              ...prev,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }))
            setLocationStatus('success')

            if (button) {
              gsap.to(button, {
                backgroundColor: '#10b981',
                duration: 0.3,
                ease: 'power2.out'
              })
            }

            reverseGeocodeDetailed(position.coords.latitude, position.coords.longitude)
          },
          (error) => {
            if (isComplete) return

            console.log(`❌ Attempt ${attempt} failed:`, error.message)

            if (attempt < maxAttempts) {
              currentDelay += 1000
              console.log(`⏳ Retrying in ${currentDelay}ms...`)
              setTimeout(attemptGeolocation, currentDelay)
            } else {
              isComplete = true
              console.log('❌ All location attempts failed')
              setLocationStatus('error')

              if (button) {
                gsap.to(button, {
                  backgroundColor: '#ef4444',
                  duration: 0.3,
                  ease: 'power2.out'
                })
              }

              setTimeout(() => {
                if (button) {
                  gsap.to(button, {
                    backgroundColor: '#f97316',
                    duration: 0.3
                  })
                }
                setLocationStatus('idle')
              }, 2000)
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        )
      } else {
        isComplete = true
        setLocationStatus('error')

        if (button) {
          gsap.to(button, {
            backgroundColor: '#ef4444',
            duration: 0.3,
            ease: 'power2.out'
          })
        }

        setTimeout(() => {
          if (button) {
            gsap.to(button, {
              backgroundColor: '#f97316',
              duration: 0.3
            })
          }
          setLocationStatus('idle')
        }, 2000)
      }
    }

    attemptGeolocation()
  }

  const reverseGeocodeDetailed = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      const data = await response.json()

      if (data.address) {
        const address = data.address
        const addressParts = []

        if (address.house_number && address.road) {
          addressParts.push(`${address.house_number} ${address.road}`)
        } else if (address.road) {
          addressParts.push(address.road)
        }

        if (address.city) {
          addressParts.push(address.city)
        } else if (address.town) {
          addressParts.push(address.town)
        } else if (address.village) {
          addressParts.push(address.village)
        }

        const fullAddress = addressParts.join(', ')
        setFormData(prev => ({
          ...prev,
          location: fullAddress
        }))
      }
    } catch (error) {
      console.error('Error with detailed geocoding:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }))

        // Animate image preview
        setTimeout(() => {
          const preview = document.querySelector('.image-preview')
          if (preview) {
            gsap.fromTo(preview,
              { scale: 0.8, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
            )
          }
        }, 50)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleAllergen = (allergen: string) => {
    const element = document.querySelector(`[data-allergen="${allergen}"]`)
    if (element) {
      gsap.to(element, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    }

    setFormData(prev => {
      if (prev.allergens.includes(allergen)) {
        return { ...prev, allergens: prev.allergens.filter(item => item !== allergen) }
      } else {
        return { ...prev, allergens: [...prev.allergens, allergen] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
  
    // Custom validation for image
    if (!formData.image) {
      setError('Please upload a photo of your food')
      const imageSection = document.querySelector('.image-upload-section')
      if (imageSection) {
        imageSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
        gsap.to(imageSection, {
          scale: 1.02,
          duration: 0.2,
          yoyo: true,
          repeat: 3,
          ease: 'power2.inOut'
        })
      }
      return
    }
  
    setSubmitting(true)
    setError('')
  
    // Celebratory animation
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    }
  
    try {
      let imageUrl = ''
  
      if (formData.image) {
        try {
          console.log('📤 Starting image upload...')
      
          const formDataToSend = new FormData()
          formDataToSend.append('image', formData.image)
      
          const uploadResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
            {
              method: 'POST',
              body: formDataToSend
            }
          )
      
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image')
          }
      
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.data.url
      
          console.log('✅ Image uploaded:', imageUrl)
        } catch (uploadError) {
          console.error('❌ Error uploading image:', uploadError)
          setError('Failed to upload image. Please try again.')
          setSubmitting(false)
          return
        }
      }
           
      const foodMeta: any = {
        homemade: formData.homemade,
        refrigerated: formData.refrigerated,
        preparedAt: formData.preparedAt ? new Date(formData.preparedAt) : new Date()      
      }
      
      // Only add allergens if there are any
      if (formData.allergens.length > 0) {
        foodMeta.allergens = formData.allergens
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        quantity: formData.quantity,
        pickupWindow: {
          start: new Date(formData.pickupWindowStart),
          end: new Date(formData.pickupWindowEnd)
        },
        foodMeta
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100 py-8 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div ref={cardRef} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-8 text-center relative">
            <div className="text-6xl mb-3 animate-bounce">🍽️</div>
            <h1 className="text-3xl font-bold text-white mb-2">Share Your Food</h1>
            <p className="text-white/90 text-sm">Help reduce food waste and make someone's day</p>
          </div>

          {error && (
            <div className="mx-8 mt-6 bg-red-50 border-2 border-red-200 text-red-600 px-5 py-4 rounded-2xl animate-shake">
              <span className="font-semibold">⚠️ {error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8">
            <div ref={contentRef} className="space-y-6">
              {/* Image Upload */}
              <div className="group image-upload-section">
                {/* Food Photo - Add asterisk */}
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Food Photo
                </label>
                <div className="border-3 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-orange-400 transition-all duration-300 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
                  {formData.imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="image-preview w-full h-64 object-cover rounded-2xl mx-auto shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const preview = document.querySelector('.image-preview')
                          if (preview) {
                            gsap.to(preview, {
                              scale: 0,
                              opacity: 0,
                              duration: 0.3,
                              onComplete: () => {
                                setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))
                              }
                            })
                          }
                        }}
                        className="text-red-500 text-sm font-semibold hover:text-red-700 px-4 py-2 rounded-full hover:bg-red-50 transition-all duration-300"
                      >
                        🗑️ Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
  <div className="text-6xl mb-3">📷</div>
  <p className="text-gray-600 font-medium mb-4">Upload a delicious photo of your food!</p>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="hidden"
    id="image-upload"
  />
  <label
    htmlFor="image-upload"
    className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-amber-600 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg"
  >
    Choose Photo
  </label>
</div>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  {/* Food Title - Add asterisk */}
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Food Title ✨
                  </label>

                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300 text-lg"
                    placeholder="e.g., Fresh Pizza Slices"
                    required
                  />
                </div>

                <div className="group">
                  {/* Quantity - Add asterisk */}
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Quantity 🍴
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300 text-lg"
                    required
                  />
                </div>
              </div>

              <div className="group">
                {/* Description - Add asterisk */}
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description 💬
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300 resize-none"
                  placeholder="Tell us about your delicious food..."
                  rows={4}
                  required
                />
              </div>

              {/* Food Details */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Food Details 🍳</h3>

                <div className="flex flex-wrap gap-4 mb-4">
                  <label className="flex items-center bg-white px-4 py-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-orange-400 transition-all duration-300 transform hover:scale-105">
                    <input
                      type="checkbox"
                      checked={formData.homemade}
                      onChange={(e) => setFormData(prev => ({ ...prev, homemade: e.target.checked }))}
                      className="w-5 h-5 rounded-lg border-2 border-orange-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="ml-3 text-gray-700 font-semibold">🏠 Homemade</span>
                  </label>

                  <label className="flex items-center bg-white px-4 py-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-orange-400 transition-all duration-300 transform hover:scale-105">
                    <input
                      type="checkbox"
                      checked={formData.refrigerated}
                      onChange={(e) => setFormData(prev => ({ ...prev, refrigerated: e.target.checked }))}
                      className="w-5 h-5 rounded-lg border-2 border-orange-300 text-orange-500 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="ml-3 text-gray-700 font-semibold">❄️ Refrigerated</span>
                  </label>
                </div>

                <CustomDateTimePicker
                  value={formData.preparedAt}
                  onChange={(value) => setFormData(prev => ({ ...prev, preparedAt: value }))}
                  label="Prepared At 🕒"
                  required
                />
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Contains Allergens ⚠️
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {allergenOptions.map((allergen) => (
                    <button
                      key={allergen.value}
                      type="button"
                      data-allergen={allergen.value}
                      onClick={() => toggleAllergen(allergen.value)}
                      className={`p-3 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${formData.allergens.includes(allergen.value)
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 border-red-500 text-white shadow-lg'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                        }`}
                    >
                      <div className="text-2xl mb-1">{allergen.emoji}</div>
                      <div className="text-xs font-semibold">{allergen.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Window */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6">
  <h3 className="font-bold text-gray-800 mb-4 text-lg">Pickup Window ⏰</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {!isPickupEndOpen && (
      <div className={isPickupStartOpen ? 'md:col-span-2' : ''}>
        <CustomDateTimePicker
          value={formData.pickupWindowStart}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, pickupWindowStart: value }))
            setIsPickupStartOpen(false)
          }}
          label="Available From 🟢"
          required
          isOpen={isPickupStartOpen}
          onOpenChange={(open) => {
            setIsPickupStartOpen(open)
            if (open) setIsPickupEndOpen(false)
          }}
        />
      </div>
    )}

    {!isPickupStartOpen && (
      <div className={isPickupEndOpen ? 'md:col-span-2' : ''}>
        <CustomDateTimePicker
          value={formData.pickupWindowEnd}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, pickupWindowEnd: value }))
            setIsPickupEndOpen(false)
          }}
          label="Available Until 🔴"
          required
          isOpen={isPickupEndOpen}
          onOpenChange={(open) => {
            setIsPickupEndOpen(open)
            if (open) setIsPickupStartOpen(false)
          }}
        />
      </div>
    )}
  </div>
</div>

              {/* Location */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Pickup Location 📍</h3>

                <div className="group">
                  {/* Address - Add asterisk */}
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Address
                    {formData.lat
                      !== 0 && formData.lng !== 0 && !formData.location && (
                        <span className="text-xs text-blue-600 ml-2">(Fetching address...)</span>
                      )}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300"
                      placeholder={formData.lat !== 0 ? "Address will auto-fill..." : "Enter pickup address"}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleLocationPermission}
                      disabled={locationStatus === 'loading'}
                      className="location-btn px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locationStatus === 'loading' ? '⏳' :
                        locationStatus === 'success' ? '✅' :
                          locationStatus === 'error' ? '❌' : '📍'}
                    </button>
                  </div>
                  {formData.lat !== 0 && formData.lng !== 0 && (
                    <p className="text-xs text-green-600 mt-2 font-semibold">
                      ✓ Location coordinates captured ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-bold text-lg transform hover:scale-105 active:scale-95"
              >
                ← Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sharing...
                  </span>
                ) : (
                  '✨ Share Food'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Fun tip at the bottom */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <span className="inline-block bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/60">
            💚 Every meal shared makes a difference!
          </span>
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

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f43f5e, #fb923c);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
          transition: transform 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f43f5e, #fb923c);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        .tip-container {
    position: relative;
}

.tip-container::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, #f43f5e20, #fb923c20);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.tip-container:hover::before {
    opacity: 1;
}

      `}</style>
    </div>
  )
}