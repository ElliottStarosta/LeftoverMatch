'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const MessagesContent = dynamic(() => import('./MessagesContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading messages..." />
})

export default function MessagesPage() {
  return <MessagesContent />
}