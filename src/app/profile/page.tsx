'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const ProfileContent = dynamic(() => import('./ProfileContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading profile..." />
})

export default function ProfilePage() {
  return <ProfileContent />
}