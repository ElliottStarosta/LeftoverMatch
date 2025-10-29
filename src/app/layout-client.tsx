'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'

const NotificationToast = dynamic(() => import('@/components/NotificationToast'), {
  ssr: false,
})

export function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <NotificationToast />
    </ErrorBoundary>
  )
}