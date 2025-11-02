'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const PublicProfileContent = dynamic(() => import('./PublicProfileContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading profile..." fullScreen />
})

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  
  return <PublicProfileContent userId={userId} />
}