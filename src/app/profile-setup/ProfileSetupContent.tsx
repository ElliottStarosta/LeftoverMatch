'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getDb } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { User } from '@/types'
import { geocodeAddress } from '@/lib/geocoding'

import { gsap } from 'gsap'

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
    const [mounted, setMounted] = useState(false)
    const [randomTip, setRandomTip] = useState('')
    const [error, setError] = useState('')


    const loadingTips = [
        "💡 Tip: The more you share, the better your matches!",
        "🍕 Pro tip: Set your max distance higher to find more food options!",
        "🌮 Did you know? You can claim multiple food items in one trip!",
        "🥗 Sharing your dietary preferences helps others know what to offer!",
        "🚗 Set a reasonable travel distance to balance variety and convenience!",
        "👨‍🍳 Update your cooking level as you improve your skills!",
        "📱 Enable notifications to never miss a nearby food opportunity!",
        "🌟 Complete your profile to increase your trust score!",
        "🍽️ The more detailed your bio, the better connections you'll make!",
        "🕒 Fresh food gets claimed quickly - check the app regularly!",
        "🗺️ Accurate location helps find food closest to you!",
        "🤝 Building a good reputation helps you access more food shares!",
        "🌱 Don't forget to update your allergies and dietary restrictions!",
        "🔥 Hot tip: Food shared in the evening tends to go fast!",
        "🎯 Be specific about what cuisines you love for better matches!"
    ]

    const router = useRouter()

    const containerRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const buttonsRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const tipElement = document.querySelector('.tip-container')
        let intervalId: NodeJS.Timeout

        const animateTip = () => {
            if (!tipElement) return

            // Fade out old tip
            gsap.to(tipElement, {
                opacity: 0,
                scale: 0.8,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    // Change tip AFTER fade out
                    const randomIndex = Math.floor(Math.random() * loadingTips.length)
                    setRandomTip(loadingTips[randomIndex])

                    // Bubble fade in
                    gsap.fromTo(
                        tipElement,
                        { opacity: 0, scale: 0.8, rotation: -5 },
                        {
                            opacity: 1,
                            scale: 1,
                            rotation: 0,
                            duration: 0.6,
                            ease: 'back.out(1.7)',
                            transformOrigin: 'center center',
                        }
                    )
                },
            })
        }

        // Initial set
        const randomIndex = Math.floor(Math.random() * loadingTips.length)
        setRandomTip(loadingTips[randomIndex])

        // Animate every 8 seconds
        intervalId = setInterval(animateTip, 8000)

        return () => clearInterval(intervalId)
    }, [])



    useEffect(() => {
        if (user && user.displayName) {
            setFormData(prev => ({ ...prev, name: user.displayName || '' }))
        }
    }, [user])

    // Initial entrance animation
    useEffect(() => {
        if (!mounted || !cardRef.current) return

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        tl.fromTo(cardRef.current,
            { scale: 0.8, opacity: 0, y: 50 },
            { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
        )

        if (progressRef.current) {
            tl.fromTo(progressRef.current,
                { scaleX: 0, transformOrigin: 'left' },
                { scaleX: 1, duration: 0.5 },
                '-=0.3'
            )
        }

        if (contentRef.current) {
            const children = contentRef.current.children
            tl.fromTo(Array.from(children),
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
                '-=0.4'
            )
        }
    }, [mounted])

    // Step transition animation
    useEffect(() => {
        if (!mounted || !contentRef.current) return

        const tl = gsap.timeline()

        // Slide out old content
        tl.to(contentRef.current.children, {
            opacity: 0,
            x: -30,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.in'
        })

        // Slide in new content
        tl.fromTo(contentRef.current.children,
            { opacity: 0, x: 30 },
            {
                opacity: 1,
                x: 0,
                duration: 0.4,
                stagger: 0.08,
                ease: 'back.out(1.7)'
            }
        )

        // Animate progress bar
        if (progressRef.current) {
            tl.to(progressRef.current.querySelector('.progress-fill'), {
                width: `${(step / 4) * 100}%`,
                duration: 0.5,
                ease: 'power2.out'
            }, '-=0.6')
        }

        // Bounce buttons
        if (buttonsRef.current) {
            tl.fromTo(buttonsRef.current.children,
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(2)' },
                '-=0.3'
            )
        }
    }, [step, mounted])

    useEffect(() => {
        if (mounted && step === 4 && formData.lat === 0 && formData.lng === 0) {
            console.log('🚀 Auto-fetching location on step 4...')
            handleLocationPermission()
        }
    }, [mounted, step])

    const dietaryOptions = [
        { value: 'Vegetarian', emoji: '🥗' },
        { value: 'Vegan', emoji: '🌱' },
        { value: 'Pescatarian', emoji: '🐟' },
        { value: 'Keto', emoji: '🥑' },
        { value: 'Paleo', emoji: '🍖' },
        { value: 'Gluten-Free', emoji: '🌾' },
        { value: 'Dairy-Free', emoji: '🥛' },
        { value: 'Low-Carb', emoji: '🥦' }
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

    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    // Update the function
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
        let currentDelay = 2000 // Start with 1 second
        let isComplete = false // Track if we're done

        const attemptGeolocation = () => {
            if (isComplete) return // Don't continue if already completed

            attempt++
            console.log(`🔄 Attempt ${attempt} of ${maxAttempts} (delay: ${currentDelay}ms)`)

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (isComplete) return // Don't process if already completed
                        isComplete = true // Mark as complete

                        console.log('✅ Location obtained successfully - STOPPING RETRIES')

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

                        // Get specific address format
                        reverseGeocodeDetailed(position.coords.latitude, position.coords.longitude)
                    },
                    (error) => {
                        if (isComplete) return // Don't process if already completed

                        console.log(`❌ Attempt ${attempt} failed:`, error.message)

                        if (attempt < maxAttempts) {
                            // Try again with increased delay
                            currentDelay += 1000 // Increase delay by 1 second each time
                            console.log(`⏳ Retrying in ${currentDelay}ms...`)
                            setTimeout(attemptGeolocation, currentDelay)
                        } else {
                            // All attempts failed
                            isComplete = true // Mark as complete
                            console.log('❌ All location attempts failed - STOPPING RETRIES')
                            setLocationStatus('error')

                            if (button) {
                                gsap.to(button, {
                                    backgroundColor: '#ef4444',
                                    duration: 0.3,
                                    ease: 'power2.out'
                                })
                            }

                            // Reset after 2 seconds
                            setTimeout(() => {
                                if (button) {
                                    gsap.to(button, {
                                        backgroundColor: '#f43f5e',
                                        duration: 0.3
                                    })
                                }
                                setLocationStatus('idle')
                            }, 2000)
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000, // 5 second timeout per attempt
                        maximumAge: 0 // Don't use cached position
                    }
                )
            } else {
                // Geolocation not supported
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
                            backgroundColor: '#f43f5e',
                            duration: 0.3
                        })
                    }
                    setLocationStatus('idle')
                }, 2000)
            }
        }

        // Start the first attempt
        attemptGeolocation()
    }
    // Get specific address format (Street, City)
    const reverseGeocodeDetailed = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            const data = await response.json()

            if (data.address) {
                const address = data.address
                const addressParts = []

                // Get street address (house number + road)
                if (address.house_number && address.road) {
                    addressParts.push(`${address.house_number} ${address.road}`)
                } else if (address.road) {
                    addressParts.push(address.road)
                }

                // Get city (prefer city, then town, then village)
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



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setSaving(true)

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

            const formDataWithLocation = { ...formData }

            if (formDataWithLocation.location && (formDataWithLocation.lat === 0 || formDataWithLocation.lng === 0)) {
                console.log('📍 Manual address entered, geocoding...')
                const coords = await geocodeAddress(formDataWithLocation.location)
                if (coords) {
                    formDataWithLocation.lat = coords.lat
                    formDataWithLocation.lng = coords.lng
                    console.log('✅ Geocoded:', coords)
                } else {
                    setError('Could not find location. Please use the location button or enter a valid address.')
                    setSaving(false)
                    return
                }
            }

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
                trustScore: 0.5,  // Start at 2.5/5 stars (neutral)
                totalRatings: 0,
                level: 'Rookie Rescuer',
                maxClaimsAllowed: 1,
                banned: false,
                successfulPosts: 0,
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

            const dbInstance = getDb()
            if (!dbInstance) throw new Error('Database not available')

            const { doc, setDoc } = await import('firebase/firestore')
            await setDoc(doc(dbInstance, 'users', user.uid), userData)

            router.push('/')
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Failed to save profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleNext = () => {
        if (buttonsRef.current) {
            const nextBtn = buttonsRef.current.querySelector('.next-btn')
            gsap.to(nextBtn, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            })
        }
        setStep(step + 1)
    }

    const handlePrevious = () => {
        if (buttonsRef.current) {
            const prevBtn = buttonsRef.current.querySelector('.prev-btn')
            gsap.to(prevBtn, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            })
        }
        setStep(step - 1)
    }

    const toggleOption = (category: 'dietaryRestrictions' | 'foodPreferences' | 'allergies', value: string) => {
        const element = document.querySelector(`[data-option="${value}"]`)
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
            const current = prev[category]
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(item => item !== value) }
            } else {
                return { ...prev, [category]: [...current, value] }
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-100 via-orange-50 to-pink-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        router.push('/auth')
        return null
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-rose-100 via-orange-50 to-pink-100 py-8 px-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-rose-300/30 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div ref={cardRef} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-pink-500 p-8 text-center relative">
                        <div className="text-6xl mb-3 animate-bounce">🍽️</div>
                        <h1 className="text-3xl font-bold text-white mb-2">Create Your Profile</h1>
                        <p className="text-white/90 text-sm">Let's find your perfect food match</p>
                    </div>

                    {/* Progress Bar */}
                    <div ref={progressRef} className="px-8 pt-6">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-3">
                            <span>Step {step} of 4</span>
                            <span>{Math.round((step / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="progress-fill bg-gradient-to-r from-rose-500 via-orange-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${(step / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="p-8">
                        <div ref={contentRef} className="space-y-6">
                            {step === 1 && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">About You</h2>
                                        <p className="text-gray-500 text-sm">Tell us who you are</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                What's your name? ✨
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300 text-lg"
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>

                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Tell us about yourself 💬
                                            </label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white transition-all duration-300 group-hover:border-gray-300 resize-none"
                                                placeholder="I love trying new cuisines and sharing my cooking experiments..."
                                                rows={4}
                                            />
                                        </div>

                                        // Replace the "Profile Photo URL" section around line 346 with:
                                        <div className="group">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Profile Photo 📸
                                            </label>
                                            {formData.profileImage ? (
                                                <div className="space-y-3">
                                                    <img
                                                        src={formData.profileImage}
                                                        alt="Preview"
                                                        className="w-32 h-32 object-cover rounded-full mx-auto shadow-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                                                        className="text-red-500 text-sm font-semibold hover:text-red-700 px-4 py-2 rounded-full hover:bg-red-50 transition-all duration-300 mx-auto block"
                                                    >
                                                        🗑️ Remove Image
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="border-3 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-400 transition-all duration-300 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
                                                    <div className="text-6xl mb-3">📷</div>
                                                    <p className="text-gray-600 font-medium mb-4">Upload your profile photo</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                try {
                                                                    const formDataToSend = new FormData()
                                                                    formDataToSend.append('image', file)

                                                                    const uploadResponse = await fetch(
                                                                        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
                                                                        {
                                                                            method: 'POST',
                                                                            body: formDataToSend
                                                                        }
                                                                    )

                                                                    if (!uploadResponse.ok) throw new Error('Failed to upload')

                                                                    const uploadData = await uploadResponse.json()
                                                                    setFormData(prev => ({ ...prev, profileImage: uploadData.data.url }))
                                                                } catch (error) {
                                                                    console.error('Upload error:', error)
                                                                    alert('Failed to upload image')
                                                                }
                                                            }
                                                        }}
                                                        className="hidden"
                                                        id="profile-image-upload"
                                                    />
                                                    <label
                                                        htmlFor="profile-image-upload"
                                                        className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-orange-600 hover:to-amber-600 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg"
                                                    >
                                                        Choose Photo
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dietary Style</h2>
                                        <p className="text-gray-500 text-sm">Select all that apply</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-4">
                                            My dietary preferences 🥗
                                        </label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {dietaryOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    data-option={option.value}
                                                    onClick={() => toggleOption('dietaryRestrictions', option.value)}
                                                    className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${formData.dietaryRestrictions.includes(option.value)
                                                        ? 'bg-gradient-to-br from-rose-500 to-orange-500 border-rose-500 text-white shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300'
                                                        }`}
                                                >
                                                    <div className="text-3xl mb-2">{option.emoji}</div>
                                                    <div className="text-sm font-semibold">{option.value}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-4 mt-6">
                                            Allergies ⚠️
                                        </label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {allergyOptions.map((allergy) => (
                                                <button
                                                    key={allergy.value}
                                                    type="button"
                                                    data-option={allergy.value}
                                                    onClick={() => toggleOption('allergies', allergy.value)}
                                                    className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${formData.allergies.includes(allergy.value)
                                                        ? 'bg-gradient-to-br from-red-500 to-orange-500 border-red-500 text-white shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'
                                                        }`}
                                                >
                                                    <div className="text-3xl mb-2">{allergy.emoji}</div>
                                                    <div className="text-sm font-semibold">{allergy.value}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Food Preferences</h2>
                                        <p className="text-gray-500 text-sm">What cuisines do you love?</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-4">
                                            Favorite cuisines 🌎
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {foodPreferences.map((cuisine) => (
                                                <button
                                                    key={cuisine.value}
                                                    type="button"
                                                    data-option={cuisine.value}
                                                    onClick={() => toggleOption('foodPreferences', cuisine.value)}
                                                    className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${formData.foodPreferences.includes(cuisine.value)
                                                        ? 'bg-gradient-to-br from-orange-500 to-pink-500 border-orange-500 text-white shadow-lg'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                                                        }`}
                                                >
                                                    <div className="text-3xl mb-2">{cuisine.emoji}</div>
                                                    <div className="text-sm font-semibold">{cuisine.value}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3 mt-6">
                                            Cooking skill level 👨‍🍳
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const dropdown = document.querySelector('.cooking-dropdown')
                                                    const isOpen = dropdown?.classList.contains('hidden')
                                                    if (dropdown) {
                                                        if (isOpen) {
                                                            dropdown.classList.remove('hidden')
                                                            gsap.fromTo(dropdown,
                                                                { opacity: 0, y: -10 },
                                                                { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.7)' }
                                                            )
                                                        } else {
                                                            gsap.to(dropdown, {
                                                                opacity: 0,
                                                                y: -10,
                                                                duration: 0.2,
                                                                onComplete: () => dropdown.classList.add('hidden')
                                                            })
                                                        }
                                                    }
                                                }}
                                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 text-lg font-medium flex items-center justify-between hover:border-gray-300"
                                            >
                                                <span>
                                                    {formData.cookingLevel === 'beginner' && '🌱 Beginner - Just getting started'}
                                                    {formData.cookingLevel === 'intermediate' && '🔥 Intermediate - I can cook!'}
                                                    {formData.cookingLevel === 'advanced' && '⭐ Advanced - Home chef level'}
                                                    {formData.cookingLevel === 'professional' && '👑 Professional - Chef status'}
                                                </span>
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            <div className="cooking-dropdown hidden relative w-full mt-2 bg-white border-2 border-orange-300 rounded-2xl shadow-2xl overflow-hidden">
                                                {[
                                                    { value: 'beginner', emoji: '🌱', label: 'Beginner - Just getting started' },
                                                    { value: 'intermediate', emoji: '🔥', label: 'Intermediate - I can cook!' },
                                                    { value: 'advanced', emoji: '⭐', label: 'Advanced - Home chef level' },
                                                    { value: 'professional', emoji: '👑', label: 'Professional - Chef status' }
                                                ].map((level, index) => (
                                                    <button
                                                        key={level.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, cookingLevel: level.value }))
                                                            const dropdown = document.querySelector('.cooking-dropdown')
                                                            if (dropdown) {
                                                                gsap.to(dropdown, {
                                                                    opacity: 0,
                                                                    y: -10,
                                                                    duration: 0.2,
                                                                    onComplete: () => dropdown.classList.add('hidden')
                                                                })
                                                            }
                                                        }}
                                                        className={`w-full px-5 py-4 text-left text-gray-900 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all duration-200 ${index !== 3 ? 'border-b border-gray-200' : ''
                                                            } ${formData.cookingLevel === level.value ? 'bg-gradient-to-r from-orange-100 to-pink-100 font-bold' : ''}`}
                                                    >
                                                        <span className="text-lg">{level.emoji} {level.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 4 && (
                                <>
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Location & Settings</h2>
                                        <p className="text-gray-500 text-sm">Where can we find food for you?</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                                Your location 📍
                                                {formData.lat !== 0 && formData.lng !== 0 && !formData.location && (
                                                    <span className="text-xs text-orange-600 ml-2">(Coordinates set - enter city name)</span>
                                                )}
                                            </label>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                    className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white transition-all duration-300"
                                                    placeholder={formData.lat !== 0 ? "Address will auto-fill..." : "Enter your address"}
                                                    required
                                                />

                                                <button
                                                    type="button"
                                                    onClick={handleLocationPermission}
                                                    disabled={locationStatus === 'loading'}
                                                    className="location-btn px-6 py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl hover:from-rose-600 hover:to-orange-600 transition-all duration-300 font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {locationStatus === 'loading' ? '⏳' :
                                                        locationStatus === 'success' ? '✅' :
                                                            locationStatus === 'error' ? '❌' : '📍'}
                                                </button>
                                            </div>
                                            {formData.lat !== 0 && formData.lng !== 0 && (
                                                <p className="text-xs text-green-600 mt-2">
                                                    ✓ Location coordinates captured ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                                How far will you travel? 🚗
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="25"
                                                value={formData.maxDistance}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                                                className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                                            />
                                            <div className="text-center mt-3">
                                                <span className="inline-block px-6 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-full font-bold text-lg shadow-lg">
                                                    {formData.maxDistance} miles
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-5">
                                            <label className="flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.notifications}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                                                    className="w-6 h-6 rounded-lg border-2 border-orange-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                                />
                                                <span className="ml-4 text-gray-700 font-semibold group-hover:text-orange-600 transition-colors">
                                                    🔔 Notify me about nearby food
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div ref={buttonsRef} className="flex justify-between items-center mt-8 gap-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="prev-btn flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-bold text-lg transform hover:scale-105 active:scale-95"
                                >
                                    ← Back
                                </button>
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="next-btn flex-1 px-6 py-4 bg-gradient-to-r from-rose-500 via-orange-500 to-pink-500 text-white rounded-2xl hover:from-rose-600 hover:via-orange-600 hover:to-pink-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ml-auto"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-2xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ml-auto"
                                >
                                    {saving ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : (
                                        '✨ Complete Profile'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Fun tip at the bottom */}
                <div className="text-center mt-6 text-gray-600 text-sm">
                    <span
                        key={randomTip}
                        className="tip-container inline-block bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/60"
                    >
                        {randomTip}
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