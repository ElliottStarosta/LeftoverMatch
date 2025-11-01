import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootLayoutClient } from './layout-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReSwipe - Connect Food with People',
  description: 'Find free ready-to-eat food near you. Swipe → claim → pick up.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}