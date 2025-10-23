'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, MapPinIcon, ClockIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { AlgorithmPost } from '@/lib/algorithm'
import { cancelClaim } from '@/lib/claims'
import QRCodeGenerator from './QRCodeGenerator'
import toast from 'react-hot-toast'

interface ClaimModalProps {
  post: AlgorithmPost
  onClose: () => void
  claimId?: string
  pickupCode?: string
}

export default function ClaimModal({ post, onClose, claimId, pickupCode }: ClaimModalProps) {
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const [isCancelling, setIsCancelling] = useState(false)

  // Generate QR code text
  const qrCodeText = claimId && pickupCode ? 
    `https://leftovermatch.com/claim/${claimId}?code=${pickupCode}` : 
    ''

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          toast.error('Claim expired - the item returned to the deck')
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onClose])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((30 * 60 - timeLeft) / (30 * 60)) * 100
  }

  const handleGetDirections = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(post.location.address)}`
    window.open(mapsUrl, '_blank')
  }

  const handleMessagePoster = () => {
    toast.success('Opening chat with poster...')
    // TODO: Open chat interface
  }

  const handleCancelClaim = async () => {
    if (!claimId) {
      toast.error('No claim to cancel')
      return
    }

    setIsCancelling(true)
    try {
      await cancelClaim(claimId)
      toast.success('Claim cancelled')
      onClose()
    } catch (error) {
      console.error('Error cancelling claim:', error)
      toast.error('Failed to cancel claim')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleOnMyWay = () => {
    toast.success('Message sent to poster: "I\'m on my way!"')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-600">🎉 Claim Locked!</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">Show this QR code to the poster to confirm pickup</p>
        </div>

        {/* QR Code */}
        <div className="p-6 text-center">
          {qrCodeText ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <QRCodeGenerator 
                text={qrCodeText}
                size={192}
                className="mx-auto"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 h-48 flex items-center justify-center">
              <div className="text-gray-500">QR Code loading...</div>
            </div>
          )}
          
          {pickupCode && (
            <div className="bg-orange-500 text-white rounded-lg p-3 mb-4">
              <p className="font-mono text-lg font-bold">{pickupCode}</p>
              <p className="text-sm opacity-90">Pickup Code</p>
            </div>
          )}

          {/* Countdown Timer */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Pickup within 30 minutes or the claim will expire
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Pickup Location</h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPinIcon className="w-5 h-5 mr-2" />
              <span>{post.location.address}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <ClockIcon className="w-5 h-5 mr-2" />
              <span>{post.distance.toFixed(1)} miles away</span>
            </div>
          </div>

          {/* Food Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-600 text-sm">{post.description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleGetDirections}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <MapPinIcon className="w-5 h-5 mr-2" />
            Get Directions
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMessagePoster}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Message Poster
            </button>
            
            <button
              onClick={handleOnMyWay}
              className="bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              I'm On My Way
            </button>
          </div>

          <button
            onClick={handleCancelClaim}
            disabled={isCancelling}
            className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Claim'}
          </button>
        </div>

        {/* Legal Notice */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Pickup within 30 minutes or the claim will expire and the item will return to the deck.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
