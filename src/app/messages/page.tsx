'use client'

import dynamic from 'next/dynamic'

const MessagesContent = dynamic(() => import('./MessagesContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading messages...</p>
      </div>
    </div>
  )
})

export default function MessagesPage() {
  return <MessagesContent />
}