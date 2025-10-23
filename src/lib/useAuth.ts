import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { getAuth } from './firebase-utils'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const auth = getAuth()
    
    if (!auth) {
      console.warn('Firebase auth not available')
      setLoading(false)
      return
    }

    try {
      const unsubscribe = auth.onAuthStateChanged(
        (user: User | null) => {
          setUser(user)
          setLoading(false)
          setError(null)
        },
        (error: Error) => {
          console.error('Auth state change error:', error)
          setError(error)
          setLoading(false)
        }
      )

      return () => {
        if (unsubscribe) {
          unsubscribe()
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setError(error as Error)
      setLoading(false)
    }
  }, [])

  return { user, loading, error }
}
