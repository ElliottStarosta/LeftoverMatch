'use client'

interface LoadingSpinnerProps {
  text?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ 
  text = 'Loading...', 
  fullScreen = true,
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  const content = (
    <div className="text-center">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-orange-500 mx-auto mb-4`}></div>
      <p className="text-gray-600">{text}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full bg-white rounded-2xl shadow-xl">
      <div className="text-center p-6">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-orange-500 mx-auto mb-4`}></div>
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  )
}