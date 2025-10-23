'use client'

import { useState, useRef, useEffect } from 'react'
import { QrScanner } from 'react-qr-scanner'

interface QRCodeScannerProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
  className?: string
}

export default function QRCodeScanner({ onScan, onError, className = '' }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    // Check for camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true)
        setIsScanning(true)
      })
      .catch((error) => {
        console.error('Camera permission denied:', error)
        setHasPermission(false)
        onError?.(error)
      })
  }, [onError])

  const handleScan = (result: string) => {
    if (result) {
      onScan(result)
    }
  }

  const handleError = (error: Error) => {
    console.error('QR Scanner error:', error)
    onError?.(error)
  }

  if (hasPermission === null) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Requesting camera permission...</p>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Camera permission denied</p>
          <p className="text-gray-600 text-sm">
            Please allow camera access to scan QR codes
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {isScanning && (
        <QrScanner
          delay={300}
          onScan={handleScan}
          onError={handleError}
          style={{ width: '100%' }}
        />
      )}
      
      {/* Overlay with scanning guide */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-white rounded-lg relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white text-sm">Position QR code within the frame</p>
        </div>
      </div>
    </div>
  )
}
