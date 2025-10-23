'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QRCodeScanner from '@/components/QRCodeScanner'
import { callConfirmPickup } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ClaimConfirmationPage() {
  const params = useParams()
  const claimId = params.claimId as string
  const [pickupCode, setPickupCode] = useState('')
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Extract pickup code from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      if (code) {
        setPickupCode(code)
      }
    }
  }, [])

  const handleQRScan = (result: string) => {
    try {
      // Parse the QR code result
      const url = new URL(result)
      const code = url.searchParams.get('code')
      if (code) {
        setPickupCode(code)
        confirmPickup(code)
      } else {
        toast.error('Invalid QR code format')
      }
    } catch (error) {
      toast.error('Invalid QR code')
    }
  }

  const handleManualEntry = () => {
    if (!pickupCode.trim()) {
      toast.error('Please enter a pickup code')
      return
    }
    confirmPickup(pickupCode.trim())
  }

  const confirmPickup = async (code: string) => {
    try {
      await callConfirmPickup(claimId, code)
      setIsConfirmed(true)
      toast.success('Pickup confirmed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm pickup')
    }
  }

  const handleError = (error: Error) => {
    toast.error('Camera error: ' + error.message)
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Pickup Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for rescuing food! Enjoy your meal and consider rating the poster.
          </p>
          <button
            onClick={() => window.close()}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-green-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Confirm Pickup</h1>
          
          {/* QR Code Scanner */}
          <div className="mb-6">
            <QRCodeScanner
              onScan={handleQRScan}
              onError={handleError}
              className="h-64"
            />
          </div>

          {/* Manual Entry */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Or Enter Code Manually</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                placeholder="Enter pickup code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={6}
              />
              <button
                onClick={handleManualEntry}
                disabled={!pickupCode.trim()}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-sm text-gray-600">
            <p className="mb-2">
              <strong>For Claimers:</strong> Show the QR code from your claim modal to the poster.
            </p>
            <p>
              <strong>For Posters:</strong> Scan the QR code or enter the pickup code manually.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
