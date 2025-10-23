// Firebase configuration for Next.js
// This file ensures Firebase only initializes on the client side

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getFunctions, Functions } from 'firebase/functions'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Validate Firebase configuration
function validateFirebaseConfig() {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]

  const missing = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`)
  }
}

// Initialize Firebase App
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let functions: Functions | undefined
let storage: FirebaseStorage | undefined

function initializeFirebaseApp(): FirebaseApp {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side')
  }

  // Validate config
  validateFirebaseConfig()

  // Check if already initialized
  if (getApps().length > 0) {
    return getApp()
  }

  // Initialize new app
  return initializeApp(firebaseConfig)
}

// Get Firebase App
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeFirebaseApp()
  }
  return app
}

// Get Auth instance
export function getAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Auth can only be accessed on the client side')
  }
  
  if (!auth) {
    const app = getFirebaseApp()
    auth = getAuth(app) as any as Auth
    
    // CRITICAL: Configure auth to use the correct domain
    // This fixes the "invalid action" error
    const firebaseAuth = require('firebase/auth')
    auth = firebaseAuth.getAuth(app)
  }
  
  return auth
}

// Get Firestore instance
export function getDb(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be accessed on the client side')
  }
  
  if (!db) {
    const app = getFirebaseApp()
    db = getFirestore(app)
  }
  
  return db
}

// Get Functions instance
export function getFunctions(): Functions | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    if (!functions) {
      const app = getFirebaseApp()
      functions = getFunctions(app)
    }
    return functions
  } catch (error) {
    console.warn('Firebase Functions not available:', error)
    return null
  }
}

// Get Storage instance
export function getStorage(): FirebaseStorage | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    if (!storage) {
      const app = getFirebaseApp()
      storage = getStorage(app)
    }
    return storage
  } catch (error) {
    console.warn('Firebase Storage not available:', error)
    return null
  }
}

// Export for backward compatibility
export { app, auth, db, functions, storage }