'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/LoadingSpinner'

const CreatePostContent = dynamic(() => import('./CreatePostContent'), {
  ssr: false,
  loading: () => <LoadingSpinner text="Loading..." />
})

export default function CreatePostPage() {
  return <CreatePostContent />
}