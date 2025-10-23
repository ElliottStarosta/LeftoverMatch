'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClockIcon, MapPinIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import QRCodeGenerator from './QRCodeGenerator'

interface ActiveClaim {
  id: string
  postId: string
  title: string
  photoUrl: string
  location: string
  posterName: string
  claimedAt: Date
  expiresAt: Date
  pickupCode: string
  status: 'pending' | 'confirmed' | 'expired'
}

export default function ActiveClaimsList() {
  const [activeClaims] = useState<ActiveClaim[]>([
    {
      id: 'claim1',
      postId: 'post1',
      title: 'Fresh Pizza Slices',
      photoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200',
      location: 'Downtown, 2 blocks from Main St',
      posterName: 'Maria',
      claimedAt: new Date('2024-01-01T11:55:00Z'), // Fixed date to avoid hydration mismatch
      expiresAt: new Date('2024-01-01T12:10:00Z'), // Fixed date to avoid hydration mismatch
      pickupCode: 'AB12CD',
      status: 'pending'
    }
  ])

  const [showQRCode, setShowQRCode] = useState<string | null>(null)

  const formatTimeLeft = (expiresAt: Date) => {
    // Use fixed time to avoid hydration mismatches
    const now = new Date('2024-01-01T12:00:00Z')
    const timeLeft = expiresAt.getTime() - now.getTime()
    
    if (timeLeft <= 0) {
      return 'Expired'
    }
    
    const minutes = Math.floor(timeLeft / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (expiresAt: Date) => {
    // Use a fixed time to avoid hydration mismatches
    const now = new Date('2024-01-01T12:00:00Z') // Fixed time for SSR consistency
    const totalTime = 15 * 60 * 1000 // 15 minutes
    const elapsed = now.getTime() - (expiresAt.getTime() - totalTime)
    return Math.max(0, Math.min(100, (elapsed / totalTime) * 100))
  }

  const handleGetDirections = (location: string) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`
    window.open(mapsUrl, '_blank')
  }

  const handleCancelClaim = (claimId: string) => {
    // TODO: Implement cancel claim logic
    console.log('Cancel claim:', claimId)
  }

  if (activeClaims.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Active Claims</h3>
        <div className="text-center text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No active claims</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Active Claims</h3>
      
      <div className="space-y-4">
        {activeClaims.map((claim) => (
          <motion.div
            key={claim.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Claim Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 line-clamp-1">{claim.title}</h4>
                <p className="text-sm text-gray-600">by {claim.posterName}</p>
              </div>
              <button
                onClick={() => handleCancelClaim(claim.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Time Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Time Left</span>
                <span className={`text-sm font-bold ${
                  getProgressPercentage(claim.expiresAt) > 80 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {formatTimeLeft(claim.expiresAt)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    getProgressPercentage(claim.expiresAt) > 80 ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${getProgressPercentage(claim.expiresAt)}%` }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <span className="line-clamp-1">{claim.location}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleGetDirections(claim.location)}
                className="flex-1 bg-primary text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                <MapPinIcon className="w-4 h-4 mr-1" />
                Directions
              </button>
              
              <button
                onClick={() => setShowQRCode(claim.pickupCode)}
                className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <QrCodeIcon className="w-4 h-4 mr-1" />
                Show QR
              </button>
            </div>

            {/* Pickup Code */}
            <div className="mt-3 text-center">
              <div className="bg-gray-100 rounded-lg p-2">
                <p className="text-xs text-gray-600 mb-1">Pickup Code</p>
                <p className="font-mono font-bold text-lg">{claim.pickupCode}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRCode(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Show QR to Poster</h3>
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <QRCodeGenerator 
                  text={`https://leftovermatch.com/claim/claim_123456789?code=${showQRCode}`}
                  size={128}
                  className="mx-auto"
                />
              </div>
              <div className="bg-primary text-white rounded-lg p-3 mb-4">
                <p className="font-mono text-lg font-bold">{showQRCode}</p>
                <p className="text-sm opacity-90">Pickup Code</p>
              </div>
              <button
                onClick={() => setShowQRCode(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
