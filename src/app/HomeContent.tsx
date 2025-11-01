'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { useIsMounted } from '@/lib/useIsMounted'
import Navbar from '@/components/Navbar'
import SwipeDeck from '@/components/SwipeDeck'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function HomeContent() {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const isMounted = useIsMounted()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (!isMounted) {
    return <LoadingSpinner text="Loading..." fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            There was an error with authentication. Please check your Firebase configuration.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
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
    <div className="h-screen bg-gradient-to-br from-orange-50 to-green-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-2">
        <div className="w-full max-w-sm h-full max-h-[calc(100vh-120px)]">
        <Suspense fallback={<LoadingSpinner text="Loading food posts..." fullScreen={false} size="sm" />}>
        <SwipeDeck />
          </Suspense>
        </div>
      </main>
    </div>
  )
}