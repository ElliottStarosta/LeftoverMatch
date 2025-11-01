'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading..." />
})

export default function Home() {
  return <HomeContent />
}