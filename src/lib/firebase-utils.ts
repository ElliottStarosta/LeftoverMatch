// Firebase imports - only on client side
let initializeApp: any, getApps: any, FirebaseApp: any
let getFirestore: any, Firestore: any
let getFirebaseAuth: any, Auth: any
let getFirebaseFunctions: any, Functions: any
let getFirebaseStorage: any, FirebaseStorage: any

// Dynamically import Firebase modules only on client side
if (typeof window !== 'undefined') {
  try {
    const firebaseApp = require('firebase/app')
    const firebaseFirestore = require('firebase/firestore')
    const firebaseAuth = require('firebase/auth')
    const firebaseFunctions = require('firebase/functions')
    const firebaseStorage = require('firebase/storage')
    
    initializeApp = firebaseApp.initializeApp
    getApps = firebaseApp.getApps
    FirebaseApp = firebaseApp.FirebaseApp
    
    getFirestore = firebaseFirestore.getFirestore
    Firestore = firebaseFirestore.Firestore
    
    getFirebaseAuth = firebaseAuth.getAuth
    Auth = firebaseAuth.Auth
    
    getFirebaseFunctions = firebaseFunctions.getFunctions
    Functions = firebaseFunctions.Functions
    
    getFirebaseStorage = firebaseStorage.getStorage
    FirebaseStorage = firebaseStorage.FirebaseStorage
  } catch (error) {
    console.warn('Firebase modules not available:', error)
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase app
let app: any = null
let db: any = null
let auth: any = null
let functions: any = null
let storage: any = null

// Initialize Firebase services
const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null, functions: null, storage: null }
  }

  // Check if Firebase modules are available
  if (!initializeApp || !getFirestore || !getFirebaseAuth) {
    console.warn('Firebase modules not available')
    return { app: null, db: null, auth: null, functions: null, storage: null }
  }

  // Check if Firebase config is properly set
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
    console.warn('Firebase configuration not set. Please check your environment variables.')
    return { app: null, db: null, auth: null, functions: null, storage: null }
  }

  try {
    // Initialize Firebase app
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    
    // Initialize services
    db = getFirestore(app)
    auth = getFirebaseAuth(app)
    functions = getFirebaseFunctions ? getFirebaseFunctions(app) : null
    storage = getFirebaseStorage ? getFirebaseStorage(app) : null

    console.log('Firebase initialized successfully:', { 
      app: !!app, 
      db: !!db, 
      auth: !!auth, 
      functions: !!functions, 
      storage: !!storage 
    })

    return { app, db, auth, functions, storage }
  } catch (error) {
    console.error('Firebase initialization failed:', error)
    return { app: null, db: null, auth: null, functions: null, storage: null }
  }
}

// Lazy getters for Firebase services
export const getDb = (): any => {
  if (!db) {
    const services = initializeFirebase()
    db = services.db
  }
  
  if (!db) {
    console.error('Firestore database is not available. Please check your Firebase configuration.')
    throw new Error('Firestore database is not available')
  }
  
  return db
}

export const getAuth = (): any => {
  if (!auth) {
    const services = initializeFirebase()
    auth = services.auth
  }
  return auth
}

export const getFunctions = (): any => {
  if (!functions) {
    const services = initializeFirebase()
    functions = services.functions
  }
  return functions
}

export const getStorage = (): any => {
  if (!storage) {
    const services = initializeFirebase()
    storage = services.storage
  }
  return storage
}

export const getApp = (): any => {
  if (!app) {
    const services = initializeFirebase()
    app = services.app
  }
  return app
}
