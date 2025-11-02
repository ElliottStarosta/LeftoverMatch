'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const PublicProfileContent = dynamic(() => import('./PublicProfileContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading profile..." fullScreen />
})

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  return <PublicProfileContent userId={params.userId} />
}