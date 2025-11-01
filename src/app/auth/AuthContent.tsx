'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { gsap } from 'gsap'
import LoadingSpinner from '@/components/LoadingSpinner'


// Initialize Firebase directly in this component
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const googleBtnRef = useRef<HTMLButtonElement>(null)
  const toggleBtnRef = useRef<HTMLButtonElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    setMounted(true);
  
    if (containerRef.current) {
      const masterTl = gsap.timeline({ defaults: { ease: "back.out(2)" } });
  
      // --- Title + Subtitle Bubble Pop ---
      if (titleRef.current && subtitleRef.current) {
        masterTl.fromTo(
          titleRef.current,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)" }
        );
        
        masterTl.fromTo(
          subtitleRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" },
          "-=0.15"
        );
      }
  
      // --- Container Quick Fade + Scale ---
      masterTl.to(
        containerRef.current,
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        },
        "-=0.25"
      );
  
      // --- Form Elements Pop In (Staggered) ---
      if (formRef.current) {
        const formChildren = Array.from(formRef.current.children);
        masterTl.addLabel("formStart", "-=0.05");
  
        formChildren.forEach((element, index) => {
          masterTl.fromTo(
            element,
            { scale: 0.6, opacity: 0, y: -15 },
            {
              scale: 1,
              opacity: 1,
              y: 0,
              duration: 0.25,
              ease: "back.out(2)"
            },
            `formStart+=${index * 0.08}`
          );
        });
      }
  
      // --- Divider ---
      if (dividerRef.current) {
        masterTl.fromTo(
          dividerRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" },
          "+=0.1"
        );
      }
  
      // --- Google Button ---
      if (googleBtnRef.current) {
        masterTl.fromTo(
          googleBtnRef.current,
          { scale: 0.6, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" },
          "+=0.05"
        );
      }
  
      // --- Toggle Button ---
      if (toggleBtnRef.current) {
        masterTl.fromTo(
          toggleBtnRef.current,
          { scale: 0.6, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" },
          "+=0.05"
        );
      }
  
      // --- Logo Pop + Gentle Float ---
      if (logoRef.current) {
        masterTl.fromTo(
          logoRef.current,
          { scale: 0, y: -60, rotation: -180, opacity: 0 },
          {
            scale: 1,
            y: 0,
            rotation: 0,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(3)"
          },
          "+=0.2"
        );
      }
    }
  }, [mounted]);
  
  
  // Animate form switch with cute bubble effect
  useEffect(() => {
    if (!mounted || !formRef.current) return;
  
    // Prevent running on first render
    if (mounted && isLogin === true) return;
  
    const formElements = Array.from(formRef.current.children);
    const tl = gsap.timeline();
  
    // Pop out
    tl.to(formElements, {
      scale: 0,
      opacity: 0,
      y: -10,
      duration: 0.3,
      stagger: 0.05,
      ease: 'back.in(2)',
    });
  
    // Pop back in
    tl.fromTo(
      formElements,
      { scale: 0, opacity: 0, y: 10 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'elastic.out(1, 0.6)',
      }
    );
  
    // Animate title/subtitle change
    if (titleRef.current && subtitleRef.current) {
      tl.to([titleRef.current, subtitleRef.current], {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      }, 0)
      .to([titleRef.current, subtitleRef.current], {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: 'back.out(2)',
      }, 0.4);
    }
  }, [isLogin]);
  

  // Animate error messages with bounce and shake
  useEffect(() => {
    if (error && errorRef.current) {
      const tl = gsap.timeline()
      
      tl.fromTo(errorRef.current,
        { scale: 0, opacity: 0, y: -30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)' }
      )
      gsap.to(errorRef.current, {
        keyframes: {
          x: [-4, 4, -4, 4, -2, 2, 0],
          ease: 'power2.inOut',
          duration: 0.5
        }
      })
      
    }
  }, [error])

  // Check if user is already signed in
  useEffect(() => {
    if (!mounted) return

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            router.push('/')
          } else {
            router.push('/profile-setup')
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [mounted, router])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Cute button press animation
    if (formRef.current) {
      gsap.to(formRef.current.querySelector('button[type="submit"]'), {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        
        // Success celebration animation
        if (containerRef.current && logoRef.current) {
          const tl = gsap.timeline()
          
          tl.to(logoRef.current, {
            scale: 1.5,
            rotation: 360,
            duration: 0.6,
            ease: 'back.out(1.7)'
          })
          .to(logoRef.current, {
            scale: 1,
            duration: 0.4,
            ease: 'elastic.out(1, 0.5)'
          })
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (name) {
          await updateProfile(userCredential.user, { displayName: name })
        }
        router.push('/profile-setup')
      }
    } catch (error: any) {
      console.error('Email auth error:', error)
      
      const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password'
      }
      
      setError(errorMessages[error.code] || error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError('')

    // Button bounce animation
    if (googleBtnRef.current) {
      gsap.to(googleBtnRef.current, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    }

    try {
      console.log('🔄 Starting Google authentication...')
      console.log('📍 Auth domain:', auth.config.authDomain)
      console.log('📍 Current URL:', window.location.href)
      
      const provider = new GoogleAuthProvider()
      
      provider.addScope('email')
      provider.addScope('profile')
      
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      console.log('🔄 Opening popup...')
      
      const result = await signInWithPopup(auth, provider)
      
      console.log('✅ Sign-in successful!')
      console.log('👤 User:', result.user.email)
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))
      
      if (!userDoc.exists()) {
        console.log('➡️ Redirecting to profile setup...')
        router.push('/profile-setup')
      } else {
        console.log('➡️ Redirecting to home...')
        router.push('/')
      }
      
      setLoading(false)
    } catch (error: any) {
      console.error('❌ Google auth error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      setLoading(false)
      
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in cancelled',
        'auth/popup-blocked': 'Popup blocked! Please allow popups for this site.',
        'auth/unauthorized-domain': 'Domain not authorized in Firebase Console',
        'auth/operation-not-allowed': 'Google sign-in not enabled in Firebase Console',
        'auth/internal-error': 'Firebase configuration error. Check console logs.',
        'auth/cancelled-popup-request': ''
      }
      
      const errorMessage = errorMessages[error.code] || `Error: ${error.message}`
      
      if (errorMessage) {
        setError(errorMessage)
      }
    }
  }

  if (!mounted) {
    return <LoadingSpinner text="Loading..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-300 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-300 to-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-rose-300 to-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div ref={containerRef} className="auth-container bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/40">
        <div className="text-center mb-8">
          <div ref={logoRef} className="auth-logo text-7xl mb-6 inline-block filter drop-shadow-lg">🍽️</div>
          <h1 ref={titleRef} className="auth-title text-4xl font-bold bg-gradient-to-r from-orange-600 via-rose-500 to-green-600 bg-clip-text text-transparent mb-3 tracking-tight">
            {isLogin ? 'Welcome Back!' : 'Join FoodShare'}
          </h1>
          <p ref={subtitleRef} className="auth-subtitle text-gray-600 text-lg">
            {isLogin ? 'Sign in to discover amazing food' : 'Start sharing and discovering food'}
          </p>
        </div>

        {error && (
          <div ref={errorRef} className="bg-gradient-to-r from-red-50 to-orange-50 backdrop-blur-sm border-2 border-red-300 text-red-700 px-5 py-4 rounded-2xl mb-6 text-sm font-medium shadow-lg">
            <span className="inline-block mr-2">⚠️</span>
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleEmailAuth} className="space-y-5">
          {!isLogin && (
            <div className="transform transition-all duration-200 hover:scale-[1.02]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white/70 backdrop-blur-sm placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white/70 backdrop-blur-sm placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="transform transition-all duration-200 hover:scale-[1.02]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white/70 backdrop-blur-sm placeholder-gray-400 transition-all duration-300 shadow-sm hover:shadow-md"
              placeholder="Enter your password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:via-rose-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span className="relative">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </span>
          </button>
        </form>

        <div ref={dividerRef} className="mt-8 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/90 text-gray-500 font-medium backdrop-blur-sm">Or continue with</span>
            </div>
          </div>
        </div>

        <button
          ref={googleBtnRef}
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center px-5 py-4 border-2 border-gray-200 rounded-2xl hover:bg-white/80 hover:border-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white/50 backdrop-blur-sm shadow-md hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.98] group"
        >
          <svg className="w-6 h-6 mr-3 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-semibold text-lg">Continue with Google</span>
        </button>

        <div className="mt-8 text-center">
          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-orange-600 hover:text-orange-700 font-semibold text-lg transition-all duration-200 hover:underline decoration-2 underline-offset-4 transform hover:scale-105"
            disabled={loading}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
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
      `}</style>
    </div>
  )
}