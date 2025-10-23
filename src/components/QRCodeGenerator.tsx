'use client'

import { useEffect, useRef } from 'react'

interface QRCodeGeneratorProps {
  text: string
  size?: number
  className?: string
}

export default function QRCodeGenerator({ text, size = 256, className = '' }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return

      try {
        // Dynamic import for qrcode-generator to avoid SSR issues
        const QRCode = (await import('qrcode-generator')).default
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        
        if (!ctx) return

        // Set canvas size
        canvas.width = size
        canvas.height = size

        // Generate QR code
        const qr = QRCode(0, 'M') // Error correction level M, size auto
        qr.addData(text)
        qr.make()

        // Get QR code matrix
        const moduleCount = qr.getModuleCount()
        const cellSize = Math.floor(size / moduleCount)
        const offset = (size - cellSize * moduleCount) / 2

        // Clear canvas
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, size, size)

        // Draw QR code
        ctx.fillStyle = '#000000'
        for (let row = 0; row < moduleCount; row++) {
          for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
              ctx.fillRect(
                offset + col * cellSize,
                offset + row * cellSize,
                cellSize,
                cellSize
              )
            }
          }
        }

      } catch (error) {
        console.error('Error generating QR code:', error)
        
        // Fallback: draw a simple placeholder
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, size, size)
          
          ctx.fillStyle = '#000000'
          ctx.font = '16px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('QR Code', size / 2, size / 2 - 10)
          ctx.fillText('Placeholder', size / 2, size / 2 + 10)
        }
      }
    }

    generateQRCode()
  }, [text, size])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}
