'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const ProfileSetupContent = dynamic(
  () => import('./ProfileSetupContent').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSpinner text="Loading..." />
  }
)

export default function ProfileSetupPage() {
  return <ProfileSetupContent />
}