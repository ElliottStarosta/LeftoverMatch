'use client'

import { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface DirectionsMapProps {
  destinationAddress: string
}

interface DirectionStep {
  instruction: string
  distance: string
  duration: string
}

export function DirectionsMap({ destinationAddress }: DirectionsMapProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [directions, setDirections] = useState<DirectionStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalDistance, setTotalDistance] = useState('')
  const [totalDuration, setTotalDuration] = useState('')

  useEffect(() => {
    const fetchDirections = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          })
        })

        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        // Geocode destination
        const coords = await geocodeAddress(destinationAddress)
        if (!coords) throw new Error('Could not find destination')

        // Fetch route from OSRM (OpenStreetMap Routing Machine)
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${coords.lng},${coords.lat}?steps=true&overview=false`
        const response = await fetch(routeUrl)
        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found')
        }

        const route = data.routes[0]
        const steps: DirectionStep[] = []

        // Process route steps
        for (const leg of route.legs) {
          for (const step of leg.steps) {
            if (step.maneuver && step.maneuver.instruction) {
              steps.push({
                instruction: step.maneuver.instruction || step.name || 'Continue',
                distance: formatDistance(step.distance),
                duration: formatDuration(step.duration)
              })
            }
          }
        }

        setDirections(steps)
        setTotalDistance(formatDistance(route.distance))
        setTotalDuration(formatDuration(route.duration))
        setLoading(false)
      } catch (err: any) {
        console.error('Error fetching directions:', err)
        setError(err.message || 'Failed to load directions')
        setLoading(false)
      }
    }

    fetchDirections()
  }, [destinationAddress])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm font-semibold">Loading directions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-4 border-2 border-red-200">
        <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🗺️</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 text-sm">
              {isExpanded ? 'Hide Directions' : 'Expand For Directions'}
            </p>
            <p className="text-xs text-gray-600">
              {totalDistance} • {totalDuration}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-blue-600" />
        )}
      </button>

      {/* Directions List - Expandable */}
      {isExpanded && (
        <div className="border-t-2 border-blue-200 bg-white max-h-96 overflow-y-auto">
          <div className="p-4 space-y-3">
            {directions.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 items-start p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-colors"
              >
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>

                {/* Step details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {step.instruction}
                  </p>
                  <p className="text-xs text-gray-600">
                    {step.distance} • {step.duration}
                  </p>
                </div>
              </div>
            ))}

            {/* Final destination */}
            <div className="flex gap-3 items-start p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-lg">📍</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 mb-1">
                  Destination
                </p>
                <p className="text-xs text-gray-600">
                  {destinationAddress}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    )
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    }
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371
  if (miles < 0.1) return `${Math.round(meters)} m`
  return `${miles.toFixed(1)} mi`
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}