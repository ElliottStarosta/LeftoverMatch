'use client'

import { useState, useEffect, useRef } from 'react'
import CustomDateTimePicker from './CustomDateTimePicker'
import { useRouter } from 'next/navigation'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { getDb } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { Post } from '@/types'
import { gsap } from 'gsap'
import {
  ChevronLeftIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'

async function createRandomFoodPosts() {
  const db = getDb()
  const { collection, addDoc } = await import('firebase/firestore')
  
  // Your location
  const baseLocation = {
    lat: 45.3026,
    lng: -75.9070,
    address: 'Ottawa, ON'
  }
  
  // Random food posts data
  const foodPosts = [
    {
      title: 'Fresh Pizza Slices',
      description: 'Half a large pepperoni pizza from dinner. Still warm and delicious!',
      photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      allergens: ['Gluten', 'Dairy']
    },
    {
      title: 'Homemade Lasagna',
      description: 'Made too much lasagna tonight. 3 generous portions available. Vegetarian!',
      photoUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800',
      allergens: ['Gluten', 'Dairy', 'Eggs']
    },
    {
      title: 'Sushi Rolls',
      description: 'Leftover sushi from lunch. California rolls and salmon nigiri. Refrigerated.',
      photoUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
      allergens: ['Fish', 'Soy', 'Sesame']
    },
    {
      title: 'Chicken Tacos',
      description: '5 soft chicken tacos with all the fixings. Just made them!',
      photoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
      allergens: ['Gluten']
    },
    {
      title: 'Pasta Primavera',
      description: 'Healthy veggie pasta with olive oil and garlic. Made fresh today.',
      photoUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
      allergens: ['Gluten']
    },
    {
      title: 'Burger and Fries',
      description: 'Extra burger and fries from BBQ. Still hot!',
      photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      allergens: ['Gluten', 'Dairy']
    },
    {
      title: 'Pad Thai',
      description: 'Authentic homemade pad thai. Extra spicy! 2 portions available.',
      photoUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
      allergens: ['Peanuts', 'Shellfish', 'Soy']
    },
    {
      title: 'Caesar Salad',
      description: 'Fresh caesar salad with grilled chicken. Made 30 mins ago.',
      photoUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
      allergens: ['Dairy', 'Eggs']
    },
    {
      title: 'Fried Rice',
      description: 'Vegetable fried rice with tofu. Perfect for lunch!',
      photoUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
      allergens: ['Soy', 'Eggs']
    },
    {
      title: 'Chocolate Cake',
      description: 'Homemade chocolate cake. 4 slices left from birthday party!',
      photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
      allergens: ['Gluten', 'Dairy', 'Eggs']
    }
  ]
  
  // Create posts
  const createdPosts = []
  
  for (const food of foodPosts) {
    // Random location within 2 miles of base location
    const randomLat = baseLocation.lat + (Math.random() - 0.5) * 0.03 // ~1 mile radius
    const randomLng = baseLocation.lng + (Math.random() - 0.5) * 0.03
    
    const now = new Date()
    const pickupStart = new Date(now.getTime() + Math.random() * 2 * 60 * 60 * 1000) // 0-2 hours from now
    const pickupEnd = new Date(pickupStart.getTime() + 2 * 60 * 60 * 1000) // 2 hours after start
    
    const postData = {
      userId: 'jCas8ArbvfR2u9MB8HvBnIIYhoc2',
      title: food.title,
      description: food.description,
      photoUrl: food.photoUrl,
      location: {
        lat: randomLat,
        lng: randomLng,
        address: baseLocation.address
      },
      status: 'available',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      quantity: Math.floor(Math.random() * 3) + 1, // 1-3 portions
      pickupWindow: {
        start: pickupStart,
        end: pickupEnd
      },
      foodMeta: {
        homemade: Math.random() > 0.5,
        refrigerated: Math.random() > 0.5,
        preparedAt: now,
        allergens: food.allergens
      }
    }
    
    try {
      const docRef = await addDoc(collection(db, 'posts'), postData)
      console.log('✅ Created post:', food.title, 'ID:', docRef.id)
      createdPosts.push(docRef.id)
    } catch (error) {
      console.error('❌ Error creating post:', food.title, error)
    }
  }
  
  console.log('🎉 Created', createdPosts.length, 'posts!')
  return createdPosts
}


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

  const [expandedSection, setExpandedSection] = useState<string | null>(null)
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
    if (typeof window !== 'undefined') {
      (window as any).createRandomFoodPosts = createRandomFoodPosts;
    }
  }, [])

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
    if (mounted && !formData.preparedAt) {
      const now = new Date()
      
      // Format for datetime-local input (local time, not UTC)
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')

      const preparedAtTime = `${year}-${month}-${day}T${hours}:${minutes}`

      setFormData(prev => ({
        ...prev,
        preparedAt: preparedAtTime
      }))
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && formData.location && formData.location.length > 5) {
      const geocodeAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}`
          )
          const data = await response.json()
          
          if (data && data.length > 0) {
            const result = data[0]
            setFormData(prev => ({
              ...prev,
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            }))
          }
        } catch (error) {
          console.error('Error geocoding address:', error)
        }
      }

      const debounceTimer = setTimeout(geocodeAddress, 800)
      return () => clearTimeout(debounceTimer)
    }
  }, [formData.location, mounted])

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
  
    let attempt = 0
    const maxAttempts = 5
    let currentDelay = 2000
    let isComplete = false

    if (typeof window !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).catch(() => {})

      }
    }  

    
    const attemptGeolocation = () => {
      if (isComplete) return
      attempt++
  
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isComplete) return
            isComplete = true
  
            setFormData(prev => ({
              ...prev,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }))
            setLocationStatus('success')
            reverseGeocodeDetailed(position.coords.latitude, position.coords.longitude)
          },
          (error) => {
            if (isComplete) return
  
            if (attempt < maxAttempts) {
              currentDelay += 1000
              setTimeout(attemptGeolocation, currentDelay)
            } else {
              isComplete = true
              setLocationStatus('error')
              setTimeout(() => setLocationStatus('idle'), 2000)
            }
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        )
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
        }
  
        const fullAddress = addressParts.join(', ')
        setFormData(prev => ({ ...prev, location: fullAddress }))
      }
    } catch (error) {
      console.error('Error with geocoding:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }))
        setTimeout(() => {
          const preview = document.querySelector('.image-preview')
          if (preview) {
            gsap.fromTo(preview, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' })
          }
        }, 50)
      }
      reader.readAsDataURL(file)
    }
  }

  const SectionHeader = ({ title, icon, isOpen, count }: { title: string; icon: string; isOpen: boolean; count?: number }) => (
    <button
      type="button"
      onClick={() => setExpandedSection(isOpen ? null : (title.toLowerCase() as any))}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:bg-gray-50 transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <div className="text-left">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
          {count !== undefined && (
            <p className="text-xs text-gray-500 mt-0.5">{count > 0 ? `${count} selected` : 'None added'}</p>
          )}
        </div>
      </div>
      <svg
        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  )

  const CustomDropdown = ({ 
    label, 
    options, 
    value, 
    onChange, 
    icon 
  }: { 
    label: string
    options: { label: string; value: any; icon?: string }[]
    value: any
    onChange: (val: any) => void
    icon: string
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
  
    useEffect(() => {
      if (isOpen && dropdownRef.current?.querySelector('[data-options]')) {
        gsap.fromTo(
          dropdownRef.current.querySelector('[data-options]'),
          { opacity: 0, y: -10, scaleY: 0.9 },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'back.out(1.2)' }
        )
      }
    }, [isOpen])
  
    const selectedOption = options.find(o => o.value === value)
  
    return (
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2.5 border border-orange-200 rounded-lg text-sm bg-white focus:border-orange-500 focus:outline-none transition-colors flex items-center justify-between hover:border-orange-300"
        >
          <span className="flex items-center gap-2">
            <span>{selectedOption?.icon || icon}</span>
            <span className="text-gray-700">{selectedOption?.label || label}</span>
          </span>
          <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
  
        {isOpen && (
          <div
            data-options
            className="relative mt-2 bg-white border border-orange-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left ${
                  value === option.value
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-gray-700 hover:bg-orange-50'
                }`}
              >
                <span className="text-lg">{option.icon || icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // ADD THIS COMPONENT - Section Header
  const SectionButton = ({ 
    title, 
    icon, 
    isOpen, 
    count 
  }: { 
    title: string
    icon: string
    isOpen: boolean
    count?: number
  }) => (
    <button
      type="button"
      onClick={() => setExpandedSection(isOpen ? null : title)}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center justify-between hover:bg-gray-50 transition-all active:scale-95"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div className="text-left">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
          {count !== undefined && (
            <p className="text-xs text-gray-400">{count > 0 ? `${count} selected` : 'None'}</p>
          )}
        </div>
      </div>
      <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
    </button>
  )
  

  const toggleAllergen = (allergen: string) => {
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
  
    if (!formData.image) {
      setError('Please upload a photo of your food')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // If location doesn't have coordinates yet, geocode it now
      let finalLat = formData.lat
      let finalLng = formData.lng

      console.log('📍 Starting geocoding. Location:', formData.location, 'Current lat/lng:', finalLat, finalLng)

      if ((formData.lat === 0 || formData.lng === 0) && formData.location) {
        try {
          const query = encodeURIComponent(formData.location)
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
          console.log('🔍 Geocoding URL:', url)

          const response = await fetch(url)
          console.log('📡 Geocoding response status:', response.status)

          const data = await response.json()
          console.log('📊 Geocoding response data:', data)
          
          if (data && data.length > 0) {
            finalLat = parseFloat(data[0].lat)
            finalLng = parseFloat(data[0].lon)
            console.log('✅ Geocoded successfully! Lat:', finalLat, 'Lng:', finalLng)
          } else {
            console.warn('⚠️ No results found for address:', formData.location)
          }
        } catch (geocodeError) {
          console.error('❌ Error geocoding address:', geocodeError)
        }
      }

      console.log('📤 Final coordinates being sent. Lat:', finalLat, 'Lng:', finalLng)
  
      let imageUrl = ''
  
      if (formData.image) {
        try {
          const formDataToSend = new FormData()
          formDataToSend.append('image', formData.image)
  
          const uploadResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
            { method: 'POST', body: formDataToSend }
          )
  
          if (!uploadResponse.ok) throw new Error('Failed to upload image')
  
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.data.url
        } catch (uploadError) {
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
  
      if (formData.allergens.length > 0) {
        foodMeta.allergens = formData.allergens
      }
  
      const postData: Omit<Post, 'id'> = {
        userId: user.uid,
        title: formData.title,
        description: formData.description,
        photoUrl: imageUrl,
        location: { lat: finalLat, lng: finalLng, address: formData.location },
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
      if (!dbInstance) throw new Error('Database not available')
  
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
    return <LoadingSpinner text="Loading..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-orange-200 flex items-center justify-between h-14 px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 -ml-2 text-orange-600 active:bg-orange-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-gray-900">Share Food</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        <form onSubmit={handleSubmit} className="space-y-3 p-3 max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-300 px-4 py-3 rounded-lg">
              <p className="text-sm text-red-600 font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-orange-100">
            {formData.imagePreview ? (
              <div className="relative h-56 bg-gray-100">
                <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}
                  className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-red-600 active:scale-90 transition-all"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="p-6 text-center bg-gradient-to-b from-orange-50 to-white">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-600 font-medium mb-3">Upload a photo</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 rounded-full font-semibold text-sm hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all cursor-pointer shadow-md">
                  Choose Photo
                </label>
              </div>
            )}
          </div>

          {/* Food Name */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 px-4 py-3">
            <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">What is it?</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              className="w-full text-base text-gray-900 bg-transparent border-0 focus:outline-none placeholder-gray-400" 
              placeholder="Fresh Pizza" 
              required 
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 px-4 py-3">
            <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Tell us more</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              className="w-full text-base text-gray-900 bg-transparent border-0 focus:outline-none resize-none placeholder-gray-400" 
              placeholder="Any special details..." 
              rows={2} 
              required 
            />
          </div>

          {/* Quick Options Row */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-orange-100">
              <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Quantity</label>
              <CustomDropdown 
                label="Portions" 
                icon="🍴" 
                options={[1,2,3,4,5,6,7,8].map(n => ({ label: `${n}`, value: n }))} 
                value={formData.quantity} 
                onChange={(val) => setFormData(prev => ({ ...prev, quantity: val }))} 
              />
            </div>
            <div className="px-4 py-3 border-b border-orange-100">
              <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Type</label>
              <CustomDropdown 
                label="Food Type" 
                icon="🏠" 
                options={[
                  { label: 'Homemade', value: true, icon: '🏠' },
                  { label: 'Bought', value: false, icon: '🛍️' }
                ]} 
                value={formData.homemade} 
                onChange={(val) => setFormData(prev => ({ ...prev, homemade: val }))} 
              />
            </div>
            <div className="px-4 py-3">
              <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Storage</label>
              <CustomDropdown 
                label="Temperature" 
                icon="❄️" 
                options={[
                  { label: 'Room Temp', value: false, icon: '🌡️' },
                  { label: 'Refrigerated', value: true, icon: '❄️' }
                ]} 
                value={formData.refrigerated} 
                onChange={(val) => setFormData(prev => ({ ...prev, refrigerated: val }))} 
              />
            </div>
          </div>

          {/* Allergens */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
            <SectionButton title="Allergens" icon="⚠️" isOpen={expandedSection === 'Allergens'} count={formData.allergens.length} />
            {expandedSection === 'Allergens' && (
              <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-t border-orange-100">
                <div className="grid grid-cols-3 gap-2">
                  {allergenOptions.map((allergen) => (
                    <button 
                      key={allergen.value} 
                      type="button" 
                      onClick={() => toggleAllergen(allergen.value)} 
                      className={`p-4 rounded-xl border-2 transition-all text-center active:scale-95 transform hover:scale-105 ${formData.allergens.includes(allergen.value) 
                        ? 'bg-gradient-to-br from-red-500 to-orange-500 border-red-500 text-white shadow-lg' 
                        : 'bg-white border-orange-200 hover:border-orange-300 text-orange-500'}
                      `}
                    >
                      <div className="text-2xl mb-1">{allergen.emoji}</div>
                      <div className="text-xs font-semibold">{allergen.value}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prepared At */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
            <SectionButton title="Prepared At" icon="🕒" isOpen={expandedSection === 'Prepared At'} />
            {expandedSection === 'Prepared At' && (
              <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-t border-orange-100">
                <CustomDateTimePicker value={formData.preparedAt} onChange={(value) => setFormData(prev => ({ ...prev, preparedAt: value }))} label="When?" required />
              </div>
            )}
          </div>

          {/* Pickup Window */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
            <SectionButton title="Pickup Window" icon="⏰" isOpen={expandedSection === 'Pickup Window'} />
            {expandedSection === 'Pickup Window' && (
              <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-t border-orange-100 space-y-3">
                <CustomDateTimePicker value={formData.pickupWindowStart} onChange={(value) => setFormData(prev => ({ ...prev, pickupWindowStart: value }))} label="Available From 🟢" required />
                <CustomDateTimePicker value={formData.pickupWindowEnd} onChange={(value) => setFormData(prev => ({ ...prev, pickupWindowEnd: value }))} label="Available Until 🔴" required />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border border-orange-100 overflow-hidden">
            <SectionButton title="Location" icon="📍" isOpen={expandedSection === 'Location'} />
            {expandedSection === 'Location' && (
              <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-t border-orange-100">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} 
                    className="flex-1 px-3 py-2 border border-orange-200 rounded text-sm bg-white focus:border-orange-500 focus:outline-none transition-colors text-gray-900 " 
                    placeholder="Enter address" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={handleLocationPermission} 
                    disabled={locationStatus === 'loading'}
                    className="px-3 py-2 bg-orange-500 text-white rounded text-lg font-bold hover:bg-orange-600 disabled:opacity-50 active:scale-90 transition-all flex-shrink-0"
                  >
                    {locationStatus === 'loading' ? '⏳' : locationStatus === 'success' ? '✅' : locationStatus === 'error' ? '❌' : '📍'}
                  </button>
                </div>
                {formData.lat !== 0 && formData.lng !== 0 && <p className="text-xs text-green-600 font-semibold mt-2">✓ Location captured</p>}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Bottom Submit Button - Not Sticky */}
      <div className="bg-gradient-to-r from-orange-100 via-amber-100 to-pink-100 border-t border-orange-200 p-4">
        <button 
          type="submit" 
          onClick={handleSubmit}
          disabled={submitting} 
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-lg font-bold text-base hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg"
        >
          {submitting ? '✨ Sharing...' : '✨ Share Food'}
        </button>
      </div>
    </div>
  )
}