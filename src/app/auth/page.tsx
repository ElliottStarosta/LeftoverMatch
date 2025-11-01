'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const AuthContent = dynamic(() => import('./AuthContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading..." />
})

export default function AuthPage() {
  return <AuthContent />
}