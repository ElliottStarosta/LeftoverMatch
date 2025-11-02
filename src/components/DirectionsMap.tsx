'use client'

import { useEffect, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DirectionsMapProps {
  destinationAddress: string
}

interface DirectionStep {
  instruction: string
  distance: string
  duration: string
  emoji: string
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

        // Fetch route from OSRM
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${coords.lng},${coords.lat}?steps=true&geometries=geojson&overview=full&annotations=distance,duration`
        const response = await fetch(routeUrl)
        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found')
        }

        const route = data.routes[0]
        const steps: DirectionStep[] = []

        // Process each leg and step
        for (const leg of route.legs) {
          for (let stepIdx = 0; stepIdx < leg.steps.length; stepIdx++) {
            const step = leg.steps[stepIdx]
            const nextStep = stepIdx < leg.steps.length - 1 ? leg.steps[stepIdx + 1] : null

            if (step.maneuver) {
              const maneuver = step.maneuver.type
              const modifier = step.maneuver.modifier
              const name = step.name || 'unnamed road'
              
              // Generate proper instruction based on maneuver
              let instruction = ''
              let emoji = '🚗'

              if (maneuver === 'depart') {
                instruction = `Head ${modifier || 'out'} on ${name}`
                emoji = '🚀'
              } else if (maneuver === 'arrive') {
                instruction = 'You have arrived at your destination'
                emoji = '🎯'
              } else if (maneuver === 'turn') {
                if (modifier === 'left') {
                  instruction = `Turn left onto ${name}`
                  emoji = '↙️'
                } else if (modifier === 'right') {
                  instruction = `Turn right onto ${name}`
                  emoji = '↗️'
                } else if (modifier === 'sharp left') {
                  instruction = `Turn sharp left onto ${name}`
                  emoji = '⬅️'
                } else if (modifier === 'sharp right') {
                  instruction = `Turn sharp right onto ${name}`
                  emoji = '➡️'
                } else if (modifier === 'slight left') {
                  instruction = `Turn slightly left onto ${name}`
                  emoji = '↙️'
                } else if (modifier === 'slight right') {
                  instruction = `Turn slightly right onto ${name}`
                  emoji = '↗️'
                } else if (modifier === 'straight') {
                  instruction = `Continue straight on ${name}`
                  emoji = '⬆️'
                } else {
                  instruction = `Turn onto ${name}`
                  emoji = '🔄'
                }
              } else if (maneuver === 'roundabout' || maneuver === 'rotary') {
                const exitNum = step.maneuver.exit || ''
                instruction = `Enter the roundabout${exitNum ? ` and take the ${exitNum} exit` : ''} onto ${name}`
                emoji = '🔁'
              } else if (maneuver === 'merge') {
                instruction = `Merge ${modifier || ''} onto ${name}`
                emoji = '🔀'
              } else if (maneuver === 'fork') {
                instruction = `Take the ${modifier || 'left'} fork onto ${name}`
                emoji = '🌳'
              } else if (maneuver === 'on ramp') {
                instruction = `Take the on ramp onto ${name}`
                emoji = '🛣️'
              } else if (maneuver === 'off ramp') {
                instruction = `Take the off ramp onto ${name}`
                emoji = '🛣️'
              } else if (maneuver === 'end of road') {
                instruction = `Road ends, turn ${modifier || 'left'} onto ${name}`
                emoji = '🛑'
              } else if (maneuver === 'use lane') {
                instruction = `Use the ${modifier || 'left'} lane on ${name}`
                emoji = '🛣️'
              } else {
                instruction = `Continue on ${name}`
                emoji = '🚗'
              }

              steps.push({
                instruction,
                distance: formatDistance(step.distance),
                duration: formatDuration(step.duration),
                emoji
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
      <div className="flex items-center gap-2 text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm font-semibold">Loading directions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
    )
  }

  return (
    <>
      {/* Collapsed View - Always visible */}
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4 hover:bg-blue-100/50 transition-all flex items-center justify-between"
        type="button"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white text-lg">🗺️</span>
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-gray-900 text-sm">View Directions</p>
            <p className="text-xs text-gray-600">
              {totalDistance} • {totalDuration}
            </p>
          </div>
        </div>
        <ChevronDownIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
      </button>

      {/* Expanded Apple Maps Style Sheet */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom">
            {/* Drag Handle & Header */}
            <div className="flex flex-col items-center border-b border-gray-200 p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-3"></div>
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg font-bold text-gray-900">Directions to {destinationAddress}</h2>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  type="button"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 w-full bg-gradient-to-r from-blue-500 to-cyan-500 h-1 rounded-full"></div>
              <p className="text-sm text-gray-600 mt-3 font-semibold">
                {totalDistance} • {totalDuration}
              </p>
            </div>

            {/* Scrollable Directions List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2 pb-4">
                {directions.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-cyan-50 transition-all border-l-4 border-blue-400"
                  >
                    {/* Emoji Icon */}
                    <div className="text-3xl flex-shrink-0 w-12 flex items-center justify-center">
                      {step.emoji}
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base leading-tight">
                        {step.instruction}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {step.distance} • {step.duration}
                      </p>
                    </div>

                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                ))}

                {/* Final Destination */}
                <div className="flex gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-400 mt-4">
                  <div className="text-3xl flex-shrink-0">📍</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">Destination</p>
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      {destinationAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button at Bottom */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`
  return `${miles.toFixed(1)} mi`
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}