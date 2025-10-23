'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'firebase/auth'
import { getAuth } from '@/lib/firebase-utils'
import { useAuth } from '@/lib/useAuth'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      if (auth) {
        await signOut(auth)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">🍽️</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              LeftoverMatch
            </span>
          </Link>

          {/* Desktop Navigation - Minimal */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/create" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium">
                  Post Food
                </Link>
                
                <Link href="/messages" className="text-gray-600 hover:text-orange-500 transition-colors font-medium relative">
                  Messages
                </Link>
                
                <button className="relative">
                  <BellIcon className="w-6 h-6 text-gray-600 hover:text-orange-500 transition-colors" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors font-medium">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-700" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link href="/create" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>Post Food</span>
                  </Link>
                  
                  <Link href="/messages" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>Messages</span>
                  </Link>
                  
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                    <BellIcon className="w-5 h-5" />
                    <span>Notifications</span>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link href="/auth" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors">
                  <UserCircleIcon className="w-5 h-5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
